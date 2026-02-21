import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/finance-engine";
import type { CFOScenarioDeltas } from "@/lib/cfoCalculations";

interface WhatIfControlsProps {
  deltas: CFOScenarioDeltas;
  onChange: (deltas: CFOScenarioDeltas) => void;
  /** Derived values shown for context */
  runwayDays?: number;
  safeToSpendNow?: number;
}

const SLIDER_MAX = 10000;
const SLIDER_STEP = 100;

export function WhatIfControls({
  deltas,
  onChange,
  runwayDays,
  safeToSpendNow,
}: WhatIfControlsProps) {
  const set = (key: keyof CFOScenarioDeltas, value: number) => {
    onChange({ ...deltas, [key]: value });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4 animate-in fade-in duration-200">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        What-if simulator
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            + New hire (€/mo)
          </label>
          <Slider
            value={[deltas.newHireMonthly ?? 0]}
            onValueChange={([v]) => set("newHireMonthly", v)}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground font-mono">
            {formatCurrency(deltas.newHireMonthly ?? 0)}
          </span>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            + New subscription (€/mo)
          </label>
          <Slider
            value={[deltas.newSubscriptionMonthly ?? 0]}
            onValueChange={([v]) => set("newSubscriptionMonthly", v)}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground font-mono">
            {formatCurrency(deltas.newSubscriptionMonthly ?? 0)}
          </span>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            − Revenue drop (€/mo)
          </label>
          <Slider
            value={[deltas.revenueDropMonthly ?? 0]}
            onValueChange={([v]) => set("revenueDropMonthly", v)}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground font-mono">
            {formatCurrency(deltas.revenueDropMonthly ?? 0)}
          </span>
        </div>
      </div>
      {(runwayDays != null || safeToSpendNow != null) && (
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
          {runwayDays != null && (
            <span className="text-xs text-muted-foreground">
              Runway: <span className="font-semibold text-foreground">{runwayDays} days</span>
            </span>
          )}
          {safeToSpendNow != null && (
            <span className="text-xs text-muted-foreground">
              Safe to spend:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(safeToSpendNow)}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
