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
  // Set html bg to match so overscroll reveals the same colour, not white
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const bg = isDark ? "#0a0a0a" : "#f5f5f5";
    const prev = root.style.backgroundColor;
    root.style.backgroundColor = bg;

    // Watch for theme changes while on this page
    const observer = new MutationObserver(() => {
      root.style.backgroundColor = root.classList.contains("dark") ? "#0a0a0a" : "#f5f5f5";
    });
    observer.observe(root, { attributeFilter: ["class"] });

    return () => {
      root.style.backgroundColor = prev;
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-white">
      <LandingNav />

      {/* Hero – green gradient glow (dynamic on landing, like sign-in left panel) */}
      <section className="relative overflow-hidden">
        {/* Glow layer: z-0 so it’s above section background; content is z-10 so text stays on top */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute -top-24 left-1/4 w-[600px] h-[500px] rounded-full blur-[130px] bg-[#76b900] opacity-[0.42] dark:opacity-30 animate-glow-float"
            aria-hidden
          />
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full blur-[110px] bg-[#76b900] opacity-[0.28] dark:opacity-20 animate-glow-float-alt"
            aria-hidden
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[350px] rounded-full blur-[100px] bg-[#76b900] opacity-[0.2] dark:opacity-15 animate-glow-float"
            style={{ animationDelay: "-4s" }}
            aria-hidden
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-[#76b900]/40 bg-[#76b900]/10 text-[#5a8d00] dark:text-[#76b900]">
              <Zap className="h-3.5 w-3.5" />
              <span>AI-powered financial clarity</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-[#0a0a0a] dark:text-white">
              Your bank balance{" "}
              <span className="text-[#76b900]">lies.</span>
              <br />
              <span className="text-[#0a0a0a]/50 dark:text-white/55">We show the </span>
              <span className="text-[#76b900]">truth.</span>
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 text-[#0a0a0a]/60 dark:text-white/60">
              PocketCFO shows your real available cash after tax reserves and
              recurring payments. So you're never surprised by the numbers.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/login" state={{ tab: "signup" }}>
                <button
                  className="flex items-center gap-2 text-base font-bold px-8 h-12 rounded-lg transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 bg-[#76b900] text-[#0a0a0a]"
                  style={{ boxShadow: "0 0 24px rgba(118,185,0,0.35)" }}
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link to="/login">
                <button className="flex items-center gap-2 text-base font-semibold px-8 h-12 rounded-lg transition-all duration-200 border border-[#0a0a0a]/20 dark:border-white/20 text-[#0a0a0a] dark:text-white hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10">
                  Log in
                </button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-black text-[#76b900]">{value}</div>
                  <div className="text-sm mt-0.5 text-[#0a0a0a]/45 dark:text-white/45">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/30 to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-24 sm:py-32 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-[#76b900]/30 bg-[#76b900]/8 text-[#5a8d00] dark:text-[#76b900]">
              <Star className="h-3.5 w-3.5" />
              <span>Everything in one dashboard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0a0a0a] dark:text-white">
              Stay on top of your{" "}
              <span className="text-[#76b900]">cash flow</span>
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto text-[#0a0a0a]/55 dark:text-white/50">
              Built for SMEs and individuals who want clarity, not just a balance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-[#111111] border border-[#76b900]/15 hover:border-[#76b900]/45"
                style={{ boxShadow: "inset 0 1px 0 rgba(118,185,0,0.05)" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110 bg-[#76b900]/10">
                  <Icon className="h-5 w-5 text-[#76b900]" />
                </div>
                <h3 className="text-base font-bold mb-2 text-[#0a0a0a] dark:text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-[#0a0a0a]/55 dark:text-white/50">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link to="/login" state={{ tab: "signup" }}>
              <button
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg font-bold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 bg-[#76b900] text-[#0a0a0a]"
                style={{ boxShadow: "0 0 24px rgba(118,185,0,0.3)" }}
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
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/30 to-transparent" />
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-10 dark:opacity-20 bg-[#76b900]" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-[#76b900]/40 bg-[#76b900]/10 text-[#5a8d00] dark:text-[#76b900]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start for free, no credit card needed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-[#0a0a0a] dark:text-white">
            Ready to see the{" "}
            <span className="text-[#76b900]">truth?</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto text-[#0a0a0a]/55 dark:text-white/50">
            Connect your data and get your true cash view in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" state={{ tab: "signup" }}>
              <button
                className="inline-flex items-center gap-2 w-full sm:w-auto h-12 px-8 rounded-lg font-bold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 bg-[#76b900] text-[#0a0a0a]"
                style={{ boxShadow: "0 0 28px rgba(118,185,0,0.35)" }}
              >
                Sign up — it's free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/login">
              <button className="inline-flex items-center gap-2 w-full sm:w-auto h-12 px-8 rounded-lg font-semibold text-base transition-all duration-200 border border-[#0a0a0a]/20 dark:border-white/20 text-[#0a0a0a] dark:text-white hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10">
                Log in
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#0a0a0a]/10 dark:border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#76b900]">
              <PiggyBank className="h-4 w-4 text-[#0a0a0a]" />
            </div>
            <span className="font-semibold text-[#0a0a0a] dark:text-white">PocketCFO</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#0a0a0a]/45 dark:text-white/40">
            <Link to="/#features" className="hover:text-[#76b900] transition-colors">Features</Link>
            <Link to="/about" className="hover:text-[#76b900] transition-colors">About</Link>
            <Link to="/login" className="hover:text-[#76b900] transition-colors">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
