import { useState } from "react";
import { TrendingDown, Check, X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance-engine";
import { ProGate } from "@/components/ProGate";
import type { CFOSavingsItem } from "@/lib/types";

interface SavingsStreamProps {
  items: CFOSavingsItem[];
  proItems?: CFOSavingsItem[];
  proLoading?: boolean;
  proError?: boolean;
  onIgnore?: (id: string) => void;
  onMarkDone?: (id: string) => void;
}

function SavingsCard({
  item,
  onReview,
  onIgnore,
}: {
  item: CFOSavingsItem;
  onReview: () => void;
  onIgnore: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
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
          onClick={onReview}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {item.ctaPrimary === "Review" ? "Reviewed" : item.ctaPrimary}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-xs"
          onClick={onIgnore}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          {item.ctaSecondary}
        </Button>
      </div>
    </div>
  );
}

function ProSavingsContent({
  proItems,
  proLoading,
  proError,
  hiddenIds,
  onReview,
  onIgnore,
}: {
  proItems: CFOSavingsItem[];
  proLoading: boolean;
  proError: boolean;
  hiddenIds: Set<string>;
  onReview: (id: string) => void;
  onIgnore: (id: string) => void;
}) {
  const visible = proItems.filter((i) => !hiddenIds.has(i.id));

  return (
    <div className="flex flex-col h-full">
      {proLoading && (
        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm flex-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing your finances…
        </div>
      )}

      {proError && !proLoading && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load personalised savings. Try again later.
        </div>
      )}

      {!proLoading && !proError && (
        <div className="space-y-4">
          {visible.map((item) => (
            <SavingsCard
              key={item.id}
              item={item}
              onReview={() => onReview(item.id)}
              onIgnore={() => onIgnore(item.id)}
            />
          ))}
          {visible.length === 0 && proItems.length > 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              All personalised suggestions reviewed.
            </p>
          )}
          {proItems.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No personalised suggestions yet. Add more transactions to unlock.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SavingsStream({
  items,
  proItems = [],
  proLoading = false,
  proError = false,
  onIgnore,
  onMarkDone,
}: SavingsStreamProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const visibleFree = items.filter((i) => !hiddenIds.has(i.id));

  const handleIgnore = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    onIgnore?.(id);
  };

  const handleReview = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    onMarkDone?.(id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-safe" />
        <h2 className="text-lg font-semibold text-foreground">Savings &amp; Optimizations</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Proactive suggestions from your CFO. Informational only; verify with a professional.
      </p>

      {/* Two-column layout: free left, pro right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-border/60">

        {/* LEFT — free rule-based savings */}
        <div className="lg:pr-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Suggestions</h3>
          </div>
          <div className="overflow-y-auto max-h-[28rem] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border space-y-4">
            {visibleFree.map((item) => (
              <SavingsCard
                key={item.id}
                item={item}
                onReview={() => handleReview(item.id)}
                onIgnore={() => handleIgnore(item.id)}
              />
            ))}
            {visibleFree.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No suggestions right now. Check back after more transactions.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — AI personalised Pro savings */}
        <div className="lg:pl-6 mt-6 lg:mt-0 pt-5 lg:pt-0 border-t border-border/60 lg:border-t-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#76b900]" />
            <h3 className="text-sm font-semibold text-foreground">AI Personalised Savings</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#76b900]/10 text-[#76b900] border border-[#76b900]/25">
              PRO
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tax loopholes, legal grey areas, and cheaper subscription alternatives. From your real data.
          </p>

          <div className="overflow-y-auto max-h-[28rem] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            <ProGate label="AI Personalised Savings — Pro feature">
              <ProSavingsContent
                proItems={proItems}
                proLoading={proLoading}
                proError={proError}
                hiddenIds={hiddenIds}
                onReview={handleReview}
                onIgnore={handleIgnore}
              />
            </ProGate>
          </div>
        </div>

      </div>
    </div>
  );
}
