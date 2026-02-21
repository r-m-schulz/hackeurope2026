import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface CashRunwayProps {
  days: number;
}

export function CashRunway({ days }: CashRunwayProps) {
  const getStatus = () => {
    if (days > 60) return { icon: CheckCircle, label: "Healthy", colorClass: "text-safe", bgClass: "bg-safe-muted" };
    if (days > 30) return { icon: Clock, label: "Monitor", colorClass: "text-warning", bgClass: "bg-warning-muted" };
    return { icon: AlertTriangle, label: "Critical", colorClass: "text-risk", bgClass: "bg-risk-muted" };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={`card-metric ${status.bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Cash Runway</h3>
        <Icon className={`h-5 w-5 ${status.colorClass}`} />
      </div>

      <div className="text-center py-4">
        <p className={`text-6xl font-black tracking-tighter ${status.colorClass}`}>{days}</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">days remaining</p>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.bgClass} ${status.colorClass}`}>
          {status.label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Based on current recurring expenses with no new income
      </p>
    </div>
  );
}
