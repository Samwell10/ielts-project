"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled ? {
        background: "rgba(255,255,255,0.90)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
      } : {
        background: "transparent",
        borderBottom: "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            <Mic size={15} color="white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span style={{ color: "#1e293b" }}>Prep</span>
            <span style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI</span>
          </span>
        </Link>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="redirect">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:text-slate-900"
                style={{ color: "#64748b" }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 2px 10px rgba(79,70,229,0.3)",
                }}
              >
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              }}
            >
              Go to Dashboard →
            </Link>
            <UserButton
              appearance={{
                variables: { colorPrimary: "#4f46e5" },
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
