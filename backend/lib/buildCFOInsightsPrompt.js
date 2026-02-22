/**
 * System prompt and user message builder for the CFO Insights Groq call.
 * Focused on cash-flow analysis, burn rate, runway, and financial health —
 * intentionally does NOT cover subscription optimisations or tax deductions
 * (those are handled by the Savings & Optimizations engine).
 */

const CFO_INSIGHTS_SYSTEM_PROMPT = `You are a CFO Insight Engine for SME owners, startup founders, and individual users.
Generate 4 to 6 concise, data-driven financial insights based on the user's real financial data AND their user type.

════════════════════════════════════════════
WHEN user type is "sme" or "startup", focus on:
- Cash flow health: income vs expense trends, monthly net, burn rate
- Runway risk: days remaining, critical thresholds, approaching danger zones
- Balance trajectory: is the balance trending up or down over the 30-day forecast?
- Tax reserve adequacy: is enough set aside relative to income and liabilities?
- Upcoming cash pressure: large upcoming payments vs available cash over next 30 days
- Income stability: is revenue consistent month to month, or volatile/lumpy?
- Working capital position: is the business cash-positive after all commitments?
- Expense concentration: is spending disproportionately heavy in one category?
- Liquidity ratio: true available cash vs total commitments
- For startups specifically: default alive/dead status, MRR trend vs burn rate,
  investor-readiness of runway (target 12–18 months), net burn trajectory

════════════════════════════════════════════
WHEN user type is "individual", focus on:
- Monthly net: are they spending more than they earn each month?
- Savings rate: what percentage of income is being saved — is it healthy (>10%)?
- Emergency fund adequacy: do they have 3–6 months of expenses available?
- Recurring commitment burden: total fixed costs as a percentage of income
- Spending pattern analysis: heavy discretionary spend, food delivery, entertainment
- Income stability: is take-home pay consistent or irregular?
- Balance trajectory: is their end-of-month balance trending down over time?
- High-spend category awareness: which single category is consuming the most cash?
- Cash flow risk: any projected shortfalls in the next 30 days?
- Rent or housing burden: if rent is detectable, is it consuming more than 35% of income?

════════════════════════════════════════════
DO NOT generate insights about:
- Specific subscription cancellations, consolidations, or annual billing switches
- Tax deduction opportunities or claimable expenses
- VAT reclaim, R&D credits, or pension contributions as a tax strategy

Each insight must:
- Reference actual numbers from the data provided (e.g. "€4,200 available for 42 days")
- Be concise: 1–2 sentences maximum
- Be specific and actionable — not generic advice
- Use honest, direct language — if something looks concerning, say so clearly

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{"insights":[{"id":"string","text":"string","severity":"info"|"warning"|"critical","category":"cash-flow"|"burn-rate"|"runway"|"tax-reserve"|"revenue"|"forecast"|"working-capital"|"expense-mix"|"liquidity"|"savings-rate"|"emergency-fund"|"spending-habits"|"income-stability"|"default-alive"|"mrr"|"general"}]}

Generate between 4 and 6 insights inside the "insights" array. Cover a variety of categories. Never repeat the same point twice.`;

/**
 * Build a rich user message summarising all available financial data.
 * @param {object} data
 * @param {object} data.summary  - { balance, estimatedTax, trueAvailable, recurringTotal, riskRatio }
 * @param {object} data.runway   - { days, status, monthlyBurn }
 * @param {Array}  data.forecast - [{ date, projected }] 30-day forecast
 * @param {Array}  data.breakdown - [{ category, amount }] expense categories
 * @param {Array}  data.transactions - raw transaction array
 * @param {Array}  data.recurring - detected recurring payments
 * @param {Array}  data.subscriptions - manual subscriptions
 * @param {string} data.userType - 'sme' | 'startup' | 'individual'
 */
