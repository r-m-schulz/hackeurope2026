import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="card-metric overflow-hidden">
      <h3 className="text-sm font-semibold text-foreground mb-1">Recent Transactions</h3>
      <p className="text-xs text-muted-foreground mb-4">All account activity</p>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 pb-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3">Merchant</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3">Category</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 pb-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-3 text-muted-foreground font-mono text-xs">
                  {new Date(t.date).toLocaleDateString("en-IE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-3 font-medium text-foreground">{t.merchant}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-mono font-medium">
                  <span className={`inline-flex items-center gap-1 ${t.type === "income" ? "text-safe" : "text-foreground"}`}>
                    {t.type === "income" ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
