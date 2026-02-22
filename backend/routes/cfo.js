const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabaseAdmin = require('../supabaseAdmin');
const supabase = require('../supabaseClient');
const { getTaxConfig } = require('../lib/tax-config');
const { parseIntent, computeCFOAnswer, getRuleBasedSavings, formatAnswerText } = require('../lib/cfo-engine');
const { SYSTEM_PROMPT, buildUserMessage } = require('../lib/buildAffordabilityPrompt');
const { CFO_INSIGHTS_SYSTEM_PROMPT, buildCFOInsightsUserMessage } = require('../lib/buildCFOInsightsPrompt');
const { PRO_SAVINGS_SYSTEM_PROMPT, buildProSavingsUserMessage } = require('../lib/buildProSavingsPrompt');

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

async function getBalance(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabaseAdmin
      .from('user_settings')
      .select('current_balance')
      .eq('user_id', userId)
      .maybeSingle();
    return data ? Number(data.current_balance) : null;
  } catch (_) {
    return null;
  }
}

async function buildAppData(userType, userId = null) {
  const [transactions, subscriptions, currentBalance] = await Promise.all([
    getTransactions(userType),
    getSubscriptions(userId),
    getBalance(userId),
  ]);
  return {
    transactions,
    subscriptions,
    currentBalance,
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

// POST /cfo/insights — AI-powered CFO insights (Groq)
// Body: { financialSnapshot: { summary, runway, forecast, breakdown, transactions, recurring, subscriptions }, userType? }
router.post('/insights', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'CFO Insights not configured (GROQ_API_KEY missing).' });
    }
    const { financialSnapshot, userType } = req.body;
    if (!financialSnapshot || typeof financialSnapshot !== 'object') {
      return res.status(400).json({ error: 'financialSnapshot is required.' });
    }

    const resolvedUserType = userType || req.userType || 'sme';
    const userMessage = buildCFOInsightsUserMessage({ ...financialSnapshot, userType: resolvedUserType });

    console.log('[Groq insights] building insights for userType:', resolvedUserType);

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: CFO_INSIGHTS_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    console.log('[Groq insights] raw response:', raw.slice(0, 400));

    let insights;
    try {
      // response_format: json_object wraps the array in an object, e.g. {"insights":[...]}
      // Fall back to finding a bare array if needed
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        insights = parsed;
      } else if (Array.isArray(parsed.insights)) {
        insights = parsed.insights;
      } else {
        // last resort: find first array value in the object
        const arrayVal = Object.values(parsed).find(v => Array.isArray(v));
        if (arrayVal) {
          insights = arrayVal;
        } else {
          throw new Error('No array found in JSON response');
        }
      }
    } catch (_) {
      console.error('[Groq insights] JSON parse failed, raw:', raw.slice(0, 500));
      return res.status(502).json({ error: 'AI response was not valid JSON.', raw: raw.slice(0, 500) });
    }

    // Sanitise each insight
    const validSeverities = ['info', 'warning', 'critical'];
    const sanitised = insights
      .filter(i => i && typeof i.text === 'string' && i.text.trim())
      .map((i, idx) => ({
        id: typeof i.id === 'string' ? i.id : `insight-${idx}`,
        text: i.text.trim(),
        severity: validSeverities.includes(i.severity) ? i.severity : 'info',
        category: typeof i.category === 'string' ? i.category : 'general',
      }));

    res.json({ insights: sanitised });
  } catch (err) {
    console.error('CFO insights error', err);
    res.status(500).json({ error: err.message || 'CFO insights failed.' });
  }
});

// POST /cfo/pro-savings — AI-powered personalised savings (Pro feature, requires auth)
// Body: { financialSnapshot: { summary, breakdown, transactions, recurring, subscriptions }, userType? }
router.post('/pro-savings', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Pro Savings not configured (GROQ_API_KEY missing).' });
    }
    const { financialSnapshot, userType } = req.body;
    if (!financialSnapshot || typeof financialSnapshot !== 'object') {
      return res.status(400).json({ error: 'financialSnapshot is required.' });
    }

    const resolvedUserType = userType || req.userType || 'sme';
    const userMessage = buildProSavingsUserMessage({ ...financialSnapshot, userType: resolvedUserType });

    // Pre-compute data-driven floors so zero estimates can be replaced with realistic values
    const txns = Array.isArray(financialSnapshot.transactions) ? financialSnapshot.transactions : [];
    const months = new Set(txns.map(t => t.date?.slice(0, 7))).size || 1;
    const avgMonthlyExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0) / months;
    const avgMonthlyIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0) / months;
    const avgMonthly = Math.max(avgMonthlyExpenses, avgMonthlyIncome, 500);
    const floorLow = Math.max(Math.round(avgMonthly * 0.008), 8);
    const floorHigh = Math.max(Math.round(avgMonthly * 0.02), 20);

    console.log('[Groq pro-savings] generating for userType:', resolvedUserType);

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: PRO_SAVINGS_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 1400,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    console.log('[Groq pro-savings] raw:', raw.slice(0, 400));

    let items;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (Array.isArray(parsed.items)) {
        items = parsed.items;
      } else {
        const arrayVal = Object.values(parsed).find(v => Array.isArray(v));
        items = arrayVal || [];
      }
    } catch (_) {
      console.error('[Groq pro-savings] JSON parse failed, raw:', raw.slice(0, 500));
      return res.status(502).json({ error: 'AI response was not valid JSON.', raw: raw.slice(0, 500) });
    }

    const sanitised = items
      .filter(i => i && typeof i.title === 'string' && i.title.trim())
      .map((i, idx) => {
        const rawLow = typeof i.estimateMonthlyLow === 'number' ? i.estimateMonthlyLow : 0;
        const rawHigh = typeof i.estimateMonthlyHigh === 'number' ? i.estimateMonthlyHigh : 0;
        const low = rawLow > 0 ? rawLow : floorLow;
        const high = rawHigh > 0 ? rawHigh : Math.max(floorHigh, Math.round(low * 1.5));
        return {
          id: typeof i.id === 'string' ? i.id : `pro-saving-${idx}`,
          title: String(i.title).trim(),
          estimateMonthlyLow: low,
          estimateMonthlyHigh: Math.max(high, low),
          confidence: typeof i.confidence === 'number' ? Math.max(0, Math.min(100, i.confidence)) : 70,
          rationale: typeof i.rationale === 'string' ? i.rationale.trim() : '',
          ctaPrimary: 'Review',
          ctaSecondary: 'Ignore',
          tags: Array.isArray(i.tags) ? i.tags.filter(t => typeof t === 'string') : [],
          evidence: typeof i.evidence === 'string' && i.evidence.trim() ? i.evidence.trim() : undefined,
        };
      });

    res.json({ items: sanitised });
  } catch (err) {
    console.error('CFO pro-savings error', err);
    res.status(500).json({ error: err.message || 'Pro savings failed.' });
  }
});

module.exports = router;
