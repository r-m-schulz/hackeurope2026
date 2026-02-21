// Ported from frontend/src/lib/finance-engine.ts
// Changes: stripped TS types, estimateTaxes accepts taxConfig param,
// generateAIInsight accepts tone param, date-fns replaced with plain Date arithmetic

function round2(n) {
  return Math.round(n * 100) / 100;
}

function detectRecurringPayments(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');

  const merchantGroups = {};
  for (const t of expenses) {
    if (!merchantGroups[t.merchant]) merchantGroups[t.merchant] = [];
    merchantGroups[t.merchant].push(t);
  }

  const recurring = [];

  for (const [merchant, txns] of Object.entries(merchantGroups)) {
    if (txns.length < 2) continue;

    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const amounts = sorted.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check similar amounts (within 5%)
    const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.05);
    if (!allSimilar) continue;

    // Check intervals ≈ 30 days
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(diff);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval < 20 || avgInterval > 40) continue;

    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

    recurring.push({
      merchant,
      averageAmount: round2(avgAmount),
      frequency: Math.round(avgInterval),
      nextExpectedDate: nextDate.toISOString().split('T')[0],
      occurrences: sorted.length,
    });
  }

  return recurring;
}

function estimateTaxes(transactions, taxConfig) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  if (taxConfig.type === 'sme') {
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const payrollExpenses = transactions
      .filter(t => t.category === 'Payroll')
      .reduce((acc, t) => acc + t.amount, 0);
    const profit = totalIncome - totalExpenses;

    const vat = totalIncome * taxConfig.vatRate;
    const corpTax = Math.max(0, profit * taxConfig.corpTaxRate);
    const prsi = payrollExpenses * taxConfig.prsiRate;

    return {
      vat: round2(vat),
      corpTax: round2(corpTax),
      prsi: round2(prsi),
      incomeTax: null,
      usc: null,
      total: round2(vat + corpTax + prsi),
    };
  }

  // individual
  const incomeTax = totalIncome * taxConfig.incomeTaxRate;
  const usc = totalIncome * taxConfig.uscRate;
  const prsi = totalIncome * taxConfig.prsiRate;

  return {
    vat: null,
    corpTax: null,
    prsi: round2(prsi),
    incomeTax: round2(incomeTax),
    usc: round2(usc),
    total: round2(incomeTax + usc + prsi),
  };
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

function getManualSubDeductionOnDate(subs, dateStr) {
  return subs.reduce((sum, sub) => {
    return sub.nextDueDate === dateStr ? sum + sub.amount : sum;
  }, 0);
}

function generateForecastFromAppData(appData, days = 30) {
  const detected = detectRecurringPayments(appData.transactions);
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const forecast = [];
  let projected = appData.currentBalance;
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    for (const r of detected) {
      const nextDate = new Date(r.nextExpectedDate);
      if (nextDate.getDate() === date.getDate() && i > 0) {
        projected -= r.averageAmount;
      }
    }
    projected -= getManualSubDeductionOnDate(appData.subscriptions, dateStr);
    if (i === days) projected -= taxes.total;

    forecast.push({ date: dateStr, projected: round2(projected) });
  }

  return forecast;
}

