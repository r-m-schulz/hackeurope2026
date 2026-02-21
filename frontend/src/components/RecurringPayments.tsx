import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import type { ManualSubscription } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-engine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurringPaymentsProps {
  subscriptions: ManualSubscription[];
  onAdd: (sub: Omit<ManualSubscription, "id">) => void;
  onDelete: (id: string) => void;
}

export function RecurringPayments({ subscriptions, onAdd, onDelete }: RecurringPaymentsProps) {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount || !nextDueDate) return;
    onAdd({ merchant, amount: Number(amount), nextDueDate, frequency });
    setOpen(false);
    setMerchant("");
    setAmount("");
    setNextDueDate("");
    setFrequency("monthly");
  };

  return (
    <div className="card-metric">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recurring Payments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manual subscriptions – used in forecast &amp; pie chart</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add subscription</DialogTitle>
                <DialogDescription>Add a recurring payment. It will appear in forecast and expense breakdown.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="merchant" className="text-right">Merchant</Label>
                  <Input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount</Label>
                  <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Next due</Label>
                  <Input id="date" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">Frequency</Label>
                  <div className="col-span-3">
                    <Select value={frequency} onValueChange={(v: "monthly" | "weekly") => setFrequency(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 min-h-0 max-h-[min(400px,60vh)] overflow-y-auto">
        {subscriptions.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No manual subscriptions. Add one to see it in forecast and expense breakdown.</p>
        )}
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{sub.merchant}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(sub.nextDueDate), "MMM d, yyyy")} · {sub.frequency}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-mono text-foreground">{formatCurrency(sub.amount)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-risk" onClick={() => onDelete(sub.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
