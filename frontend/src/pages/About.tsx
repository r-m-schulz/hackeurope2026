import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  BrainCircuit,
  TrendingDown,
  BarChart3,
  CalendarClock,
  ShieldCheck,
  Zap,
  Rocket,
  Building2,
  User,
  RefreshCw,
  Landmark,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "True Available Cash",
    description:
      "Your bank balance minus tax reserves, upcoming recurring payments, and committed spend. The number that actually matters.",
  },
  {
    icon: BarChart3,
    title: "30-Day Cash Forecast",
    description:
      "A day-by-day projection of your balance based on detected recurring payments, manual subscriptions, and estimated tax deductions.",
  },
  {
    icon: CalendarClock,
    title: "Cash Runway",
    description:
      "How many days (and months) you can operate at your current burn rate. Critical for startups; essential for every business.",
  },
  {
    icon: BrainCircuit,
    title: "AI Affordability Advisor",
    description:
      "Ask anything: \"Can I afford a €4k/month engineer?\" or \"Can I buy a MacBook Pro?\" The AI factors in your real cash position and gives a verdict with reasoning.",
  },
  {
    icon: Lightbulb,
    title: "AI CFO Insights",
    description:
      "4–6 AI-generated financial insights refreshed per session, covering burn rate, income stability, tax reserve adequacy, forecast risk, and working capital health.",
  },
  {
    icon: TrendingDown,
    title: "Savings & Optimisations",
    description:
      "Rule-based suggestions to reduce costs: duplicate subscriptions, annual billing, tax deductions, R&D credits, cloud startup programmes, KEEP equity options, and more.",
  },
  {
    icon: RefreshCw,
    title: "Recurring Payment Detection",
    description:
      "Automatically identifies recurring charges from your transaction history. Add manual subscriptions too; everything is factored into your forecast.",
  },
  {
    icon: Landmark,
    title: "Tax Vault",
    description:
      "Real-time estimate of your VAT, corporation tax, income tax, USC, and PRSI liability. Know exactly how much to ring-fence before it's due.",
  },
  {
    icon: MessageSquare,
    title: "Ask PocketCFO",
    description:
      "A persistent AI chat always one click away. Ask about hiring, runway, funding rounds, equity, or anything financial, grounded in your live data.",
  },
];

const USER_TYPES = [
  {
    icon: Building2,
    label: "SMEs",
    tagline: "Cash flow clarity for established businesses",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    points: [
      "True available cash after VAT and corp tax reserves",
      "30-day forecast accounting for payroll and recurring costs",
      "Rule-based savings: subscriptions, annual billing, deductions",
      "Bank connection via Plaid for live transaction data",
      "AI insights on cash flow health and expense concentration",
    ],
  },
  {
    icon: Rocket,
    label: "Startups",
    tagline: "Runway-first financial intelligence for founders",
    color: "text-[#76b900]",
    bg: "bg-[#76b900]/10",
    highlight: true,
    points: [
      "Runway in months at current burn, always visible",
      "Default alive / default dead assessment",
      "Burn rate vs MRR trend and net cash position",
      "Startup-specific savings: AWS/GCP/Azure credits, R&D Tax Credit (25%), SURE/EIIS relief",
      "KEEP share options guidance for equity-efficient hiring",
      "Enterprise Ireland & IDA grant awareness",
      "AI advisor understands fundraising, hiring burn impact, and investor runway",
    ],
  },
  {
    icon: User,
    label: "Individuals",
    tagline: "Personal finance without the guesswork",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    points: [
      "True spendable cash after income tax, USC, and PRSI",
      "Upcoming bills and subscriptions in one place",
      "AI affordability check before any big purchase",
      "Expense breakdown to spot where money actually goes",
      "Flat-rate expense claims and professional development deductions",
    ],
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Sign up & choose your type",
    description: "Create an account and select SME, Startup, or Individual. Everything is tailored from the start.",
  },
  {
    step: "2",
    title: "Connect your bank or set a balance",
    description: "Link your bank via Plaid for live transactions, or manually set your current balance to get started immediately.",
  },
  {
    step: "3",
    title: "Add recurring payments",
    description: "Subscriptions and recurring costs are auto-detected. Add any manual ones to ensure complete forecast accuracy.",
  },
  {
    step: "4",
    title: "Get your full picture",
    description: "Your dashboard updates instantly: true available cash, runway, 30-day forecast, tax reserve, AI insights, and savings suggestions.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border border-[#76b900]/40 bg-[#76b900]/10 text-[#76b900]">
          <Zap className="h-3 w-3" />
          Built for HackEurope 2026
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-5">
          About PocketCFO
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Your bank balance is a lie. It doesn't account for tax reserves, upcoming bills, or
          recurring commitments. PocketCFO gives startups, SMEs, and individuals the number that
          actually matters: your <strong className="text-foreground">true available cash</strong>.
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-border bg-card/60 p-8 flex gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#76b900]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="h-6 w-6 text-[#76b900]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Our mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To give founders, business owners, and individuals a clear, honest view of their cash
              position in real time, with no accountant required. We combine balance, tax
              estimates, recurring payments, AI analysis, and forecasts so you can make decisions
              with confidence and avoid surprises. Whether you're watching runway burn or planning
              a hire, PocketCFO gives you the data your bank doesn't.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Built for three kinds of users</h2>
        <p className="text-muted-foreground text-center mb-10">
          One platform. Three tailored experiences.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USER_TYPES.map(({ icon: Icon, label, tagline, color, bg, highlight, points }) => (
            <div
              key={label}
              className={`rounded-2xl border p-6 flex flex-col gap-4 ${
                highlight
                  ? "border-[#76b900]/40 bg-[#76b900]/5"
                  : "border-border bg-card/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${color}`}>{label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{tagline}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Everything in one place</h2>
        <p className="text-muted-foreground text-center mb-10">
          Every feature is built around one question: <em>what can I actually afford right now?</em>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-border bg-card/60 p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="h-4.5 w-4.5 text-primary h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">How it works</h2>
        <p className="text-muted-foreground text-center mb-10">Up and running in under two minutes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {HOW_IT_WORKS.map(({ step, title, description }) => (
            <div key={step} className="rounded-xl border border-border bg-card/60 p-5 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-[#76b900]/15 text-[#76b900] font-black text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Built at HackEurope */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-border bg-card/60 p-8 flex gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Built at HackEurope 2026</h2>
            <p className="text-muted-foreground leading-relaxed">
              PocketCFO was built in a hackathon sprint with a focus on real cash visibility,
              usability, and AI-driven intelligence. The product uses Groq's LLM API for
              sub-second AI responses, Plaid for live bank data, and Supabase for secure
              user management. Every feature was designed to be immediately useful, with no setup
              required beyond your balance. If you have feedback, we'd love to hear it.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Ready to see your real cash position?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Free to get started. No credit card. Works for startups, SMEs, and individuals.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button variant="outline" size="lg">Back to home</Button>
          </Link>
          <Link to="/login" state={{ tab: "signup" }}>
            <Button size="lg" className="gap-2 bg-[#76b900] hover:bg-[#5c8f00] text-[#0a0a0a] font-bold">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      </motion.div>
    </div>
  );
}
