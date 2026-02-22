import { Transaction, RecurringPayment, FinancialSummary, ForecastDay, ExpenseBreakdown, ManualSubscription, AppData } from "./types";

export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);
}

export function detectRecurringPayments(transactions: Transaction[]): RecurringPayment[] {
  const expenses = transactions.filter((t) => t.type === "expense");

  // Group by merchant
  const merchantGroups: Record<string, Transaction[]> = {};
  for (const t of expenses) {
    if (!merchantGroups[t.merchant]) merchantGroups[t.merchant] = [];
    merchantGroups[t.merchant].push(t);
  }

  const recurring: RecurringPayment[] = [];

  for (const [merchant, txns] of Object.entries(merchantGroups)) {
    if (txns.length < 2) continue;

    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check similar amounts (within 5%)
    const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount <= 0.05);
    if (!allSimilar) continue;

    // Check intervals ≈ 30 days
    const intervals: number[] = [];
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
      averageAmount: Math.round(avgAmount * 100) / 100,
      frequency: Math.round(avgInterval),
      nextExpectedDate: nextDate.toISOString().split("T")[0],
      occurrences: sorted.length,
    });
  }

  return recurring;
}

/** Recurring income streams (same pattern as expenses: same merchant, similar amount, ~monthly). */
function detectRecurringIncome(transactions: Transaction[]): { averageAmount: number; frequency: number }[] {
  const incomeTxns = transactions.filter((t) => t.type === "income");
  const merchantGroups: Record<string, Transaction[]> = {};
  for (const t of incomeTxns) {
    if (!merchantGroups[t.merchant]) merchantGroups[t.merchant] = [];
    merchantGroups[t.merchant].push(t);
  }
  const recurring: { averageAmount: number; frequency: number }[] = [];
  for (const [, txns] of Object.entries(merchantGroups)) {
    if (txns.length < 2) continue;
    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (!amounts.every((a) => Math.abs(a - avgAmount) / avgAmount <= 0.05)) continue;
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval < 20 || avgInterval > 40) continue;
    recurring.push({
      averageAmount: Math.round(avgAmount * 100) / 100,
      frequency: Math.round(avgInterval),
    });
  }
  return recurring;
}

/** Annual income from recurring incoming payments only. */
function getAnnualIncomeFromRecurring(transactions: Transaction[]): number {
  const streams = detectRecurringIncome(transactions);
  return streams.reduce((sum, r) => sum + r.averageAmount * (365 / Math.max(1, r.frequency)), 0);
}

const INDIVIDUAL_TAX_THRESHOLD = 17000;
const INDIVIDUAL_STANDARD_BAND = 44000;
const INDIVIDUAL_STANDARD_RATE = 0.2;
const INDIVIDUAL_HIGHER_RATE = 0.4;
const INDIVIDUAL_PRSI_RATE = 0.042;
// USC 2026: 0.5% to €12,012 | 2% to €28,700 | 3% to €70,044 | 8% above
const USC_BAND1 = 12012;
const USC_BAND2 = 28700;
const USC_BAND3 = 70044;

function calculateUSC(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  let usc = Math.min(USC_BAND1, annualIncome) * 0.005;
  if (annualIncome > USC_BAND1) {
    usc += Math.min(USC_BAND2 - USC_BAND1, annualIncome - USC_BAND1) * 0.02;
  }
  if (annualIncome > USC_BAND2) {
    usc += Math.min(USC_BAND3 - USC_BAND2, annualIncome - USC_BAND2) * 0.03;
  }
  if (annualIncome > USC_BAND3) {
    usc += (annualIncome - USC_BAND3) * 0.08;
  }
  return usc;
}

/** SME: VAT 23%, corp 12.5%, PRSI 9%. Individual: income tax 20%/40%, PRSI 4.2%, USC 2026 bands, from recurring income only. */
export function estimateTaxes(
  transactions: Transaction[],
  taxConfig?: { type?: string; vatRate?: number; corpTaxRate?: number; prsiRate?: number } | null
) {
  const isIndividual = taxConfig?.type === "individual";

  const MONTHLY_DIVISOR = 12;

  if (isIndividual) {
    const annualIncome = getAnnualIncomeFromRecurring(transactions);
    let incomeTax = 0;
    if (annualIncome > INDIVIDUAL_TAX_THRESHOLD) {
      const inStandard = Math.min(INDIVIDUAL_STANDARD_BAND, annualIncome);
      const inHigher = Math.max(0, annualIncome - INDIVIDUAL_STANDARD_BAND);
      incomeTax = (inStandard * INDIVIDUAL_STANDARD_RATE + inHigher * INDIVIDUAL_HIGHER_RATE) / MONTHLY_DIVISOR;
    }
    const prsi = (annualIncome * INDIVIDUAL_PRSI_RATE) / MONTHLY_DIVISOR;
    const usc = calculateUSC(annualIncome) / MONTHLY_DIVISOR;
    const total = Math.round((incomeTax + prsi + usc) * 100) / 100;
    return {
      vat: null,
      corpTax: null,
      prsi: Math.round(prsi * 100) / 100,
      incomeTax: Math.round(incomeTax * 100) / 100,
      usc: Math.round(usc * 100) / 100,
      total,
    };
  }

  const earnings = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const vat = (earnings * 0.23) / MONTHLY_DIVISOR;
  const corpTax = (earnings * 0.125) / MONTHLY_DIVISOR;
  const prsi = (earnings * 0.09) / MONTHLY_DIVISOR;
  return {
    vat: Math.round(vat * 100) / 100,
    corpTax: Math.round(corpTax * 100) / 100,
    prsi: Math.round(prsi * 100) / 100,
    total: Math.round((vat + corpTax + prsi) * 100) / 100,
  };
}