function buildCFOInsightsUserMessage(data) {
  const {
    summary,
    runway,
    forecast = [],
    breakdown = [],
    transactions = [],
    recurring = [],
    subscriptions = [],
    userType = 'sme',
  } = data;

  const fmt = (n) => `€${Number(n ?? 0).toLocaleString('en-IE', { maximumFractionDigits: 0 })}`;
  const isIndividual = userType === 'individual';
  const isStartup = userType === 'startup';

  // ── Monthly income / expense totals ──────────────────────────────────────
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const months = new Set(transactions.map(t => t.date?.slice(0, 7))).size || 1;
  const avgMonthlyIncome = incomeTotal / months;
  const avgMonthlyExpense = expenseTotal / months;
  const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpense;

  // ── Forecast analysis ─────────────────────────────────────────────────────
  const forecastStart = forecast[0]?.projected ?? summary.balance;
  const forecastEnd = forecast[forecast.length - 1]?.projected ?? summary.balance;
  const forecastLowest = forecast.length > 0
    ? Math.min(...forecast.map(f => f.projected))
    : summary.balance;
  const forecastTrend = forecastEnd > forecastStart ? 'improving' : forecastEnd < forecastStart ? 'declining' : 'flat';

  // ── Top expense categories ────────────────────────────────────────────────
  const topCategories = [...breakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(c => `${c.category}: ${fmt(c.amount)}`)
    .join(', ');

  // ── Recurring commitments ─────────────────────────────────────────────────
  const recurringMonthlyTotal = recurring.reduce((s, r) => s + (r.averageAmount ?? 0), 0)
    + subscriptions.reduce((s, sub) => s + (sub.frequency === 'weekly' ? sub.amount * 4 : sub.amount), 0);
  const recurringCount = recurring.length + subscriptions.length;

  // ── Income sources ────────────────────────────────────────────────────────
  const incomeSources = new Set(transactions.filter(t => t.type === 'income').map(t => t.merchant)).size;

  // ── Tax reserve ratio ─────────────────────────────────────────────────────
  const taxRatio = summary.balance > 0 ? ((summary.estimatedTax / summary.balance) * 100).toFixed(1) : '0';

  const lines = [
    `User type: ${userType}`,
    '',
    '── Financial Position ──',
    `Bank balance: ${fmt(summary.balance)}`,
    `Estimated tax liability: ${fmt(summary.estimatedTax)} (${taxRatio}% of balance)`,
    `True available cash (after tax + recurring): ${fmt(summary.trueAvailable)}`,
    `Upcoming recurring commitments (30 days): ${fmt(summary.recurringTotal)}`,
    `Risk ratio (true available / balance): ${(Number(summary.riskRatio ?? 0) * 100).toFixed(1)}%`,
    '',
    '── Cash Flow (averaged over data period) ──',
    `Average monthly income: ${fmt(avgMonthlyIncome)}`,
    `Average monthly expenses: ${fmt(avgMonthlyExpense)}`,
    `Average monthly net: ${fmt(avgMonthlyNet)} (${avgMonthlyNet >= 0 ? 'surplus' : 'deficit'})`,
    `Transaction data spans ~${months} month(s)`,
    `Income sources: ${incomeSources} distinct merchants/clients`,
    '',
    '── Runway ──',
    `Cash runway: ${runway.days} days (status: ${runway.status})`,
    `Monthly burn rate: ${fmt(runway.monthlyBurn)}`,
    '',
    '── 30-Day Forecast ──',
    `Forecast start: ${fmt(forecastStart)}`,
    `Forecast end (day 30): ${fmt(forecastEnd)}`,
    `Lowest projected balance: ${fmt(forecastLowest)}`,
    `Balance trajectory: ${forecastTrend}`,
    forecastLowest < 0 ? 'WARNING: balance goes negative within 30 days' : 'Balance stays positive over 30 days',
    '',
    '── Recurring Commitments ──',
    `Total recurring payments: ${recurringCount} (${fmt(recurringMonthlyTotal)}/month)`,
    '',
    '── Top Expense Categories ──',
    topCategories || 'No breakdown available',
  ];

  // ── Individual-specific metrics ───────────────────────────────────────────
  if (isIndividual) {
    const savingsRate = avgMonthlyIncome > 0
      ? ((avgMonthlyNet / avgMonthlyIncome) * 100).toFixed(1)
      : '0';
    const emergencyFundMonths = runway.monthlyBurn > 0
      ? (summary.trueAvailable / runway.monthlyBurn).toFixed(1)
      : 'N/A';
    const recurringBurden = avgMonthlyIncome > 0
      ? ((recurringMonthlyTotal / avgMonthlyIncome) * 100).toFixed(1)
      : '0';
    const discretionaryKeywords = ['restaurant', 'café', 'cafe', 'deliveroo', 'just eat', 'uber eats', 'netflix', 'spotify', 'disney', 'cinema', 'pub', 'bar '];
    const discretionarySpend = transactions
      .filter(t => t.type === 'expense' && discretionaryKeywords.some(k => t.merchant.toLowerCase().includes(k)))
      .reduce((s, t) => s + t.amount, 0) / months;

    lines.push('');
    lines.push('── Individual-Specific Metrics ──');
    lines.push(`Monthly savings rate: ${savingsRate}% of income (${avgMonthlyNet >= 0 ? 'saving' : 'overspending'})`);
    lines.push(`Emergency fund coverage: ~${emergencyFundMonths} months of expenses`);
    lines.push(`Fixed recurring burden: ${recurringBurden}% of monthly income`);
    lines.push(`Estimated discretionary spend: ${fmt(discretionarySpend)}/month (dining, entertainment, streaming)`);
    lines.push(avgMonthlyNet < 0 ? 'ALERT: Spending exceeds income — net negative each month' : 'Monthly cash flow is positive');
  }

  // ── Startup-specific metrics ──────────────────────────────────────────────
  if (isStartup) {
    const netBurnPositive = avgMonthlyNet >= 0;
    const runwayMonths = (runway.days / 30).toFixed(1);
    const defaultAlive = netBurnPositive ? 'YES (cash-flow positive)' : runway.days > 365 ? 'YES (>12 months runway)' : runway.days > 180 ? 'BORDERLINE (6–12 months)' : 'NO — needs immediate action';

    lines.push('');
    lines.push('── Startup-Specific Metrics ──');
    lines.push(`Runway: ${runwayMonths} months (${runway.days} days)`);
    lines.push(`Net cash position: ${avgMonthlyNet >= 0 ? 'positive (default alive)' : 'negative (burning cash)'}`);
    lines.push(`Default alive: ${defaultAlive}`);
    lines.push(`Monthly net burn: ${fmt(Math.abs(avgMonthlyNet))} (${netBurnPositive ? 'net positive' : 'net negative'})`);
    lines.push(`Revenue (avg monthly income): ${fmt(avgMonthlyIncome)}`);
    lines.push(`Burn vs revenue ratio: ${avgMonthlyIncome > 0 ? ((avgMonthlyExpense / avgMonthlyIncome) * 100).toFixed(0) : 'N/A'}%`);
  }

  return lines.join('\n');
}

module.exports = {
  CFO_INSIGHTS_SYSTEM_PROMPT,
  buildCFOInsightsUserMessage,
};
