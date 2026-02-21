# hackeurope2026

Single frontend app (TrueBalance): true cash visibility, forecast, tax vault, recurring payments, and AI insights.

## Run the app

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, shadcn/ui, Recharts, React Router, TanStack Query.
- **Data:** Single source of truth (`AppData`): transactions, manual subscriptions, balance, tax config. All features (forecast, expense pie chart, KPIs, AI insight, cash runway) use this shared state—e.g. adding a recurring payment updates the forecast and pie chart.

## Build

```bash
cd frontend && npm run build
```
