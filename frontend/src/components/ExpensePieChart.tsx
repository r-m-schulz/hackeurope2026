import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import { ExpenseBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";

interface ExpensePieChartProps {
  data: ExpenseBreakdown[];
}

const MAX_SECTIONS = 4;
const COLORS = [
  "hsl(152, 60%, 40%)",
  "hsl(220, 70%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(200, 70%, 50%)",
];

const CHART_SIZE = 160;
const PIE_CX = CHART_SIZE / 2;
const PIE_CY = CHART_SIZE / 2;
const OUTER_R = 72;

/** Recharts Pie uses 0° = 3 o'clock, angles increase counter-clockwise. Returns midAngle in degrees. */
function getSegmentMidAngle(chartData: { amount: number }[], total: number, index: number): number {
  let start = 0;
  for (let i = 0; i < index; i++) start += (chartData[i].amount / total) * 360;
  const end = start + (chartData[index].amount / total) * 360;
  return (start + end) / 2;
}

/** Y position of a point on the pie edge (0 = top of chart). Angle in degrees, 0 = right, 90 = top. */
function angleToY(angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180;
  return PIE_CY - OUTER_R * Math.sin(rad);
}

/** Segment on left half of pie (9 o'clock side) => show tooltip on left; else right. */
function segmentIsOnLeft(midAngleDeg: number): boolean {
  const a = midAngleDeg % 360;
  return a > 90 && a < 270;
}

const tooltipContentStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: 12,
  color: "hsl(var(--card-foreground))",
};

function ExpenseBreakdownTooltipContent({ payload }: { payload: TooltipProps<number, string>["payload"] }) {
  if (!payload?.length) return null;
  const item = payload[0];
  const value = typeof item.value === "number" ? item.value : 0;
  const name = item.name ?? "";
  return (
    <div style={tooltipContentStyle} className="px-2.5 py-1.5 shadow-md whitespace-nowrap">
      <div className="font-medium" style={{ color: "hsl(var(--card-foreground))" }}>{name}</div>
      <div style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(value)}</div>
    </div>
  );
}

type TooltipPayload = NonNullable<TooltipProps<number, string>["payload"]>;

interface TooltipPlacement {
  payload: TooltipPayload;
  topPx: number;
  isLeft: boolean;
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const [tooltipState, setTooltipState] = useState<TooltipPlacement | null>(null);
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const top = data.slice(0, MAX_SECTIONS);
  const rest = data.slice(MAX_SECTIONS);
  const otherAmount = rest.reduce((sum, d) => sum + d.amount, 0);
  const chartData = otherAmount > 0 ? [...top, { category: "Other", amount: otherAmount }] : top;

  const updateTooltip = (active: boolean, payload: TooltipPayload | undefined) => {
    if (!active || !payload?.length) {
      setTooltipState(null);
      return;
    }
    const name = payload[0].name ?? "";
    const index = chartData.findIndex((d) => d.category === name);
    if (index < 0) {
      setTooltipState(null);
      return;
    }
    const midAngle = getSegmentMidAngle(chartData, total, index);
    const topPx = angleToY(midAngle);
    const isLeft = segmentIsOnLeft(midAngle);
    queueMicrotask(() => setTooltipState({ payload, topPx, isLeft }));
  };

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">Expense Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">By category</p>

      <div className="relative h-[160px] w-[320px] max-w-[calc(100vw-2rem)] mx-auto mb-5 overflow-visible">
        {/* Chart centered in the row */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[160px] h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  updateTooltip(!!active, payload);
                  return null;
                }}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
          </div>
        </div>
        {/* Tooltip: vertical position matches segment; left/right of pie by segment side */}
        {tooltipState ? (
          <div
            className="absolute w-[120px] pointer-events-none min-w-0"
            style={{
              top: tooltipState.topPx,
              transform: "translateY(-50%)",
              ...(tooltipState.isLeft
                ? { right: CHART_SIZE + OUTER_R + 8, display: "flex", justifyContent: "flex-end" }
                : { left: CHART_SIZE + OUTER_R + 8 }),
            }}
            aria-hidden
          >
            <ExpenseBreakdownTooltipContent payload={tooltipState.payload} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        {chartData.map((item, i) => (
          <div key={item.category} className="flex items-start gap-1.5 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate" title={item.category}>
                {item.category}
              </div>
              <div className="text-xs font-medium text-foreground">
                {formatCurrency(item.amount)}{" "}
                <span className="font-normal text-muted-foreground">
                  {Math.round((item.amount / total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
