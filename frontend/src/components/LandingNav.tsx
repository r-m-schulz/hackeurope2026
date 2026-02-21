import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function LandingNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "rgba(10,10,10,0.85)",
        borderBottom: "1px solid rgba(118,185,0,0.15)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm tracking-tight"
            style={{ background: "#76b900", color: "#0a0a0a" }}
          >
            TB
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "#ffffff" }}>
            TrueBalance
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/#features"
            className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block hover:text-white"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Features
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block hover:text-white"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            About
          </Link>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login">
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Log in
            </button>
          </Link>
          <Link to="/login" state={{ tab: "signup" }}>
            <button
              className="text-sm font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-110"
              style={{
                background: "#76b900",
                color: "#0a0a0a",
                boxShadow: "0 0 14px rgba(118,185,0,0.35)",
              }}
            >
              Sign up
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
