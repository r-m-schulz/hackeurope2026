import type { AffordabilityAdvisorResponse } from "@/lib/types";

const VALID_VERDICTS = ["AFFORD", "CANNOT_AFFORD", "RISKY"] as const;
const VALID_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

/**
 * Parse and validate the Affordability Advisor API response.
 * Handles malformed JSON and missing fields gracefully.
 */
export function parseAIResponse(data: unknown): AffordabilityAdvisorResponse | null {
  if (data == null || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const verdict = VALID_VERDICTS.includes(obj.verdict as (typeof VALID_VERDICTS)[number])
    ? (obj.verdict as AffordabilityAdvisorResponse["verdict"])
    : "RISKY";

  const riskLevel = VALID_RISK_LEVELS.includes(obj.risk_level as (typeof VALID_RISK_LEVELS)[number])
    ? (obj.risk_level as AffordabilityAdvisorResponse["risk_level"])
    : "MEDIUM";

  const confidence =
    typeof obj.confidence === "number" && Number.isFinite(obj.confidence)
      ? Math.max(0, Math.min(100, obj.confidence))
      : 50;

  return {
    verdict,
    confidence,
    reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "",
    impact_summary: typeof obj.impact_summary === "string" ? obj.impact_summary : "",
    risk_level: riskLevel,
    estimated_purchase_cost:
      typeof obj.estimated_purchase_cost === "number" && Number.isFinite(obj.estimated_purchase_cost)
        ? obj.estimated_purchase_cost
        : null,
    estimated_monthly_cost:
      typeof obj.estimated_monthly_cost === "number" && Number.isFinite(obj.estimated_monthly_cost)
        ? obj.estimated_monthly_cost
        : null,
  };
}
