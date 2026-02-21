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
    const total = equipmentOrSoftware.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'tax-deductible-hint',
      title: 'Work-related equipment or software may be deductible',
      estimateMonthlyLow: Math.round(total * 0.125 / 12),
      estimateMonthlyHigh: Math.round(total * 0.25 / 12),
      confidence: 45,
      rationale: 'Equipment and software used for business (laptops, monitors, subscriptions) are deductible against your taxable income. At 12.5–25% effective tax rate, this reduces your tax bill. Confirm with an accountant.',
      evidence: equipmentOrSoftware.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'deduction'],
    });
  }

  // Home office furniture
  const furnitureMerchants = ['ikea', 'argos', 'dfs', 'harvey norman', 'furniture', 'homestore', 'dunelm', 'next', 'b&q', 'woodies', 'atlantic homecare', 'oak', 'sofa'];
  const furnitureTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.amount > 50 &&
      furnitureMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (furnitureTxns.length >= 1) {
    const total = furnitureTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'home-office-furniture',
      title: 'Home office furniture may be claimable as a business expense',
      estimateMonthlyLow: Math.round(total * 0.125 / 12),
      estimateMonthlyHigh: Math.round(total * 0.25 / 12),
      confidence: 55,
      rationale: 'Desks, chairs and shelving used for your home office are legitimately claimable. Keep receipts and document the business-use percentage. Confirm with your accountant.',
      evidence: furnitureTxns.slice(0, 3).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'home-office'],
    });
  }

  // Phone bill – business use proportion
  const phoneMerchants = ['vodafone', 'three', 'eir', 'tesco mobile', 'o2', 'meteor', 'virgin mobile', 'lyca', '48', 'sky mobile'];
  const phoneTxns = appData.transactions.filter(
    t => t.type === 'expense' && phoneMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (phoneTxns.length >= 1) {
    const monthly = phoneTxns.reduce((s, t) => s + t.amount, 0) / Math.max(phoneTxns.length, 1);
    items.push({
      id: 'phone-business-use',
      title: 'Claim the business-use portion of your phone bill',
      estimateMonthlyLow: Math.round(monthly * 0.25),
      estimateMonthlyHigh: Math.round(monthly * 0.5),
      confidence: 60,
      rationale: 'If you use your phone for business calls and data, typically 25–50% can be claimed as a business expense. Maintain a usage log to support the claim.',
      evidence: phoneTxns.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'phone'],
    });
  }

  // Broadband / internet – home office proportion
  const broadbandMerchants = ['sky', 'virgin media', 'pure telecom', 'siro', 'net1', 'digiweb', 'imagine', 'vodafone home'];
  const broadbandTxns = appData.transactions.filter(
    t => t.type === 'expense' && broadbandMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (broadbandTxns.length >= 1) {
    const monthly = broadbandTxns.reduce((s, t) => s + t.amount, 0) / Math.max(broadbandTxns.length, 1);
    items.push({
      id: 'broadband-home-office',
      title: 'Home broadband used for work may be partially deductible',
      estimateMonthlyLow: Math.round(monthly * 0.2),
      estimateMonthlyHigh: Math.round(monthly * 0.4),
      confidence: 55,
      rationale: 'If you work from home, a proportion of your broadband bill (based on business vs personal use) can be claimed. Keep bills and calculate the business-use %. Confirm with accountant.',
      evidence: broadbandTxns.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'home-office'],
    });
  }

  // Amazon – potential business supplies
  const amazonTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.merchant.toLowerCase().includes('amazon') && t.amount > 30
  );
  if (amazonTxns.length >= 2) {
    const total = amazonTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'amazon-business-supplies',
      title: 'Amazon purchases for business use may be deductible',
      estimateMonthlyLow: Math.round(total * 0.1 / 3),
      estimateMonthlyHigh: Math.round(total * 0.3 / 3),
      confidence: 40,
      rationale: 'Office supplies, cables, equipment and stationery bought on Amazon for business use are deductible. Review your orders and flag those with a business purpose.',
      evidence: `${amazonTxns.length} Amazon transactions totalling €${total.toFixed(0)}`,
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'supplies'],
    });
  }

  // Transport / fuel – business mileage
  const transportMerchants = ['shell', 'applegreen', 'circle k', 'topaz', 'fuel', 'petrol', 'diesel', 'uber', 'freenow', 'taxi', 'irish rail', 'irishrail', 'luas', 'dart', 'bus éireann', 'translink', 'ryanair', 'aer lingus', 'dublin bus'];
  const transportTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.amount > 10 &&
      transportMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (transportTxns.length >= 2) {
    const total = transportTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'business-travel',
      title: 'Business travel expenses may be deductible',
      estimateMonthlyLow: Math.round(total * 0.2 / 3),
      estimateMonthlyHigh: Math.round(total * 0.5 / 3),
      confidence: 50,
      rationale: 'Fuel, taxis and public transport costs incurred for business purposes (client visits, supplier trips, etc.) are deductible. Keep a mileage log and retain receipts.',
      evidence: transportTxns.slice(0, 3).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'travel'],
    });
  }

  // Client meals / entertainment (50% rule)
  const mealMerchants = ['restaurant', 'café', 'cafe', 'costa', 'starbucks', 'bar ', ' pub', 'centra', 'supermacs', 'mcdonalds', 'kfc', 'nandos', 'domino', 'just eat', 'deliveroo', 'uber eats'];
  const mealTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.amount > 15 &&
      mealMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (mealTxns.length >= 2) {
    const total = mealTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'client-entertainment',
      title: 'Client meals & entertainment may be 50% deductible',
      estimateMonthlyLow: Math.round(total * 0.25 / 3),
      estimateMonthlyHigh: Math.round(total * 0.5 / 3),
      confidence: 45,
      rationale: 'Meals and entertainment with clients or prospects are commonly deductible at 50%. Document the business purpose and attendees for each receipt.',
      evidence: mealTxns.slice(0, 3).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'entertainment'],
    });
  }

  // Professional development / courses
  const learningMerchants = ['udemy', 'coursera', 'linkedin learning', 'pluralsight', 'skillshare', 'eason', 'hodges figgis', 'chapters', 'amazon kindle', "o'reilly", 'manning', 'packt'];
  const learningTxns = appData.transactions.filter(
    t => t.type === 'expense' && learningMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (learningTxns.length >= 1) {
    const total = learningTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'professional-development',
      title: 'Professional development & training costs are fully deductible',
      estimateMonthlyLow: Math.round(total * 0.125 / 3),
      estimateMonthlyHigh: Math.round(total / 3),
      confidence: 70,
      rationale: 'Courses, books and subscriptions that maintain or improve skills relevant to your trade are 100% deductible. These are among the safest deductions available.',
      evidence: learningTxns.slice(0, 3).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'education'],
    });
  }

  // Coworking / office rental
  const coworkingMerchants = ['wework', 'glandore', 'regus', 'spaces', 'dogpatch', 'coworking', 'huckletree', 'the fumbally', 'talent garden'];
  const coworkingTxns = appData.transactions.filter(
    t => t.type === 'expense' && coworkingMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (coworkingTxns.length >= 1) {
    const total = coworkingTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: 'coworking-vat',
      title: 'Reclaim VAT on coworking / office costs',
      estimateMonthlyLow: Math.round(total * 0.18 / 3),
      estimateMonthlyHigh: Math.round(total * 0.23 / 3),
      confidence: 75,
      rationale: 'Coworking and office rental for business use are fully deductible. If VAT-registered, you can also reclaim the 23% VAT on these charges.',
      evidence: coworkingTxns.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'office'],
    });
  }

  // Pension contributions – highly tax-efficient
  const totalMonthlyExpenses = appData.transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) / 3;
  if (totalMonthlyExpenses > 500) {
    items.push({
      id: 'pension-contributions',
      title: 'Pension contributions offer one of the best tax reliefs available',
      estimateMonthlyLow: Math.round(totalMonthlyExpenses * 0.04),
      estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.08),
      confidence: 70,
      rationale: 'Self-employed individuals and SME directors can contribute up to 40% of net earnings to a pension and claim full income tax relief. This is effectively a 40c saving per €1 contributed for higher-rate taxpayers.',
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'pension'],
    });
  }

  // Utility bills – home office proportion
  const utilityMerchants = ['esb', 'electric ireland', 'bord gáis', 'bord gais', 'sse airtricity', 'airtricity', 'pinergy', 'flogas', 'calor'];
  const utilityTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.amount > 20 &&
      utilityMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (utilityTxns.length >= 1) {
    const monthly = utilityTxns.reduce((s, t) => s + t.amount, 0) / Math.max(utilityTxns.length, 1);
    items.push({
      id: 'utility-home-office',
      title: 'Claim a proportion of utility bills for your home office',
      estimateMonthlyLow: Math.round(monthly * 0.1),
      estimateMonthlyHigh: Math.round(monthly * 0.2),
      confidence: 55,
      rationale: "If you work from home, electricity and gas costs attributable to your workspace (typically calculated by room count or hours worked) are deductible. Revenue's e-worker scheme allows €3.20/day tax-free.",
      evidence: utilityTxns.slice(0, 2).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'home-office'],
    });
  }

  // Bank fees – deductible and worth reviewing
  const bankMerchants = ['bank of ireland', 'aib', 'ulster bank', 'ptsb', 'revolut', 'n26', 'stripe', 'paypal', 'square'];
  const bankFeeTxns = appData.transactions.filter(
    t => t.type === 'expense' && t.amount > 0 && t.amount < 50 &&
      bankMerchants.some(k => t.merchant.toLowerCase().includes(k))
  );
  if (bankFeeTxns.length >= 2) {
    const monthly = bankFeeTxns.reduce((s, t) => s + t.amount, 0) / 3;
    items.push({
      id: 'bank-fees',
      title: 'Bank & payment processing fees are fully deductible',
      estimateMonthlyLow: Math.round(monthly * 0.125),
      estimateMonthlyHigh: Math.round(monthly * 0.25),
      confidence: 65,
      rationale: 'Account maintenance fees, transaction charges and payment processor fees (Stripe, PayPal, etc.) are 100% deductible as a business expense. Ensure they\'re recorded correctly in your accounts.',
      evidence: bankFeeTxns.slice(0, 3).map(t => t.merchant).join(', '),
      ctaPrimary: 'Review',
      ctaSecondary: 'Ignore',
      tags: ['tax', 'banking'],
    });
  }

  // Always-on suggestions — appear regardless of transaction data

  items.push({
    id: 'vat-reclaim-review',
    title: 'Review VAT reclaim on all business purchases',
    estimateMonthlyLow: Math.round(appData.currentBalance * 0.002),
    estimateMonthlyHigh: Math.round(appData.currentBalance * 0.005),
    confidence: 65,
    rationale: "If you're VAT-registered, you can reclaim 23% VAT on most business expenses — software, equipment, office supplies, professional services. Many businesses miss this by not keeping proper VAT receipts.",
    ctaPrimary: 'Review',
    ctaSecondary: 'Ignore',
    tags: ['tax', 'vat'],
  });

  items.push({
    id: 'r-and-d-tax-credit',
    title: 'R&D Tax Credit — worth up to 25% of qualifying spend',
    estimateMonthlyLow: Math.round(totalMonthlyExpenses * 0.03),
    estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.08),
    confidence: 50,
    rationale: 'Any spend on developing new products, services or processes (including software, prototyping, testing) may qualify for a 25% R&D tax credit in Ireland. This applies even to failed projects. Many SMEs don\'t claim this.',
    ctaPrimary: 'Review',
    ctaSecondary: 'Ignore',
    tags: ['tax', 'r&d'],
  });

  items.push({
    id: 'flat-rate-expenses',
    title: 'Claim flat-rate expenses for your trade or profession',
    estimateMonthlyLow: 10,
    estimateMonthlyHigh: 40,
    confidence: 60,
    rationale: "Revenue allows flat-rate expense deductions for many trades without requiring individual receipts — covering uniforms, tools, and professional subscriptions. Check Revenue's published flat-rate schedule for your sector.",
    ctaPrimary: 'Review',
    ctaSecondary: 'Ignore',
    tags: ['tax', 'expenses'],
  });

  items.push({
    id: 'startup-relief',
    title: 'Start-Up Relief (SURE) or EIIS may reduce your tax bill',
    estimateMonthlyLow: 0,
    estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.1),
    confidence: 40,
    rationale: 'If you or investors have put money into the business, SURE (Start-Up Relief for Entrepreneurs) or EIIS (Employment Investment Incentive Scheme) can provide income tax relief of up to 40% on investment. Confirm eligibility with an accountant.',
    ctaPrimary: 'Review',
    ctaSecondary: 'Ignore',
    tags: ['tax', 'startup'],
  });

  return items.slice(0, 17);
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
