import { useMemo, useState } from "react";
import { initialAppData, createManualSubscription } from "@/lib/app-data";
import type { AppData } from "@/lib/types";
import {
  calculateSummaryFromAppData,
  detectRecurringPayments,
  generateForecastFromAppData,
  getExpenseBreakdownFromAppData,
  getCashRunwayFromAppData,
  generateAIInsight,
} from "@/lib/finance-engine";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCards } from "@/components/MetricCards";
import { ForecastChart } from "@/components/ForecastChart";
import { ExpensePieChart } from "@/components/ExpensePieChart";
import { TransactionsTable } from "@/components/TransactionsTable";
import { TaxVault } from "@/components/TaxVault";
import { CashRunway } from "@/components/CashRunway";
import { RecurringPaymentsList } from "@/components/RecurringPaymentsList";
import { RecurringPayments } from "@/components/RecurringPayments";
import { AIInsightPanel } from "@/components/AIInsightPanel";

const Index = () => {
  const [appData, setAppData] = useState<AppData>(initialAppData);

  const summary = useMemo(() => calculateSummaryFromAppData(appData), [appData]);
  const detectedRecurring = useMemo(() => detectRecurringPayments(appData.transactions), [appData.transactions]);
  const forecast = useMemo(() => generateForecastFromAppData(appData, 30), [appData]);
  const expenseBreakdown = useMemo(() => getExpenseBreakdownFromAppData(appData), [appData]);
  const runwayDays = useMemo(() => getCashRunwayFromAppData(appData), [appData]);
  const aiInsight = useMemo(
    () => generateAIInsight(appData.currentBalance, forecast, summary.estimatedTax),
    [appData.currentBalance, forecast, summary.estimatedTax]
  );

  const handleAddSubscription = (sub: { merchant: string; amount: number; nextDueDate: string; frequency: "monthly" | "weekly" }) => {
    setAppData((prev) => ({
      ...prev,
      subscriptions: [...prev.subscriptions, createManualSubscription(sub)],
    }));
  };

  const handleDeleteSubscription = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((s) => s.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <MetricCards summary={summary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ForecastChart data={forecast} />
          </div>
          <div>
            <ExpensePieChart data={expenseBreakdown} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TaxVault estimatedTax={summary.estimatedTax} balance={summary.balance} />
          <CashRunway days={runwayDays} />
          <AIInsightPanel insightText={aiInsight} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecurringPaymentsList payments={detectedRecurring} />
          <RecurringPayments
            subscriptions={appData.subscriptions}
            onAdd={handleAddSubscription}
            onDelete={handleDeleteSubscription}
          />
        </div>

        <TransactionsTable transactions={appData.transactions} />
      </main>
    </div>
  );
};

export default Index;
