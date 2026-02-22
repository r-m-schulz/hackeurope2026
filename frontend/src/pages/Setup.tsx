import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getUserType } from "@/lib/auth";
import { api } from "@/lib/api";
import { usePlaidLink } from "react-plaid-link";
import { PocketCFOLogo } from "@/components/PocketCFOLogo";
import {
    Landmark,
    PenLine,
    ArrowRight,
    ShieldCheck,
    ChevronRight,
    X,
    Lock,
    Zap,
    PiggyBank,
} from "lucide-react";
import { toast } from "sonner";

type Step = "choose" | "bank-connect" | "manual-form";

export default function Setup() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("choose");

    // Plaid state
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [fetchingToken, setFetchingToken] = useState(false);
    const [exchanging, setExchanging] = useState(false);

    // Manual form state
    const [balance, setBalance] = useState("");
    const [monthlyIncome, setMonthlyIncome] = useState("");
    const [monthlyExpenses, setMonthlyExpenses] = useState("");
    const [saving, setSaving] = useState(false);

    // Fetch a Plaid link token when the user enters the bank-connect step
    useEffect(() => {
        if (step !== "bank-connect") return;
        const token = getToken();
        if (!token) return;
        setFetchingToken(true);
        api.plaid
            .createLinkToken(token)
            .then((data) => setLinkToken(data.link_token))
            .catch(() => toast.error("Couldn't start bank connection. Please try again."))
            .finally(() => setFetchingToken(false));
    }, [step]);

    const { open: openPlaid, ready: plaidReady } = usePlaidLink({
        token: linkToken,
        onSuccess: async (publicToken) => {
            const token = getToken();
            if (!token) return;
            setExchanging(true);
            try {
                await api.plaid.exchangeToken(publicToken, token);
                toast.success("Bank connected successfully!");
                navigate("/");
            } catch {
                toast.error("Couldn't save bank connection. Please try again.");
            } finally {
                setExchanging(false);
            }
        },
    });

    async function handleManualSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const token = getToken();
        if (!token) {
            toast.error("Session expired. Please log in again.");
            setSaving(false);
            return;
        }
        const balanceNum = Number(balance.replace(/,/g, ""));
        if (Number.isNaN(balanceNum) || balanceNum < 0) {
            toast.error("Please enter a valid bank balance.");
            setSaving(false);
            return;
        }
        const userType = getUserType() ?? "sme";
        try {
            await api.settings.updateBalance(balanceNum, token, userType);
            toast.success("Your balance has been saved.");
            navigate("/");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] flex flex-col">
            {/* Nav */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-[#0a0a0a]/8 dark:border-white/8">
                <div className="flex items-center gap-2.5">
                    <PocketCFOLogo size={32} className="text-[#0a0a0a] dark:text-white" />
                    <span className="font-bold tracking-tight text-[#0a0a0a] dark:text-white">
                        PocketCFO
                    </span>
                </div>
                <button
                    onClick={() => navigate("/")}
                    className="text-sm text-[#0a0a0a]/40 dark:text-white/35 hover:text-[#0a0a0a] dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                    Skip setup
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </header>

            {/* Progress bar */}
            <div className="h-0.5 bg-[#0a0a0a]/5 dark:bg-white/5">
                <div
                    className="h-full bg-[#76b900] transition-all duration-500"
                    style={{
                        width: step === "choose" ? "33%" : step === "bank-connect" || step === "manual-form" ? "66%" : "100%",
                    }}
                />
            </div>

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                {/* ── Step 1: Choose ── */}
                {step === "choose" && (
                    <div className="w-full max-w-lg">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border border-[#76b900]/40 bg-[#76b900]/10 text-[#5a8d00] dark:text-[#76b900]">
                                <Zap className="h-3 w-3" />
                                Step 1 of 2
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a] dark:text-white mb-2">
                                How would you like to add your data?
                            </h1>
                            <p className="text-[#0a0a0a]/50 dark:text-white/45 text-base">
                                Connect your bank for live data, or fill in the numbers yourself.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Bank option */}
                            <button
                                onClick={() => setStep("bank-connect")}
                                className="group text-left rounded-2xl p-6 bg-white dark:bg-[#111111] border border-[#76b900]/15 hover:border-[#76b900]/50 transition-all duration-200 hover:scale-[1.02]"
                                style={{ boxShadow: "inset 0 1px 0 rgba(118,185,0,0.06)" }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#76b900]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Landmark className="h-6 w-6 text-[#76b900]" />
                                </div>
                                <h2 className="font-black text-lg text-[#0a0a0a] dark:text-white mb-1.5">
                                    Connect my bank
                                </h2>
                                <p className="text-sm text-[#0a0a0a]/50 dark:text-white/45 leading-relaxed mb-4">
                                    Securely link your account for real-time transactions and automatic updates.
                                </p>
                                <div className="flex items-center gap-1.5 text-[#76b900] text-sm font-semibold">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Bank-grade security
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[#0a0a0a] dark:text-white font-semibold text-sm">
                                    Get started
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>

                            {/* Manual option */}
                            <button
                                onClick={() => setStep("manual-form")}
                                className="group text-left rounded-2xl p-6 bg-white dark:bg-[#111111] border border-[#76b900]/15 hover:border-[#76b900]/50 transition-all duration-200 hover:scale-[1.02]"
                                style={{ boxShadow: "inset 0 1px 0 rgba(118,185,0,0.06)" }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#76b900]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PenLine className="h-6 w-6 text-[#76b900]" />
                                </div>
                                <h2 className="font-black text-lg text-[#0a0a0a] dark:text-white mb-1.5">
                                    Enter manually
                                </h2>
                                <p className="text-sm text-[#0a0a0a]/50 dark:text-white/45 leading-relaxed mb-4">
                                    Type in your current balance, income, and expenses to get started right away.
                                </p>
                                <div className="flex items-center gap-1.5 text-[#76b900] text-sm font-semibold">
                                    <Zap className="h-3.5 w-3.5" />
                                    Ready in 60 seconds
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[#0a0a0a] dark:text-white font-semibold text-sm">
                                    Fill in numbers
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        </div>

                        <p className="text-center text-xs text-[#0a0a0a]/30 dark:text-white/25 mt-6">
                            You can always change this later in settings.
                        </p>
                    </div>
                )}

                {/* ── Step 2a: Bank connect (Plaid) ── */}
                {step === "bank-connect" && (
                    <div className="w-full max-w-md">
                        <button
                            onClick={() => { setStep("choose"); setLinkToken(null); }}
                            className="flex items-center gap-1.5 text-sm text-[#0a0a0a]/40 dark:text-white/35 hover:text-[#76b900] transition-colors mb-8"
                        >
                            <X className="h-3.5 w-3.5" />
                            Back
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border border-[#76b900]/40 bg-[#76b900]/10 text-[#5a8d00] dark:text-[#76b900]">
                                <Landmark className="h-3 w-3" />
                                Step 2 of 2
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-[#0a0a0a] dark:text-white mb-2">
                                Connect your bank
                            </h1>
                            <p className="text-sm text-[#0a0a0a]/45 dark:text-white/40">
                                A secure Plaid window will open so you can choose your bank and log in safely.
                            </p>
                        </div>

                        {/* Security note */}
                        <div className="rounded-xl p-3.5 mb-5 flex items-start gap-2.5 bg-[#76b900]/6 border border-[#76b900]/15">
                            <Lock className="h-4 w-4 text-[#76b900] shrink-0 mt-0.5" />
                            <p className="text-xs text-[#0a0a0a]/55 dark:text-white/50 leading-relaxed">
                                <span className="font-semibold text-[#0a0a0a]/70 dark:text-white/65">Read-only access.</span>{" "}
                                Your credentials go directly to your bank via Plaid — PocketCFO never sees them. You can disconnect at any time.
                            </p>
                        </div>

                        <button
                            onClick={() => openPlaid()}
                            disabled={fetchingToken || !plaidReady || exchanging}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed bg-[#76b900] text-[#0a0a0a]"
                            style={{ boxShadow: plaidReady && !exchanging ? "0 0 22px rgba(118,185,0,0.28)" : "none" }}
                        >
                            {fetchingToken || exchanging ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-[#0a0a0a]/25 border-t-[#0a0a0a] rounded-full animate-spin" />
                                    {exchanging ? "Saving connection…" : "Preparing…"}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Open Plaid
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ── Step 2b: Manual form ── */}
                {step === "manual-form" && (
                    <div className="w-full max-w-md">
                        <button
                            onClick={() => setStep("choose")}
                            className="flex items-center gap-1.5 text-sm text-[#0a0a0a]/40 dark:text-white/35 hover:text-[#76b900] transition-colors mb-8"
                        >
                            <X className="h-3.5 w-3.5" />
                            Back
                        </button>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border border-[#76b900]/40 bg-[#76b900]/10 text-[#5a8d00] dark:text-[#76b900]">
                                <PenLine className="h-3 w-3" />
                                Step 2 of 2
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-[#0a0a0a] dark:text-white mb-2">
                                Enter your numbers
                            </h1>
                            <p className="text-sm text-[#0a0a0a]/45 dark:text-white/40">
                                These give PocketCFO enough to calculate your true cash position.
                            </p>
                        </div>

                        <form
                            onSubmit={handleManualSave}
                            className="rounded-2xl p-6 bg-white dark:bg-[#111111] border border-[#0a0a0a]/8 dark:border-white/8 space-y-5"
                            style={{ boxShadow: "inset 0 1px 0 rgba(118,185,0,0.06)" }}
                        >
                            {[
                                {
                                    id: "balance",
                                    label: "Current bank balance",
                                    value: balance,
                                    set: setBalance,
                                    placeholder: "e.g. 12,500",
                                    hint: "Your account balance right now",
                                    icon: PiggyBank,
                                },
                                {
                                    id: "income",
                                    label: "Average monthly income",
                                    value: monthlyIncome,
                                    set: setMonthlyIncome,
                                    placeholder: "e.g. 5,000",
                                    hint: "Revenue or salary after tax",
                                    icon: ArrowRight,
                                },
                                {
                                    id: "expenses",
                                    label: "Average monthly expenses",
                                    value: monthlyExpenses,
                                    set: setMonthlyExpenses,
                                    placeholder: "e.g. 3,200",
                                    hint: "Fixed costs, subscriptions, etc.",
                                    icon: ArrowRight,
                                },
                            ].map(({ id, label, value, set, placeholder, hint }) => (
                                <div key={id}>
                                    <label className="text-[11px] font-semibold text-[#0a0a0a]/50 dark:text-white/45 uppercase tracking-widest block mb-1.5">
                                        {label}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0a0a0a]/35 dark:text-white/30">
                                            €
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={value}
                                            onChange={(e) => set(e.target.value)}
                                            placeholder={placeholder}
                                            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#0a0a0a]/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#1a1a1a] text-[#0a0a0a] dark:text-white text-sm placeholder:text-[#0a0a0a]/25 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#76b900]/55 transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-[#0a0a0a]/35 dark:text-white/28 mt-1">{hint}</p>
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 disabled:opacity-55 bg-[#76b900] text-[#0a0a0a] mt-2"
                                style={{ boxShadow: saving ? "none" : "0 0 22px rgba(118,185,0,0.28)" }}
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-[#0a0a0a]/25 border-t-[#0a0a0a] rounded-full animate-spin" />
                                        Saving…
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Go to my dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
