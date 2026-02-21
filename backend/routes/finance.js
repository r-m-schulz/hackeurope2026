const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const supabase = require('../supabaseClient');
const { requireAuth } = require('../lib/auth-middleware');

const DEBUG_LOG_PATH = path.join(__dirname, '../../.cursor/debug-63f232.log');
function debugLog(location, message, data, hypothesisId) {
  const line = JSON.stringify({ sessionId: '63f232', location, message, data, timestamp: Date.now(), hypothesisId }) + '\n';
  try { fs.appendFileSync(DEBUG_LOG_PATH, line); } catch (_) {}
}
const { getTaxConfig, getLabels, validateUserType } = require('../lib/tax-config');
const {
  detectRecurringPayments,
  generateForecastFromAppData,
  getExpenseBreakdownFromAppData,
  calculateSummaryFromAppData,
  generateAIInsight,
  getCashRunwayFromAppData,
} = require('../lib/finance-engine');

router.use(validateUserType);

// Optional auth — extracts userId from Bearer token if present, never blocks
async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) req.userId = data.user.id;
  }
  next();
}

router.use(optionalAuth);

async function getTransactions(userType, userId = null) {
  if (userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      if (error) return [];
      return data || [];
    } catch (_) {
      return [];
    }
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_type', userType)
      .is('user_id', null);
    if (error) return [];
    return data || [];
  } catch (_) {
    return [];
  }
}

function getSeedMeta(userType) {
  return userType === 'sme'
    ? require('../data/seed-sme')
    : require('../data/seed-individual');
}

async function getBalance(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('current_balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data ? Number(data.current_balance) : null;
  } catch (_) {
    return null;
  }
}

async function getSubscriptions(userId) {
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  // Map DB column names to frontend shape
  return (data || []).map(s => ({
    id: s.id,
    merchant: s.merchant,
    amount: Number(s.amount),
    nextDueDate: s.next_due_date,
    frequency: s.frequency,
  }));
}

async function buildAppData(userType, userId = null) {
  const [transactions, subscriptions, storedBalance] = await Promise.all([
    getTransactions(userType, userId),
    getSubscriptions(userId),
    userId ? getBalance(userId) : Promise.resolve(null),
  ]);
  const seedMeta = getSeedMeta(userType);
  // Logged-in users: use stored balance only (no seed). New users see 0 until they set it.
  const currentBalance = storedBalance !== null && storedBalance !== undefined
    ? storedBalance
    : (userId ? 0 : (seedMeta.currentBalance ?? 0));
  // #region agent log
  debugLog('finance.js:buildAppData', 'buildAppData result', { userId: userId ? String(userId).slice(0, 8) : null, storedBalance, seedBalance: seedMeta.currentBalance, currentBalance, transactionsCount: transactions.length }, 'H2,H3');
  // #endregion
  return {
    transactions,
    subscriptions,
    currentBalance,
    taxConfig: getTaxConfig(userType),
  };
}

// GET /finance/summary?user_type=sme|individual
router.get('/summary', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const summary = calculateSummaryFromAppData(appData);
  // #region agent log
  debugLog('finance.js:GET/summary', 'summary response', { reqUserId: req.userId ? String(req.userId).slice(0, 8) : null, summaryBalance: summary.balance }, 'H2,H5');
  // #endregion
  res.json({ ...summary, labels: getLabels(req.userType) });
});

// GET /finance/settings (auth required) — returns current_balance
router.get('/settings', requireAuth, async (req, res) => {
  const balance = await getBalance(req.userId);
  res.json({ current_balance: balance !== null && balance !== undefined ? balance : 0 });
});

// PUT /finance/settings (auth required) — update current_balance
router.put('/settings', requireAuth, async (req, res) => {
  const { current_balance } = req.body;
  if (typeof current_balance !== 'number' && typeof current_balance !== 'string') {
    return res.status(400).json({ error: 'current_balance is required' });
  }
  const value = Number(current_balance);
  if (Number.isNaN(value)) return res.status(400).json({ error: 'current_balance must be a number' });

  const { error } = await supabaseAdmin
    .from('user_settings')
    .upsert(
      { user_id: req.userId, current_balance: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  // #region agent log
  debugLog('finance.js:PUT/settings', 'settings upsert', { userId: req.userId ? String(req.userId).slice(0, 8) : null, value, upsertError: error ? error.message : null }, 'H1,H2');
  // #endregion
  if (error) {
    const msg = error.message?.includes('user_settings') && error.message?.includes('schema cache')
      ? 'Database setup required: run the migration in supabase/migrations/001_user_settings_and_transactions_user_id.sql (see supabase/README.md).'
      : error.message;
    return res.status(500).json({ error: msg });
  }
  res.json({ current_balance: value });
});

// GET /finance/transactions?user_type=sme|individual
router.get('/transactions', async (req, res) => {
  const transactions = await getTransactions(req.userType, req.userId);
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json({ transactions: sorted, count: sorted.length });
});

// GET /finance/forecast?user_type=sme|individual&days=30
router.get('/forecast', async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const appData = await buildAppData(req.userType, req.userId);
  const forecast = generateForecastFromAppData(appData, days);
  res.json({ forecast, days });
});

// GET /finance/recurring?user_type=sme|individual
router.get('/recurring', async (req, res) => {
  const transactions = await getTransactions(req.userType, req.userId);
  const recurring = detectRecurringPayments(transactions);
  res.json({ recurring, count: recurring.length });
});

// GET /finance/breakdown?user_type=sme|individual
router.get('/breakdown', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const breakdown = getExpenseBreakdownFromAppData(appData);
  res.json({ breakdown });
});

// GET /finance/runway?user_type=sme|individual
router.get('/runway', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const { days, monthlyBurn, trueAvailable } = getCashRunwayFromAppData(appData);
  const status = days > 60 ? 'safe' : days > 30 ? 'warning' : 'critical';
  res.json({ days, status, monthlyBurn, trueAvailable });
});

// GET /finance/insight?user_type=sme|individual
router.get('/insight', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const summary = calculateSummaryFromAppData(appData);
  const forecast = generateForecastFromAppData(appData, 30);
  const labels = getLabels(req.userType);
  const { insight, severity } = generateAIInsight(
    summary.balance,
    forecast,
    summary.estimatedTax,
    labels.insightTone
  );
  res.json({ insight, tone: labels.insightTone, severity });
});

module.exports = router;
