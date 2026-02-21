import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const top = data.slice(0, MAX_SECTIONS);
  const rest = data.slice(MAX_SECTIONS);
  const otherAmount = rest.reduce((sum, d) => sum + d.amount, 0);
  const chartData = otherAmount > 0 ? [...top, { category: "Other", amount: otherAmount }] : top;

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">Expense Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">By category</p>

      <div className="relative h-[160px] w-[160px] mx-auto mb-5">
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>
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
