"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MoveRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["fluent", "confident", "prepared", "unstoppable", "band-ready"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const { scrollY } = useScroll();
  const orb1Y = useTransform(scrollY, [0, 600], [0, 80]);
  const orb2Y = useTransform(scrollY, [0, 600], [0, -60]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
          background: "linear-gradient(160deg, #eef2ff 0%, #f5f3ff 35%, #fdf4ff 65%, #ffffff 100%)",
          minHeight: "100svh",
        }}
    >
      {/* Indigo orb — top left */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          y: orb1Y,
          width: "700px",
          height: "700px",
          top: "-200px",
          left: "-180px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)",
        }}
      />

      {/* Purple orb — bottom right */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          y: orb2Y,
          width: "600px",
          height: "600px",
          bottom: "-100px",
          right: "-140px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
      />

      {/* Top-center glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center gap-7 pt-36 pb-24 lg:pt-48 lg:pb-32">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "#ede9fe",
                color: "#6d28d9",
                border: "1px solid #ddd6fe",
              }}
            >
              <Sparkles size={11} />
              AI-Powered IELTS &amp; CELPIP Practice
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <h1
              className="text-5xl md:text-7xl max-w-3xl tracking-tighter font-bold leading-[1.06]"
              style={{ color: "#0f172a" }}
            >
              Practice until you&apos;re

              <span className="relative flex w-full justify-center overflow-hidden md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-black"
                    style={{
                      background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p
              className="text-lg md:text-xl leading-relaxed max-w-xl mx-auto"
              style={{ color: "#64748b" }}
            >
              AI scores your speaking, writing, reading and listening against
              official IELTS and CELPIP rubrics — no examiner, no waiting.
              Get your band score in seconds and improve with every session.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <SignedOut>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
                }}
              >
                Get Started Free <MoveRight size={15} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm border transition-all hover:bg-slate-50"
                style={{
                  color: "#334155",
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              >
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
                }}
              >
                Go to Dashboard <MoveRight size={15} />
              </Link>
              <Link
                href="/setup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm border transition-all hover:bg-slate-50"
                style={{
                  color: "#334155",
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              >
                Start Practising
              </Link>
            </SignedIn>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2"
          >
            {[
              { value: "4 Skills", label: "Speaking · Writing · Reading · Listening" },
              { value: "2 Exams", label: "IELTS & CELPIP covered" },
              { value: "Instant", label: "Band score feedback" },
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center gap-1.5">
                <span className="text-sm font-black" style={{ color: "#4f46e5" }}>{value}</span>
                <span className="text-xs" style={{ color: "#94a3b8" }}>{label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Bottom fade to white */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "120px",
          background: "linear-gradient(to bottom, transparent, #ffffff)",
        }}
      />
    </section>
  );
}

export { Hero };
