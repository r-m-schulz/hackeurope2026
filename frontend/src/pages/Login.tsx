import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { saveAuth, saveProStatus } from "@/lib/auth";
import { api } from "@/lib/api";
import type { UserType } from "@/lib/api";
import {
  Eye,
  EyeOff,
  ArrowRight,
  PiggyBank,
  Building2,
  User,
  CheckCircle,
  Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const sideStats = [
  { value: "€0", label: "Surprise tax bills" },
  { value: "30d", label: "Cash forecast" },
  { value: "100%", label: "Financial clarity" },
];

const sideBullets = [
  "True available cash after all obligations",
  "Tax vault with real-time estimates",
  "30-day cash runway forecast",
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: "login" | "signup" } | null)?.tab === "signup"
      ? "signup"
      : "login";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>("sme");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/signup";
      const body: Record<string, string> = { email, password };
      if (tab === "signup") body.user_type = userType;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      saveAuth(data.access_token, data.user_type);

      // Fetch and cache subscription status
      try {
        const status = await api.stripe.subscriptionStatus(data.access_token);
        saveProStatus(status.isPro);
      } catch {
        saveProStatus(false);
      }

      navigate(tab === "signup" ? "/setup" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: "login" | "signup") {
    setTab(t);
    setError("");
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-[#0d0d0d]">
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-[600px] h-[500px] rounded-full blur-[130px] opacity-[0.22] bg-[#76b900]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[350px] rounded-full blur-[110px] opacity-[0.12] bg-[#76b900]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#76b900]">
            <PiggyBank className="h-5 w-5 text-[#0a0a0a]" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            TrueBalance
          </span>
        </div>

        {/* Main content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-8 border border-[#76b900]/40 bg-[#76b900]/10 text-[#76b900]">
            <Zap className="h-3 w-3" />
            <span>AI-powered financial clarity</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight leading-[1.08] text-white mb-5">
            Your bank balance{" "}
            <span className="text-[#76b900]">lies.</span>
            <br />
            We show the{" "}
            <span className="text-[#76b900]">truth.</span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed mb-12 max-w-sm">
            See your real available cash after tax reserves and recurring
            payments — so you're never caught off guard.
          </p>

          {/* Stats */}
          <div className="flex gap-10 mb-12">
            {sideStats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-black text-[#76b900]">{value}</div>
                <div className="text-xs text-white/35 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Bullets */}
          <div className="space-y-3">
            {sideBullets.map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-[#76b900] shrink-0" />
                <span className="text-sm text-white/55">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <div className="h-px bg-gradient-to-r from-[#76b900]/40 via-[#76b900]/60 to-transparent mb-5" />
          <p className="text-xs text-white/25">
            © 2026 TrueBalance · Built for HackEurope
          </p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-0">
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 mb-8 lg:hidden transition-opacity hover:opacity-75"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#76b900]">
              <PiggyBank className="h-4 w-4 text-[#0a0a0a]" />
            </div>
            <span className="font-bold text-[#0a0a0a] dark:text-white tracking-tight">
              TrueBalance
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-black tracking-tight text-[#0a0a0a] dark:text-white mb-1.5">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-[#0a0a0a]/45 dark:text-white/40">
              {tab === "login"
                ? "Sign in to see your true cash position."
                : "Start seeing the truth behind your balance."}
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6 bg-white dark:bg-[#111111] border border-[#0a0a0a]/8 dark:border-white/8"
            style={{
              boxShadow:
                "0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(118,185,0,0.05)",
            }}
          >
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] p-1 mb-6 gap-1">
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t
                      ? "bg-white dark:bg-[#252525] text-[#0a0a0a] dark:text-white shadow-sm"
                      : "text-[#0a0a0a]/38 dark:text-white/30 hover:text-[#0a0a0a]/65 dark:hover:text-white/60"
                    }`}
                >
                  {t === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-[#0a0a0a]/50 dark:text-white/45 uppercase tracking-widest block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#0a0a0a]/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-white text-sm placeholder:text-[#0a0a0a]/28 dark:placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-[#76b900]/55 focus:border-[#76b900]/55 transition-all duration-150"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold text-[#0a0a0a]/50 dark:text-white/45 uppercase tracking-widest block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#0a0a0a]/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-white text-sm placeholder:text-[#0a0a0a]/28 dark:placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-[#76b900]/55 focus:border-[#76b900]/55 transition-all duration-150"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/30 dark:text-white/25 hover:text-[#0a0a0a]/60 dark:hover:text-white/55 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Account type — signup only */}
              {tab === "signup" && (
                <div>
                  <label className="text-[11px] font-semibold text-[#0a0a0a]/50 dark:text-white/45 uppercase tracking-widest block mb-2">
                    Account type
                  </label>
                  <div className="flex gap-2.5">
                    {(
                      [
                        {
                          value: "sme" as UserType,
                          label: "Business",
                          sub: "SME / Ltd",
                          Icon: Building2,
                        },
                        {
                          value: "individual" as UserType,
                          label: "Personal",
                          sub: "Individual",
                          Icon: User,
                        },
                      ] as const
                    ).map(({ value, label, sub, Icon }) => (
                      <label
                        key={value}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border cursor-pointer transition-all duration-150 ${userType === value
                            ? "border-[#76b900]/65 bg-[#76b900]/10 text-[#76b900]"
                            : "border-[#0a0a0a]/10 dark:border-white/10 text-[#0a0a0a]/35 dark:text-white/30 hover:border-[#76b900]/35"
                          }`}
                      >
                        <input
                          type="radio"
                          name="user_type"
                          value={value}
                          checked={userType === value}
                          onChange={() => setUserType(value)}
                          className="sr-only"
                        />
                        <Icon
                          className={`h-[18px] w-[18px] ${userType === value
                              ? "text-[#76b900]"
                              : "text-[#0a0a0a]/30 dark:text-white/25"
                            }`}
                        />
                        <span className="text-xs font-semibold leading-none">
                          {label}
                        </span>
                        <span
                          className={`text-[10px] leading-none ${userType === value
                              ? "text-[#76b900]/65"
                              : "text-[#0a0a0a]/28 dark:text-white/22"
                            }`}
                        >
                          {sub}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-55 disabled:cursor-not-allowed bg-[#76b900] text-[#0a0a0a] mt-1"
                style={{
                  boxShadow: loading ? "none" : "0 0 22px rgba(118,185,0,0.28)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-[15px] h-[15px] border-2 border-[#0a0a0a]/25 border-t-[#0a0a0a] rounded-full animate-spin" />
                    Please wait…
                  </span>
                ) : tab === "login" ? (
                  <span className="flex items-center justify-center gap-2">
                    Log in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Switch tab link */}
          <p className="text-center text-sm text-[#0a0a0a]/38 dark:text-white/32 mt-5">
            {tab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("signup")}
                  className="text-[#76b900] font-semibold hover:brightness-110 transition-all"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-[#76b900] font-semibold hover:brightness-110 transition-all"
                >
                  Log in
                </button>
              </>
            )}
          </p>

          {tab === "signup" && (
            <p className="text-center text-xs text-[#0a0a0a]/28 dark:text-white/22 mt-2.5">
              No credit card required · Free to use
            </p>
          )}

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-xs text-[#0a0a0a]/28 dark:text-white/22 hover:text-[#76b900] transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
