import { formatCurrency } from "@/lib/finance-engine";

interface TaxVaultProps {
  estimatedTax: number;
  balance: number;
}

export function TaxVault({ estimatedTax, balance }: TaxVaultProps) {
  const spendable = balance - estimatedTax;
  const taxPercent = balance > 0 ? Math.min(100, (estimatedTax / balance) * 100) : 0;

  return (
    <div className="card-metric">
      <h3 className="text-sm font-semibold text-foreground mb-1">Tax Vault</h3>
      <p className="text-xs text-muted-foreground mb-6">Reserved vs. spendable</p>

      <div className="space-y-6">
        {/* Visual meter */}
        <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-risk rounded-full transition-all duration-700"
            style={{ width: `${taxPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <span className="text-xs font-semibold text-secondary-foreground relative z-10">
              Tax Reserved
            </span>
            <span className="text-xs font-semibold text-secondary-foreground relative z-10">
              Spendable
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-risk-muted rounded-xl">
            <p className="text-xs font-medium text-muted-foreground mb-1">Tax Reserved</p>
            <p className="text-xl font-bold text-risk">{formatCurrency(estimatedTax)}</p>
          </div>
          <div className="text-center p-4 bg-safe-muted rounded-xl">
            <p className="text-xs font-medium text-muted-foreground mb-1">Spendable</p>
            <p className="text-xl font-bold text-safe">{formatCurrency(Math.max(0, spendable))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
