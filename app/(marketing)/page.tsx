import Link from "next/link";
import { Zap, TrendingUp, Star, BookOpen } from "lucide-react";
import { Hero } from "@/components/ui/animated-hero";
import { FadeInSection, ParallaxBlob } from "@/components/ui/parallax";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    emoji: "🎯",
    title: "Choose a module",
    desc: "Pick Speaking, Writing, Reading, or Listening. Select IELTS or CELPIP and your preferred topic.",
  },
  {
    num: "02",
    emoji: "🤖",
    title: "Practice with AI",
    desc: "The AI generates realistic exam content and guides you through each question in real time.",
  },
  {
    num: "03",
    emoji: "📊",
    title: "Get your band score",
    desc: "Receive your IELTS band or CELPIP level with a per-criterion breakdown and actionable improvement tips.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Instant AI Scoring",
    desc: "Get your IELTS band or CELPIP level in seconds using official rubrics powered by Gemini AI.",
    color: "var(--purple)",
    bg: "var(--accent-light)",
  },
  {
    icon: BookOpen,
    title: "Exam-Realistic Prompts",
    desc: "AI generates unique questions, charts, and audio every session — never the same prompt twice.",
    color: "#D97706",
    bg: "rgba(252,211,77,0.15)",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    desc: "Visual score history, trend charts, and per-criterion breakdowns across all your sessions.",
    color: "#0284c7",
    bg: "rgba(14,165,233,0.1)",
  },
  {
    icon: Star,
    title: "IELTS & CELPIP Ready",
    desc: "Full support for both exams across all four skills with official band descriptors baked in.",
    color: "#059669",
    bg: "rgba(16,185,129,0.1)",
  },
];

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div>

      {/* ── Hero — full-width, no container ───────────────────────────────── */}
      <Hero />

      {/* ── Below-hero content — constrained to max-w-6xl ─────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 space-y-0">

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <FadeInSection>
      <section className="mb-16 md:mb-24">
        <div className="text-center space-y-3 mb-10">
          <div className="section-label mx-auto w-fit">Why PrepAI</div>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--foreground)" }}>
            Built for{" "}
            <em className="not-italic font-black" style={{ color: "var(--purple)" }}>exam success</em>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="flex gap-5 p-6 rounded-3xl card-lift"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1" style={{ color: "var(--foreground)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <FadeInSection>
      <section className="mb-16 md:mb-24">
        <div className="text-center space-y-3 mb-10">
          <div className="section-label mx-auto w-fit">How it works</div>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--foreground)" }}>
            Ready in{" "}
            <em className="not-italic" style={{ color: "var(--yellow)", WebkitTextStroke: "2px #D97706" }}>
              three steps
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(({ num, emoji, title, desc }) => (
            <div
              key={num}
              className="relative p-6 rounded-3xl flex flex-col gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <span
                className="absolute top-4 right-5 text-5xl font-black select-none pointer-events-none"
                style={{ color: "rgba(124,58,237,0.07)" }}
              >
                {num}
              </span>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "var(--accent-light)" }}
              >
                {emoji}
              </div>
              <div>
                <p className="font-black text-base mb-1.5" style={{ color: "var(--foreground)" }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      {/* ── Purple mission banner ────────────────────────────────────────────── */}
      <FadeInSection>
      <section
        className="relative rounded-xl overflow-hidden mb-16 md:mb-24 py-16 px-6 md:px-16 text-center"
        style={{ background: "var(--purple)" }}
      >
        <ParallaxBlob
          className="blob -top-16 -left-16 w-64 h-64 opacity-20"
          style={{ background: "#ffffff" }}
          speed={0.07}
        />
        <ParallaxBlob
          className="blob-2 -bottom-12 -right-12 w-48 h-48 opacity-15"
          style={{ background: "var(--yellow)" }}
          speed={-0.05}
        />

        <div className="relative space-y-5">
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Our mission</p>
          <h2 className="text-3xl md:text-4xl font-black text-white max-w-3xl mx-auto leading-tight">
            We aim to help you{" "}
            <em className="not-italic font-black" style={{ color: "var(--yellow)" }}>
              achieve your target band score
            </em>
            {" "}and unlock your full potential.
          </h2>
          <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed">
            PrepAI uses official IELTS and CELPIP rubrics, Gemini AI, and real exam formats
            to give you the most accurate practice experience possible.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
            {[
              { emoji: "🎙️", title: "Real exam questions", desc: "AI generates unique prompts every session — just like the real exam." },
              { emoji: "⚡",  title: "Instant scoring",    desc: "Band score and per-criterion feedback delivered in under 3 seconds." },
              { emoji: "📈",  title: "Track improvement",  desc: "Score history and trend graphs show your progress over time." },
            ].map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <span className="text-3xl">{emoji}</span>
                <p className="font-bold text-white text-sm">{title}</p>
                <p className="text-white/65 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <FadeInSection>
      <section
        className="relative text-center py-16 px-6 md:px-16 rounded-3xl overflow-hidden mb-8"
        style={{ background: "var(--accent-yellow-light)", border: "2px solid var(--yellow)" }}
      >
        <ParallaxBlob
          className="blob -top-12 -left-12 w-48 h-48 opacity-40"
          style={{ background: "var(--yellow)" }}
          speed={0.09}
        />
        <ParallaxBlob
          className="blob-2 -bottom-10 -right-10 w-36 h-36 opacity-30"
          style={{ background: "var(--purple)" }}
          speed={-0.06}
        />

        <div className="relative space-y-5">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: "var(--yellow)", color: "#1a1a2e" }}
          >
            Start today — it&apos;s free
          </span>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--foreground)" }}>
            Your target band score is{" "}
            <em className="not-italic font-black" style={{ color: "var(--purple)" }}>
              closer than you think.
            </em>
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "var(--muted)" }}>
            Create your free account and start your first practice session in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-white btn-gradient w-full sm:w-auto justify-center"
            >
              Get Started Free →
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-semibold text-sm w-full sm:w-auto justify-center"
              style={{ color: "var(--purple)" }}
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      </div>{/* end max-w-6xl wrapper */}
    </div>
  );
}
