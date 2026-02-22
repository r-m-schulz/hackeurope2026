import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { PocketCFOLogo } from "@/components/PocketCFOLogo";
import { scrollToSection } from "@/lib/scroll-sections";

export function LandingNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-xl border-b border-[#76b900]/15 bg-[#f5f5f5]/85 dark:bg-[#0a0a0a]/85"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
          <PocketCFOLogo size={32} className="text-[#0a0a0a] dark:text-white" />
          <span className="text-lg font-bold tracking-tight text-[#0a0a0a] dark:text-white">
            PocketCFO
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {isLanding ? (
            <>
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block text-[#0a0a0a]/50 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block text-[#0a0a0a]/50 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white"
              >
                Pricing
              </button>
            </>
          ) : (
            <>
              <Link
                to="/#features"
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block text-[#0a0a0a]/50 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white"
              >
                Features
              </Link>
              <Link
                to="/#pricing"
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block text-[#0a0a0a]/50 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white"
              >
                Pricing
              </Link>
            </>
          )}
          <Link
            to="/about"
            className="text-sm font-medium px-3 py-2 rounded-md transition-colors hidden sm:block text-[#0a0a0a]/50 dark:text-white/50 hover:text-[#0a0a0a] dark:hover:text-white"
          >
            About
          </Link>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-[#0a0a0a]/50 dark:text-white/50 hover:bg-[#0a0a0a]/8 dark:hover:bg-white/10"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login">
            <button className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors text-[#0a0a0a]/65 dark:text-white/65 hover:bg-[#0a0a0a]/8 dark:hover:bg-white/10">
              Log in
            </button>
          </Link>
          <Link to="/login" state={{ tab: "signup" }}>
            <button
              className="text-sm font-bold px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-110 bg-[#76b900] text-[#0a0a0a]"
              style={{ boxShadow: "0 0 14px rgba(118,185,0,0.3)" }}
            >
              Sign up
            </button>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
