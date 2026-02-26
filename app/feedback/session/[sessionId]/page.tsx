"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ChevronRight, Clock, BookOpen, Mic, AlertCircle } from "lucide-react";
import { type SessionRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color = score / max >= 0.78 ? "var(--success)" : score / max >= 0.61 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-bold" style={{ color }}>{score} / {max}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--card-border)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function getScoreColor(score: number, max: number) {
  const r = score / max;
  return r >= 0.78 ? "var(--success)" : r >= 0.61 ? "var(--warning)" : "var(--danger)";
}

export default function SessionFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const api = useApi();

  useEffect(() => {
    api.getSession(sessionId)
      .then(setSession)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
        <p style={{ color: "var(--muted)" }}>Loading your feedback...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{error || "Session not found."}</p>
        <Link href="/history" className="px-6 py-3 rounded-xl font-semibold text-white inline-block"
          style={{ background: "var(--accent)" }}>
          Back to History
        </Link>
      </div>
    );
  }

  const isIELTS = session.exam_type === "IELTS";
  const maxScore = isIELTS ? 9 : 12;
  const overallScore = session.overall_score ?? 0;
  const scoreColor = getScoreColor(overallScore, maxScore);
  const minutes = Math.floor((session.duration_seconds ?? 0) / 60);
  const seconds = (session.duration_seconds ?? 0) % 60;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Feedback Report</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {session.exam_type} {session.part ? `· ${session.part}` : ""} · {session.topic}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          {minutes}m {seconds}s
        </div>
      </div>

      {/* Overall score */}
      <div
        className="p-8 rounded-2xl text-center space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
          Estimated Score
        </p>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {session.estimated_band ?? "—"}
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {isIELTS ? "Based on IELTS official band descriptors" : "Based on CELPIP official level descriptors"}
        </p>
      </div>

      {/* Per-question breakdowns */}
      {session.responses.map((r, i) => {
        const rScore = r.overall_score ?? 0;
        const color = getScoreColor(rScore, maxScore);

        const criteria = isIELTS
          ? [
              { key: "Fluency & Coherence", score: r.fluency_coherence ?? 0 },
              { key: "Lexical Resource", score: r.lexical_resource ?? 0 },
              { key: "Grammatical Range", score: r.grammatical_range ?? 0 },
              { key: "Pronunciation", score: r.pronunciation ?? 0 },
            ]
          : [
              { key: "Content & Coherence", score: r.content_coherence ?? 0 },
              { key: "Vocabulary", score: r.vocabulary ?? 0 },
              { key: "Listenability", score: r.listenability ?? 0 },
              { key: "Task Fulfillment", score: r.task_fulfillment ?? 0 },
            ];

        return (
          <div
            key={r.response_id}
            className="p-6 rounded-2xl space-y-5"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                  Question {i + 1}
                </p>
                <p className="font-medium" style={{ color: "var(--foreground)" }}>{r.question_text}</p>
              </div>
              <div
                className="shrink-0 text-xl font-black px-4 py-1.5 rounded-xl"
                style={{ background: "#1e293b", color }}
              >
                {rScore.toFixed(1)}
              </div>
            </div>

            <div className="space-y-3">
              {criteria.map(({ key, score }) => (
                <ScoreBar key={key} label={key} score={score} max={maxScore} />
              ))}
            </div>

            {r.transcript && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Your Response (Transcript)
                </p>
                <div
                  className="p-4 rounded-xl text-sm leading-relaxed"
                  style={{ background: "#0f172a", border: "1px solid var(--card-border)", color: "var(--muted)" }}
                >
                  {r.transcript}
                </div>
              </div>
            )}

            {r.feedback && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  AI Feedback
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{r.feedback}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary tips from last response if available */}
      {session.responses.length > 0 && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <BookOpen size={18} style={{ color: "var(--accent)" }} />
            Keep Improving
          </h2>
          <ul className="space-y-3">
            {[
              "Review your transcripts and look for repeated grammar errors.",
              "Practise extending answers with 'for example…' and 'such as…'.",
              "Record yourself daily for 5 minutes on a random topic.",
              "Focus on the criteria where your score was lowest this session.",
            ].map((tip, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/setup"
          className="flex-1 py-3 rounded-xl font-semibold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "var(--accent)" }}
        >
          <Mic size={16} /> Practice Again
        </Link>
        <Link
          href="/history"
          className="flex-1 py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
        >
          View History <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
