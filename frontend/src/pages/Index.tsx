import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, getUserType, clearAuth } from "@/lib/auth";
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
import { SavingsStream } from "@/components/SavingsStream";
import { AffordabilityAdvisor } from "@/components/AffordabilityAdvisor";
import { getRuleBasedSavings } from "@/lib/savingsHeuristics";
import type { AppData } from "@/lib/types";
import type { AffordabilityInput } from "@/utils/buildAffordabilityPrompt";

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken()!;
  const userType = getUserType() ?? "sme";
  const [affordabilityOpen, setAffordabilityOpen] = useState(false);

  const { data: summaryData } = useQuery({
    queryKey: ["summary", userType],
    queryFn: () => api.summary(userType, token),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ["transactions", userType],
    queryFn: () => api.transactions(userType),
  });

  const { data: forecastData } = useQuery({
    queryKey: ["forecast", userType],
    queryFn: () => api.forecast(userType, token),
  });

  const { data: recurringData } = useQuery({
    queryKey: ["recurring", userType],
    queryFn: () => api.recurring(userType),
  });

  const { data: breakdownData } = useQuery({
    queryKey: ["breakdown", userType],
    queryFn: () => api.breakdown(userType, token),
  });

  const { data: runwayData } = useQuery({
    queryKey: ["runway", userType],
    queryFn: () => api.runway(userType, token),
  });

  const { data: insightData } = useQuery({
    queryKey: ["insight", userType],
    queryFn: () => api.insight(userType, token),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api.subscriptions.list(token),
  });

  const { data: savingsData } = useQuery({
    queryKey: ["cfo-savings", userType],
    queryFn: () => api.cfo.savings(token, userType),
    staleTime: 60_000,
  });

  const appData: AppData = useMemo(
    () => ({
      transactions: transactionsData?.transactions ?? [],
      subscriptions: subscriptionsData?.subscriptions ?? [],
      currentBalance: summaryData?.balance ?? 0,
      taxConfig: { vatRate: 0.23, corpTaxRate: 0.125 },
    }),
    [
      transactionsData?.transactions,
      subscriptionsData?.subscriptions,
      summaryData?.balance,
    ]
  );

  const savingsItems = useMemo(() => {
    const fromApi = savingsData?.items ?? [];
    if (fromApi.length >= 4) return fromApi;
    const fromRules = getRuleBasedSavings(appData, {});
    return fromRules.length >= fromApi.length ? fromRules : fromApi;
  }, [savingsData?.items, appData]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    ["summary", "forecast", "breakdown", "runway", "insight"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key, userType] })
    );
  };

  const addMutation = useMutation({
    mutationFn: (sub: { merchant: string; amount: number; nextDueDate: string; frequency: "monthly" | "weekly" }) =>
      api.subscriptions.add(sub, token),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.subscriptions.delete(id, token),
    onSuccess: invalidateAll,
  });

  function handleLogout() {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  }

  const summary = summaryData ?? {
    balance: 0, estimatedTax: 0, estimatedVAT: null, estimatedCorpTax: null,
    estimatedPRSI: null, recurringTotal: 0, trueAvailable: 0, riskRatio: 0,
  };

  const affordabilityInput: AffordabilityInput = useMemo(
    () => ({
      summary,
      runway: runwayData ?? { days: 0, status: "critical", monthlyBurn: 0, trueAvailable: 0 },
      forecast: forecastData?.forecast ?? [],
      transactions: transactionsData?.transactions ?? [],
    }),
    [summary, runwayData, forecastData?.forecast, transactionsData?.transactions]
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Affordability Advisor entry point */}
        <section className="flex justify-center pt-2">
          <div className="w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setAffordabilityOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <BrainCircuit className="h-4 w-4" />
              </span>
              <span className="text-sm text-muted-foreground flex-1">
                Ask the Affordability Advisor… e.g. &quot;Can I afford a dog?&quot; or &quot;Can I afford a €2,500/month hire?&quot;
              </span>
            </button>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Account type:</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
              {userType === "sme" ? "SME" : "Individual"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>

        <MetricCards summary={summary} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ForecastChart data={forecastData?.forecast ?? []} />
          </div>
          <div>
            <ExpensePieChart data={breakdownData?.breakdown ?? []} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TaxVault estimatedTax={summary.estimatedTax} balance={summary.balance} />
          <CashRunway days={runwayData?.days ?? 0} />
          <AIInsightPanel insightText={insightData?.insight ?? "Loading insight..."} />
        </div>

        {/* Savings & Optimizations – below Tax Vault / Runway */}
        <section className="rounded-2xl border border-border bg-card/50 p-6">
          <SavingsStream items={savingsItems} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecurringPaymentsList payments={recurringData?.recurring ?? []} />
          <RecurringPayments
            subscriptions={subscriptionsData?.subscriptions ?? []}
            onAdd={(sub) => addMutation.mutate(sub)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </div>

        <TransactionsTable transactions={transactionsData?.transactions ?? []} />
      </main>

      <AffordabilityAdvisor
        open={affordabilityOpen}
        onClose={() => setAffordabilityOpen(false)}
        input={affordabilityInput}
      />
    </div>
  );
};

export default Index;
