import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  buildAffordabilitySummary,
  extractPriceFromMessage,
} from "@/utils/buildAffordabilityPrompt";
import { parseAIResponse } from "@/utils/parseAIResponse";
import type { AffordabilityAdvisorResponse } from "@/lib/types";
import type { AffordabilityInput } from "@/utils/buildAffordabilityPrompt";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  role: MessageRole;
  content: string;
  result?: AffordabilityAdvisorResponse | null;
  isFollowUpPrompt?: boolean;
}

interface AffordabilityAdvisorProps {
  open: boolean;
  onClose: () => void;
  /** Current financial data for context */
  input: AffordabilityInput;
  /** Pre-filled query to auto-submit when the panel opens */
  initialQuery?: string;
  /** Called after the initial query has been consumed so the parent can clear it */
  onInitialQueryConsumed?: () => void;
}

export function AffordabilityAdvisor({
  open,
  onClose,
  input,
  initialQuery,
  onInitialQueryConsumed,
}: AffordabilityAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages]);

  const financialSummary = buildAffordabilitySummary(input);
  const trueAvailableNegative = financialSummary.trueAvailableCash < 0;
  const forecastLowestNegative = financialSummary.forecastLowestPoint30Days < 0;

  async function sendMessage(question: string) {
    if (!question || loading) return;

    const priceExtracted = extractPriceFromMessage(question);

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInputValue("");
    setError(null);
    setLoading(true);

    const options = {
      priceExtracted: priceExtracted ?? undefined,
      priceAboveTrueAvailable:
        priceExtracted != null
          ? priceExtracted > financialSummary.trueAvailableCash
          : undefined,
      trueAvailableNegative,
      forecastLowestNegative,
    };

    try {
      const token = getToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      let res: Awaited<ReturnType<typeof api.cfo.affordability>>;
      try {
        res = await api.cfo.affordability({ question, financialSummary, options }, token);
      } catch (firstErr) {
        // Retry once on 502 (AI JSON parse failure / cold-start)
        if (firstErr instanceof Error && firstErr.message.includes("502")) {
          await new Promise((r) => setTimeout(r, 800));
          res = await api.cfo.affordability({ question, financialSummary, options }, token);
        } else {
          throw firstErr;
        }
      }
      const parsed = parseAIResponse(res) ?? {
        verdict: "RISKY" as const,
        confidence: 50,
        reasoning: "Unable to parse response.",
        impact_summary: "",
        risk_level: "MEDIUM" as const,
        estimated_purchase_cost: null,
        estimated_monthly_cost: null,
      };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: parsed.reasoning, result: parsed },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
          result: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit when the panel opens with a pre-filled query
  useEffect(() => {
    if (open && initialQuery) {
      sendMessage(initialQuery);
      onInitialQueryConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = inputValue.trim();
    await sendMessage(question);
  }

  function handleRetry() {
    setError(null);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setInputValue(lastUser.content);
    }
  }

  const verdictStyles = {
    AFFORD: "bg-safe text-safe-foreground border-safe",
    RISKY: "bg-warning-muted text-warning-foreground border-warning",
    CANNOT_AFFORD: "bg-risk-muted text-risk-foreground border-risk",
  };

  const riskStyles = {
    LOW: "bg-safe-muted text-safe",
    MEDIUM: "bg-warning-muted text-warning",
    HIGH: "bg-risk-muted text-risk",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[400px] max-w-[100vw] bg-card border-l border-border shadow-2xl rounded-l-2xl flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Affordability Advisor</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        >
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask whether you can afford anything — a purchase, a pet, a vehicle. Include a price if you know it, or let the advisor estimate it for you.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.role === "assistant" && msg.result && (
                  <div className="space-y-3 mb-3">
                    <div
                      className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border",
                        verdictStyles[msg.result.verdict]
                      )}
                    >
                      {msg.result.verdict.replace(/_/g, " ")}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        Confidence: {msg.result.confidence}%
                      </p>
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium",
                          riskStyles[msg.result.risk_level]
                        )}
                      >
                        Risk: {msg.result.risk_level}
                      </span>
                    </div>
                    {(msg.result.estimated_purchase_cost != null || msg.result.estimated_monthly_cost != null) && (
                      <div className="rounded-lg bg-background border border-border px-3 py-2 space-y-1">
                        {msg.result.estimated_purchase_cost != null && msg.result.estimated_purchase_cost > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Est. purchase cost</span>
                            <span className="font-mono font-medium">
                              €{msg.result.estimated_purchase_cost.toLocaleString("en-IE")}
                            </span>
                          </div>
                        )}
                        {msg.result.estimated_monthly_cost != null && msg.result.estimated_monthly_cost > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Est. monthly cost</span>
                            <span className="font-mono font-medium">
                              €{msg.result.estimated_monthly_cost.toLocaleString("en-IE")}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.result.impact_summary && (
                      <p className="text-xs font-medium text-foreground">
                        {msg.result.impact_summary}
                      </p>
                    )}
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing…</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-border shrink-0 flex gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Can I afford a dog? or Can I afford €1,200 laptop?"
            className="rounded-xl flex-1"
            disabled={loading}
            aria-label="Ask affordability question"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 rounded-xl h-10 w-10"
            disabled={loading || !inputValue.trim()}
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
