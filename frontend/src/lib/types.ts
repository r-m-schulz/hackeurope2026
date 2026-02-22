export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  type: "income" | "expense";
  category: string;
}

export interface RecurringPayment {
  merchant: string;
  averageAmount: number;
  frequency: number;
  nextExpectedDate: string;
  occurrences: number;
}

export interface FinancialSummary {
  balance: number;
  estimatedTax: number;
  estimatedVAT: number | null;
  estimatedCorpTax: number | null;
  estimatedPRSI: number | null;
  estimatedIncomeTax?: number | null;
  estimatedUSC?: number | null;
  recurringTotal: number;
  trueAvailable: number;
  riskRatio: number;
}

export interface ForecastDay {
  date: string;
  projected: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
}

/** Manual recurring payment (user-added subscription) */
export interface ManualSubscription {
  id: string;
  merchant: string;
  amount: number;
  nextDueDate: string;
  frequency: "monthly" | "weekly";
}

export interface TaxConfig {
  vatRate: number;
  corpTaxRate: number;
}

/** Single source of truth for the app – transactions, manual subs, balance, tax config */
export interface AppData {
  transactions: Transaction[];
  subscriptions: ManualSubscription[];
  currentBalance: number;
  taxConfig: TaxConfig;
}

/** CFO query request (snapshot optional if backend has user_type + auth) */
export interface CFOQueryInput {
  queryText: string;
  appDataSnapshot?: AppData;
  userSettings?: { student?: boolean; businessType?: string };
}

/** CFO query response */
export interface CFOQueryResponse {
  intent: string;
  answerText: string;
  affordability: boolean;
  recommendedMaxMonthly: number;
  runwayDays: number;
  safeToSpendNow: number;
  confidence: number;
  assumptions: { label: string; value: string }[];
  confidenceReasons?: string[];
  actions?: string[];
}

/** Single savings suggestion from /cfo/savings */
export interface CFOSavingsItem {
  id: string;
  title: string;
  estimateMonthlyLow: number;
  estimateMonthlyHigh: number;
  confidence: number;
  rationale: string;
  ctaPrimary: string;
  ctaSecondary: string;
  tags: string[];
  evidence?: string;
}

export interface CFOSavingsResponse {
  items: CFOSavingsItem[];
}

/** Financial summary payload for Affordability Advisor (summarized numbers only) */
export interface AffordabilitySummary {
  bankBalance: number;
  trueAvailableCash: number;
  estimatedTaxLiability: number;
  upcomingRecurring30Days: number;
  forecastLowestPoint30Days: number;
  monthlyIncomeTotal: number;
  monthlyExpenseTotal: number;
  riskStatus: string;
}

/** Single AI-generated CFO insight */
export interface CFOInsight {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical";
  category: string;
}

export interface CFOInsightsResponse {
  insights: CFOInsight[];
}

/** Financial snapshot sent to /cfo/insights */
export interface CFOInsightsSnapshot {
  summary: {
    balance: number;
    estimatedTax: number;
    trueAvailable: number;
    recurringTotal: number;
    riskRatio: number;
  };
  runway: { days: number; status: string; monthlyBurn: number };
  forecast: { date: string; projected: number }[];
  breakdown: { category: string; amount: number }[];
  transactions: Transaction[];
  recurring: RecurringPayment[];
  subscriptions: ManualSubscription[];
}

/** Affordability Advisor AI response */
export interface AffordabilityAdvisorResponse {
  verdict: "AFFORD" | "CANNOT_AFFORD" | "RISKY";
  confidence: number;
  reasoning: string;
  impact_summary: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  estimated_purchase_cost: number | null;
  estimated_monthly_cost: number | null;
}
