import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import { api } from "@/lib/api";
import { getToken, getUserType, clearAuth, saveProStatus } from "@/lib/auth";
import { ProGate } from "@/components/ProGate";
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
import type { AppData, CFOInsightsSnapshot } from "@/lib/types";
import type { AffordabilityInput } from "@/utils/buildAffordabilityPrompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Building2, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getToken()!;
  const userType = getUserType() ?? "sme";
  const [affordabilityOpen, setAffordabilityOpen] = useState(false);
  const [cfoBarQuery, setCfoBarQuery] = useState("");
  const [pendingCfoQuery, setPendingCfoQuery] = useState<string | undefined>(undefined);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");

  const { data: summaryData } = useQuery({
    queryKey: ["summary", userType],
    queryFn: () => api.summary(userType, token),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ["transactions", userType],
    queryFn: () => api.transactions(userType, token),
  });

  const { data: forecastData } = useQuery({
    queryKey: ["forecast", userType],
    queryFn: () => api.forecast(userType, token),
  });

  const { data: recurringData } = useQuery({
    queryKey: ["recurring", userType],
    queryFn: () => api.recurring(userType, token),
  });

  const { data: breakdownData } = useQuery({
    queryKey: ["breakdown", userType],
    queryFn: () => api.breakdown(userType, token),
  });

  const { data: runwayData } = useQuery({
    queryKey: ["runway", userType],
    queryFn: () => api.runway(userType, token),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api.subscriptions.list(token),
  });

  const cfoInsightsSnapshot = useMemo((): CFOInsightsSnapshot | null => {
    if (!summaryData || !runwayData) return null;
    return {
      summary: {
        balance: summaryData.balance ?? 0,
        estimatedTax: summaryData.estimatedTax ?? 0,
        trueAvailable: summaryData.trueAvailable ?? 0,
        recurringTotal: summaryData.recurringTotal ?? 0,
        riskRatio: summaryData.riskRatio ?? 0,
      },
      runway: {
        days: runwayData.days ?? 0,
        status: runwayData.status ?? "unknown",
        monthlyBurn: runwayData.monthlyBurn ?? 0,
      },
      forecast: forecastData?.forecast ?? [],
      breakdown: breakdownData?.breakdown ?? [],
      transactions: transactionsData?.transactions ?? [],
      recurring: recurringData?.recurring ?? [],
      subscriptions: subscriptionsData?.subscriptions ?? [],
    };
  }, [summaryData, runwayData, forecastData, breakdownData, transactionsData, recurringData, subscriptionsData]);

  const { data: cfoInsightsData, isLoading: cfoInsightsLoading, isError: cfoInsightsError } = useQuery({
    queryKey: ["cfo-insights", userType],
    queryFn: () => api.cfo.insights({ financialSnapshot: cfoInsightsSnapshot!, userType }, token),
    enabled: !!cfoInsightsSnapshot,
    staleTime: 5 * 60_000,
    retry: 1,
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
    ["summary", "forecast", "breakdown", "runway", "insight", "transactions", "recurring"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key, userType] })
    );
  };

  const updateBalanceMutation = useMutation({
    mutationFn: (value: number) => api.settings.updateBalance(value, token, userType),
    onSuccess: async (_data, value) => {
      invalidateAll();
      await queryClient.refetchQueries({ queryKey: ["summary", userType] });
      setBalanceDialogOpen(false);
      setBalanceInput("");
      toast.success("Balance updated to €" + value.toLocaleString("en-IE"));
    },
    onError: (err: Error) => {
      toast.error("Could not save balance: " + (err.message || "Please try again."));
    },
  });

  const addMutation = useMutation({
    mutationFn: (sub: { merchant: string; amount: number; nextDueDate: string; frequency: "monthly" | "weekly" }) =>
      api.subscriptions.add(sub, token),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.subscriptions.delete(id, token),
    onSuccess: invalidateAll,
  });

  // --- Plaid ---
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectingBank, setConnectingBank] = useState(false);

  const { data: plaidStatus, refetch: refetchPlaidStatus } = useQuery({
    queryKey: ["plaid-status"],
    queryFn: () => api.plaid.status(token),
  });

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: async (public_token) => {
      try {
        await api.plaid.exchangeToken(public_token, token);
        await refetchPlaidStatus();
        invalidateAll();
        toast.success("Bank connected! Loading your real transactions...");
      } catch {
        toast.error("Failed to connect bank. Please try again.");
      } finally {
        setLinkToken(null);
        setConnectingBank(false);
      }
    },
    onExit: () => {
      setLinkToken(null);
      setConnectingBank(false);
    },
  });

  // Open Plaid modal as soon as the link token is ready
  useEffect(() => {
    if (linkToken && plaidReady) openPlaid();
  }, [linkToken, plaidReady, openPlaid]);

  // Handle Stripe checkout success redirect
  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    saveProStatus(true);
    toast.success("Welcome to Pro! AI insights and forecasting are now unlocked.");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  async function handleConnectBank() {
    setConnectingBank(true);
    try {
      const { link_token } = await api.plaid.createLinkToken(token);
      setLinkToken(link_token);
    } catch {
      toast.error("Could not initialise bank connection. Please try again.");
      setConnectingBank(false);
    }
  }

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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = cfoBarQuery.trim();
                setPendingCfoQuery(q || undefined);
                setCfoBarQuery("");
                setAffordabilityOpen(true);
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 hover:shadow-md focus-within:bg-primary/10 focus-within:border-primary/50 focus-within:shadow-md transition-all duration-200"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <BrainCircuit className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={cfoBarQuery}
                onChange={(e) => setCfoBarQuery(e.target.value)}
                placeholder='Ask PocketCFO… e.g. "Can I afford a dog?" or "Can I afford a €2,500/month hire?"'
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setAffordabilityOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Open chat
              </button>
            </form>
          </div>
        </section>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Account type:</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
              {userType === "sme" ? "SME" : "Individual"}
            </span>

            {plaidStatus?.connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Bank connected
              </span>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleConnectBank}
                disabled={connectingBank}
              >
                {connectingBank ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                {connectingBank ? "Connecting…" : "Connect your bank"}
              </Button>
            )}

            <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Landmark className="h-4 w-4" />
                  Update balance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Bank balance</DialogTitle>
                  <DialogDescription>
                    Set your current account balance. This is used for true available cash, forecast, and runway.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = Number(balanceInput.replace(/,/g, ""));
                    if (!Number.isNaN(val)) updateBalanceMutation.mutate(val);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="balance">Current balance (€)</Label>
                    <Input
                      id="balance"
                      type="text"
                      inputMode="decimal"
                      placeholder={summary.balance.toLocaleString("en-IE")}
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBalanceDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateBalanceMutation.isPending || (balanceInput !== "" && Number.isNaN(Number(balanceInput.replace(/,/g, ""))))}
                    >
                      {updateBalanceMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
          <ProGate label="AI insights — Pro feature">
            <AIInsightPanel
              insights={cfoInsightsData?.insights ?? []}
              isLoading={cfoInsightsLoading}
              isError={cfoInsightsError}
            />
          </ProGate>
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
        initialQuery={pendingCfoQuery}
        onInitialQueryConsumed={() => setPendingCfoQuery(undefined)}
      />
    </div>
  );
};

export default Index;
