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

  // 6) Tax-deductible equipment / software
  const equipmentOrSoftware = appData.transactions.filter(
    (t) =>
      t.type === "expense" &&
      (t.category === "Supplies" || t.category === "IT" || t.category === "Subscriptions") &&
      t.amount > 100
  );
  if (equipmentOrSoftware.length >= 1) {
    const total = equipmentOrSoftware.reduce((s, t) => s + t.amount, 0);
    // Estimated annual tax saving at 12.5–25% corp/income tax, spread monthly
    items.push({
      id: "tax-deductible-hint",
      title: "Work-related equipment or software may be deductible",
      estimateMonthlyLow: Math.round(total * 0.125 / 12),
      estimateMonthlyHigh: Math.round(total * 0.25 / 12),
      confidence: 45,
      rationale:
        "Equipment and software used for business (laptops, monitors, subscriptions) are deductible against your taxable income. At 12.5–25% effective tax rate, this reduces your tax bill. Confirm with an accountant.",
      evidence: equipmentOrSoftware.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "deduction"],
    });
  }

  // 7) Furniture / home office equipment purchases
  const furnitureMerchants = ["ikea", "argos", "dfs", "harvey norman", "furniture", "homestore", "dunelm", "next", "b&q", "woodies", "atlantic homecare", "oak", "sofa"];
  const furnitureTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.amount > 50 &&
      furnitureMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (furnitureTxns.length >= 1) {
    const total = furnitureTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "home-office-furniture",
      title: "Home office furniture may be claimable as a business expense",
      estimateMonthlyLow: Math.round(total * 0.125 / 12),
      estimateMonthlyHigh: Math.round(total * 0.25 / 12),
      confidence: 55,
      rationale:
        "Desks, chairs and shelving used for your home office are legitimately claimable. Keep receipts and document the business-use percentage. Confirm with your accountant.",
      evidence: furnitureTxns.slice(0, 3).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "home-office"],
    });
  }

  // 8) Phone bill – business use proportion
  const phoneMerchants = ["vodafone", "three", "eir", "tesco mobile", "o2", "meteor", "virgin mobile", "lyca", "48", "sky mobile"];
  const phoneTxns = appData.transactions.filter(
    (t) => t.type === "expense" &&
      phoneMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (phoneTxns.length >= 1) {
    const monthly = phoneTxns.reduce((s, t) => s + t.amount, 0) / Math.max(phoneTxns.length, 1);
    items.push({
      id: "phone-business-use",
      title: "Claim the business-use portion of your phone bill",
      estimateMonthlyLow: Math.round(monthly * 0.25),
      estimateMonthlyHigh: Math.round(monthly * 0.5),
      confidence: 60,
      rationale:
        "If you use your phone for business calls and data, typically 25–50% can be claimed as a business expense. Maintain a usage log to support the claim.",
      evidence: phoneTxns.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "phone"],
    });
  }

  // 9) Broadband / internet – home office proportion
  const broadbandMerchants = ["sky", "virgin media", "pure telecom", "siro", "net1", "digiweb", "imagine", "vodafone home"];
  const broadbandTxns = appData.transactions.filter(
    (t) => t.type === "expense" &&
      broadbandMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (broadbandTxns.length >= 1) {
    const monthly = broadbandTxns.reduce((s, t) => s + t.amount, 0) / Math.max(broadbandTxns.length, 1);
    items.push({
      id: "broadband-home-office",
      title: "Home broadband used for work may be partially deductible",
      estimateMonthlyLow: Math.round(monthly * 0.2),
      estimateMonthlyHigh: Math.round(monthly * 0.4),
      confidence: 55,
      rationale:
        "If you work from home, a proportion of your broadband bill (based on business vs personal use) can be claimed. Keep bills and calculate the business-use %. Confirm with accountant.",
      evidence: broadbandTxns.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "home-office"],
    });
  }

  // 10) Amazon – potential business supplies
  const amazonTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.merchant.toLowerCase().includes("amazon") && t.amount > 30
  );
  if (amazonTxns.length >= 2) {
    const total = amazonTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "amazon-business-supplies",
      title: "Amazon purchases for business use may be deductible",
      estimateMonthlyLow: Math.round(total * 0.1 / 3),
      estimateMonthlyHigh: Math.round(total * 0.3 / 3),
      confidence: 40,
      rationale:
        "Office supplies, cables, equipment and stationery bought on Amazon for business use are deductible. Review your orders and flag those with a business purpose.",
      evidence: `${amazonTxns.length} Amazon transactions totalling €${total.toFixed(0)}`,
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "supplies"],
    });
  }

  // 11) Transport / fuel – business mileage
  const transportMerchants = ["shell", "applegreen", "circle k", "topaz", "fuel", "petrol", "diesel", "uber", "freenow", "taxi", "irish rail", "irishrail", "luas", "dart", "bus éireann", "translink", "ryanair", "aer lingus", "dublin bus"];
  const transportTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.amount > 10 &&
      transportMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (transportTxns.length >= 2) {
    const total = transportTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "business-travel",
      title: "Business travel expenses may be deductible",
      estimateMonthlyLow: Math.round(total * 0.2 / 3),
      estimateMonthlyHigh: Math.round(total * 0.5 / 3),
      confidence: 50,
      rationale:
        "Fuel, taxis and public transport costs incurred for business purposes (client visits, supplier trips, etc.) are deductible. Keep a mileage log and retain receipts.",
      evidence: transportTxns.slice(0, 3).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "travel"],
    });
  }

  // 12) Client meals / entertainment (50% rule)
  const mealMerchants = ["restaurant", "café", "cafe", "costa", "starbucks", "bar ", " pub", "centra", "supermacs", "mcdonalds", "kfc", "nandos", "domino", "just eat", "deliveroo", "uber eats"];
  const mealTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.amount > 15 &&
      mealMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (mealTxns.length >= 2) {
    const total = mealTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "client-entertainment",
      title: "Client meals & entertainment may be 50% deductible",
      estimateMonthlyLow: Math.round(total * 0.25 / 3),
      estimateMonthlyHigh: Math.round(total * 0.5 / 3),
      confidence: 45,
      rationale:
        "Meals and entertainment with clients or prospects are commonly deductible at 50%. Document the business purpose and attendees for each receipt.",
      evidence: mealTxns.slice(0, 3).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "entertainment"],
    });
  }

  // 13) Professional development / courses
  const learningMerchants = ["udemy", "coursera", "linkedin learning", "pluralsight", "skillshare", "eason", "hodges figgis", "chapters", "amazon kindle", "o'reilly", "manning", "packt"];
  const learningTxns = appData.transactions.filter(
    (t) => t.type === "expense" &&
      learningMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (learningTxns.length >= 1) {
    const total = learningTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "professional-development",
      title: "Professional development & training costs are fully deductible",
      estimateMonthlyLow: Math.round(total * 0.125 / 3),
      estimateMonthlyHigh: Math.round(total / 3),
      confidence: 70,
      rationale:
        "Courses, books and subscriptions that maintain or improve skills relevant to your trade are 100% deductible. These are among the safest deductions available.",
      evidence: learningTxns.slice(0, 3).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "education"],
    });
  }

  // 14) Coworking / office rental
  const coworkingMerchants = ["wework", "glandore", "regus", "spaces", "dogpatch", "coworking", "huckletree", "the fumbally", "talent garden"];
  const coworkingTxns = appData.transactions.filter(
    (t) => t.type === "expense" &&
      coworkingMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (coworkingTxns.length >= 1) {
    const total = coworkingTxns.reduce((s, t) => s + t.amount, 0);
    items.push({
      id: "coworking-vat",
      title: "Reclaim VAT on coworking / office costs",
      estimateMonthlyLow: Math.round(total * 0.18 / 3),
      estimateMonthlyHigh: Math.round(total * 0.23 / 3),
      confidence: 75,
      rationale:
        "Coworking and office rental for business use are fully deductible. If VAT-registered, you can also reclaim the 23% VAT on these charges.",
      evidence: coworkingTxns.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "office"],
    });
  }

  // 15) Pension contributions – highly tax-efficient
  const totalMonthlyExpenses = appData.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0) / 3;
  if (totalMonthlyExpenses > 500) {
    items.push({
      id: "pension-contributions",
      title: "Pension contributions offer one of the best tax reliefs available",
      estimateMonthlyLow: Math.round(totalMonthlyExpenses * 0.04),
      estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.08),
      confidence: 70,
      rationale:
        "Self-employed individuals and SME directors can contribute up to 40% of net earnings to a pension and claim full income tax relief. This is effectively a 40c saving per €1 contributed for higher-rate taxpayers.",
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "pension"],
    });
  }

  // 16) Utility bills – home office proportion
  const utilityMerchants = ["esb", "electric ireland", "bord gáis", "bord gais", "sse airtricity", "airtricity", "pinergy", "flogas", "calor"];
  const utilityTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.amount > 20 &&
      utilityMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (utilityTxns.length >= 1) {
    const monthly = utilityTxns.reduce((s, t) => s + t.amount, 0) / Math.max(utilityTxns.length, 1);
    items.push({
      id: "utility-home-office",
      title: "Claim a proportion of utility bills for your home office",
      estimateMonthlyLow: Math.round(monthly * 0.1),
      estimateMonthlyHigh: Math.round(monthly * 0.2),
      confidence: 55,
      rationale:
        "If you work from home, electricity and gas costs attributable to your workspace (typically calculated by room count or hours worked) are deductible. Revenue's e-worker scheme allows €3.20/day tax-free.",
      evidence: utilityTxns.slice(0, 2).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "home-office"],
    });
  }

  // 17) Bank fees – deductible and worth reviewing
  const bankMerchants = ["bank of ireland", "aib", "ulster bank", "ptsb", "revolut", "n26", "stripe", "paypal", "square"];
  const bankFeeTxns = appData.transactions.filter(
    (t) => t.type === "expense" && t.amount > 0 && t.amount < 50 &&
      bankMerchants.some((k) => t.merchant.toLowerCase().includes(k))
  );
  if (bankFeeTxns.length >= 2) {
    const monthly = bankFeeTxns.reduce((s, t) => s + t.amount, 0) / 3;
    items.push({
      id: "bank-fees",
      title: "Bank & payment processing fees are fully deductible",
      estimateMonthlyLow: Math.round(monthly * 0.125),
      estimateMonthlyHigh: Math.round(monthly * 0.25),
      confidence: 65,
      rationale:
        "Account maintenance fees, transaction charges and payment processor fees (Stripe, PayPal, etc.) are 100% deductible as a business expense. Ensure they're recorded correctly in your accounts.",
      evidence: bankFeeTxns.slice(0, 3).map((t) => t.merchant).join(", "),
      ctaPrimary: "Review",
      ctaSecondary: "Ignore",
      tags: ["tax", "banking"],
    });
  }

  // Always-on suggestions — appear regardless of transaction data

  items.push({
    id: "vat-reclaim-review",
    title: "Review VAT reclaim on all business purchases",
    estimateMonthlyLow: Math.round(appData.currentBalance * 0.002),
    estimateMonthlyHigh: Math.round(appData.currentBalance * 0.005),
    confidence: 65,
    rationale:
      "If you're VAT-registered, you can reclaim 23% VAT on most business expenses — software, equipment, office supplies, professional services. Many businesses miss this by not keeping proper VAT receipts.",
    ctaPrimary: "Review",
    ctaSecondary: "Ignore",
    tags: ["tax", "vat"],
  });

  items.push({
    id: "r-and-d-tax-credit",
    title: "R&D Tax Credit — worth up to 25% of qualifying spend",
    estimateMonthlyLow: Math.round(totalMonthlyExpenses * 0.03),
    estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.08),
    confidence: 50,
    rationale:
      "Any spend on developing new products, services or processes (including software, prototyping, testing) may qualify for a 25% R&D tax credit in Ireland. This applies even to failed projects. Many SMEs don't claim this.",
    ctaPrimary: "Review",
    ctaSecondary: "Ignore",
    tags: ["tax", "r&d"],
  });

  items.push({
    id: "flat-rate-expenses",
    title: "Claim flat-rate expenses for your trade or profession",
    estimateMonthlyLow: 10,
    estimateMonthlyHigh: 40,
    confidence: 60,
    rationale:
      "Revenue allows flat-rate expense deductions for many trades without requiring individual receipts — covering uniforms, tools, and professional subscriptions. Check Revenue's published flat-rate schedule for your sector.",
    ctaPrimary: "Review",
    ctaSecondary: "Ignore",
    tags: ["tax", "expenses"],
  });

  items.push({
    id: "startup-relief",
    title: "Start-Up Relief (SURE) or EIIS may reduce your tax bill",
    estimateMonthlyLow: 0,
    estimateMonthlyHigh: Math.round(totalMonthlyExpenses * 0.1),
    confidence: 40,
    rationale:
      "If you or investors have put money into the business, SURE (Start-Up Relief for Entrepreneurs) or EIIS (Employment Investment Incentive Scheme) can provide income tax relief of up to 40% on investment. Confirm eligibility with an accountant.",
    ctaPrimary: "Review",
    ctaSecondary: "Ignore",
    tags: ["tax", "startup"],
  });

  return items.slice(0, 17);
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
