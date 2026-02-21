import { TrendingUp, TrendingDown, Landmark, Receipt, RefreshCw, ShieldCheck } from "lucide-react";
import { formatCurrency, getRiskLevel } from "@/lib/finance-engine";
import { FinancialSummary } from "@/lib/types";

interface MetricCardsProps {
  summary: FinancialSummary;
}

const LONG_NUMBER_LENGTH = 12;

export function MetricCards({ summary }: MetricCardsProps) {
  const riskLevel = getRiskLevel(summary.riskRatio);

  const balanceStr = formatCurrency(summary.balance);
  const taxStr = formatCurrency(summary.estimatedTax);
  const recurringStr = formatCurrency(summary.recurringTotal);
  const trueAvailableStr = formatCurrency(summary.trueAvailable);

  const riskColors = {
    safe: "border-safe text-safe",
    warning: "border-warning text-warning",
    risk: "border-risk text-risk",
  };

  const riskBg = {
    safe: "bg-safe-muted",
    warning: "bg-warning-muted",
    risk: "bg-risk-muted",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Bank Balance */}
      <div className="card-metric">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">Bank Balance</span>
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className={`metric-value text-foreground w-full ${balanceStr.length > LONG_NUMBER_LENGTH ? "metric-value-long" : ""}`}>{balanceStr}</p>
        <p className="text-xs text-muted-foreground mt-2">Current account balance</p>
      </div>

      {/* Tax Owed */}
      <div className="card-metric">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">Estimated Tax</span>
          <Receipt className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className={`metric-value text-risk w-full ${taxStr.length > LONG_NUMBER_LENGTH ? "metric-value-long" : ""}`}>{taxStr}</p>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">VAT: {formatCurrency(summary.estimatedVAT)}</p>
          <p className="text-xs text-muted-foreground">Corp: {formatCurrency(summary.estimatedCorpTax)}</p>
          <p className="text-xs text-muted-foreground">PRSI: {formatCurrency(summary.estimatedPRSI)}</p>
        </div>
      </div>

      {/* Recurring Expenses */}
      <div className="card-metric">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">Recurring (30d)</span>
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className={`metric-value text-warning w-full ${recurringStr.length > LONG_NUMBER_LENGTH ? "metric-value-long" : ""}`}>{recurringStr}</p>
        <p className="text-xs text-muted-foreground mt-2">Upcoming recurring payments</p>
      </div>

      {/* True Available Cash - HERO */}
      <div className={`card-hero ${riskBg[riskLevel]} ${riskColors[riskLevel]} md:col-span-2 lg:col-span-1`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold opacity-80">True Available Cash</span>
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className={`metric-value-hero ${riskColors[riskLevel]} w-full ${trueAvailableStr.length > LONG_NUMBER_LENGTH ? "metric-value-hero-long" : ""}`}>
          {trueAvailableStr}
        </p>
        <div className="flex items-center gap-1.5 mt-3">
          {summary.trueAvailable >= 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <p className="text-xs font-medium opacity-80">
            {Math.round(summary.riskRatio * 100)}% of balance is spendable
          </p>
        </div>
      </div>
    </div>
  );
}