export function getUpcomingRecurringTotal(recurring: RecurringPayment[], days: number = 30): number {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);

  return recurring.reduce((total, r) => {
    const nextDate = new Date(r.nextExpectedDate);
    if (nextDate <= cutoff) {
      return total + r.averageAmount;
    }
    return total;
  }, 0);
}

export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  const balance = calculateBalance(transactions);
  const taxes = estimateTaxes(transactions);
  const recurring = detectRecurringPayments(transactions);
  const recurringTotal = getUpcomingRecurringTotal(recurring);

  const trueAvailable = balance - taxes.vat - taxes.corpTax - recurringTotal;
  const riskRatio = balance > 0 ? trueAvailable / balance : 0;

  return {
    balance: Math.round(balance * 100) / 100,
    estimatedTax: taxes.total,
    estimatedVAT: taxes.vat,
    estimatedCorpTax: taxes.corpTax,
    estimatedPRSI: taxes.prsi,
    recurringTotal: Math.round(recurringTotal * 100) / 100,
    trueAvailable: Math.round(trueAvailable * 100) / 100,
    riskRatio: Math.round(riskRatio * 100) / 100,
  };
}

export function generateForecast(balance: number, recurring: RecurringPayment[], days: number = 30): ForecastDay[] {
  const forecast: ForecastDay[] = [];
  let projected = balance;
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // Check if any recurring payment falls on this day
    for (const r of recurring) {
      const nextDate = new Date(r.nextExpectedDate);
      // Check if this day matches (or is a monthly repeat)
      if (nextDate.getDate() === date.getDate() && i > 0) {
        projected -= r.averageAmount;
      }
    }

    forecast.push({ date: dateStr, projected: Math.round(projected * 100) / 100 });
  }

  return forecast;
}

export function getExpenseBreakdown(transactions: Transaction[]): ExpenseBreakdown[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const categories: Record<string, number> = {};

  for (const t of expenses) {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  }

  return Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getRiskLevel(ratio: number): "safe" | "warning" | "risk" {
  if (ratio >= 0.4) return "safe";
  if (ratio >= 0.2) return "warning";
  return "risk";
}

export function getCashRunwayDays(trueAvailable: number, recurring: RecurringPayment[]): number {
  const monthlyBurn = recurring.reduce((sum, r) => sum + r.averageAmount, 0);
  if (monthlyBurn <= 0) return 999;
  const dailyBurn = monthlyBurn / 30;
  return Math.max(0, Math.floor(trueAvailable / dailyBurn));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------- Unified helpers (shared data: transactions + manual subs + balance + tax) ----------

/** Upcoming payments total from manual subscriptions in the next N days */
export function getUpcomingPaymentsManual(subs: ManualSubscription[], days: number = 30): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return subs.reduce((total, sub) => {
    const due = new Date(sub.nextDueDate);
    due.setHours(0, 0, 0, 0);
    if (due >= today && due <= cutoff) return total + sub.amount;
    return total;
  }, 0);
}

/** Convert manual sub to a RecurringPayment-like shape for forecast (same date = deduct once) */
function getManualSubDeductionOnDate(subs: ManualSubscription[], dateStr: string): number {
  return subs.reduce((sum, sub) => {
    const dueStr = sub.nextDueDate;
    if (dueStr === dateStr) return sum + sub.amount;
    return sum;
  }, 0);
}

/** Forecast using balance, detected recurring, manual subs, and tax (e.g. on day 30). All features use this. */
export function generateForecastFromAppData(appData: AppData, days: number = 30): ForecastDay[] {
  const detected = detectRecurringPayments(appData.transactions);
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const forecast: ForecastDay[] = [];
  let projected = appData.currentBalance;
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    for (const r of detected) {
      const nextDate = new Date(r.nextExpectedDate);
      if (nextDate.getDate() === date.getDate() && i > 0) projected -= r.averageAmount;
    }
    projected -= getManualSubDeductionOnDate(appData.subscriptions, dateStr);
    if (i === days) projected -= taxes.total;

    projected = Math.round(projected * 100) / 100;
    forecast.push({ date: dateStr, projected });
  }

  return forecast;
}

