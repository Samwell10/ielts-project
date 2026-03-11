"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, BookOpen, CheckCircle, ChevronRight, Clock, XCircle,
} from "lucide-react";
import { type ReadingAttemptRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

interface FullQuestion {
  question_id: string;
  question_type: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  accepted_answers?: string[];
}

const READING_TIPS = [
  "Skim the passage for the main idea before answering questions — it saves time.",
  "For True/False/Not Given: 'Not Given' means the text says nothing about it; don't infer.",
  "Underline keywords in fill-in questions, then scan the passage for matching phrases.",
  "Matching headings: eliminate obvious wrong options first, then decide between remaining ones.",
];

const TYPE_LABEL: Record<string, string> = {
  mcq: "MCQ",
  tfng: "T/F/NG",
  matching: "Matching",
  fill_in: "Fill-in",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  mcq:      { bg: "rgba(139,92,246,0.15)",  color: "#c4b5fd" },
  tfng:     { bg: "rgba(14,165,233,0.15)",  color: "#7dd3fc" },
  matching: { bg: "rgba(245,158,11,0.15)",  color: "#fcd34d" },
  fill_in:  { bg: "rgba(16,185,129,0.15)",  color: "#6ee7b7" },
};

function isCorrect(q: FullQuestion, userAns: string): boolean {
  const ua = userAns.trim().toLowerCase();
  if (q.question_type === "fill_in") {
    const accepted = (q.accepted_answers ?? [q.correct_answer]).map((a) => a.toLowerCase());
    return accepted.includes(ua);
  }
  return ua === q.correct_answer.toLowerCase();
}

export default function ReadingFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<ReadingAttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passageOpen, setPassageOpen] = useState(false);
  const api = useApi();

  useEffect(() => {
    api.getReadingAttempt(id)
      .then(setAttempt)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
        />
        <p style={{ color: "var(--muted)" }}>Loading your results…</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{error || "Attempt not found."}</p>
        <Link href="/reading/history" className="px-6 py-3 rounded-xl font-semibold text-white inline-block"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}>
          Back to History
        </Link>
      </div>
    );
  }

  const questions: FullQuestion[] = JSON.parse(attempt.questions_json);
  const fullQuestions: FullQuestion[] = JSON.parse(attempt.correct_answers_json);
  const userAnswers: Record<string, string> = attempt.answers_json ? JSON.parse(attempt.answers_json) : {};

  const score = attempt.score ?? 0;
  const total = attempt.total_questions;
  const pct = total > 0 ? score / total : 0;

  const minutes = Math.floor((attempt.time_spent_seconds ?? 0) / 60);
  const seconds = (attempt.time_spent_seconds ?? 0) % 60;

  const scoreColor = pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Reading Results</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {attempt.exam_type} · {attempt.passage_type} · {attempt.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          {minutes}m {seconds}s
        </div>
      </div>

      {/* Score card */}
      <div
        className="p-8 rounded-2xl text-center space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
          Your Score
        </p>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {score} <span className="text-3xl font-bold" style={{ color: "var(--muted)" }}>/ {total}</span>
        </div>
        <div className="text-2xl font-bold" style={{ color: scoreColor }}>
          {attempt.estimated_band}
        </div>

        {/* Accuracy bar */}
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
            <span>Accuracy</span>
            <span>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: "var(--card-border)" }}>
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${pct * 100}%`, background: scoreColor }}
            />
          </div>
        </div>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {attempt.exam_type === "IELTS"
            ? "Based on IELTS official Reading band descriptors"
            : "Based on CELPIP official Reading level descriptors"}
        </p>
      </div>

      {/* Per-question review */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Question Review</h2>

        {questions.map((q, i) => {
          const full = fullQuestions.find((fq) => fq.question_id === q.question_id) ?? { ...q, correct_answer: "" };
          const userAns = userAnswers[q.question_id] ?? "";
          const correct = isCorrect(full, userAns);
          const typeStyle = TYPE_COLORS[q.question_type] ?? TYPE_COLORS.mcq;

          return (
            <div
              key={q.question_id}
              className="p-5 rounded-2xl space-y-3"
              style={{
                background: "var(--card)",
                border: `1px solid ${correct ? "rgba(16,185,129,0.3)" : userAns ? "rgba(239,68,68,0.3)" : "var(--card-border)"}`,
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}
                >
                  Q{i + 1}
                </span>
                <span
                  className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: typeStyle.bg, color: typeStyle.color }}
                >
                  {TYPE_LABEL[q.question_type]}
                </span>
                <div className="ml-auto shrink-0">
                  {correct
                    ? <CheckCircle size={18} style={{ color: "var(--success)" }} />
                    : <XCircle size={18} style={{ color: userAns ? "var(--danger)" : "var(--muted)" }} />
                  }
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--foreground)" }}>
                {q.question_text}
              </p>

              {/* Answer display */}
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2 flex-wrap">
                  <span style={{ color: "var(--muted)" }}>Your answer:</span>
                  <span
                    className="font-semibold"
                    style={{ color: correct ? "var(--success)" : userAns ? "var(--danger)" : "var(--muted)" }}
                  >
                    {userAns || "Not answered"}
                  </span>
                </div>
                {!correct && (
                  <div className="flex gap-2 flex-wrap">
                    <span style={{ color: "var(--muted)" }}>Correct answer:</span>
                    <span className="font-semibold" style={{ color: "var(--success)" }}>
                      {full.correct_answer}
                    </span>
                  </div>
                )}
              </div>

              {full.explanation && (
                <p className="text-xs leading-relaxed p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", color: "var(--muted)", border: "1px solid var(--card-border)" }}>
                  {full.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Passage (collapsible) */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <button
          onClick={() => setPassageOpen((o) => !o)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: "#10b981" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              Original Passage
            </span>
          </div>
          <ChevronRight
            size={16}
            style={{ color: "var(--muted)", transform: passageOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
          />
        </button>
        {passageOpen && (
          <div className="px-5 pb-5">
            <h3 className="font-bold mb-3" style={{ color: "var(--foreground)" }}>{attempt.passage_title}</h3>
            <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
              {attempt.passage_body}
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <BookOpen size={18} style={{ color: "#10b981" }} />
          Keep Improving
        </h2>
        <ul className="space-y-3">
          {READING_TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3">
              <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
              <span className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link
          href="/dashboard"
          className="flex-1 py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
        >
          Back to Dashboard
        </Link>
        <Link
          href="/reading"
          className="flex-1 py-3 rounded-xl font-semibold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
        >
          <BookOpen size={16} /> Try another Reading
        </Link>
      </div>
    </div>
  );
}
