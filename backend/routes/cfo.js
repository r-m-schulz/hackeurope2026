const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');
const supabase = require('../supabaseClient');
const { getTaxConfig } = require('../lib/tax-config');
const { parseIntent, computeCFOAnswer, getRuleBasedSavings, formatAnswerText } = require('../lib/cfo-engine');

function validateUserTypeOptional(req, res, next) {
  const userType = req.query.user_type || req.body?.user_type;
  if (userType && !['sme', 'individual'].includes(userType)) {
    return res.status(400).json({ error: 'user_type must be "sme" or "individual" if provided' });
  }
  req.userType = userType;
  next();
}

async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) req.userId = data.user.id;
  }
  next();
}

router.use(validateUserTypeOptional);
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

function normalizeAppData(appData) {
  if (appData && appData.taxConfig && appData.taxConfig.type == null) {
    appData.taxConfig = { type: 'sme', vatRate: 0.23, corpTaxRate: 0.125, prsiRate: 0.04, ...appData.taxConfig };
  }
  return appData;
}

// POST /cfo/query
// Body: { queryText, appDataSnapshot?, userSettings?, user_type? }
// If appDataSnapshot provided, use it; else require user_type (and auth for subscriptions) to build appData
router.post('/query', async (req, res) => {
  try {
    const { queryText, appDataSnapshot, userSettings = {} } = req.body;
    let appData = appDataSnapshot ? normalizeAppData({ ...appDataSnapshot }) : null;
    if (!appData || !appData.transactions) {
      if (!req.userType) {
        return res.status(400).json({ error: 'queryText required; provide appDataSnapshot or user_type (and auth for subscriptions)' });
      }
      appData = await buildAppData(req.userType, req.userId);
    }
    const { intent, monthlyAmount } = parseIntent(queryText);
    const result = computeCFOAnswer(appData, { monthlyAmount, targetRunwayDays: 60 });
    const answerText = formatAnswerText(result, monthlyAmount, intent);
    const actions = [
      'Simulate in What-if',
      'Add as recurring',
      'Ignore',
      'Move to tax vault (informational)',
    ];
    res.json({
      intent,
      answerText,
      affordability: result.affordability,
      recommendedMaxMonthly: result.recommendedMaxMonthly,
      runwayDays: result.runwayDays,
      safeToSpendNow: result.safeToSpendNow,
      confidence: result.confidence,
      assumptions: result.assumptions,
      confidenceReasons: result.confidenceReasons,
      actions,
    });
  } catch (err) {
    console.error('CFO query error', err);
    res.status(500).json({ error: err.message || 'CFO query failed' });
  }
});

// GET /cfo/savings?user_type=sme (optional auth)
// POST /cfo/savings with body: { appDataSnapshot?, userSettings?, user_type? }
router.get('/savings', async (req, res) => {
  try {
    if (!req.userType) {
      return res.status(400).json({ error: 'user_type query param required for GET /cfo/savings' });
    }
    const appData = await buildAppData(req.userType, req.userId);
    const userSettings = {};
    const items = getRuleBasedSavings(appData, userSettings);
    res.json({ items });
  } catch (err) {
    console.error('CFO savings error', err);
    res.status(500).json({ error: err.message || 'CFO savings failed' });
  }
});

router.post('/savings', async (req, res) => {
  try {
    const { appDataSnapshot, userSettings = {} } = req.body;
    let appData = appDataSnapshot ? normalizeAppData({ ...appDataSnapshot }) : null;
    if (!appData || !appData.transactions) {
      if (!req.userType) {
        return res.status(400).json({ error: 'Provide appDataSnapshot or user_type for POST /cfo/savings' });
      }
      appData = await buildAppData(req.userType, req.userId);
    }
    const items = getRuleBasedSavings(appData, userSettings);
    res.json({ items });
  } catch (err) {
    console.error('CFO savings error', err);
    res.status(500).json({ error: err.message || 'CFO savings failed' });
  }
});

module.exports = router;
