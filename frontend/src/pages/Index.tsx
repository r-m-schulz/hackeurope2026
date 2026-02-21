import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken()!;
  const userType = getUserType() ?? "sme";

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

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
    </div>
  );
};

export default Index;
