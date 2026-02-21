import { addDays } from "date-fns";
import { Transaction } from "./types";
import { seedTransactions } from "./seed-data";
import type { AppData, ManualSubscription } from "./types";

/** A few seed manual subscriptions so the app has shared data from the start */
export const seedManualSubscriptions: ManualSubscription[] = [
  { id: "sub-1", merchant: "AWS", amount: 1250, nextDueDate: addDays(new Date(), 2).toISOString().split("T")[0], frequency: "monthly" },
  { id: "sub-2", merchant: "Google Workspace", amount: 240, nextDueDate: addDays(new Date(), 5).toISOString().split("T")[0], frequency: "monthly" },
  { id: "sub-3", merchant: "WeWork", amount: 3500, nextDueDate: addDays(new Date(), 12).toISOString().split("T")[0], frequency: "monthly" },
];

/** Single source of truth: all features read from this shape. */
export const initialAppData: AppData = {
  transactions: [...seedTransactions],
  subscriptions: [...seedManualSubscriptions],
  currentBalance: 85400,
  taxConfig: { vatRate: 0.23, corpTaxRate: 0.125 },
};

/** Helper to create a new manual subscription with an id */
export function createManualSubscription(
  sub: Omit<ManualSubscription, "id">
): ManualSubscription {
  return { ...sub, id: `sub-${Date.now()}` };
}