/** Expense breakdown from transactions + manual subscriptions total + estimated tax (for pie chart). */
export function getExpenseBreakdownFromAppData(appData: AppData): ExpenseBreakdown[] {
  const fromTx = getExpenseBreakdown(appData.transactions);
  const categories: Record<string, number> = {};
  for (const { category, amount } of fromTx) {
    categories[category] = (categories[category] || 0) + amount;
  }
  const subsTotal = appData.subscriptions.reduce((s, sub) => s + sub.amount, 0);
  if (subsTotal > 0) categories["Subscriptions (manual)"] = subsTotal;
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  if (taxes.total > 0) categories["Estimated Tax"] = taxes.total;

  return Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Summary from AppData: balance, tax, upcoming (detected + manual), true available. */
export function calculateSummaryFromAppData(appData: AppData): FinancialSummary {
  const balance = appData.currentBalance;
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const detectedRecurring = detectRecurringPayments(appData.transactions);
  const upcomingDetected = getUpcomingRecurringTotal(detectedRecurring, 30);
  const upcomingManual = getUpcomingPaymentsManual(appData.subscriptions, 30);
  const recurringTotal = upcomingDetected + upcomingManual;
  const trueAvailable = balance - taxes.total - recurringTotal;
  const riskRatio = balance > 0 ? trueAvailable / balance : 0;

  return {
    balance: Math.round(balance * 100) / 100,
    estimatedTax: taxes.total,
    estimatedVAT: taxes.vat ?? null,
    estimatedCorpTax: taxes.corpTax ?? null,
    estimatedPRSI: taxes.prsi ?? null,
    estimatedIncomeTax: "incomeTax" in taxes ? taxes.incomeTax ?? null : null,
    estimatedUSC: "usc" in taxes ? taxes.usc ?? null : null,
    recurringTotal: Math.round(recurringTotal * 100) / 100,
    trueAvailable: Math.round(trueAvailable * 100) / 100,
    riskRatio: Math.round(riskRatio * 100) / 100,
  };
}

/** AI insight text from balance, forecast, and tax (shared with dashboard). */
export function generateAIInsight(
  balance: number,
  forecast: ForecastDay[],
  taxLiability: number
): string {
  const finalBalance = forecast.length > 0 ? forecast[forecast.length - 1].projected : balance;
  const taxPercentage = balance > 0 ? ((taxLiability / balance) * 100).toFixed(1) : "0";

  if (finalBalance < 0) {
    const shortfallIndex = forecast.findIndex((f) => f.projected < 0);
    const day = shortfallIndex >= 0 ? shortfallIndex : 30;
    return `At current burn rate, you will face a shortfall in ${day} days.`;
  }
  if (taxLiability > balance * 0.2) {
    return `Your estimated tax liability represents ${taxPercentage}% of available cash. Ensure your Tax Vault is funded.`;
  }
  return `Your cash flow looks stable. No shortfalls predicted in the next 30 days.`;
}

function normalisedMonthlySubAmount(sub: ManualSubscription): number {
  const freq = (sub.frequency || "monthly").toLowerCase();
  if (freq === "weekly") return sub.amount * (365 / 12 / 7); // ~4.33 weeks/month
  if (freq === "annual" || freq === "yearly") return sub.amount / 12;
  if (freq === "quarterly") return sub.amount / 3;
  return sub.amount; // monthly (default)
}

/** Cash runway days derived from actual historical expense rate + manual subscriptions. */
export function getCashRunwayFromAppData(appData: AppData): number {
  const summary = calculateSummaryFromAppData(appData);

  const expenses = appData.transactions.filter((t) => t.type === "expense");
  let monthlyBurnFromHistory = 0;
  if (expenses.length > 0) {
    const timestamps = expenses.map((t) => new Date(t.date).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const periodDays = Math.max((maxTs - minTs) / (1000 * 60 * 60 * 24), 30);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    monthlyBurnFromHistory = (totalExpenses / periodDays) * 30;
  }

  const monthlyManual = appData.subscriptions.reduce((s, sub) => s + normalisedMonthlySubAmount(sub), 0);
  const monthlyBurn = monthlyBurnFromHistory + monthlyManual;

  if (monthlyBurn <= 0) return 999;
  const dailyBurn = monthlyBurn / 30;
  const available = Number.isFinite(summary.trueAvailable) ? summary.trueAvailable : 0;
  return Math.max(0, Math.floor(available / dailyBurn));
}
