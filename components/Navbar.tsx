"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mic, History, PenLine, Home, BookOpen, Headphones, Menu, X, LayoutDashboard } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const navLinks = [
  { href: "/",           label: "Home",      icon: Home            },
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
          >
            <Mic size={15} color="white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span style={{ color: "var(--foreground)" }}>Prep</span>
            <span style={{
              background: "linear-gradient(135deg, #60a5fa, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          <SignedIn>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? "rgba(37, 99, 235, 0.12)" : "transparent",
                    color: active ? "#93c5fd" : "var(--muted)",
                    border: active ? "1px solid rgba(37, 99, 235, 0.28)" : "1px solid transparent",
                  }}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </SignedIn>
        </div>

        {/* Right: Auth + Mobile hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <SignedOut>
            <SignInButton mode="redirect">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hidden sm:block"
                style={{ color: "var(--muted)" }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white btn-gradient">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                variables: { colorPrimary: "#2563eb" },
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </SignedIn>

          {/* Mobile hamburger — only when signed in */}
          <SignedIn>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                color: "var(--muted)",
              }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </SignedIn>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <SignedIn>
          <div
            className="md:hidden border-t px-4 py-3 grid grid-cols-3 gap-2"
            style={{ background: "var(--glass-bg)", borderColor: "var(--card-border)" }}
          >
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: active ? "rgba(37, 99, 235, 0.12)" : "transparent",
                    color: active ? "#93c5fd" : "var(--muted)",
                    border: active ? "1px solid rgba(37, 99, 235, 0.25)" : "1px solid transparent",
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        </SignedIn>
      )}
    </nav>
  );
}
