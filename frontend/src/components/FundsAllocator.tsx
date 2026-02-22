import { useState, useMemo } from "react";
import {
  Wallet,
  Palette,
  UtensilsCrossed,
  Sparkles,
  Gift,
  Dumbbell,
  Heart,
  Wrench,
  Factory,
  Pizza,
  Megaphone,
  GraduationCap,
  Package,
  Plane,
  Home,
  Car,
  ShoppingCart,
  Coffee,
  Film,
  Music,
  BookOpen,
  MoreHorizontal,
  SlidersHorizontal,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/finance-engine";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

/** 8 colours: black default + pie chart palette (ExpensePieChart COLORS + 2 more) */
const ALLOCATOR_COLORS = [
  "hsl(0, 0%, 12%)",
  "hsl(152, 60%, 40%)",
  "hsl(220, 70%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(340, 60%, 55%)",
  "hsl(160, 55%, 45%)",
  "hsl(320, 55%, 55%)",
];

/** Icon options for user-added categories (key -> component) */
const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  palette: Palette,
  utensils: UtensilsCrossed,
  sparkles: Sparkles,
  gift: Gift,
  dumbbell: Dumbbell,
  heart: Heart,
  wrench: Wrench,
  factory: Factory,
  pizza: Pizza,
  megaphone: Megaphone,
  graduation: GraduationCap,
  package: Package,
  plane: Plane,
  home: Home,
  car: Car,
  cart: ShoppingCart,
  coffee: Coffee,
  film: Film,
  music: Music,
  book: BookOpen,
  more: MoreHorizontal,
};

const ICON_KEYS = Object.keys(ICON_MAP);

export interface AllocatorCategory {
  id: string;
  label: string;
  iconKey: string;
  color: string;
}

interface FundsAllocatorProps {
  trueAvailable: number;
  transactions?: Transaction[];
  className?: string;
}

