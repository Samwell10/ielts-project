"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, CheckCircle, ChevronRight, Clock, Headphones, Volume2, XCircle,
} from "lucide-react";
import { type ListeningAttemptRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FullQuestion {
  question_id: string;
  question_type: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  accepted_answers?: string[];
}

const LISTENING_TIPS = [
  "Listen to the audio all the way through once before reading the questions — get the gist first.",
  "For fill-in answers, spelling must be exact; listen carefully for names, numbers, and technical terms.",
  "MCQ distractors often use words from the audio; focus on the overall meaning, not just keywords.",
  "In Section 3 / Part 2 discussions, track who says what — each speaker may give different information.",
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  mcq:     { bg: "rgba(99,102,241,0.15)",  color: "#a5b4fc" },
  fill_in: { bg: "rgba(16,185,129,0.15)",  color: "#6ee7b7" },
};

// Colour-code speaker lines in the transcript
function formatTranscript(text: string) {
  const SPEAKER_COLORS: Record<string, string> = {
    "Speaker 1": "#a5b4fc",  // indigo
    "Speaker 2": "#93c5fd",  // blue
    "Speaker 3": "#6ee7b7",  // teal
  };

  return text.split("\n").map((line, i) => {
    const match = line.match(/^(Speaker \d):\s*(.*)/);
    if (match) {
      const [, speaker, rest] = match;
      const color = SPEAKER_COLORS[speaker] ?? "var(--muted)";
      return (
        <p key={i} className="mb-1 leading-7">
          <span className="font-bold text-xs mr-2" style={{ color }}>{speaker}:</span>
          <span style={{ color: "var(--foreground)" }}>{rest}</span>
        </p>
      );
    }
    return (
      <p key={i} className="mb-1 leading-7" style={{ color: "var(--muted)" }}>{line}</p>
    );
  });
}

function isCorrect(q: FullQuestion, userAns: string): boolean {
  const ua = userAns.trim().toLowerCase();
  if (q.question_type === "fill_in") {
    const accepted = (q.accepted_answers ?? [q.correct_answer]).map((a) => a.toLowerCase());
    return accepted.includes(ua);
  }
  return ua === q.correct_answer.toLowerCase();
}

export default function ListeningFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<ListeningAttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const api = useApi();

  useEffect(() => {
    api.getListeningAttempt(id)
      .then(setAttempt)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: "#6366f1", borderTopColor: "transparent" }}
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
        <Link href="/listening/history" className="px-6 py-3 rounded-xl font-semibold text-white inline-block"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
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
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Listening Results</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {attempt.exam_type} · {attempt.section_type} · {attempt.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          {minutes}m {seconds}s
        </div>
      </div>

      {/* Audio replay */}
      <div className="p-5 rounded-2xl space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <Volume2 size={15} style={{ color: "#6366f1" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {attempt.section_title}
          </p>
        </div>
        {attempt.audio_url ? (
          <audio
            controls
            className="w-full"
            style={{ colorScheme: "dark" }}
            src={`${BASE}${attempt.audio_url}`}
          >
            Your browser does not support audio playback.
          </audio>
        ) : (
          <p className="text-xs px-3 py-2 rounded-xl"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
            Audio was not available for this session.
          </p>
        )}
      </div>

      {/* Score card */}
      <div className="p-8 rounded-2xl text-center space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
          Your Score
        </p>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {score} <span className="text-3xl font-bold" style={{ color: "var(--muted)" }}>/ {total}</span>
        </div>
        {attempt.estimated_band && (
          <div className="text-2xl font-bold" style={{ color: scoreColor }}>
            {attempt.estimated_band}
          </div>
        )}

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
            ? "Based on IELTS official Listening band descriptors"
            : "Based on CELPIP official Listening level descriptors"}
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
                <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>
                  Q{i + 1}
                </span>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: typeStyle.bg, color: typeStyle.color }}>
                  {q.question_type === "mcq" ? "MCQ" : "Fill-in"}
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

              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2 flex-wrap">
                  <span style={{ color: "var(--muted)" }}>Your answer:</span>
                  <span className="font-semibold"
                    style={{ color: correct ? "var(--success)" : userAns ? "var(--danger)" : "var(--muted)" }}>
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

      {/* Transcript (collapsible) */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <button
          onClick={() => setTranscriptOpen((o) => !o)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-2">
            <Headphones size={16} style={{ color: "#6366f1" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              Full Transcript
            </span>
          </div>
          <ChevronRight
            size={16}
            style={{
              color: "var(--muted)",
              transform: transcriptOpen ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {transcriptOpen && (
          <div className="px-5 pb-5">
            <h3 className="font-bold mb-3 text-sm" style={{ color: "var(--foreground)" }}>
              {attempt.section_title}
            </h3>
            <div className="text-sm">
              {formatTranscript(attempt.script_text)}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-6 rounded-2xl space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Headphones size={18} style={{ color: "#6366f1" }} />
          Keep Improving
        </h2>
        <ul className="space-y-3">
          {LISTENING_TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3">
              <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "#6366f1" }} />
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
          href="/listening"
          className="flex-1 py-3 rounded-xl font-semibold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}
        >
          <Headphones size={16} /> Try another Listening
        </Link>
      </div>
    </div>
  );
}
