import type { AppData, RecurringPayment, Transaction } from "./types";
import {
  detectRecurringPayments,
  estimateTaxes,
  getUpcomingRecurringTotal,
  getUpcomingPaymentsManual,
  generateForecastFromAppData,
} from "./finance-engine";

const DEFAULT_RUNWAY_TARGET_DAYS = 60;
const AFFORDABILITY_HORIZON_DAYS = 60;

export interface CFOScenarioDeltas {
  newHireMonthly?: number;
  newSubscriptionMonthly?: number;
  revenueDropMonthly?: number;
}

export interface CFOAssumption {
  label: string;
  value: string;
}

export interface CFOAnswerResult {
  safeToSpendNow: number;
  runwayDays: number;
  affordability: boolean;
  recommendedMaxMonthly: number;
  confidence: number;
  confidenceReasons: string[];
  assumptions: CFOAssumption[];
}

/** Safe to spend now = balance - estimated VAT - corp tax - upcoming recurring (30d) */
export function getSafeToSpendNow(appData: AppData, deltas?: CFOScenarioDeltas): number {
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);
  const detected = detectRecurringPayments(appData.transactions);
  const upcomingDetected = getUpcomingRecurringTotal(detected, 30);
  const upcomingManual = getUpcomingPaymentsManual(appData.subscriptions, 30);
  let balance = appData.currentBalance;

  if (deltas?.revenueDropMonthly) {
    balance -= deltas.revenueDropMonthly;
  }
  if (deltas?.newHireMonthly) {
    balance -= deltas.newHireMonthly;
  }
  if (deltas?.newSubscriptionMonthly) {
    balance -= deltas.newSubscriptionMonthly;
  }

  const recurring = upcomingDetected + upcomingManual;
  return Math.max(0, balance - taxes.total - recurring);
}

/** Avg daily net outflow from recurring (detected + manual) for runway. */
function getAvgDailyNetOutflow(appData: AppData, deltas?: CFOScenarioDeltas): number {
  const detected = detectRecurringPayments(appData.transactions);
  const monthlyDetected = detected.reduce((s, r) => s + r.averageAmount, 0);
  const monthlyManual = appData.subscriptions.reduce(
    (s, sub) => s + (sub.frequency === "monthly" ? sub.amount : sub.amount * 4),
    0
  );
  let monthly = monthlyDetected + monthlyManual;
  if (deltas?.newHireMonthly) monthly += deltas.newHireMonthly;
  if (deltas?.newSubscriptionMonthly) monthly += deltas.newSubscriptionMonthly;
  if (monthly <= 0) return 0;
  return monthly / 30;
}

/** Runway in days with guardrails (min 0, max 999). */
export function getRunwayDays(appData: AppData, deltas?: CFOScenarioDeltas): number {
  const safe = getSafeToSpendNow(appData, deltas);
  const daily = getAvgDailyNetOutflow(appData, deltas);
  if (daily <= 0) return 999;
  return Math.max(0, Math.min(999, Math.floor(safe / daily)));
}

/** Can afford X per month? Yes if projected balance stays > 0 for next AFFORDABILITY_HORIZON_DAYS. */
export function canAffordMonthly(
  appData: AppData,
  monthlyAmount: number,
  deltas?: CFOScenarioDeltas
): boolean {
  const forecast = generateForecastFromAppData(appData, AFFORDABILITY_HORIZON_DAYS);
  const dailyExtra = monthlyAmount / 30;
  for (let i = 0; i < forecast.length; i++) {
    const projected = forecast[i].projected - dailyExtra * (i + 1);
    if (projected <= 0) return false;
  }
  return true;
}

/** Max X per month such that runway >= target days (e.g. 60). */
export function getRecommendedMaxMonthly(
  appData: AppData,
  targetRunwayDays: number = DEFAULT_RUNWAY_TARGET_DAYS,
  deltas?: CFOScenarioDeltas
): number {
  const safe = getSafeToSpendNow(appData, deltas);
  const daily = getAvgDailyNetOutflow(appData, deltas);
  if (daily <= 0) return safe;
  const runwayAtZeroExtra = safe / daily;
  if (runwayAtZeroExtra >= targetRunwayDays) {
    const headroom = safe - targetRunwayDays * daily;
    return Math.max(0, Math.floor(headroom / (targetRunwayDays / 30)));
  }
  return 0;
}

/** Confidence 0–100 and reason tags for CFO answer. */
export function getCFOConfidence(
  appData: AppData,
  recurring: RecurringPayment[]
): { confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 100;

  const totalExpenses = appData.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const categorized = appData.transactions.filter((t) => t.category && t.category !== "Uncategorized");
  const categorizedAmount = categorized
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const pctCategorized = totalExpenses > 0 ? categorizedAmount / totalExpenses : 1;
  if (pctCategorized < 0.8) {
    score -= 15;
    reasons.push("Some expenses uncategorized");
  }
  if (recurring.length < 2) {
    score -= 10;
    reasons.push("Few recurring patterns detected");
  }

  const weeklySpending = getWeeklySpendingVolatility(appData.transactions);
  if (weeklySpending > 0.3) {
    score -= 10;
    reasons.push("Spending varies week to week");
  }
  if (reasons.length === 0) reasons.push("Based on categorized data and recurring patterns");

  return {
    confidence: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

function getWeeklySpendingVolatility(transactions: Transaction[]): number {
  const byWeek: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.date);
    const weekKey = `${d.getFullYear()}-W${getWeek(d)}`;
    byWeek[weekKey] = (byWeek[weekKey] || 0) + t.amount;
  }
  const amounts = Object.values(byWeek);
  if (amounts.length < 2) return 0;
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((s, x) => s + (x - mean) ** 2, 0) / amounts.length;
  const std = Math.sqrt(variance);
  return mean > 0 ? std / mean : 0;
}

function getWeek(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + 1) / 7);
}

/** Full CFO answer: safeToSpend, runway, affordability for monthly X, recommended max, confidence, assumptions. */
export function computeCFOAnswer(
  appData: AppData,
  options: {
    monthlyAmount?: number;
    targetRunwayDays?: number;
    deltas?: CFOScenarioDeltas;
  }
): CFOAnswerResult {
  const { monthlyAmount = 0, targetRunwayDays = DEFAULT_RUNWAY_TARGET_DAYS, deltas } = options;
  const detected = detectRecurringPayments(appData.transactions);
  const taxes = estimateTaxes(appData.transactions, appData.taxConfig);

  const safeToSpendNow = getSafeToSpendNow(appData, deltas);
  const runwayDays = getRunwayDays(appData, deltas);
  const affordability = monthlyAmount <= 0 ? true : canAffordMonthly(appData, monthlyAmount, deltas);
  const recommendedMaxMonthly = getRecommendedMaxMonthly(appData, targetRunwayDays, deltas);
  const { confidence, reasons: confidenceReasons } = getCFOConfidence(appData, detected);

  const assumptions: CFOAssumption[] = [
    { label: "Tax reserve", value: `${((taxes.total / appData.currentBalance) * 100).toFixed(1)}% of balance` },
    { label: "Recurring", value: "Detected + manual subscriptions included" },
    { label: "Timeframe", value: "30-day horizon for safe-to-spend" },
  ];

  return {
    safeToSpendNow,
    runwayDays,
    affordability,
    recommendedMaxMonthly,
    confidence,
    confidenceReasons,
    assumptions,
  };
}
