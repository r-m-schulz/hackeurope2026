/**
 * Build system and user messages for the Affordability Advisor Groq call.
 * Uses summarized financial data only (no raw transactions).
 */

const SYSTEM_PROMPT = `You are a financial decision assistant for SME owners and individuals.
You must determine whether the user can afford a purchase based STRICTLY on the provided financial data.

COST ESTIMATION:
If the user asks about a specific item but does NOT provide an explicit price, you MUST estimate:
1. A realistic one-off purchase cost in euros (use typical market price; be conservative, use the higher end of the range).
2. A realistic ongoing monthly cost in euros to maintain/run that item (e.g. food, grooming, insurance, fuel, servicing, subscriptions, etc.). If there is no meaningful ongoing cost, set it to 0.
Examples:
- Dog: purchase ~€1,500, monthly ~€200 (food, vet, grooming)
- Lamborghini Urus: purchase ~€240,000, monthly ~€2,500 (fuel, insurance, servicing)
- Laptop: purchase ~€1,500, monthly ~€0
- Horse: purchase ~€5,000, monthly ~€800 (livery, feed, vet, farrier)
Always populate estimated_purchase_cost and estimated_monthly_cost with your estimates (or the user-provided amounts).

AFFORDABILITY RULES:
1. True available cash is the maximum the user can spend on a one-off purchase without depleting tax reserve and recurring commitments. If the purchase cost (estimated or stated) exceeds True available cash, verdict MUST be CANNOT_AFFORD or RISKY.
2. Also evaluate whether the new ongoing monthly cost is sustainable: compare it to monthly income and current monthly expense total. If adding the new monthly cost creates a clear shortfall, reflect that in the verdict and reasoning.
3. Be conservative. If risk exists, prefer RISKY or CANNOT_AFFORD over AFFORD.
4. If True available cash is negative, always return CANNOT_AFFORD.

Respond ONLY with valid JSON in this exact format, no other text or markdown:
{"verdict":"AFFORD"|"CANNOT_AFFORD"|"RISKY","confidence":number 0-100,"reasoning":"string","impact_summary":"short impact statement","risk_level":"LOW"|"MEDIUM"|"HIGH","estimated_purchase_cost":number,"estimated_monthly_cost":number}`;

function buildUserMessage(financialSummary, question, options = {}) {
  const {
    priceExtracted,
    priceAboveTrueAvailable,
    trueAvailableNegative,
    forecastLowestNegative,
  } = options;

  const trueAvailable = financialSummary.trueAvailableCash;
  const lines = [
    'Financial summary (use only these numbers):',
    `- Bank balance: ${financialSummary.bankBalance}`,
    `- True available cash (after tax reserve and recurring): ${trueAvailable}`,
    `- Estimated tax liability: ${financialSummary.estimatedTaxLiability}`,
    `- Upcoming recurring payments (30 days): ${financialSummary.upcomingRecurring30Days}`,
    `- 30-day forecast lowest point: ${financialSummary.forecastLowestPoint30Days}`,
    `- Monthly income total: ${financialSummary.monthlyIncomeTotal}`,
    `- Monthly expense total: ${financialSummary.monthlyExpenseTotal}`,
    `- Risk status: ${financialSummary.riskStatus}`,
  ];

  if (priceExtracted != null && typeof priceExtracted === 'number') {
    lines.push('');
    lines.push(`Requested amount (explicitly stated in question): ${priceExtracted}`);
    lines.push(`True available cash: ${trueAvailable}`);
    if (priceExtracted > trueAvailable) {
      lines.push(`RULE: ${priceExtracted} > ${trueAvailable} therefore verdict MUST be CANNOT_AFFORD.`);
    }
  } else {
    lines.push('');
    lines.push('No explicit price given — estimate the purchase cost and monthly maintenance cost from your knowledge.');
  }

  if (trueAvailableNegative) {
    lines.push('\nContext: True available cash is negative. Strong liquidity warning.');
  }
  if (forecastLowestNegative) {
    lines.push('Context: Forecast shows negative balance within 30 days. Liquidity risk.');
  }
  if (priceExtracted != null && priceAboveTrueAvailable) {
    lines.push(`Context: The stated amount (${priceExtracted}) exceeds true available cash. You MUST return CANNOT_AFFORD.`);
  }

  lines.push('\nUser question:');
  lines.push(question);
  return lines.join('\n');
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserMessage,
};
