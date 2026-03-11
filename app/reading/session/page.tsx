"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BookOpen, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { type ReadingQuestionFE } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

// ── Timer display ──────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Question renderers ─────────────────────────────────────────────────────────
function QuestionCard({
  q,
  index,
  answer,
  onAnswer,
}: {
  q: ReadingQuestionFE;
  index: number;
  answer: string;
  onAnswer: (qid: string, val: string) => void;
}) {
  const typeLabel: Record<string, string> = {
    mcq: "MCQ",
    tfng: "T/F/NG",
    matching: "Matching",
    fill_in: "Fill-in",
  };
  const typeBg: Record<string, string> = {
    mcq: "rgba(139,92,246,0.15)",
    tfng: "rgba(14,165,233,0.15)",
    matching: "rgba(245,158,11,0.15)",
    fill_in: "rgba(16,185,129,0.15)",
  };
  const typeColor: Record<string, string> = {
    mcq: "#c4b5fd",
    tfng: "#7dd3fc",
    matching: "#fcd34d",
    fill_in: "#6ee7b7",
  };

  const bg = typeBg[q.question_type] ?? typeBg.mcq;
  const color = typeColor[q.question_type] ?? typeColor.mcq;

  return (
    <div
      className="p-4 rounded-2xl space-y-3"
      style={{ background: "var(--card)", border: answer ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--card-border)" }}
    >
      {/* Question header */}
      <div className="flex items-start gap-2">
        <span
          className="shrink-0 text-xs font-black px-2 py-0.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}
        >
          {index + 1}
        </span>
        <span
          className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg"
          style={{ background: bg, color }}
        >
          {typeLabel[q.question_type]}
        </span>
        {answer && <CheckCircle size={14} className="shrink-0 mt-0.5 ml-auto" style={{ color: "var(--success)" }} />}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        {q.question_text}
      </p>

      {/* Renderers by type */}
      {q.question_type === "fill_in" ? (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(q.question_id, e.target.value)}
          placeholder="Type your answer…"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: "#0f172a",
            border: "1px solid var(--card-border)",
            color: "var(--foreground)",
          }}
        />
      ) : (
        <div className="space-y-1.5">
          {(q.options ?? []).map((opt) => {
            const val = q.question_type === "mcq" ? opt.split(".")[0].trim() : opt;
            const isSelected = answer === val;
            return (
              <button
                key={opt}
                onClick={() => onAnswer(q.question_id, val)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
                style={isSelected ? {
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.45)",
                  color: "#6ee7b7",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--card-border)",
                  color: "var(--muted)",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main session component ─────────────────────────────────────────────────────
function ReadingSession() {
  const router = useRouter();
  const params = useSearchParams();
  const api = useApi();

  const examType = params.get("examType") ?? "IELTS";
  const passageType = params.get("passageType") ?? "Academic";
  const difficulty = params.get("difficulty") ?? "Intermediate";

  type Phase = "loading" | "reading" | "submitting" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const [passageTitle, setPassageTitle] = useState("");
  const [passageBody, setPassageBody] = useState("");
  const [questions, setQuestions] = useState<ReadingQuestionFE[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Store correct answers on client without exposing to DOM
  const correctAnswersRef = useRef<string>("");
  const questionsJsonRef = useRef<string>("");
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptKeyRef = useRef<string>("");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);

  // Load passage on mount
  useEffect(() => {
    api.generateReadingPassage({ exam_type: examType, passage_type: passageType, difficulty })
      .then((result) => {
        setPassageTitle(result.passage_title);
        setPassageBody(result.passage_body);
        setQuestions(result.questions);
        setTimeLeft(result.time_limit_minutes * 60);
        correctAnswersRef.current = result.correct_answers_json;
        questionsJsonRef.current = JSON.stringify(result.questions);
        startTimeRef.current = Date.now();

        // Check for saved draft
        const key = `reading_draft_${examType}_${passageType}_${result.passage_title.slice(0, 20)}`;
        attemptKeyRef.current = key;
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const { answers: savedAnswers } = JSON.parse(saved);
            if (savedAnswers && Object.keys(savedAnswers).length > 0) {
              setAnswers(savedAnswers);
              setResumePrompt(true);
            }
          }
        } catch { /* ignore */ }

        setPhase("reading");
      })
      .catch((e: Error) => {
        setErrorMsg(e.message);
        setPhase("error");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save answers to localStorage on every change
  useEffect(() => {
    if (phase !== "reading" || !attemptKeyRef.current) return;
    try {
      localStorage.setItem(attemptKeyRef.current, JSON.stringify({ answers, timestamp: Date.now() }));
    } catch { /* ignore */ }
  }, [answers, phase]);

  // beforeunload guard
  useEffect(() => {
    if (phase !== "reading") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const doSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setPhase("submitting");
    try {
      // Clear saved draft on submit
      if (attemptKeyRef.current) localStorage.removeItem(attemptKeyRef.current);
      const result = await api.submitReading({
        exam_type: examType,
        passage_type: passageType,
        difficulty,
        passage_title: passageTitle,
        passage_body: passageBody,
        questions_json: questionsJsonRef.current,
        correct_answers_json: correctAnswersRef.current,
        user_answers: answers,
        time_spent_seconds: elapsed,
      });
      setPhase("done");
      router.push(`/reading/feedback/${result.attempt_id}`);
    } catch (e: unknown) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    }
  }, [answers, passageTitle, passageBody, examType, passageType, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (force = false) => {
    if (phase !== "reading") return;
    if (force) {
      // Called by timer auto-submit
      await doSubmit();
    } else {
      // Show review modal first
      setShowReviewModal(true);
    }
  }, [phase, doSubmit]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "reading") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleSubmit]);

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isTimeLow = timeLeft > 0 && timeLeft < 300;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
        />
        <p style={{ color: "var(--muted)" }}>Generating your reading passage…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-20">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{errorMsg}</p>
        <button
          onClick={() => router.push("/reading")}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
        >
          Back to Reading Setup
        </button>
      </div>
    );
  }

  // ── Submitting / Done ────────────────────────────────────────────────────────
  if (phase === "submitting" || phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          {phase === "done"
            ? <CheckCircle size={28} style={{ color: "var(--success)" }} />
            : <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          }
        </div>
        <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
          {phase === "done" ? "Submitted! Redirecting…" : "Grading your answers…"}
        </p>
      </div>
    );
  }

  // ── Reading phase ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Answer review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl p-6 space-y-5"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <h2 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Review your answers</h2>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => {
                const answered = !!answers[q.question_id];
                return (
                  <div key={q.question_id}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: answered ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      border: `1px solid ${answered ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.35)"}`,
                      color: answered ? "var(--success)" : "#fcd34d",
                    }}>
                    Q{i + 1}
                    {answered ? <CheckCircle size={11} /> : <span className="text-xs">—</span>}
                  </div>
                );
              })}
            </div>
            {answeredCount < questions.length && (
              <p className="text-xs px-3 py-2 rounded-xl"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
                {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} left unanswered — they will be marked incorrect.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}>
                Go back
              </button>
              <button onClick={() => { setShowReviewModal(false); doSubmit(); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}>
                Confirm &amp; Submit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume prompt */}
      {resumePrompt && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-2xl text-sm"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--success)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} />
            <span>Draft restored — your previous answers have been loaded.</span>
          </div>
          <button onClick={() => { setResumePrompt(false); setAnswers({}); }}
            className="shrink-0 text-xs opacity-70 hover:opacity-100" style={{ color: "var(--muted)" }}>
            Start fresh
          </button>
        </div>
      )}

      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-2xl mb-6"
        style={{ background: "rgba(14,21,53,0.9)", backdropFilter: "blur(16px)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg tag-teal"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", color: "#6ee7b7" }}>
            {examType} · {passageType}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{difficulty}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {answeredCount} / {questions.length} answered
          </span>
          <div className="flex items-center gap-1.5" style={{ color: isTimeLow ? "var(--danger)" : "var(--muted)" }}>
            <Clock size={14} />
            <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-6" style={{ background: "var(--card-border)" }}>
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%`, background: "linear-gradient(90deg, #10b981, #0891b2)" }}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

        {/* Left — Passage */}
        <div
          className="p-6 rounded-2xl space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} style={{ color: "#10b981" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Reading Passage
            </p>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{passageTitle}</h2>
          <div className="text-sm leading-7 whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
            {passageBody}
          </div>
        </div>

        {/* Right — Questions */}
        <div id="questions" className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.question_id}
              q={q}
              index={i}
              answer={answers[q.question_id] ?? ""}
              onAnswer={(qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }))}
            />
          ))}

          {/* Submit button */}
          <button
            onClick={() => handleSubmit(false)}
            className="w-full py-3.5 rounded-2xl font-semibold text-white mt-4"
            style={{ background: "linear-gradient(135deg, #10b981, #0891b2)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
          >
            Submit Answers ({answeredCount}/{questions.length})
          </button>

          {/* Jump to questions anchor (mobile) */}
          <a href="#questions" className="flex items-center justify-center gap-1.5 text-xs lg:hidden"
            style={{ color: "var(--muted)" }}>
            <ChevronDown size={13} /> Jump to questions
          </a>

          {answeredCount < questions.length && (
            <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
              {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} left unanswered
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReadingSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    }>
      <ReadingSession />
    </Suspense>
  );
}
