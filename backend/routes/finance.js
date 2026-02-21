const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const supabase = require('../supabaseClient');
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

async function getTransactions(userType) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_type', userType);
  if (error) throw error;
  return data;
}

function getSeedMeta(userType) {
  return userType === 'sme'
    ? require('../data/seed-sme')
    : require('../data/seed-individual');
}

async function getSubscriptions(userId) {
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  // Map DB column names to frontend shape
  return data.map(s => ({
    id: s.id,
    merchant: s.merchant,
    amount: Number(s.amount),
    nextDueDate: s.next_due_date,
    frequency: s.frequency,
  }));
}

async function buildAppData(userType, userId = null) {
  const [transactions, subscriptions] = await Promise.all([
    getTransactions(userType),
    getSubscriptions(userId),
  ]);
  const seedMeta = getSeedMeta(userType);
  return {
    transactions,
    subscriptions,
    currentBalance: seedMeta.currentBalance,
    taxConfig: getTaxConfig(userType),
  };
}

// GET /finance/summary?user_type=sme|individual
router.get('/summary', async (req, res) => {
  const appData = await buildAppData(req.userType, req.userId);
  const summary = calculateSummaryFromAppData(appData);
  res.json({ ...summary, labels: getLabels(req.userType) });
});

// GET /finance/transactions?user_type=sme|individual
router.get('/transactions', async (req, res) => {
  const transactions = await getTransactions(req.userType);
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
  const transactions = await getTransactions(req.userType);
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
