const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabaseAdmin = require('../supabaseAdmin');
const supabase = require('../supabaseClient');
const { getTaxConfig } = require('../lib/tax-config');
const { parseIntent, computeCFOAnswer, getRuleBasedSavings, formatAnswerText } = require('../lib/cfo-engine');
const { SYSTEM_PROMPT, buildUserMessage } = require('../lib/buildAffordabilityPrompt');

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
    const { intent, monthlyAmount, oneOffAmount } = parseIntent(queryText);
    const result = computeCFOAnswer(appData, { monthlyAmount, oneOffAmount, targetRunwayDays: 60 });
    const answerText = formatAnswerText(result, monthlyAmount, intent, oneOffAmount);
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

// POST /cfo/affordability — AI Affordability Advisor (Groq)
// Body: { question, financialSummary, options?: { priceExtracted, priceAboveTrueAvailable, trueAvailableNegative, forecastLowestNegative } }
router.post('/affordability', async (req, res) => {
  console.log('[affordability] route hit, body keys:', Object.keys(req.body || {}));
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Affordability Advisor not configured (GROQ_API_KEY missing).' });
    }
    const { question, financialSummary, options = {} } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'question is required.' });
    }
    if (!financialSummary || typeof financialSummary !== 'object') {
      return res.status(400).json({ error: 'financialSummary is required.' });
    }

    const userContent = buildUserMessage(financialSummary, question.trim(), options);
    console.log('[Groq affordability] incoming question:', question.trim());
    console.log('[Groq affordability] user message sent to Groq:\n', userContent);
    const client = new Groq({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    console.log('[Groq affordability] raw response:', raw);
    let parsed;
    try {
      // Strip <think>...</think> blocks that some reasoning models emit
      const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      // Find the outermost JSON object (last { ... } pair to avoid stray braces in preamble)
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON object found');
      parsed = JSON.parse(match[match.length - 1] ?? match[0]);
    } catch (_) {
      console.error('[Groq affordability] JSON parse failed, raw:', raw.slice(0, 500));
      return res.status(502).json({
        error: 'AI response was not valid JSON.',
        raw: raw.slice(0, 500),
      });
    }

    let verdict = ['AFFORD', 'CANNOT_AFFORD', 'RISKY'].includes(parsed.verdict) ? parsed.verdict : 'RISKY';
    const riskLevel = ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.risk_level) ? parsed.risk_level : 'MEDIUM';
    let confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 50;
    let reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
    let impact_summary = typeof parsed.impact_summary === 'string' ? parsed.impact_summary : '';
    const estimated_purchase_cost = typeof parsed.estimated_purchase_cost === 'number' ? parsed.estimated_purchase_cost : null;
    const estimated_monthly_cost = typeof parsed.estimated_monthly_cost === 'number' ? parsed.estimated_monthly_cost : null;

    const priceExtracted = options.priceExtracted;
    const trueAvailable = financialSummary.trueAvailableCash;
    const effectiveCost = priceExtracted ?? estimated_purchase_cost;
    if (typeof effectiveCost === 'number' && typeof trueAvailable === 'number' && effectiveCost > trueAvailable && verdict === 'AFFORD') {
      verdict = 'CANNOT_AFFORD';
      impact_summary = impact_summary || `Estimated cost (€${effectiveCost.toLocaleString('en-IE')}) exceeds your true available cash (€${trueAvailable.toLocaleString('en-IE')}).`;
      if (!reasoning) {
        reasoning = `Your true available cash is €${trueAvailable.toLocaleString('en-IE')} (after tax reserve and recurring commitments). The estimated cost of €${effectiveCost.toLocaleString('en-IE')} exceeds that amount.`;
      }
      confidence = Math.min(confidence, 95);
    }

    res.json({
      verdict,
      confidence,
      reasoning,
      impact_summary,
      risk_level: verdict === 'CANNOT_AFFORD' ? 'HIGH' : riskLevel,
      estimated_purchase_cost,
      estimated_monthly_cost,
    });
  } catch (err) {
    console.error('CFO affordability error', err);
    res.status(500).json({ error: err.message || 'Affordability request failed.' });
  }
});

module.exports = router;
