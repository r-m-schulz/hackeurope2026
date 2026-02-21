/**
 * System prompt and user message builder for the CFO Insights Groq call.
 * Focused on cash-flow analysis, burn rate, runway, and financial health —
 * intentionally does NOT cover subscription optimisations or tax deductions
 * (those are handled by the Savings & Optimizations engine).
 */

const CFO_INSIGHTS_SYSTEM_PROMPT = `You are a CFO Insight Engine for SME owners and individual freelancers.
Generate 4 to 6 concise, data-driven financial insights based on the user's real financial data.

FOCUS AREAS — insights must cover topics such as:
- Cash flow health: income vs expense trends, monthly net, burn rate
- Runway risk: days remaining, critical thresholds, approaching danger zones
- Balance trajectory: is the balance trending up or down over the forecast?
- Tax reserve adequacy: is enough set aside relative to income and liabilities?
- Upcoming cash pressure: large upcoming payments vs available cash over next 30 days
- Income stability or volatility: is income consistent month to month?
- Working capital position: is the business cash-positive after all commitments?
- Forecast signals: any projected shortfalls or healthy surpluses?
- Expense concentration: is spending disproportionately heavy in any one category?
- Liquidity ratio: how does true available cash compare to total commitments?

DO NOT generate insights about:
- Specific subscription cancellations, consolidations, or annual billing switches
- Tax deduction opportunities or claimable expenses
- VAT reclaim or R&D tax credits
- Pension contributions as a tax strategy

Each insight must:
- Reference actual numbers from the data provided (e.g. "€4,200 runway for 42 days")
- Be concise: 1–2 sentences maximum
- Be specific and actionable, not generic
- Use honest, direct language — if something looks concerning, say so clearly

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{"insights":[{"id":"string","text":"string","severity":"info"|"warning"|"critical","category":"cash-flow"|"burn-rate"|"runway"|"tax-reserve"|"revenue"|"forecast"|"working-capital"|"expense-mix"|"liquidity"|"general"}]}

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
 * @param {string} data.userType - 'sme' | 'individual'
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

  // ── Monthly income / expense totals ──────────────────────────────────────
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Approximate over distinct months present in data
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

  return lines.join('\n');
}

module.exports = {
  CFO_INSIGHTS_SYSTEM_PROMPT,
  buildCFOInsightsUserMessage,
};
