import { RecurringPayment } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";
import { RefreshCw } from "lucide-react";

interface RecurringPaymentsListProps {
  payments: RecurringPayment[];
}

export function RecurringPaymentsList({ payments }: RecurringPaymentsListProps) {
  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">Detected Recurring Payments</h3>
      <p className="text-xs text-muted-foreground mb-4">Auto-detected from transaction patterns</p>

      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.merchant}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{p.merchant}</p>
                <p className="text-xs text-muted-foreground">
                  Every ~{p.frequency} days · {p.occurrences} occurrences
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono text-foreground">{formatCurrency(p.averageAmount)}</p>
              <p className="text-xs text-muted-foreground">
                Next: {new Date(p.nextExpectedDate).toLocaleDateString("en-IE", { day: "2-digit", month: "short" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
