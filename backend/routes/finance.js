const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const { getLabels } = require('../lib/tax-config');
const { requireAuth } = require('../lib/auth-middleware');
const {
  detectRecurringPayments,
  generateForecastFromAppData,
  getExpenseBreakdownFromAppData,
  calculateSummaryFromAppData,
  generateAIInsight,
  getCashRunwayFromAppData,
} = require('../lib/finance-engine');
const { getTransactions, getBalance, buildAppData } = require('../lib/app-data-builder');

// All finance routes require auth. requireAuth sets req.userId and req.userType from JWT.
router.use(requireAuth);

// GET /finance/summary
router.get('/summary', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const summary = calculateSummaryFromAppData(appData);
  res.json({ ...summary, labels: getLabels(req.userType) });
});

// GET /finance/settings (auth required) — returns current_balance
router.get('/settings', requireAuth, async (req, res) => {
  const balance = await getBalance(req.userId, req.userType);
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
  if (error) {
    const msg = error.message?.includes('user_settings') && error.message?.includes('schema cache')
      ? 'Database setup required: run the migration in supabase/migrations/001_user_settings_and_transactions_user_id.sql (see supabase/README.md).'
      : error.message;
    return res.status(500).json({ error: msg });
  }
  res.json({ current_balance: value });
});

// GET /finance/transactions
router.get('/transactions', async (req, res) => {
  const { transactions } = await getTransactions(req.userType, req.userId);
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json({ transactions: sorted, count: sorted.length });
});

// GET /finance/forecast?days=30
router.get('/forecast', async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const appData = await buildAppData(req.userType, req.userId);
  const forecast = generateForecastFromAppData(appData, days);
  res.json({ forecast, days });
});

// GET /finance/recurring
router.get('/recurring', async (req, res) => {
  const { transactions } = await getTransactions(req.userType, req.userId);
  const recurring = detectRecurringPayments(transactions);
  res.json({ recurring, count: recurring.length });
});

// GET /finance/breakdown
router.get('/breakdown', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const breakdown = getExpenseBreakdownFromAppData(appData);
  res.json({ breakdown });
});

// GET /finance/runway
router.get('/runway', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const { days, monthlyBurn, trueAvailable } = getCashRunwayFromAppData(appData);
  const status = days > 60 ? 'safe' : days > 30 ? 'warning' : 'critical';
  res.json({ days, status, monthlyBurn, trueAvailable });
});

// GET /finance/insight
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
