/**
 * System prompt and user message builder for the AI-powered Pro Savings Groq call.
 * Focused on two distinct areas that DO NOT overlap with CFO Insights:
 *   1. Tax grey areas, legal loopholes, and underutilised reliefs (Irish/EU context)
 *   2. Cheaper alternatives to detected recurring subscriptions
 */

const PRO_SAVINGS_SYSTEM_PROMPT = `You are a specialist financial optimisation AI for Irish and EU-based SMEs and individuals.
Your job is to identify personalised, actionable savings opportunities from a user's real financial data.

You operate in TWO areas only:

════════════════════════════════════════════
AREA 1 — TAX GREY AREAS & LEGAL LOOPHOLES
════════════════════════════════════════════
Identify underutilised tax reliefs and legal optimisations applicable to the user's specific situation.
Only suggest strategies that are genuinely relevant to the detected spending patterns, income, and user type.

Examples to consider (only if supported by the data):
- Home office expense relief (€30/day, up to 30% of home running costs) if remote work is implied
- R&D tax credit (Section 766 TCA 1997 — 25% credit on qualifying R&D spend) if tech/software spend detected
- Pension contributions as a pre-tax shield (up to age-banded Revenue limits reducing taxable income)
- Entrepreneur Relief (10% CGT rate on qualifying disposals) for SME directors
- Employment Investment Incentive (EII) scheme for additional income sheltering
- Startup Refunds for Entrepreneurs (SURE scheme) if previous employment income detected
- Accelerated capital allowances on energy-efficient equipment (100% in year 1 vs 12.5% standard)
- Section 481 film/creative industry relief if relevant spend detected
- Directors: salary vs dividend optimisation to reduce PRSI/income tax liability
- Subsistence rates: Revenue-approved tax-free daily rates for business travel
- Remote working deduction: Revenue accepts €10/day for vouched home-office costs
- Professional subscriptions and CPD costs as fully deductible business expenses
- VAT cash accounting scheme: pay VAT when customer pays (not when invoiced), improving cash flow
- VAT registration timing: voluntary registration below €37,500 (services) threshold for input credit
- Trading losses: carry back to prior year or carry forward to offset future profits
- Small companies rate (12.5% CT on trading income vs 25% on passive income) — income stream classification
- Annual investment allowance: 100% deduction on capital expenditure in year of purchase

════════════════════════════════════════════
AREA 2 — SUBSCRIPTION COST OPTIMISATION
════════════════════════════════════════════
Identify cheaper alternatives or strategies for each detected subscription or recurring payment.
Be specific — name the current service, the specific saving, and the exact alternative.

Strategies to consider:
- Annual billing switch (typically 15–25% cheaper than monthly)
- Direct competitor at lower price (e.g. Notion → Obsidian free tier, Zoom → Google Meet free)
- Free or open-source alternative (e.g. Adobe → Canva free, Slack → Discord free)
- Family/team plan split (e.g. Spotify Family €17.99 split 6 ways = €3/person vs €11.99 individual)
- Bundle discount (e.g. Microsoft 365 Business Basic covers Teams + OneDrive + Office vs separate tools)
- Identify duplicate tools (two project management tools, two video conferencing tools, etc.)
- Negotiate annual contract discount (many SaaS tools offer 10–20% for annual commitment + negotiation)

════════════════════════════════════════════
RULES
════════════════════════════════════════════
- Every suggestion MUST reference actual data from the user (merchant names, amounts, categories)
- DO NOT generate cash flow warnings, runway alerts, burn rate observations, or tax reserve commentary
- DO NOT generate generic advice not grounded in the user's specific data
- Each item must have a realistic monthly saving estimate (even for annual strategies, divide by 12)
- Confidence should reflect how certain you are the strategy applies (50–95%)
- Use Irish Revenue / EU tax law context throughout
- CRITICAL: estimateMonthlyLow and estimateMonthlyHigh MUST be greater than zero — never output 0 for either field. Calculate savings from the actual numbers in the data: for subscriptions use the real cost difference; for tax strategies use a percentage of the relevant spend or income amount. If uncertain, use a conservative non-zero estimate (minimum €5 low, €15 high).

Respond ONLY with a valid JSON object — no markdown, no extra text:
{"items":[{"id":"string","title":"string","estimateMonthlyLow":number,"estimateMonthlyHigh":number,"confidence":number,"rationale":"string","ctaPrimary":"Review","ctaSecondary":"Ignore","tags":["tax"|"subscription"|"loophole"|"deduction"|"alternative"|"relief"],"evidence":"string"}]}

Generate 4 to 8 highly personalised savings items. Balance tax optimisations and subscription alternatives based on the data provided.`;

