// CFO query answer and savings suggestions (deterministic, no LLM required)

const {
  detectRecurringPayments,
  estimateTaxes,
  generateForecastFromAppData,
  calculateSummaryFromAppData,
  getCashRunwayFromAppData,
} = require('./finance-engine');

const DEFAULT_RUNWAY_TARGET_DAYS = 60;
const AFFORDABILITY_HORIZON_DAYS = 60;

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Parse query for intent and optional amount (monthly or one-off). */
function parseIntent(queryText) {
  const text = (queryText || '').trim();
  const lower = text.toLowerCase();
  const intent = lower.includes('hire') || lower.includes('employee') ? 'hire'
    : lower.includes('subscription') || lower.includes('subscribe') || lower.includes('/mo') || lower.includes('per month') ? 'subscription'
    : lower.includes('tax') || lower.includes('vault') ? 'tax'
    : lower.includes('afford') || lower.includes('spend') || lower.includes('cost') || /\d+/.test(text) ? 'afford'
    : 'general';

  let monthlyAmount = 0;
  let oneOffAmount = 0;

  // €1,200 or 1200€ or € 1200 or 1200 euro
  const withEuro = text.match(/€\s*([\d\s,.]+)|([\d\s,]+)\s*(?:€|eur|euro)/i);
  // 500/month or 500 per month or 500/mo or €2500/month
  const monthly = text.match(/([\d\s,.]+)\s*(?:\/|\/mo|per)\s*(?:month|mo|mth)/i);
  // Plain number when question is about affording something
  const affordContext = lower.includes('afford') || lower.includes('spend') || lower.includes('cost') || lower.includes('buy') || lower.includes('laptop') || lower.includes('pet');
  const plainNumMatch = text.match(/\d[\d\s,.]*/);

  if (monthly && monthly[1]) {
    const numStr = monthly[1].replace(/[\s,]/g, '');
    monthlyAmount = parseFloat(numStr) || 0;
  } else if (withEuro && (withEuro[1] || withEuro[2])) {
    const numStr = (withEuro[1] || withEuro[2]).replace(/[\s,]/g, '');
    const value = parseFloat(numStr) || 0;
    if (lower.includes('month') || lower.includes('/mo') || lower.includes('per month')) {
      monthlyAmount = value;
    } else {
      oneOffAmount = value;
    }
  } else if (affordContext && plainNumMatch) {
    const numStr = (plainNumMatch[0] || '').replace(/[\s,]/g, '');
    const value = parseFloat(numStr) || 0;
    if (value > 0) {
      if (lower.includes('month') || lower.includes('/mo') || lower.includes('per month') || lower.includes('hire') || lower.includes('subscription')) {
        monthlyAmount = value;
      } else {
        oneOffAmount = value;
      }
    }
  }

  return { intent, monthlyAmount, oneOffAmount };
}

function getUpcomingRecurringTotal(recurring, days = 30) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);
  return recurring.reduce((total, r) => {
    const nextDate = new Date(r.nextExpectedDate);
    return nextDate <= cutoff ? total + r.averageAmount : total;
  }, 0);
}

function getUpcomingPaymentsManual(subs, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return subs.reduce((total, sub) => {
    const due = new Date(sub.nextDueDate);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= cutoff ? total + sub.amount : total;
  }, 0);
}

function getSafeToSpendNow(appData) {
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const detected = detectRecurringPayments(appData.transactions);
  const upcomingDetected = getUpcomingRecurringTotal(detected, 30);
  const upcomingManual = getUpcomingPaymentsManual(appData.subscriptions, 30);
  const balance = appData.currentBalance;
  const recurring = upcomingDetected + upcomingManual;
  return Math.max(0, balance - taxes.total - recurring);
}

function getAvgDailyNetOutflow(appData) {
  const detected = detectRecurringPayments(appData.transactions);
  const monthlyDetected = detected.reduce((s, r) => s + r.averageAmount, 0);
  const monthlyManual = appData.subscriptions.reduce((s, sub) => {
    return s + (sub.frequency === 'monthly' ? sub.amount : sub.amount * 4);
  }, 0);
  const monthly = monthlyDetected + monthlyManual;
  if (monthly <= 0) return 0;
  return monthly / 30;
}

function getRunwayDays(appData) {
  const safe = getSafeToSpendNow(appData);
  const daily = getAvgDailyNetOutflow(appData);
  if (daily <= 0) return 999;
  return Math.max(0, Math.min(999, Math.floor(safe / daily)));
}

function canAffordMonthly(appData, monthlyAmount) {
  const forecast = generateForecastFromAppData(appData, AFFORDABILITY_HORIZON_DAYS);
  const dailyExtra = monthlyAmount / 30;
  for (let i = 0; i < forecast.length; i++) {
    const projected = forecast[i].projected - dailyExtra * (i + 1);
    if (projected <= 0) return false;
  }
  return true;
}

