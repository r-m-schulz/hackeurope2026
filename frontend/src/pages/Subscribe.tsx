import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PiggyBank, Check, Zap, BrainCircuit, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { getToken, isLoggedIn } from "@/lib/auth";
import { toast } from "sonner";

const proFeatures = [
  { icon: BrainCircuit, label: "AI/CFO insights", desc: "Personalised financial analysis powered by AI" },
  { icon: Zap, label: "Smart savings tips", desc: "Actionable ways to cut costs and grow runway" },
];

const freeFeatures = [
  "Dashboard KPIs (balance, tax reserve, true available)",
  "Transaction history",
  "Subscriptions tracker",
  "Cash runway indicator",
];

export default function Subscribe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (!isLoggedIn()) {
      navigate("/login", { state: { tab: "signup" } });
      return;
    }

    const token = getToken()!;
    setLoading(true);
    try {
      const { url } = await api.stripe.createCheckoutSession(token, window.location.origin);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-black/6 dark:border-white/6 bg-white/70 dark:bg-black/40 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-75">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#76b900]">
            <PiggyBank className="h-4 w-4 text-[#0a0a0a]" />
          </div>
          <span className="font-bold text-[#0a0a0a] dark:text-white tracking-tight">TrueBalance</span>
        </Link>
        {isLoggedIn() ? (
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to dashboard
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-[#76b900] hover:brightness-110 transition-all">
            Log in
          </Link>
        )}
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border border-[#76b900]/40 bg-[#76b900]/10 text-[#76b900]">
          <Zap className="h-3 w-3" />
          <span>Upgrade to Pro</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] text-[#0a0a0a] dark:text-white mb-4 max-w-xl">
          Unlock the full picture of your finances
        </h1>
        <p className="text-base text-[#0a0a0a]/50 dark:text-white/45 max-w-md mb-12">
          Pro gives you AI-powered insights and a 30-day cash forecast — so you always know what's coming.
        </p>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mb-12">
          {/* Free */}
          <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#111] p-6 text-left">
            <p className="text-xs font-semibold text-[#0a0a0a]/40 dark:text-white/35 uppercase tracking-widest mb-1">Free</p>
            <p className="text-3xl font-black text-[#0a0a0a] dark:text-white mb-1">€0</p>
            <p className="text-xs text-[#0a0a0a]/38 dark:text-white/32 mb-5">forever</p>
            <ul className="space-y-2.5">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#0a0a0a]/65 dark:text-white/55">
                  <Check className="h-4 w-4 text-[#76b900] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl border border-[#76b900]/50 bg-white dark:bg-[#111] p-6 text-left relative overflow-hidden"
            style={{ boxShadow: "0 0 40px rgba(118,185,0,0.12)" }}
          >
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#76b900] text-[#0a0a0a]">
              RECOMMENDED
            </div>
            <p className="text-xs font-semibold text-[#76b900] uppercase tracking-widest mb-1">Pro</p>
            <p className="text-3xl font-black text-[#0a0a0a] dark:text-white mb-1">€9</p>
            <p className="text-xs text-[#0a0a0a]/38 dark:text-white/32 mb-5">per month</p>
            <ul className="space-y-3 mb-6">
              <li className="text-xs font-semibold text-[#0a0a0a]/40 dark:text-white/35 uppercase tracking-widest">
                Everything in Free, plus:
              </li>
              {proFeatures.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="h-4 w-4 text-[#76b900] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-[#0a0a0a] dark:text-white">{label}</span>
                    <p className="text-xs text-[#0a0a0a]/45 dark:text-white/38">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-55 disabled:cursor-not-allowed bg-[#76b900] text-[#0a0a0a]"
              style={{ boxShadow: loading ? "none" : "0 0 22px rgba(118,185,0,0.28)" }}
            >
              {loading ? (
                <>
                  <span className="w-[15px] h-[15px] border-2 border-[#0a0a0a]/25 border-t-[#0a0a0a] rounded-full animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-[#0a0a0a]/28 dark:text-white/22">
          Powered by Stripe · Cancel anytime · Test card: 4242 4242 4242 4242
        </p>
      </div>
    </div>
  );
}
