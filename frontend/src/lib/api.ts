import type { FinancialSummary, ForecastDay, ExpenseBreakdown, RecurringPayment, Transaction, ManualSubscription, AppData, CFOQueryInput, CFOQueryResponse, CFOSavingsResponse, AffordabilitySummary, AffordabilityAdvisorResponse } from "./types";

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
  summary: (userType: UserType, token: string) =>
    get<FinancialSummary & { labels: { primaryMetric: string; taxReserve: string; thirdMetric: string } }>("/finance/summary", { user_type: userType }, token),

  transactions: (userType: UserType) =>
    get<{ transactions: Transaction[]; count: number }>("/finance/transactions", { user_type: userType }),

  forecast: (userType: UserType, token: string) =>
    get<{ forecast: ForecastDay[]; days: number }>("/finance/forecast", { user_type: userType }, token),

  recurring: (userType: UserType) =>
    get<{ recurring: RecurringPayment[]; count: number }>("/finance/recurring", { user_type: userType }),

  breakdown: (userType: UserType, token: string) =>
    get<{ breakdown: ExpenseBreakdown[] }>("/finance/breakdown", { user_type: userType }, token),

  runway: (userType: UserType, token: string) =>
    get<{ days: number; status: string; monthlyBurn: number; trueAvailable: number }>("/finance/runway", { user_type: userType }, token),

  insight: (userType: UserType, token: string) =>
    get<{ insight: string; tone: string; severity: string }>("/finance/insight", { user_type: userType }, token),

  subscriptions: {
    list: (token: string) =>
      get<{ subscriptions: ManualSubscription[]; count: number }>("/subscriptions", undefined, token),

    add: (sub: Omit<ManualSubscription, "id">, token: string) =>
      post<{ subscription: ManualSubscription }>("/subscriptions", sub, token),

    delete: (id: string, token: string) =>
      del<{ message: string; id: string }>(`/subscriptions/${id}`, token),
  },

  cfo: {
    query: (body: CFOQueryInput, token: string) =>
      post<CFOQueryResponse>("/cfo/query", body, token),

    savings: (
      token: string,
      userType: UserType,
      body?: { appDataSnapshot?: AppData; userSettings?: { student?: boolean } }
    ) =>
      body?.appDataSnapshot != null
        ? post<CFOSavingsResponse>("/cfo/savings", { ...body, user_type: userType }, token)
        : get<CFOSavingsResponse>("/cfo/savings", { user_type: userType }, token),

    affordability: (
      body: {
        question: string;
        financialSummary: AffordabilitySummary;
        options?: {
          priceExtracted?: number;
          priceAboveTrueAvailable?: boolean;
          trueAvailableNegative?: boolean;
          forecastLowestNegative?: boolean;
        };
      },
      token: string
    ) => post<AffordabilityAdvisorResponse>("/cfo/affordability", body, token),
  },
};
