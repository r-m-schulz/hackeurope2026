import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  TrendingUp,
  Receipt,
  Calendar,
  PieChart,
  PiggyBank,
  Sparkles,
  ArrowRight,
  Zap,
  Star,
} from "lucide-react";
import { LandingNav } from "@/components/LandingNav";

const features = [
  {
    icon: ShieldCheck,
    title: "True Available Cash",
    description:
      "See how much you can actually spend. We subtract tax reserves and upcoming recurring payments so your balance reflects reality.",
  },
  {
    icon: Receipt,
    title: "Tax Vault & Estimates",
    description:
      "Estimated VAT, Corp Tax, and PRSI in one place. Know what to set aside so tax time never catches you off guard.",
  },
  {
    icon: Calendar,
    title: "30-Day Cash Forecast",
    description:
      "Projected balance day by day based on recurring payments and no new income. Spot shortfalls before they happen.",
  },
  {
    icon: PieChart,
    title: "Expense Breakdown",
    description:
      "Understand where your money goes. Expenses by category with a clear view of subscriptions and tax.",
  },
  {
    icon: TrendingUp,
    title: "Cash Runway",
    description:
      "How many days until you'd run out of cash at current burn? We show you a simple runway so you can plan.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description:
      "Plain-language insights on your cash flow, shortfall risk, and tax liability so you can act with confidence.",
  },
];

const stats = [
  { value: "€0", label: "Hidden in your balance" },
  { value: "30", label: "Day cash forecast" },
  { value: "3x", label: "Tax obligations tracked" },
];

export default function Landing() {
  useEffect(() => {
    const prev = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#0a0a0a";
    return () => { document.documentElement.style.backgroundColor = prev; };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0a0a0a", color: "#ffffff" }}>
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* NVIDIA green glow blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute top-[-100px] left-1/3 w-[700px] h-[500px] rounded-full blur-[120px] opacity-30"
            style={{ background: "radial-gradient(circle, #76b900 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: "radial-gradient(circle, #76b900 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
              style={{
                border: "1px solid rgba(118,185,0,0.4)",
                background: "rgba(118,185,0,0.08)",
                color: "#76b900",
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>AI-powered financial clarity</span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              style={{ color: "#ffffff" }}
            >
              Your bank balance{" "}
              <span style={{ color: "#76b900" }}>lies.</span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.55)" }}>
                We show the{" "}
              </span>
              <span style={{ color: "#76b900" }}>truth.</span>
            </h1>

            <p
              className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              TrueBalance shows your real available cash after tax reserves and
              recurring payments — so you're never surprised by the numbers.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/login" state={{ tab: "signup" }}>
                <button
                  className="flex items-center gap-2 text-base font-bold px-8 h-12 rounded-lg transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "#76b900",
                    color: "#0a0a0a",
                    boxShadow: "0 0 24px rgba(118,185,0,0.4)",
                  }}
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link to="/login">
                <button
                  className="flex items-center gap-2 text-base font-semibold px-8 h-12 rounded-lg transition-all duration-200 hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#ffffff",
                    background: "transparent",
                  }}
                >
                  Log in
                </button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-black" style={{ color: "#76b900" }}>
                    {value}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(118,185,0,0.3), transparent)" }}
        />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-24 sm:py-32 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
              style={{
                border: "1px solid rgba(118,185,0,0.3)",
                background: "rgba(118,185,0,0.06)",
                color: "#76b900",
              }}
            >
              <Star className="h-3.5 w-3.5" />
              <span>Everything in one dashboard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ color: "#ffffff" }}>
              Stay on top of your{" "}
              <span style={{ color: "#76b900" }}>cash flow</span>
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Built for SMEs and individuals who want clarity, not just a balance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(118,185,0,0.15)",
                  boxShadow: "inset 0 1px 0 rgba(118,185,0,0.05)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(118,185,0,0.45)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(118,185,0,0.12), inset 0 1px 0 rgba(118,185,0,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(118,185,0,0.15)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "inset 0 1px 0 rgba(118,185,0,0.05)";
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: "rgba(118,185,0,0.1)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#76b900" }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "#ffffff" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link to="/login" state={{ tab: "signup" }}>
              <button
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg font-bold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95"
                style={{
                  background: "#76b900",
                  color: "#0a0a0a",
                  boxShadow: "0 0 24px rgba(118,185,0,0.35)",
                }}
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(118,185,0,0.3), transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(118,185,0,0.3), transparent)" }}
        />
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-20"
            style={{ background: "radial-gradient(circle, #76b900 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
            style={{
              border: "1px solid rgba(118,185,0,0.4)",
              background: "rgba(118,185,0,0.08)",
              color: "#76b900",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start for free, no credit card needed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4" style={{ color: "#ffffff" }}>
            Ready to see the{" "}
            <span style={{ color: "#76b900" }}>truth?</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Connect your data and get your true cash view in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" state={{ tab: "signup" }}>
              <button
                className="inline-flex items-center gap-2 w-full sm:w-auto h-12 px-8 rounded-lg font-bold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95"
                style={{
                  background: "#76b900",
                  color: "#0a0a0a",
                  boxShadow: "0 0 28px rgba(118,185,0,0.4)",
                }}
              >
                Sign up — it's free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/login">
              <button
                className="inline-flex items-center gap-2 w-full sm:w-auto h-12 px-8 rounded-lg font-semibold text-base transition-all duration-200 hover:bg-white/10"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#ffffff",
                  background: "transparent",
                }}
              >
                Log in
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#76b900" }}
            >
              <PiggyBank className="h-4 w-4" style={{ color: "#0a0a0a" }} />
            </div>
            <span className="font-semibold" style={{ color: "#ffffff" }}>TrueBalance</span>
          </Link>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
