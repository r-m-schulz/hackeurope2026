import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { getIsPro } from "@/lib/auth";

interface ProGateProps {
  children: React.ReactNode;
  label?: string;
}

export function ProGate({ children, label = "Pro feature" }: ProGateProps) {
  if (getIsPro()) return <>{children}</>;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#76b900]/10 border border-[#76b900]/30">
          <Zap className="h-3.5 w-3.5 text-[#76b900]" />
          <span className="text-xs font-semibold text-[#76b900]">{label}</span>
        </div>
        <Link
          to="/subscribe"
          className="px-5 py-2 rounded-xl font-bold text-sm bg-[#76b900] text-[#0a0a0a] hover:brightness-110 hover:scale-[1.015] active:scale-[0.985] transition-all duration-150"
          style={{ boxShadow: "0 0 22px rgba(118,185,0,0.28)" }}
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
