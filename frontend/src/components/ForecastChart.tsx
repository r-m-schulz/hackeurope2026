import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ForecastDay } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";

interface ForecastChartProps {
  data: ForecastDay[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  const minValue = Math.min(...data.map((d) => d.projected));
  const dangerZone = minValue < 0;

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">30-Day Cash Forecast</h3>
      <p className="text-xs text-muted-foreground mb-6">Projected balance assuming recurring payments continue, no new income</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              tickFormatter={(v) => formatCurrency(v)}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: 12,
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value: number) => [formatCurrency(value), "Projected"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-IE")}
            />
            {dangerZone && <ReferenceLine y={0} stroke="hsl(var(--risk))" strokeDasharray="5 5" />}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="hsl(var(--chart-line))"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--chart-line))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
