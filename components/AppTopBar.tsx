"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Mic, Flame, LayoutDashboard, PenLine, BookOpen, Headphones, History, Menu, X } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { useApi } from "@/hooks/useApi";
import type { XPStatus } from "@/lib/api";

/* Page title map */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/setup":     "Speaking Practice",
  "/writing":   "Writing Practice",
  "/reading":   "Reading Practice",
  "/listening": "Listening Practice",
  "/history":    "Session History",
  "/study-plan": "Study Plan",
  "/onboarding": "Getting Started",
};

function resolveTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return title;
  }
  return "PrepAI";
}

/* Mobile nav links (shown in hamburger dropdown) */
const mobileLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/setup",     label: "Speaking",  icon: Mic             },
  { href: "/writing",   label: "Writing",   icon: PenLine         },
  { href: "/reading",   label: "Reading",   icon: BookOpen        },
  { href: "/listening", label: "Listening", icon: Headphones      },
  { href: "/history",   label: "History",   icon: History         },
];

function XPCompact() {
  const { userId, isSignedIn } = useAuth();
  const api = useApi();
  const [status, setStatus] = useState<XPStatus | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    api.getGamificationStatus(userId).then(setStatus).catch(() => null);
  }, [isSignedIn, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) return null;

  return (
    <div className="hidden lg:flex items-center gap-2">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
        style={{
          background: status.streak > 0 ? "rgba(251,146,60,0.1)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${status.streak > 0 ? "rgba(251,146,60,0.25)" : "rgba(0,0,0,0.08)"}`,
          color: status.streak > 0 ? "#f97316" : "#94a3b8",
        }}
      >
        <Flame size={12} />
        <span>{status.streak}</span>
      </div>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        <span className="font-bold" style={{ color: "#d97706" }}>Lv.{status.level}</span>
        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(status.level_pct * 100)}%`, background: "linear-gradient(90deg,#6366f1,#fbbf24)" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AppTopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = resolveTitle(pathname);

  return (
    <>
      <header
        className="shrink-0 h-14 flex items-center justify-between px-4 md:px-6 border-b bg-white"
        style={{ borderColor: "#e2e8f0" }}
      >
        {/* Left: mobile logo OR desktop page title */}
        <div className="flex items-center gap-3">
          {/* Mobile: logo */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
            >
              <Mic size={13} color="white" />
            </div>
            <span className="font-bold text-base tracking-tight">
              <span style={{ color: "#1e293b" }}>Prep</span>
              <span style={{
                background: "linear-gradient(135deg, #60a5fa, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>AI</span>
            </span>
          </Link>

          {/* Desktop: page title */}
          <h1 className="hidden lg:block text-base font-bold" style={{ color: "#1e293b" }}>
            {title}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <SignedIn>
            <XPCompact />
            <UserButton
              appearance={{
                variables: { colorPrimary: "#2563eb" },
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "#f1f5f9", color: "#64748b" }}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="redirect">
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ color: "#64748b" }}>
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white btn-gradient">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </header>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <div
          className="lg:hidden border-b px-3 py-2 grid grid-cols-3 gap-1.5"
          style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
        >
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all"
                style={active
                  ? { background: "#eff6ff", color: "#1d4ed8" }
                  : { color: "#64748b" }
                }
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
