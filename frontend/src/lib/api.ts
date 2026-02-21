import type { FinancialSummary, ForecastDay, ExpenseBreakdown, RecurringPayment, Transaction, ManualSubscription } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export type UserType = "sme" | "individual";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function del<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: "DELETE" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  summary: (userType: UserType) =>
    get<FinancialSummary & { labels: { primaryMetric: string; taxReserve: string; thirdMetric: string } }>("/finance/summary", { user_type: userType }),

  transactions: (userType: UserType) =>
    get<{ transactions: Transaction[]; count: number }>("/finance/transactions", { user_type: userType }),

  forecast: (userType: UserType) =>
    get<{ forecast: ForecastDay[]; days: number }>("/finance/forecast", { user_type: userType }),

  recurring: (userType: UserType) =>
    get<{ recurring: RecurringPayment[]; count: number }>("/finance/recurring", { user_type: userType }),

  breakdown: (userType: UserType) =>
    get<{ breakdown: ExpenseBreakdown[] }>("/finance/breakdown", { user_type: userType }),

  runway: (userType: UserType) =>
    get<{ days: number; status: string; monthlyBurn: number; trueAvailable: number }>("/finance/runway", { user_type: userType }),

  insight: (userType: UserType) =>
    get<{ insight: string; tone: string; severity: string }>("/finance/insight", { user_type: userType }),

  subscriptions: {
    list: (userType: UserType) =>
      get<{ subscriptions: ManualSubscription[]; count: number }>("/subscriptions", { user_type: userType }),

    add: (userType: UserType, sub: Omit<ManualSubscription, "id">) =>
      post<{ subscription: ManualSubscription }>("/subscriptions", { user_type: userType, ...sub }),

    delete: (userType: UserType, id: string) =>
      del<{ message: string; id: string }>(`/subscriptions/${id}`, { user_type: userType }),
  },
};
