"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mic, PenLine, BookOpen, Headphones } from "lucide-react";
import { SignedIn } from "@clerk/nextjs";

const tabs = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    activeColor: "#7C3AED",
    activeBg: "rgba(124,58,237,0.12)",
  },
  {
    href: "/setup",
    label: "Speaking",
    icon: Mic,
    activeColor: "#7C3AED",
    activeBg: "rgba(124,58,237,0.12)",
  },
  {
    href: "/writing",
    label: "Writing",
    icon: PenLine,
    activeColor: "#d97706",
    activeBg: "rgba(217,119,6,0.12)",
  },
  {
    href: "/reading",
    label: "Reading",
    icon: BookOpen,
    activeColor: "#0891b2",
    activeBg: "rgba(8,145,178,0.12)",
  },
  {
    href: "/listening",
    label: "Listening",
    icon: Headphones,
    activeColor: "#e11d48",
    activeBg: "rgba(225,29,72,0.12)",
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <SignedIn>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: "var(--card-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch h-16">
          {tabs.map(({ href, label, icon: Icon, activeColor, activeBg }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  background: active ? activeBg : "transparent",
                  color: active ? activeColor : "var(--muted)",
                }}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </SignedIn>
  );
}
