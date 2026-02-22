import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { PocketCFOLogo } from "@/components/PocketCFOLogo";

export function DashboardHeader() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PocketCFOLogo size={36} className="text-foreground" />
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">PocketCFO</h1>
            <p className="text-xs text-muted-foreground">Your bank balance lies. We show the truth.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-safe-muted text-safe">
            ● Live
          </span>
        </div>
      </div>
    </header>
  );
}
