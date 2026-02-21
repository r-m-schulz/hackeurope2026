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
