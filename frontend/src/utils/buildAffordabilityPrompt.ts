import type {
  AffordabilitySummary,
  FinancialSummary,
  ForecastDay,
  Transaction,
} from "@/lib/types";

export interface AffordabilityInput {
  summary: FinancialSummary;
  runway: { days: number; status: string; monthlyBurn: number; trueAvailable: number };
  forecast: ForecastDay[];
  transactions: Transaction[];
}

/**
 * Build the structured financial summary object sent to the Affordability Advisor API.
 * Uses summarized numbers only; no raw transaction history.
 */
export function buildAffordabilitySummary(input: AffordabilityInput): AffordabilitySummary {
  const { summary, runway, forecast, transactions } = input;

  const forecast30 = forecast.slice(0, 30);
  const forecastLowest =
    forecast30.length > 0
      ? Math.min(...forecast30.map((d) => d.projected))
      : summary.balance;

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const monthCount = monthSpan(transactions);
  const monthlyIncome = monthCount > 0 ? incomeTotal / monthCount : incomeTotal;
  const monthlyExpense = monthCount > 0 ? expenseTotal / monthCount : expenseTotal;

  return {
    bankBalance: summary.balance,
    trueAvailableCash: runway.trueAvailable,
    estimatedTaxLiability: summary.estimatedTax,
    upcomingRecurring30Days: summary.recurringTotal,
    forecastLowestPoint30Days: forecastLowest,
    monthlyIncomeTotal: Math.round(monthlyIncome * 100) / 100,
    monthlyExpenseTotal: Math.round(monthlyExpense * 100) / 100,
    riskStatus: runway.status,
  };
}

function monthSpan(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  const dates = transactions.map((t) => new Date(t.date).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  const days = (max - min) / (1000 * 60 * 60 * 24);
  return Math.max(1, days / 30);
}

/**
 * Extract a numeric price (euro amount) from user message if present.
 * Handles: "€1,200", "1200", "€500/month", "30 million", "1.5 million euro".
 */
export function extractPriceFromMessage(message: string): number | null {
  const normalized = message.replace(/,/g, "").toLowerCase();
  const millionMatch = normalized.match(/€?\s*(\d+(?:\.\d+)?)\s*million/i);
  if (millionMatch) {
    const value = parseFloat(millionMatch[1]) * 1_000_000;
    return Number.isFinite(value) ? value : null;
  }
  const thousandMatch = normalized.match(/€?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)/i);
  if (thousandMatch) {
    const value = parseFloat(thousandMatch[1]) * 1_000;
    return Number.isFinite(value) ? value : null;
  }
  const match = normalized.match(/€?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/?(?:month|mo|mth))?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}
