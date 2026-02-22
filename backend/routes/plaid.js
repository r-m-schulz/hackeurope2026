const express = require('express');
const router = express.Router();
const plaidClient = require('../lib/plaid-client');
const { requireAuth } = require('../lib/auth-middleware');
const supabaseAdmin = require('../supabaseAdmin');

// Step 1: Frontend calls this to get a short-lived token that initialises Plaid Link
router.post('/create-link-token', requireAuth, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.userId },
      client_name: 'PocketCFO',
      products: ['transactions'],
      country_codes: ['IE', 'GB'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error('Plaid create-link-token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Step 2: After the user completes Plaid Link, the frontend sends the public_token here.
// We exchange it for a permanent access_token and save it against the user.
router.post('/exchange-token', requireAuth, async (req, res) => {
  const { public_token } = req.body;
  if (!public_token) return res.status(400).json({ error: 'public_token is required' });

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        { user_id: req.userId, user_type: req.userType, plaid_access_token: access_token, plaid_item_id: item_id },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to save Plaid connection' });
    }

    // Trigger a transactions refresh and then poll until data is ready (handles sandbox async sync).
    // We wait here so the frontend immediately gets real data when it refetches after this call returns.
    try {
      await plaidClient.transactionsRefresh({ access_token });
      console.log('[Plaid] transactionsRefresh triggered, polling for data...');

      const today = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 90);
      const startDate = start.toISOString().split('T')[0];

      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const check = await plaidClient.transactionsGet({ access_token, start_date: startDate, end_date: today });
          if (check.data.total_transactions > 0) {
            console.log(`[Plaid] transactions ready: ${check.data.total_transactions} total`);
            break;
          }
          console.log(`[Plaid] poll ${i + 1}/8: still 0 transactions, waiting...`);
        } catch (pollErr) {
          const code = pollErr.response?.data?.error_code;
          if (code === 'PRODUCT_NOT_READY') {
            console.log(`[Plaid] poll ${i + 1}/8: PRODUCT_NOT_READY, waiting...`);
          } else {
            break; // unexpected error, stop polling
          }
        }
      }
    } catch (refreshErr) {
      console.warn('[Plaid] transactionsRefresh failed:', refreshErr.response?.data?.error_code || refreshErr.message);
    }

    // Fetch account balance from Plaid and persist it so the dashboard shows real figures.
    try {
      const balanceRes = await plaidClient.accountsBalanceGet({ access_token });
      const accounts = balanceRes.data.accounts ?? [];
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balances.current ?? 0), 0);
      await supabaseAdmin
        .from('user_settings')
        .upsert(
          { user_id: req.userId, current_balance: totalBalance, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      console.log(`[Plaid] balance synced: €${totalBalance} across ${accounts.length} account(s)`);
    } catch (balErr) {
      console.warn('[Plaid] balance fetch failed:', balErr.response?.data?.error_code || balErr.message);
    }

    res.json({ status: 'connected' });
  } catch (err) {
    console.error('Plaid exchange-token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// GET /plaid/status — check if the current user has a bank connected
router.get('/status', requireAuth, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('plaid_access_token')
    .eq('user_id', req.userId)
    .maybeSingle();

  res.json({ connected: !!(profile?.plaid_access_token) });
});

module.exports = router;
