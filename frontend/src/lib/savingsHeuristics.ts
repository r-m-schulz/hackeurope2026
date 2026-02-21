import type { AppData, RecurringPayment, Transaction } from "./types";
import { detectRecurringPayments } from "./finance-engine";

export interface UserSettings {
  student?: boolean;
  businessType?: string;
}

export interface SavingsItem {
  id: string;
  title: string;
  estimateMonthlyLow: number;
  estimateMonthlyHigh: number;
  confidence: number;
  rationale: string;
  ctaPrimary: string;
  ctaSecondary: string;
  tags: string[];
  /** Optional: merchant/category for "why we think this" */
  evidence?: string;
}

/** Confidence for recurring: same merchant, stable amount, consistent interval => high. */
export function getRecurringConfidence(r: RecurringPayment): number {
  const hasStableAmount = r.averageAmount > 0;
  const hasEnoughOccurrences = r.occurrences >= 2;
  const intervalOk = r.frequency >= 20 && r.frequency <= 40;
  if (hasStableAmount && hasEnoughOccurrences && intervalOk) return 85;
  if (hasEnoughOccurrences) return 60;
  return 40;
}

/** Rule-based savings suggestions. Returns 4–6 items. */
export function getRuleBasedSavings(
  appData: AppData,
  userSettings: UserSettings = {}
): SavingsItem[] {
  const items: SavingsItem[] = [];
  const detected = detectRecurringPayments(appData.transactions);
  const allRecurring = [
    ...detected.map((r) => ({ merchant: r.merchant, amount: r.averageAmount, source: "detected" as const })),
    ...appData.subscriptions.map((s) => ({ merchant: s.merchant, amount: s.amount, source: "manual" as const })),
  ];

  const byCategory = groupByMerchantFamily(allRecurring);

  // 1) Duplicate / same-family subscriptions (only named families with 2+)
  for (const [family, entries] of Object.entries(byCategory)) {
    if (entries.length < 2 || family === "Other") continue;
    const total = entries.reduce((s, e) => s + e.amount, 0);
    const low = Math.round(total * 0.1);
    const high = Math.round(total * 0.25);
    items.push({
      id: `dup-${family}`,
      title: `Possible duplicate or overlapping subscriptions (${family})`,
      estimateMonthlyLow: low,
      estimateMonthlyHigh: high,
      confidence: 65,
      rationale: `Multiple charges in same category: ${entries.map((e) => e.merchant).join(", ")}. Consolidating may save 10–25%.`,
      evidence: entries.map((e) => e.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["duplicate", "subscriptions"],
    });
  }

  // 2) Student plan hints
  if (userSettings.student) {
    const spotify = allRecurring.find((r) => r.merchant.toLowerCase().includes("spotify"));
    if (spotify) {
      items.push({
        id: "student-spotify",
        title: "Check Spotify Student discount",
        estimateMonthlyLow: 3,
        estimateMonthlyHigh: 6,
        confidence: 70,
        rationale: "Student plans often offer 50% off. Verify eligibility with your institution.",
        evidence: spotify.merchant,
        ctaPrimary: "Mark done",
        ctaSecondary: "Ignore",
        tags: ["student", "entertainment"],
      });
    }
  }

  // 3) Adobe / multi-product consolidation
  const adobe = allRecurring.filter((r) => r.merchant.toLowerCase().includes("adobe"));
  if (adobe.length >= 2) {
    const total = adobe.reduce((s, e) => s + e.amount, 0);
    items.push({
      id: "adobe-consolidate",
      title: "Consider Adobe plan consolidation",
      estimateMonthlyLow: Math.round(total * 0.1),
      estimateMonthlyHigh: Math.round(total * 0.2),
      confidence: 60,
      rationale: "Multiple Adobe charges detected. Bundled plans may be cheaper.",
      evidence: adobe.map((e) => e.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["subscriptions", "software"],
    });
  }

  // 4) Many small SaaS – annual/bundle hint
  const smallSaaS = allRecurring.filter((e) => e.amount > 0 && e.amount < 100);
  if (smallSaaS.length >= 3) {
    const total = smallSaaS.reduce((s, e) => s + e.amount, 0);
    items.push({
      id: "saas-annual",
      title: "Review annual billing for small SaaS tools",
      estimateMonthlyLow: Math.round(total * 0.05),
      estimateMonthlyHigh: Math.round(total * 0.15),
      confidence: 55,
      rationale: "Several small recurring tools. Annual plans often offer 1–2 months free.",
      evidence: smallSaaS.map((e) => e.merchant).slice(0, 3).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["subscriptions", "optimization"],
    });
  }

  // 5) Payment method: monthly vs annual (generic)
  const highRecurring = allRecurring.filter((e) => e.amount >= 50);
  if (highRecurring.length >= 1) {
    items.push({
      id: "payment-annual",
      title: "Check annual vs monthly pricing for larger subscriptions",
      estimateMonthlyLow: 5,
      estimateMonthlyHigh: 20,
      confidence: 50,
      rationale: "Some providers offer a discount for annual payment. Compare on their billing page.",
      evidence: highRecurring.slice(0, 2).map((e) => e.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["billing", "optimization"],
    });
  }

  // 6) Tax-deductible hint (legal disclaimer baked in)
  const equipmentOrSoftware = appData.transactions.filter(
    (t) =>
      t.type === "expense" &&
      (t.category === "Supplies" || t.category === "IT" || t.category === "Subscriptions") &&
      t.amount > 100
  );
  if (equipmentOrSoftware.length >= 1) {
    items.push({
      id: "tax-deductible-hint",
      title: "Work-related equipment or software may be deductible",
      estimateMonthlyLow: 0,
      estimateMonthlyHigh: 0,
      confidence: 45,
      rationale:
        "May be deductible depending on jurisdiction and business use—confirm with an accountant. Informational only.",
      evidence: equipmentOrSoftware.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "deduction"],
    });
  }

  return items.slice(0, 6);
}

function groupByMerchantFamily(
  entries: { merchant: string; amount: number }[]
): Record<string, { merchant: string; amount: number }[]> {
  const families: Record<string, { merchant: string; amount: number }[]> = {};
  const categoryKeywords: Record<string, string[]> = {
    cloud: ["aws", "google cloud", "azure", "digitalocean", "heroku"],
    workspace: ["slack", "notion", "asana", "monday", "trello", "google workspace", "microsoft"],
    design: ["figma", "adobe", "sketch", "canva"],
    crm: ["hubspot", "salesforce", "pipedrive", "zoho"],
  };
  for (const e of entries) {
    const lower = e.merchant.toLowerCase();
    let family = "Other";
    for (const [fam, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((k) => lower.includes(k))) {
        family = fam;
        break;
      }
    }
    if (!families[family]) families[family] = [];
    families[family].push(e);
  }
  return families;
}
