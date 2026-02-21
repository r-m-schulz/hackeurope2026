import type { FinancialSummary, ForecastDay, ExpenseBreakdown, RecurringPayment, Transaction, ManualSubscription } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export type UserType = "sme" | "individual";

function authHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function get<T>(path: string, params?: Record<string, string>, token?: string): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function del<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
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
    list: (token: string) =>
      get<{ subscriptions: ManualSubscription[]; count: number }>("/subscriptions", undefined, token),

    add: (sub: Omit<ManualSubscription, "id">, token: string) =>
      post<{ subscription: ManualSubscription }>("/subscriptions", sub, token),

    delete: (id: string, token: string) =>
      del<{ message: string; id: string }>(`/subscriptions/${id}`, token),
  },
};
