import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExpenseBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";

interface ExpensePieChartProps {
  data: ExpenseBreakdown[];
}

const COLORS = [
  "hsl(220, 60%, 12%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(170, 50%, 45%)",
  "hsl(45, 80%, 55%)",
  "hsl(260, 50%, 60%)",
  "hsl(320, 60%, 50%)",
];

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">Expense Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">By category</p>

      <div className="flex items-center gap-6">
        <div className="h-[220px] w-[220px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
              >
                {data.map((_, index) => (
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
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          {data.slice(0, 6).map((item, i) => (
            <div key={item.category} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate">{item.category}</span>
              </div>
              <span className="font-medium text-foreground flex-shrink-0">
                {Math.round((item.amount / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
