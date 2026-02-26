import Link from "next/link";
import { Mic, BarChart2, Clock, Star } from "lucide-react";

const stats = [
  { label: "Practice Sessions", value: "10K+", icon: Mic },
  { label: "Avg Session Length", value: "12 min", icon: Clock },
  { label: "Repeat Users", value: "47%", icon: BarChart2 },
  { label: "Feedback Rating", value: "4.7/5", icon: Star },
];

const features = [
  {
    title: "IELTS & CELPIP Ready",
    desc: "Official-style questions and rubrics for both exams, from Band 1 to 9 and Level 1 to 12.",
  },
  {
    title: "AI Examiner",
    desc: "Realistic interview flow across IELTS Parts 1–3 and CELPIP speaking tasks.",
  },
  {
    title: "Instant Feedback",
    desc: "Get scored on fluency, grammar, vocabulary, pronunciation, and coherence immediately.",
  },
  {
    title: "Session History",
    desc: "Review past recordings, transcripts, and track your improvement over time.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 py-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-2"
          style={{ background: "#312e81", color: "#a5b4fc" }}
        >
          <Mic size={14} />
          AI-Powered Speaking Practice
        </div>
        <h1 className="text-5xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
          Ace Your IELTS &amp; CELPIP
          <br />
          <span style={{ color: "var(--accent)" }}>Speaking Test</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>
          Practice with an AI examiner that listens, scores, and gives detailed
          feedback — anytime, anywhere. No partner needed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/setup"
            className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Start Practicing
          </Link>
          <Link
            href="/history"
            className="px-6 py-3 rounded-xl font-semibold transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--foreground)",
            }}
          >
            View History
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="text-center space-y-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
              style={{ background: "#312e81" }}
            >
              <Icon size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {value}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              {label}
            </div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center" style={{ color: "var(--foreground)" }}>
          Everything You Need to Improve
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl space-y-2"
              style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <h3 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                {title}
              </h3>
              <p style={{ color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="text-center p-10 rounded-2xl space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Ready to start?
        </h2>
        <p style={{ color: "var(--muted)" }}>
          Choose your exam, pick a topic, and begin your session in seconds.
        </p>
        <Link
          href="/setup"
          className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Start a Practice Session
        </Link>
      </section>
    </div>
  );
}
