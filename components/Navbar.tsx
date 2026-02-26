"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, History, BookOpen } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

const navLinks = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/setup", label: "Practice", icon: Mic },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b px-4 py-3"
      style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Mic size={16} color="white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
            SpeakPrep AI
          </span>
        </Link>

        {/* Nav links — only shown when signed in */}
        <div className="flex items-center gap-1">
          <SignedIn>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "white" : "var(--muted)",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </SignedIn>
        </div>

        {/* Auth controls */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="redirect">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--muted)" }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                variables: { colorPrimary: "#6366f1" },
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
