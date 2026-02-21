import { useState, useEffect, useCallback } from "react";
import { Command, BrainCircuit } from "lucide-react";
import { CFOConsolePanel } from "@/components/CFOConsolePanel";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { AppData } from "@/lib/types";
import type { CFOQueryResponse } from "@/lib/types";

interface CFOCommandBarProps {
  appData: AppData;
  userType: "sme" | "individual";
  onOpenAdvisor?: () => void;
}

export function CFOCommandBar({ appData, userType, onOpenAdvisor }: CFOCommandBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [lastResult, setLastResult] = useState<CFOQueryResponse | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const token = getToken();

  const handleQuery = useCallback(
    async (queryText: string): Promise<CFOQueryResponse | null> => {
      if (!token) return null;
      setLastQuery(queryText);
      setLoading(true);
      try {
        const res = await api.cfo.query(
          {
            queryText,
            appDataSnapshot: appData,
            userSettings: {},
          },
          token
        );
        setLastResult(res);
        return res;
      } catch {
        setLastResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, appData]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4">
      {/* Slim pill – always visible */}
      <div className="w-full flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          onFocus={() => setExpanded(true)}
          className="flex-1 flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 text-left"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <Command className="h-4 w-4" />
          </span>
          <span className="text-sm text-muted-foreground flex-1">
            Ask your CFO… e.g. &quot;Can I afford €2500/month hire?&quot;
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        {onOpenAdvisor && (
          <button
            type="button"
            onClick={onOpenAdvisor}
            className="flex items-center gap-2 px-4 py-3 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all duration-200 text-sm font-medium whitespace-nowrap shadow-sm"
          >
            <BrainCircuit className="h-4 w-4" />
            Affordability Advisor
          </button>
        )}
      </div>

      {/* Expanded CFO Console – in place, not modal */}
      {expanded && (
        <div className="w-full">
          <CFOConsolePanel
            appData={appData}
            onQuery={handleQuery}
            lastResult={lastResult}
            lastQuery={lastQuery}
            loading={loading}
            onClose={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}
