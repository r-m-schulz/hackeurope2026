import { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown } from "lucide-react";

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (sortBy === "date") {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      const diff = a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [transactions, sortBy, sortDir]);

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "date" ? "desc" : "asc");
    }
  };

  const SortIcons = ({ column }: { column: SortBy }) => {
    const active = sortBy === column;
    const upHighlight = active && sortDir === "asc";
    const downHighlight = active && sortDir === "desc";
    return (
      <span className="inline-flex flex-col ml-0.5 leading-none" aria-hidden>
        <ChevronUp className={`h-3 w-3 -mb-0.5 ${upHighlight ? "text-foreground opacity-100" : "text-muted-foreground opacity-50"}`} />
        <ChevronDown className={`h-3 w-3 ${downHighlight ? "text-foreground opacity-100" : "text-muted-foreground opacity-50"}`} />
      </span>
    );
  };

  return (
    <div className="card-metric overflow-hidden">
      <h3 className="text-sm font-semibold text-foreground mb-1">Recent Transactions</h3>
      <p className="text-xs text-muted-foreground mb-4">All account activity</p>

      <div className="overflow-x-auto -mx-6 max-h-[14rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 pb-3 pt-0">
                <button
                  type="button"
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center hover:text-foreground transition-colors"
                >
                  Date
                  <SortIcons column="date" />
                </button>
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3 pt-0">Merchant</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3 pt-0">Category</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 pb-3 pt-0">
                <button
                  type="button"
                  onClick={() => toggleSort("amount")}
                  className="inline-flex items-center hover:text-foreground transition-colors"
                >
                  Amount
                  <SortIcons column="amount" />
                </button>
              </th>
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
