import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";

interface AIInsightPanelProps {
  insightText: string;
}

export function AIInsightPanel({ insightText }: AIInsightPanelProps) {
  const isWarning =
    insightText.toLowerCase().includes("shortfall") ||
    insightText.toLowerCase().includes("ensure");

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" />
        CFO Insight
      </h3>
      <p className="text-xs text-muted-foreground mb-4">AI-generated cash flow insight</p>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 text-risk shrink-0 mt-0.5" />
        ) : (
          <TrendingUp className="h-5 w-5 text-safe shrink-0 mt-0.5" />
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{insightText}</p>
      </div>
    </div>
  );
}