function getRecommendedMaxMonthly(appData, targetRunwayDays = DEFAULT_RUNWAY_TARGET_DAYS) {
  const safe = getSafeToSpendNow(appData);
  const daily = getAvgDailyNetOutflow(appData);
  if (daily <= 0) return safe;
  const runwayAtZeroExtra = safe / daily;
  if (runwayAtZeroExtra >= targetRunwayDays) {
    const headroom = safe - targetRunwayDays * daily;
    return Math.max(0, Math.floor(headroom / (targetRunwayDays / 30)));
  }
  return 0;
}

function getCFOConfidence(appData, recurring) {
  const reasons = [];
  let score = 100;
  const totalExpenses = appData.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const categorized = appData.transactions.filter(t => t.category && t.category !== 'Uncategorized');
  const categorizedAmount = categorized.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const pctCategorized = totalExpenses > 0 ? categorizedAmount / totalExpenses : 1;
  if (pctCategorized < 0.8) {
    score -= 15;
    reasons.push('Some expenses uncategorized');
  }
  if (recurring.length < 2) {
    score -= 10;
    reasons.push('Few recurring patterns detected');
  }
  if (reasons.length === 0) reasons.push('Based on categorized data and recurring patterns');
  return { confidence: Math.max(0, Math.min(100, score)), reasons };
}

function computeCFOAnswer(appData, { monthlyAmount = 0, oneOffAmount = 0, targetRunwayDays = DEFAULT_RUNWAY_TARGET_DAYS } = {}) {
  const detected = detectRecurringPayments(appData.transactions);
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const safeToSpendNow = getSafeToSpendNow(appData);
  const runwayDays = getRunwayDays(appData);
  let affordability = true;
  if (oneOffAmount > 0) {
    affordability = oneOffAmount <= safeToSpendNow;
  } else if (monthlyAmount > 0) {
    affordability = canAffordMonthly(appData, monthlyAmount);
  }
  const recommendedMaxMonthly = getRecommendedMaxMonthly(appData, targetRunwayDays);
  const { confidence, reasons: confidenceReasons } = getCFOConfidence(appData, detected);
  const taxPct = appData.currentBalance > 0 ? ((taxes.total / appData.currentBalance) * 100).toFixed(1) : '0';
  const assumptions = [
    { label: 'Tax reserve', value: `${taxPct}% of balance` },
    { label: 'Recurring', value: 'Detected + manual subscriptions included' },
    { label: 'Timeframe', value: '30-day horizon for safe-to-spend' },
  ];
  return {
    safeToSpendNow: round2(safeToSpendNow),
    runwayDays,
    affordability,
    recommendedMaxMonthly: round2(recommendedMaxMonthly),
    confidence,
    confidenceReasons,
    assumptions,
    oneOffAmount,
    monthlyAmount,
  };
}

function groupByMerchantFamily(entries) {
  const families = {};
  const categoryKeywords = {
    cloud: ['aws', 'google cloud', 'azure', 'digitalocean', 'heroku'],
    workspace: ['slack', 'notion', 'asana', 'monday', 'trello', 'google workspace', 'microsoft'],
    design: ['figma', 'adobe', 'sketch', 'canva'],
    crm: ['hubspot', 'salesforce', 'pipedrive', 'zoho'],
  };
  for (const e of entries) {
    const lower = e.merchant.toLowerCase();
    let family = 'Other';
    for (const [fam, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        family = fam;
        break;
      }
    }
    if (!families[family]) families[family] = [];
    families[family].push(e);
  }
  return families;
}

