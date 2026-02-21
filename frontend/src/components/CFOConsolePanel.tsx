import { useState, useMemo, useCallback } from "react";
import { Search, Gauge, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatIfControls } from "@/components/WhatIfControls";
import { formatCurrency } from "@/lib/finance-engine";
import {
  computeCFOAnswer,
  type CFOScenarioDeltas,
  type CFOAnswerResult,
} from "@/lib/cfoCalculations";
import type { AppData } from "@/lib/types";
import type { CFOQueryResponse } from "@/lib/types";

const SUGGESTED_PROMPTS = [
  "Can I afford a €2500/month hire?",
  "What's my safe-to-spend now?",
  "Add a €99/mo subscription — can I afford it?",
  "How much runway do I have?",
];

interface CFOConsolePanelProps {
  appData: AppData;
  onQuery: (queryText: string) => Promise<CFOQueryResponse | null>;
  lastResult: CFOQueryResponse | null;
  lastQuery: string;
  loading: boolean;
  onClose: () => void;
}

export function CFOConsolePanel({
  appData,
  onQuery,
  lastResult,
  lastQuery,
  loading,
  onClose,
}: CFOConsolePanelProps) {
  const [queryText, setQueryText] = useState(lastQuery);
  const [deltas, setDeltas] = useState<CFOScenarioDeltas>({});

  const liveAnswer = useMemo((): CFOAnswerResult | null => {
    return computeCFOAnswer(appData, {
      targetRunwayDays: 60,
      deltas: Object.keys(deltas).length ? deltas : undefined,
    });
  }, [appData, deltas]);

  const runwayDays = liveAnswer?.runwayDays ?? lastResult?.runwayDays;
  const safeToSpendNow = liveAnswer?.safeToSpendNow ?? lastResult?.safeToSpendNow;
  const recommendedMax = liveAnswer?.recommendedMaxMonthly ?? lastResult?.recommendedMaxMonthly ?? 0;
  const affordability = lastResult ? lastResult.affordability : liveAnswer?.affordability ?? null;
  const confidence = lastResult?.confidence ?? liveAnswer?.confidence ?? 0;
  const assumptions = lastResult?.assumptions ?? liveAnswer?.assumptions ?? [];
  const confidenceReasons = lastResult?.confidenceReasons ?? liveAnswer?.confidenceReasons ?? [];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = queryText.trim();
      if (q) onQuery(q);
    },
    [queryText, onQuery]
  );

  return (
    <div className="w-full max-w-5xl mx-auto animate-cfo-expand">
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: Query + chips */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Ask your CFO… e.g. Can I afford €2500/month hire?"
                  className="pl-9 h-11 rounded-xl bg-background border-border"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setQueryText(prompt);
                      onQuery(prompt);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border hover:bg-accent hover:border-primary/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Right: Answer Sheet */}
          <div className="p-6 flex flex-col justify-center min-h-[200px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Answer sheet
            </p>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Computing…</span>
              </div>
            ) : (
              <div className="space-y-4">
                {affordability !== null && (
                  <div className="flex items-center gap-2">
                    {affordability ? (
                      <CheckCircle className="h-5 w-5 text-safe" />
                    ) : (
                      <XCircle className="h-5 w-5 text-risk" />
                    )}
                    <span className="font-semibold text-foreground">
                      Can afford? {affordability ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-muted-foreground block text-xs">Runway impact</span>
                    <span className="font-mono font-semibold">{runwayDays ?? "—"} days</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-muted-foreground block text-xs">Recommended max spend</span>
                    <span className="font-mono font-semibold">{formatCurrency(recommendedMax)}/mo</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Key assumptions</span>
                  <ul className="text-xs text-foreground space-y-0.5">
                    {assumptions.map((a) => (
                      <li key={a.label}>
                        {a.label}: {a.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence {confidence}%{confidenceReasons.length ? ` — ${confidenceReasons[0]}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions row + What-if */}
        <div className="border-t border-border p-4 space-y-4 bg-muted/10">
          <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> to collapse</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-2">Actions:</span>
            {["Simulate", "Add recurring", "Ignore", "Move to tax vault"].map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
              >
                {action}
              </Button>
            ))}
          </div>
          <WhatIfControls
            deltas={deltas}
            onChange={setDeltas}
            runwayDays={runwayDays ?? undefined}
            safeToSpendNow={safeToSpendNow ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
