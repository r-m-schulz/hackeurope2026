const express = require('express');
const router = express.Router();
const { getTaxConfig, getLabels, validateUserType } = require('../lib/tax-config');
const {
  detectRecurringPayments,
  generateForecastFromAppData,
  getExpenseBreakdownFromAppData,
  calculateSummaryFromAppData,
  generateAIInsight,
  getCashRunwayFromAppData,
} = require('../lib/finance-engine');
const { listSubscriptions } = require('../store/subscriptions');

// All finance routes require user_type
router.use(validateUserType);

function getSeedData(userType) {
  return userType === 'sme'
    ? require('../data/seed-sme')
    : require('../data/seed-individual');
}

function buildAppData(userType) {
  const seed = getSeedData(userType);
  const taxConfig = getTaxConfig(userType);
  const subscriptions = listSubscriptions(userType);
  return {
    transactions: seed.seedTransactions,
    subscriptions,
    currentBalance: seed.currentBalance,
    taxConfig,
  };
}

// GET /finance/summary?user_type=sme|individual
router.get('/summary', (req, res) => {
  const appData = buildAppData(req.userType);
  const summary = calculateSummaryFromAppData(appData);
  const labels = getLabels(req.userType);
  res.json({ ...summary, labels });
});

// GET /finance/transactions?user_type=sme|individual
router.get('/transactions', (req, res) => {
  const seed = getSeedData(req.userType);
  const transactions = [...seed.seedTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json({ transactions, count: transactions.length });
});

// GET /finance/forecast?user_type=sme|individual&days=30
router.get('/forecast', (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const appData = buildAppData(req.userType);
  const forecast = generateForecastFromAppData(appData, days);
  res.json({ forecast, days });
});

// GET /finance/recurring?user_type=sme|individual
router.get('/recurring', (req, res) => {
  const seed = getSeedData(req.userType);
  const recurring = detectRecurringPayments(seed.seedTransactions);
  res.json({ recurring, count: recurring.length });
});

// GET /finance/breakdown?user_type=sme|individual
router.get('/breakdown', (req, res) => {
  const appData = buildAppData(req.userType);
  const breakdown = getExpenseBreakdownFromAppData(appData);
  res.json({ breakdown });
});

// GET /finance/runway?user_type=sme|individual
router.get('/runway', (req, res) => {
  const appData = buildAppData(req.userType);
  const { days, monthlyBurn, trueAvailable } = getCashRunwayFromAppData(appData);
  const status = days > 60 ? 'safe' : days > 30 ? 'warning' : 'critical';
  res.json({ days, status, monthlyBurn, trueAvailable });
});

// GET /finance/insight?user_type=sme|individual
router.get('/insight', (req, res) => {
  const appData = buildAppData(req.userType);
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
