import { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Search, X } from "lucide-react";

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [merchantQuery, setMerchantQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(transactions.map((t) => t.category))).sort();
    return unique;
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = merchantQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesMerchant = !q || t.merchant.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      return matchesMerchant && matchesCategory;
    });
  }, [transactions, merchantQuery, categoryFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      const diff = a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [filtered, sortBy, sortDir]);

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
      <p className="text-xs text-muted-foreground mb-4">
        {sorted.length === transactions.length
          ? "All account activity"
          : `${sorted.length} of ${transactions.length} transactions`}
      </p>

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
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3 pt-0">
                <div className="flex items-center gap-1.5">
                  <span>Merchant</span>
                  <div className="relative">
                    <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={merchantQuery}
                      onChange={(e) => setMerchantQuery(e.target.value)}
                      placeholder="Search…"
                      className="pl-5 pr-5 py-0.5 w-28 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-normal"
                    />
                    {merchantQuery && (
                      <button
                        type="button"
                        onClick={() => setMerchantQuery("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 pb-3 pt-0">
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-0.5 px-1.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-normal max-w-[100px]"
                  >
                    <option value="all">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </th>
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
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No transactions match your search.
                </td>
              </tr>
            )}
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
                  <span className={`inline-flex items-center gap-1 ${t.type === "income" ? "text-safe" : "text-risk"}`}>
                    {t.type === "income" ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
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
