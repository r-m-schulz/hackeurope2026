import { useState } from "react";
import { TrendingDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance-engine";
import type { CFOSavingsItem } from "@/lib/types";

interface SavingsStreamProps {
  items: CFOSavingsItem[];
  onIgnore?: (id: string) => void;
  onMarkDone?: (id: string) => void;
}

export function SavingsStream({
  items,
  onIgnore,
  onMarkDone,
}: SavingsStreamProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const visible = items.filter((i) => !hiddenIds.has(i.id));

  const handleIgnore = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    onIgnore?.(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-safe" />
        <h2 className="text-lg font-semibold text-foreground">Savings &amp; Optimizations</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Proactive suggestions from your CFO. Informational only; verify with a professional.
      </p>
      <div className="overflow-y-auto max-h-[26rem] pr-1 scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-safe">
                Save ~{formatCurrency(item.estimateMonthlyLow)}
                {item.estimateMonthlyHigh > item.estimateMonthlyLow
                  ? `–${formatCurrency(item.estimateMonthlyHigh)}`
                  : ""}
                /mo
              </span>
              <span className="text-xs text-muted-foreground">
                {item.confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{item.rationale}</p>
            {item.evidence && (
              <p className="text-xs text-muted-foreground/80 mb-3">
                Why: {item.evidence}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => { handleIgnore(item.id); onMarkDone?.(item.id); }}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {item.ctaPrimary === "Review" ? "Reviewed" : item.ctaPrimary}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => handleIgnore(item.id)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {item.ctaSecondary}
              </Button>
            </div>
          </div>
        ))}
      </div>
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No suggestions right now. Check back after more transactions.
        </p>
      )}
    </div>
  );
}
