import { AlertTriangle, Lightbulb, TrendingUp, Info, Loader2, RefreshCw } from "lucide-react";
import type { CFOInsight } from "@/lib/types";

interface AIInsightPanelProps {
  insights: CFOInsight[];
  isLoading?: boolean;
  isError?: boolean;
}

function InsightIcon({ severity }: { severity: CFOInsight["severity"] }) {
  if (severity === "critical") {
    return <AlertTriangle className="h-4 w-4 text-risk shrink-0 mt-0.5" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />;
  }
  return <TrendingUp className="h-4 w-4 text-safe shrink-0 mt-0.5" />;
}

export function AIInsightPanel({ insights, isLoading, isError }: AIInsightPanelProps) {
  return (
    <div className="card-metric flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" />
        CFO Insights
      </h3>
      <p className="text-xs text-muted-foreground mb-3">AI-generated financial insights</p>

      <div className="flex-1 overflow-y-auto max-h-52 space-y-3 pr-1 scrollbar-thin">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Generating insights…</span>
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex items-start gap-2 py-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Could not load insights right now. They will retry automatically.
            </p>
          </div>
        )}

        {!isLoading && !isError && insights.length === 0 && (
          <div className="flex items-start gap-2 py-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Loading your financial data…
            </p>
          </div>
        )}

        {!isLoading && insights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-2.5 rounded-lg p-2.5 bg-muted/40 border border-border/50"
          >
            <InsightIcon severity={insight.severity} />
            <p className="text-xs leading-relaxed text-muted-foreground">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
