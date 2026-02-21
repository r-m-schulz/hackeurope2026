import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveAuth } from "@/lib/auth";
import type { UserType } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: "login" | "signup" } | null)?.tab === "signup" ? "signup" : "login";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">TrueBalance</h1>
          <p className="text-sm text-muted-foreground mt-1">Your bank balance lies. We show the truth.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {tab === "signup" && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">I am a...</label>
                <div className="flex gap-3">
                  {(["sme", "individual"] as UserType[]).map((type) => (
                    <label
                      key={type}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                        userType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_type"
                        value={type}
                        checked={userType === type}
                        onChange={() => setUserType(type)}
                        className="sr-only"
                      />
                      {type === "sme" ? "Business (SME)" : "Individual"}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-risk bg-risk-muted px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Please wait..." : tab === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