function parseInput(value: string): number {
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function thisMonthsSpending(transactions: Transaction[]): number {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  return transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.date).getMonth() === thisMonth &&
        new Date(t.date).getFullYear() === thisYear
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function FundsAllocator({ trueAvailable, transactions = [], className }: FundsAllocatorProps) {
  const [categories, setCategories] = useState<AllocatorCategory[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [inputRaw, setInputRaw] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIconKey, setNewIconKey] = useState(ICON_KEYS[0]);
  const [newColor, setNewColor] = useState(ALLOCATOR_COLORS[0]);
  const [barHover, setBarHover] = useState<{ label: string; amount: number; pct: number; centerX: number; top: number } | null>(null);

  const categoryIds = categories.map((c) => c.id);
  const totalAllocated = useMemo(
    () => categoryIds.reduce((sum, id) => sum + (amounts[id] ?? 0), 0),
    [amounts, categoryIds]
  );
  const remaining = Math.max(0, trueAvailable - totalAllocated);
  const isOver = totalAllocated > trueAvailable;
  const thisMonthSpending = useMemo(() => thisMonthsSpending(transactions), [transactions]);

  const setAmount = (id: string, value: number) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
    setInputRaw((prev) => ({ ...prev, [id]: value > 0 ? String(value) : "" }));
  };

  const setInput = (id: string, raw: string) => {
    setInputRaw((prev) => ({ ...prev, [id]: raw }));
    let value = parseInput(raw);
    const othersTotal = totalAllocated - (amounts[id] ?? 0);
    const maxForThis = Math.max(0, trueAvailable - othersTotal);
    value = Math.min(value, maxForThis);
    setAmounts((prev) => ({ ...prev, [id]: value }));
    if (value !== parseInput(raw)) setInputRaw((prev) => ({ ...prev, [id]: String(value) }));
  };

  const handleSliderChange = (id: string, percent: number) => {
    const value = Math.round((percent / 100) * trueAvailable);
    const othersTotal = totalAllocated - (amounts[id] ?? 0);
    const maxForThis = Math.max(0, trueAvailable - othersTotal);
    setAmount(id, Math.min(value, maxForThis));
  };

  const addCategory = () => {
    const label = newLabel.trim() || "New category";
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCategories((prev) => [...prev, { id, label, iconKey: newIconKey, color: newColor }]);
    setAmounts((prev) => ({ ...prev, [id]: 0 }));
    setInputRaw((prev) => ({ ...prev, [id]: "" }));
    setNewLabel("");
    setNewIconKey(ICON_KEYS[0]);
    setNewColor(ALLOCATOR_COLORS[0]);
    setAddOpen(false);
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setInputRaw((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const distributeEqually = () => {
    if (categoryIds.length === 0) return;
    const each = Math.floor(trueAvailable / categoryIds.length);
    const remainder = trueAvailable - each * categoryIds.length;
    const next: Record<string, number> = {};
    const raw: Record<string, string> = {};
    categoryIds.forEach((id, i) => {
      const v = i === 0 ? each + remainder : each;
      next[id] = v;
      raw[id] = v > 0 ? String(v) : "";
    });
    setAmounts(next);
    setInputRaw(raw);
  };

  const clearAll = () => {
    setAmounts(Object.fromEntries(categoryIds.map((id) => [id, 0])));
    setInputRaw(Object.fromEntries(categoryIds.map((id) => [id, ""])));
  };

  return (
    <div className={cn("card-metric", className)}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Funds allocator</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Add your own categories and simulate how you’d split your true available cash.
      </p>

      <div className="rounded-lg bg-secondary/50 px-4 py-3 flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">True available</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{formatCurrency(trueAvailable)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">This month&apos;s spending</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{formatCurrency(thisMonthSpending)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={distributeEqually}
            disabled={categoryIds.length === 0}
            className="rounded-lg"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            Split equally
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={categoryIds.length === 0}
            className="rounded-lg text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "rounded-lg px-4 py-2.5 flex items-center justify-between gap-2 mb-5 text-sm",
          isOver ? "bg-risk-muted text-risk" : "bg-safe-muted text-safe dark:bg-safe-muted dark:text-safe"
        )}
      >
        <span className="font-medium">
          {isOver ? "Over by " : "Remaining "}
          {formatCurrency(isOver ? totalAllocated - trueAvailable : remaining)}
        </span>
        <span className="font-medium tabular-nums">{formatCurrency(totalAllocated)} allocated</span>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.iconKey] ?? MoreHorizontal;
          const amount = amounts[cat.id] ?? 0;
          const raw = inputRaw[cat.id] ?? "";
          const pct = trueAvailable > 0 ? Math.min(100, (amount / trueAvailable) * 100) : 0;
          const allocPct = totalAllocated > 0 ? (amount / totalAllocated) * 100 : 0;
          const color = cat.color || ALLOCATOR_COLORS[0];
          return (
            <div key={cat.id} className="space-y-2 group">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground flex-1 min-w-0">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{cat.label}</span>
                </Label>
                <div className="flex items-center gap-2 shrink-0 min-w-[8rem]">
                  <span className="text-muted-foreground text-xs">€</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={raw}
                    onChange={(e) => setInput(cat.id, e.target.value)}
                    className="h-9 text-right font-mono text-sm max-w-[14rem]"
                    style={{ width: `calc(${Math.max(4, (raw || "0").length)}ch + 0.75rem)`, minWidth: "5rem" }}
                  />
                  {totalAllocated > 0 && amount > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {Math.round(allocPct)}%
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCategory(cat.id)}
                    aria-label={`Remove ${cat.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[pct]}
                onValueChange={([v]) => handleSliderChange(cat.id, v)}
                max={100}
                step={0.5}
                className="py-2"
              />
            </div>
          );
        })}

        {addOpen ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 w-full space-y-4">
            <div className="flex w-full gap-4 items-end">
              <div className="flex-1 min-w-0 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category name</Label>
                <Input
                  placeholder="e.g. Holiday, Equipment…"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="h-9 w-full"
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" size="sm" onClick={addCategory} className="rounded-lg">
                  Add
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setAddOpen(false); setNewLabel(""); }} className="rounded-lg">
                  Cancel
                </Button>
              </div>
            </div>
            <div className="w-full space-y-1.5">
              <Label className="text-xs text-muted-foreground block">Icon</Label>
              <div className="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-1.5 w-full">
                {ICON_KEYS.map((key) => {
                  const Icon = ICON_MAP[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewIconKey(key)}
                      className={cn(
                        "flex h-9 w-full min-w-0 items-center justify-center rounded-lg border transition-colors aspect-square",
                        newIconKey === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      )}
                      title={key}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full space-y-1.5">
              <Label className="text-xs text-muted-foreground block">Colour</Label>
              <div className="flex flex-wrap gap-2 w-full">
                {ALLOCATOR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-9 w-9 rounded-lg border-2 transition-all shrink-0",
                      newColor === c ? "border-foreground ring-2 ring-offset-2 ring-foreground/30" : "border-border hover:border-muted-foreground/50"
                    )}
                    style={{ backgroundColor: c }}
                    title="Category colour in list and bar"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-lg border-dashed py-5 gap-2 text-muted-foreground hover:text-foreground text-sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {categories.length === 0 ? "Add your first category" : "Add another category"}
          </Button>
        )}

        {totalAllocated > 0 && categories.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Allocation preview</p>
            <p className="text-xs text-muted-foreground mb-2">
              How your {formatCurrency(totalAllocated)} planned allocation is split across categories. Hover a segment to see the category.
            </p>
            <div className="relative">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
                {categories.map((cat) => {
                  const amount = amounts[cat.id] ?? 0;
                  const pct = totalAllocated > 0 ? (amount / totalAllocated) * 100 : 0;
                  if (pct <= 0) return null;
                  const backgroundColor = cat.color || ALLOCATOR_COLORS[0];
                  return (
                    <div
                      key={cat.id}
                      className="h-full transition-all duration-300 min-w-[2px] cursor-default"
                      style={{ width: `${pct}%`, backgroundColor }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setBarHover({
                          label: cat.label,
                          amount,
                          pct,
                          centerX: rect.left + rect.width / 2,
                          top: rect.top,
                        });
                      }}
                      onMouseLeave={() => setBarHover(null)}
                    />
                  );
                })}
              </div>
              {barHover && (
                <div
                  className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md font-medium whitespace-nowrap"
                  style={{
                    left: barHover.centerX,
                    top: barHover.top - 6,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div>{barHover.label}</div>
                  <div className="text-muted-foreground font-normal text-xs">
                    {formatCurrency(barHover.amount)} · {Math.round(barHover.pct)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
