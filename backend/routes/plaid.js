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
      client_name: 'TrueBalance',
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
      .update({ plaid_access_token: access_token, plaid_item_id: item_id })
      .eq('user_id', req.userId);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to save Plaid connection' });
    }

    res.json({ status: 'connected' });
  } catch (err) {
    console.error('Plaid exchange-token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

module.exports = router;
