# PocketCFO

**Your bank balance lies. We show the truth.**

PocketCFO is a cash-visibility and runway dashboard for individuals and small businesses. It turns your balance, recurring payments, and tax estimates into **true available cash**, a 30-day forecast, and plain-language insights so you can see what’s safe to spend and when you might run short.

---

## Why it exists

Bank balance alone is misleading: tax reserves and upcoming bills aren’t set aside, so you can’t tell how much you can actually use. PocketCFO:

- Reserves **estimated tax** (VAT, Corp Tax, income tax, PRSI, etc.) so it’s not counted as spendable.
- Subtracts **recurring and upcoming payments** so “true available” reflects what’s left after commitments.
- Projects **day-by-day cash** for the next 30 days so you can spot shortfalls early.
- Surfaces **AI-powered insights** and savings suggestions (Pro) so you can act with confidence.

---

## What it does

### Core dashboard

- **True available cash** — Spendable amount after tax reserve and upcoming recurring payments; shown as the main metric with a simple risk indication.
- **Tax vault** — Estimated tax (VAT, Corp Tax, PRSI, etc.) vs spendable; visual split so you know what’s reserved.
- **30-day cash forecast** — Projected balance each day from recurring and subscriptions (no new income); helps spot dips before they happen.
- **Expense breakdown** — Spending by category with a pie chart and totals.
- **Cash runway** — How many days until cash would run out at current burn.
- **Recurring payments** — Auto-detected from transactions plus manual subscriptions; both feed the forecast and breakdown.
- **Recent transactions** — Searchable, sortable list with category and type.

### Funds allocator

- **Simulate spending** — Allocate your true available cash across your own categories (e.g. holiday, equipment, team events).
- **Your categories** — Add categories in a dialog (name, icon, colour); no fixed list.
- **Visual split** — Sliders and inputs per category; total capped at true available; “remaining” vs “over” feedback.
- **Allocation bar** — Bar chart of how you’ve split the total; hover shows category name, amount, and share.
- **This month’s spending** — Sum of current-month expenses from transactions, shown next to true available.

### AI & Pro

- **Affordability advisor** — Ask questions like “Can I afford a dog?” or “Can I afford a €2,500/month hire?”; answers use your financial snapshot and runway.
- **AI insights** (Pro) — Short, plain-language insights on cash flow, risk, and tax.
- **Savings & optimisations** — Suggestions to cut costs or improve runway; rule-based and/or AI (Pro).

### Integrations

- **Plaid** — Connect your bank so transactions and balance can be real (optional; sandbox data available without linking).
- **Stripe** — Pro subscription; checkout redirects back to the same origin (localhost or Vercel) after payment.

### Account types

- **Individual** — Personal tax and spending view; categories and labels tuned for individuals.
- **SME** — Business tax (e.g. VAT, Corp Tax) and SME-focused categories and insights.

---

## Tech overview

- **Frontend** — React 18, TypeScript, Vite, Tailwind, shadcn/ui, React Router, TanStack Query, Recharts. Single-page app with client-side routing; Vercel rewrite so routes like `/dashboard` work after redirects.
- **Backend** — Node (Express), finance and tax logic, sandbox data per user type. REST API for summary, forecast, recurring, breakdown, runway, subscriptions, CFO (query, savings, affordability, insights), Plaid, Stripe.
- **Auth & data** — JWT auth; Supabase for user profiles and Stripe customer/subscription state.
- **Deploy** — Frontend and backend can be deployed separately (e.g. frontend on Vercel, backend elsewhere); env vars for API URL, Stripe, Plaid, Supabase, etc.

---

## Project structure

```
├── frontend/          # React SPA (PocketCFO UI)
│   ├── src/
│   │   ├── pages/     # Landing, Login, Dashboard (Index), Subscribe, Setup, About
│   │   ├── components/
│   │   └── lib/       # API client, finance helpers, types
│   └── vercel.json    # SPA rewrites for /dashboard, etc.
├── backend/           # Express API
│   ├── routes/        # auth, finance, cfo, plaid, stripe, subscriptions
│   ├── lib/           # finance-engine, tax, sandbox data, CFO prompts
│   └── data/          # sandbox JSON for SME/individual
└── README.md
```

---

## How to run the app

Go to: https://hackeurope2026.vercel.app

---

## How to run the code

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (Vite default).

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # if present; set PORT, Supabase, Stripe, Plaid, etc.
npm run dev
```

Set `VITE_API_URL` (e.g. `http://localhost:3001`) for the frontend so it talks to the backend.

**Build**

```bash
cd frontend && npm run build
```

---

## License

ISC.