function getExpenseBreakdown(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const categories = {};
  for (const t of expenses) {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  }
  return Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function getExpenseBreakdownFromAppData(appData) {
  const fromTx = getExpenseBreakdown(appData.transactions);
  const categories = {};
  for (const { category, amount } of fromTx) {
    categories[category] = (categories[category] || 0) + amount;
  }
  const subsTotal = appData.subscriptions.reduce((s, sub) => s + sub.amount, 0);
  if (subsTotal > 0) categories['Subscriptions (manual)'] = subsTotal;
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  if (taxes.total > 0) categories['Estimated Tax'] = taxes.total;

  return Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function calculateSummaryFromAppData(appData) {
  const balance = Number.isFinite(appData.currentBalance) ? appData.currentBalance : 0;
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const detectedRecurring = detectRecurringPayments(appData.transactions);
  const upcomingDetected = getUpcomingRecurringTotal(detectedRecurring, 30);
  const upcomingManual = getUpcomingPaymentsManual(appData.subscriptions, 30);
  const recurringTotal = upcomingDetected + upcomingManual;
  const trueAvailable = balance - taxes.total - recurringTotal;
  const riskRatio = balance > 0 ? trueAvailable / balance : 0;

  return {
    balance: round2(balance),
    estimatedTax: taxes.total,
    estimatedVAT: taxes.vat,
    estimatedCorpTax: taxes.corpTax,
    estimatedPRSI: taxes.prsi,
    estimatedIncomeTax: taxes.incomeTax,
    estimatedUSC: taxes.usc,
    recurringTotal: round2(recurringTotal),
    trueAvailable: round2(trueAvailable),
    riskRatio: round2(riskRatio),
  };
}

function generateAIInsight(balance, forecast, taxLiability, tone) {
  const finalBalance = forecast.length > 0 ? forecast[forecast.length - 1].projected : balance;
  const taxPercentage = balance > 0 ? ((taxLiability / balance) * 100).toFixed(1) : '0';

  if (tone === 'cfo') {
    if (finalBalance < 0) {
      const shortfallIndex = forecast.findIndex(f => f.projected < 0);
      const day = shortfallIndex >= 0 ? shortfallIndex : 30;
      return {
        insight: `Cash reserves will be exhausted in ${day} days at current burn rate. Immediate review of operating expenditure is recommended.`,
        severity: 'critical',
      };
    }
    if (taxLiability > balance * 0.2) {
      return {
        insight: `Tax liability represents ${taxPercentage}% of liquid assets. Recommend ringfencing funds in a dedicated Tax Vault to ensure compliance.`,
        severity: 'warning',
      };
    }
    return {
      insight: `Cash flow is stable. No liquidity shortfalls forecast over the next 30 days. VAT and corp tax reserves are within acceptable parameters.`,
      severity: 'info',
    };
  }

  // personal tone
  if (finalBalance < 0) {
    const shortfallIndex = forecast.findIndex(f => f.projected < 0);
    const day = shortfallIndex >= 0 ? shortfallIndex : 30;
    return {
      insight: `You'll run out of money in ${day} days if things continue as they are. Time to cut back on non-essential spending.`,
      severity: 'critical',
    };
  }
  if (taxLiability > balance * 0.2) {
    return {
      insight: `Your tax bill is ${taxPercentage}% of your savings. Make sure you're setting aside enough each month to cover it.`,
      severity: 'warning',
    };
  }
  return {
    insight: `Your finances look healthy. No cash shortfalls expected in the next 30 days. Keep it up!`,
    severity: 'info',
  };
}

function normalisedMonthlySubAmount(sub) {
  const freq = (sub.frequency || 'monthly').toLowerCase();
  if (freq === 'weekly') return sub.amount * (365 / 12 / 7);   // ~4.33 weeks/month
  if (freq === 'annual' || freq === 'yearly') return sub.amount / 12;
  if (freq === 'quarterly') return sub.amount / 3;
  return sub.amount; // monthly (default)
}

function getCashRunwayFromAppData(appData) {
  const summary = calculateSummaryFromAppData(appData);

  // Derive monthly burn from actual historical expenses rather than only
  // pattern-matched recurring payments (which can silently return 0 with
  // real bank data where merchant names vary).
  const expenses = appData.transactions.filter(t => t.type === 'expense');
  let monthlyBurnFromHistory = 0;
  if (expenses.length > 0) {
    const timestamps = expenses.map(t => new Date(t.date).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    // Use at least 30 days to avoid wild extrapolation from very short windows.
    const periodDays = Math.max((maxTs - minTs) / (1000 * 60 * 60 * 24), 30);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    monthlyBurnFromHistory = (totalExpenses / periodDays) * 30;
  }

  // Add manual subscriptions, converting each to a monthly equivalent.
  const monthlyManual = appData.subscriptions.reduce(
    (s, sub) => s + normalisedMonthlySubAmount(sub),
    0
  );

  const monthlyBurn = monthlyBurnFromHistory + monthlyManual;

  // Guard: if truly no expenses and no subscriptions, return a sentinel.
  if (monthlyBurn <= 0) return { days: 999, monthlyBurn: 0, trueAvailable: summary.trueAvailable };

  const dailyBurn = monthlyBurn / 30;

  // trueAvailable = balance - taxes - upcoming recurring (next 30 days).
  // Guard against null/NaN balance so we never return a nonsense runway.
  const available = Number.isFinite(summary.trueAvailable) ? summary.trueAvailable : 0;
  const days = Math.max(0, Math.floor(available / dailyBurn));
  return { days, monthlyBurn: round2(monthlyBurn), trueAvailable: summary.trueAvailable };
}

module.exports = {
  detectRecurringPayments,
  estimateTaxes,
  generateForecastFromAppData,
  getExpenseBreakdownFromAppData,
  calculateSummaryFromAppData,
  generateAIInsight,
  getCashRunwayFromAppData,
};
