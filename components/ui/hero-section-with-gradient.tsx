"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Mic, BookOpen, Zap, Star, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

/* ── AnimatedGroup — staggered entrance ─────────────────────────────────── */

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  preset?: "fade-up" | "fade" | "scale";
  stagger?: number;
}

function AnimatedGroup({
  children,
  className,
  preset = "fade-up",
  stagger = 0.1,
}: AnimatedGroupProps) {
  const presets = {
    "fade-up": { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } },
    "fade":    { hidden: { opacity: 0 },         visible: { opacity: 1 }        },
    "scale":   { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
  };
  const v = presets[preset];

  const items = Array.isArray(children) ? children : [children];

  return (
    <motion.div
      className={cn("flex flex-col", className)}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {items.map((child, i) => (
        <motion.div
          key={i}
          variants={v}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Score card mockup ───────────────────────────────────────────────────── */

const criteria: [string, number][] = [
  ["Fluency & Coherence", 0.89],
  ["Lexical Resource",    0.83],
  ["Grammatical Range",   0.78],
  ["Pronunciation",       0.84],
];

function AppMockup() {
  return (
    <div className="relative">
      {/* Purple glow below card */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-3xl pointer-events-none"
        style={{ background: "rgba(124,58,237,0.3)" }}
      />
      {/* Yellow blob top-right */}
      <div
        className="blob absolute -top-8 -right-8 w-40 h-40 pointer-events-none -z-10 opacity-60"
        style={{ background: "rgba(252,211,77,0.3)" }}
      />
      {/* Purple blob bottom-left */}
      <div
        className="blob-2 absolute -bottom-6 -left-6 w-28 h-28 pointer-events-none -z-10 opacity-50"
        style={{ background: "rgba(124,58,237,0.12)" }}
      />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--card-border)",
          boxShadow: "0 32px 80px rgba(124,58,237,0.15), 0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        {/* Browser chrome bar */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--card-border)" }}
        >
          <div className="flex gap-1.5">
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div
            className="flex-1 px-3 py-1 rounded-md text-xs text-center"
            style={{ background: "var(--accent-light)", color: "var(--muted)" }}
          >
            prepai.app/feedback/session
          </div>
        </div>

        {/* Score content */}
        <div className="p-6 space-y-4" style={{ background: "var(--background)" }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Speaking Score
              </p>
              <p className="text-xl font-black mt-0.5" style={{ color: "var(--foreground)" }}>
                Your AI Feedback
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{
                background: "var(--accent-light)",
                color: "var(--purple)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              Band 7.5
            </span>
          </div>

          {/* Criterion bars */}
          {criteria.map(([label, pct]) => (
            <div key={label} className="space-y-1.5">
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>{label}</span>
                <span className="font-bold" style={{ color: "var(--foreground)" }}>
                  {(pct * 9).toFixed(1)}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--card-border)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, var(--purple), var(--yellow))",
                  }}
                />
              </div>
            </div>
          ))}

          {/* AI Tip */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl"
            style={{
              background: "var(--accent-light)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <CheckCircle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--purple)" }}
            />
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              <span className="font-bold" style={{ color: "var(--foreground)" }}>AI Tip: </span>
              Use cohesive devices to link ideas and boost your fluency score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stats row ───────────────────────────────────────────────────────────── */

const stats = [
  { icon: Zap,        value: "< 3s",   label: "Score delivery"   },
  { icon: Star,       value: "Band 9", label: "Max possible"      },
  { icon: TrendingUp, value: "4",      label: "Practice modules"  },
  { icon: Clock,      value: "24/7",   label: "Always available"  },
];

function StatsRow() {
  return (
    <div className="flex flex-wrap gap-5 justify-center lg:justify-start">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-light)" }}
          >
            <Icon size={14} style={{ color: "var(--purple)" }} />
          </div>
          <div>
            <p className="text-sm font-black leading-none" style={{ color: "var(--foreground)" }}>
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main hero section ───────────────────────────────────────────────────── */

export function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bgRef.current) return;
    gsap.fromTo(
      bgRef.current,
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" }
    );
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* ── GSAP-animated gradient background ── */}
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 5% 45%, rgba(124,58,237,0.13) 0%, transparent 65%)," +
            "radial-gradient(ellipse 55% 65% at 92% 15%, rgba(252,211,77,0.22) 0%, transparent 60%)," +
            "radial-gradient(ellipse 45% 50% at 55% 100%, rgba(124,58,237,0.07) 0%, transparent 70%)," +
            "var(--background)",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 py-16 sm:py-24 lg:py-32 items-center">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <AnimatedGroup
            preset="fade-up"
            stagger={0.11}
            className="gap-7 items-center lg:items-start text-center lg:text-left"
          >
            {/* Badge pill */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-center lg:self-start"
              style={{
                background: "var(--accent-light)",
                color: "var(--purple)",
                border: "1px solid rgba(124,58,237,0.22)",
              }}
            >
              AI-Powered Exam Prep
            </span>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black leading-[1.1] tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Ace your{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--purple) 20%, var(--yellow) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                IELTS &amp; CELPIP
              </span>
              <br />
              with AI practice
            </h1>

            {/* Subtitle */}
            <p
              className="text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
              style={{ color: "var(--muted)" }}
            >
              AI scores your speaking, writing, reading and listening against
              official rubrics — no examiner, no waiting. Results in seconds.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white btn-gradient w-full sm:w-auto"
              >
                <Mic size={16} />
                Start Practising Free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold transition-all w-full sm:w-auto"
                style={{
                  background: "var(--accent-light)",
                  color: "var(--purple)",
                  border: "1.5px solid rgba(124,58,237,0.28)",
                }}
              >
                <BookOpen size={16} />
                View progress
              </Link>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {["Free to use", "Official rubrics", "Results in 3s"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "var(--accent-light)", color: "var(--purple)" }}
                >
                  <CheckCircle size={11} />
                  {item}
                </span>
              ))}
            </div>

            {/* Stats */}
            <StatsRow />
          </AnimatedGroup>

          {/* ── Right column: App mockup ─────────────────────────────────── */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 50, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <AppMockup />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
