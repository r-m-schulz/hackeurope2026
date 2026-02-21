import { useState } from "react";
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
import { Landmark } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken()!;
  const userType = getUserType() ?? "sme";
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

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Account type:</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
              {userType === "sme" ? "SME" : "Individual"}
            </span>
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
