"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Mic, PenLine, BookOpen, Headphones, History, Flame, Map,
} from "lucide-react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useApi } from "@/hooks/useApi";
import type { XPStatus } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, activeColor: "#1e40af", activeBg: "#eff6ff" },
  { href: "/setup",     label: "Speaking",  icon: Mic,             activeColor: "#6d28d9", activeBg: "#f5f3ff" },
  { href: "/writing",   label: "Writing",   icon: PenLine,         activeColor: "#b45309", activeBg: "#fef3c7" },
  { href: "/reading",   label: "Reading",   icon: BookOpen,        activeColor: "#0e7490", activeBg: "#ecfeff" },
  { href: "/listening", label: "Listening", icon: Headphones,      activeColor: "#be123c", activeBg: "#fff1f2" },
  { href: "/history",    label: "History",    icon: History,          activeColor: "#475569", activeBg: "#f1f5f9" },
  { href: "/study-plan", label: "Study Plan", icon: Map,              activeColor: "#0f766e", activeBg: "#f0fdf4" },
];

function XPWidget() {
  const { userId, isSignedIn } = useAuth();
  const api = useApi();
  const [status, setStatus] = useState<XPStatus | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    api.getGamificationStatus(userId).then(setStatus).catch(() => null);
  }, [isSignedIn, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) return null;

  const levelPct = Math.round(status.level_pct * 100);

  return (
    <div className="px-3 py-3 space-y-2">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: status.streak > 0 ? "rgba(251,146,60,0.15)" : "#f1f5f9" }}
        >
          <Flame size={13} style={{ color: status.streak > 0 ? "#f97316" : "#94a3b8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-none" style={{ color: status.streak > 0 ? "#f97316" : "#94a3b8" }}>
            {status.streak} day streak
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold" style={{ color: "#64748b" }}>Level {status.level}</span>
          <span className="text-[11px]" style={{ color: "#94a3b8" }}>{status.total_xp} XP</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${levelPct}%`, background: "linear-gradient(90deg, #6366f1, #fbbf24)" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            <Mic size={15} color="white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span style={{ color: "#1e293b" }}>Prep</span>
            <span style={{
              background: "linear-gradient(135deg, #60a5fa, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI</span>
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, activeColor, activeBg }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active
                ? { background: activeBg, color: activeColor, fontWeight: 600 }
                : { color: "#64748b" }
              }
            >
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
              {active && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: activeColor }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100" />

      {/* XP widget */}
      <XPWidget />

      {/* Divider */}
      <div className="mx-3 border-t border-slate-100" />

      {/* User */}
      <div className="px-3 py-3 flex items-center gap-2.5 shrink-0">
        <UserButton
          appearance={{
            variables: { colorPrimary: "#2563eb" },
            elements: { avatarBox: "w-8 h-8" },
          }}
        />
        {user?.firstName && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>
              {user.firstName} {user.lastName ?? ""}
            </p>
            <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