/**
 * Build a rich user message with the financial context needed for Pro Savings generation.
 * @param {object} data
 * @param {Array}  data.transactions    - raw transaction array
 * @param {Array}  data.recurring       - detected recurring payments
 * @param {Array}  data.subscriptions   - manual subscriptions
 * @param {object} data.summary         - { balance, estimatedTax, trueAvailable, recurringTotal }
 * @param {Array}  data.breakdown       - [{ category, amount }] expense categories
 * @param {string} data.userType        - 'sme' | 'startup' | 'individual'
 */
function buildProSavingsUserMessage(data) {
  const {
    transactions = [],
    recurring = [],
    subscriptions = [],
    summary = {},
    breakdown = [],
    userType = 'sme',
  } = data;

  const fmt = (n) => `€${Number(n ?? 0).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  // Monthly income / expense totals
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const months = new Set(transactions.map(t => t.date?.slice(0, 7))).size || 1;
  const avgMonthlyIncome = incomeTotal / months;
  const avgMonthlyExpense = expenseTotal / months;

  // Top expense categories
  const topCats = [...breakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map(c => `  - ${c.category}: ${fmt(c.amount)}`)
    .join('\n');

  // All detected subscriptions / recurring payments
  const recurringLines = [
    ...recurring.map(r =>
      `  - ${r.merchant}: ~${fmt(r.averageAmount)}/mo (auto-detected, ${r.occurrences} occurrences)`
    ),
    ...subscriptions.map(s =>
      `  - ${s.merchant}: ${fmt(s.amount)}/${s.frequency} (user-added)`
    ),
  ].join('\n') || '  None detected';

  // Sample expense merchants for context
  const expenseMerchants = [
    ...new Set(transactions.filter(t => t.type === 'expense').map(t => t.merchant)),
  ].slice(0, 25).join(', ');

  // Income sources
  const incomeMerchants = [
    ...new Set(transactions.filter(t => t.type === 'income').map(t => t.merchant)),
  ].slice(0, 10).join(', ');

  return [
    `User type: ${userType}`,
    '',
    '── Financial Context ──',
    `Bank balance: ${fmt(summary.balance)}`,
    `Estimated tax liability: ${fmt(summary.estimatedTax)}`,
    `True available cash (after tax + recurring): ${fmt(summary.trueAvailable)}`,
    `Average monthly income: ${fmt(avgMonthlyIncome)} (est. annual: ${fmt(avgMonthlyIncome * 12)})`,
    `Average monthly expenses: ${fmt(avgMonthlyExpense)}`,
    `Transaction data spans ~${months} month(s)`,
    '',
    '── Expense Categories ──',
    topCats || '  No breakdown available',
    '',
    '── Subscriptions & Recurring Payments ──',
    recurringLines,
    '',
    '── All Expense Merchants (sample) ──',
    expenseMerchants || '  None',
    '',
    '── Income Sources ──',
    incomeMerchants || '  None detected',
    '',
    '── Your Task ──',
    'Generate 4–8 personalised savings suggestions for THIS specific user.',
    'Reference actual merchant names, categories, and amounts from above.',
    'Focus on: (1) tax loopholes/reliefs applicable to their income level and user type,',
    '(2) cheaper alternatives or strategies for their specific detected subscriptions.',
    'DO NOT generate generic advice. Every suggestion must be grounded in the data above.',
  ].join('\n');
}

module.exports = { PRO_SAVINGS_SYSTEM_PROMPT, buildProSavingsUserMessage };