function getRuleBasedSavings(appData, userSettings = {}) {
  const items = [];
  const detected = detectRecurringPayments(appData.transactions);
  const allRecurring = [
    ...detected.map(r => ({ merchant: r.merchant, amount: r.averageAmount })),
    ...appData.subscriptions.map(s => ({ merchant: s.merchant, amount: s.amount })),
  ];
  const byCategory = groupByMerchantFamily(allRecurring);

  for (const [family, entries] of Object.entries(byCategory)) {
    if (entries.length < 2 || family === 'Other') continue;
    const total = entries.reduce((s, e) => s + e.amount, 0);
    items.push({
      id: `dup-${family}`,
      title: `Possible duplicate or overlapping subscriptions (${family})`,
      estimateMonthlyLow: Math.round(total * 0.1),
      estimateMonthlyHigh: Math.round(total * 0.25),
      confidence: 65,
      rationale: `Multiple charges in same category. Consolidating may save 10–25%.`,
      evidence: entries.map(e => e.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['duplicate', 'subscriptions'],
    });
  }

  if (userSettings.student) {
    const spotify = allRecurring.find(r => r.merchant.toLowerCase().includes('spotify'));
    if (spotify) {
      items.push({
        id: 'student-spotify',
        title: 'Check Spotify Student discount',
        estimateMonthlyLow: 3,
        estimateMonthlyHigh: 6,
        confidence: 70,
        rationale: 'Student plans often offer 50% off. Verify eligibility with your institution.',
        evidence: spotify.merchant,
        ctaPrimary: 'Mark done',
        ctaSecondary: 'Ignore',
        tags: ['student', 'entertainment'],
      });
    }
  }

  const adobe = allRecurring.filter(r => r.merchant.toLowerCase().includes('adobe'));
  if (adobe.length >= 2) {
    const total = adobe.reduce((s, e) => s + e.amount, 0);
    items.push({
      id: 'adobe-consolidate',
      title: 'Consider Adobe plan consolidation',
      estimateMonthlyLow: Math.round(total * 0.1),
      estimateMonthlyHigh: Math.round(total * 0.2),
      confidence: 60,
      rationale: 'Multiple Adobe charges detected. Bundled plans may be cheaper.',
      evidence: adobe.map(e => e.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['subscriptions', 'software'],
    });
  }

  const smallSaaS = allRecurring.filter(e => e.amount > 0 && e.amount < 100);
  if (smallSaaS.length >= 3) {
    const total = smallSaaS.reduce((s, e) => s + e.amount, 0);
    items.push({
      id: 'saas-annual',
      title: 'Review annual billing for small SaaS tools',
      estimateMonthlyLow: Math.round(total * 0.05),
      estimateMonthlyHigh: Math.round(total * 0.15),
      confidence: 55,
      rationale: 'Several small recurring tools. Annual plans often offer 1–2 months free.',
      evidence: smallSaaS.slice(0, 3).map(e => e.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['subscriptions', 'optimization'],
    });
  }

  const highRecurring = allRecurring.filter(e => e.amount >= 50);
  if (highRecurring.length >= 1) {
    items.push({
      id: 'payment-annual',
      title: 'Check annual vs monthly pricing for larger subscriptions',
      estimateMonthlyLow: 5,
      estimateMonthlyHigh: 20,
      confidence: 50,
      rationale: 'Some providers offer a discount for annual payment. Compare on their billing page.',
      evidence: highRecurring.slice(0, 2).map(e => e.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['billing', 'optimization'],
    });
  }

  const equipmentOrSoftware = appData.transactions.filter(
    t => t.type === 'expense' && ['Supplies', 'IT', 'Subscriptions'].includes(t.category) && t.amount > 100
  );
  if (equipmentOrSoftware.length >= 1) {
    items.push({
      id: 'tax-deductible-hint',
      title: 'Work-related equipment or software may be deductible',
      estimateMonthlyLow: 0,
      estimateMonthlyHigh: 0,
      confidence: 45,
      rationale: 'May be deductible depending on jurisdiction and business use—confirm with an accountant. Informational only.',
      evidence: equipmentOrSoftware.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'deduction'],
    });
  }

  return items.slice(0, 6);
}

function formatAnswerText(result, monthlyAmount, intent, oneOffAmount = 0) {
  const afford = result.affordability ? 'Yes' : 'No';
  const runway = result.runwayDays;
  const max = result.recommendedMaxMonthly;
  const safe = result.safeToSpendNow.toLocaleString('en-IE', { maximumFractionDigits: 0 });
  if (oneOffAmount > 0) {
    return `Can you afford a one-off cost of €${oneOffAmount.toLocaleString('en-IE', { maximumFractionDigits: 0 })}? ${afford}. Safe to spend now: €${safe}. Runway: ${runway} days.`;
  }
  if (intent === 'hire' && monthlyAmount > 0) {
    return `Can you afford a €${monthlyAmount.toLocaleString('en-IE', { maximumFractionDigits: 0 })}/month hire? ${afford}. Current runway: ${runway} days. Recommended max new monthly commitment to keep ~60 days runway: €${max.toLocaleString('en-IE', { maximumFractionDigits: 0 })}.`;
  }
  if ((intent === 'subscription' || intent === 'afford') && monthlyAmount > 0) {
    return `Can you afford €${monthlyAmount.toLocaleString('en-IE', { maximumFractionDigits: 0 })}/month? ${afford}. Safe to spend now: €${safe}. Runway: ${runway} days.`;
  }
  return `Safe to spend now: €${safe}. Runway: ${runway} days. Recommended max monthly spend to maintain buffer: €${max.toLocaleString('en-IE', { maximumFractionDigits: 0 })}.`;
}

module.exports = {
  parseIntent,
  computeCFOAnswer,
  getRuleBasedSavings,
  formatAnswerText,
};
