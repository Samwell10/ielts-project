"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, ChevronRight, Clock, Headphones, Volume2 } from "lucide-react";
import { type ListeningQuestionFE } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Question card (MCQ or fill_in) ────────────────────────────────────────────
function QuestionCard({
  q, index, answer, onAnswer, disabled,
}: {
  q: ListeningQuestionFE; index: number; answer: string;
  onAnswer: (qid: string, val: string) => void; disabled: boolean;
}) {
  return (
    <div
      className="p-4 rounded-2xl space-y-3 transition-all"
      style={{
        background: "var(--card)",
        border: answer && !disabled
          ? "1px solid rgba(99,102,241,0.4)"
          : "1px solid var(--card-border)",
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-xs font-black px-2 py-0.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>
          {index + 1}
        </span>
        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg"
          style={q.question_type === "mcq"
            ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }
            : { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
          {q.question_type === "mcq" ? "MCQ" : "Fill-in"}
        </span>
        {answer && !disabled && (
          <CheckCircle size={14} className="ml-auto mt-0.5 shrink-0" style={{ color: "#6ee7b7" }} />
        )}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        {q.question_text}
      </p>

      {q.question_type === "fill_in" ? (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(q.question_id, e.target.value)}
          placeholder="Type your answer…"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "#0f172a", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
        />
      ) : (
        <div className="space-y-1.5">
          {(q.options ?? []).map((opt) => {
            const val = opt.split(".")[0].trim(); // extract "A", "B", etc.
            const isSelected = answer === val;
            return (
              <button
                key={opt}
                onClick={() => onAnswer(q.question_id, val)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
                style={isSelected ? {
                  background: "rgba(99,102,241,0.14)",
                  border: "1px solid rgba(99,102,241,0.5)",
                  color: "#a5b4fc",
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

// ── Main session ───────────────────────────────────────────────────────────────
function ListeningSession() {
  const router = useRouter();
  const params = useSearchParams();
  const api = useApi();

  const examType = params.get("examType") ?? "IELTS";
  const sectionType = params.get("sectionType") ?? "Section 1";
  const difficulty = params.get("difficulty") ?? "Intermediate";

  type Phase = "generating" | "ready" | "listening" | "answering" | "submitting" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("generating");
  const [errorMsg, setErrorMsg] = useState("");
  const [genProgress, setGenProgress] = useState(0);

  const [sectionTitle, setSectionTitle] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ListeningQuestionFE[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  const correctAnswersRef = useRef<string>("");
  const questionsJsonRef = useRef<string>("");
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scriptOpen, setScriptOpen] = useState(false);

  // Fake progress bar for generation phase (ease-out 0→90% over 20s, jumps to 100% on resolve)
  useEffect(() => {
    if (phase !== "generating") return;
    let v = 0;
    const id = setInterval(() => {
      v += (90 - v) * 0.06;
      setGenProgress(Math.min(Math.round(v), 89));
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  // Load script + audio on mount
  useEffect(() => {
    api.generateListeningScript({ exam_type: examType, section_type: sectionType, difficulty })
      .then((result) => {
        setSectionTitle(result.section_title);
        setScriptText(result.script_text);
        setAudioUrl(result.audio_url ?? null);
        setQuestions(result.questions);
        setTimeLeft(result.time_limit_minutes * 60);
        correctAnswersRef.current = result.correct_answers_json;
        questionsJsonRef.current = JSON.stringify(result.questions);
        setGenProgress(100);
        // Brief pause so 100% is visible, then show ready card
        setTimeout(() => setPhase("ready"), 400);
      })
      .catch((e: Error) => { setErrorMsg(e.message); setPhase("error"); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    if (phase !== "answering") return;
    setPhase("submitting");
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const result = await api.submitListening({
        exam_type: examType,
        section_type: sectionType,
        difficulty,
        section_title: sectionTitle,
        script_text: scriptText,
        audio_url: audioUrl ?? undefined,
        questions_json: questionsJsonRef.current,
        correct_answers_json: correctAnswersRef.current,
        user_answers: answers,
        time_spent_seconds: elapsed,
      });
      setPhase("done");
      router.push(`/listening/feedback/${result.attempt_id}`);
    } catch (e: unknown) {
      setErrorMsg((e as Error).message);
      setPhase("error");
    }
  }, [phase, answers, sectionTitle, scriptText, audioUrl, examType, sectionType, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown (only in answering phase)
  useEffect(() => {
    if (phase !== "answering") return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleSubmit]);

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isTimeLow = phase === "answering" && timeLeft > 0 && timeLeft < 180;

  // ── Generating ───────────────────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
          <Headphones size={28} color="white" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
            Generating your listening passage…
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Creating script, questions and audio — this takes 20–30 seconds.
          </p>
        </div>
        {/* Fake progress bar */}
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>Generating audio script…</span>
            <span>{genProgress}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${genProgress}%`, background: "linear-gradient(90deg, #6366f1, #3b82f6)", transition: "width 0.5s ease-out" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Ready (audio+questions loaded, show transition card) ──────────────────────
  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <CheckCircle size={28} style={{ color: "var(--success)" }} />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-xl" style={{ color: "var(--foreground)" }}>Audio is ready!</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Listen to the full audio clip, then answer the questions when you&apos;re ready.
            Your timer only starts after you click &ldquo;Start answering&rdquo;.
          </p>
        </div>
        <button
          onClick={() => setPhase("listening")}
          className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}
        >
          <Volume2 size={18} /> Listen to audio →
        </button>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-20">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{errorMsg}</p>
        <button onClick={() => router.push("/listening")}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
          Back to Listening Setup
        </button>
      </div>
    );
  }

  // ── Submitting / Done ────────────────────────────────────────────────────────
  if (phase === "submitting" || phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
          {phase === "done"
            ? <CheckCircle size={28} style={{ color: "#a5b4fc" }} />
            : <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "#6366f1", borderTopColor: "transparent" }} />
          }
        </div>
        <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
          {phase === "done" ? "Submitted! Redirecting…" : "Grading your answers…"}
        </p>
      </div>
    );
  }

  // ── Listening / Answering phases ──────────────────────────────────────────────
  const isListening = phase === "listening"; // audio playing, questions disabled

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: "rgba(14,21,53,0.9)", backdropFilter: "blur(16px)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
            {examType} · {sectionType}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{difficulty}</span>
        </div>

        <div className="flex items-center gap-4">
          {!isListening && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {answeredCount} / {questions.length} answered
            </span>
          )}
          {!isListening && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5" style={{ color: isTimeLow ? "var(--danger)" : "var(--muted)" }}>
                <Clock size={14} />
                <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
              </div>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>⏱ Time to answer</span>
            </div>
          )}
        </div>
      </div>

      {/* Audio player */}
      <div className="p-6 rounded-2xl space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <Volume2 size={16} style={{ color: "#6366f1" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{sectionTitle}</p>
        </div>

        {audioUrl ? (
          <audio
            controls
            className="w-full"
            style={{ colorScheme: "dark" }}
            src={`${BASE}${audioUrl}`}
          >
            Your browser does not support audio playback.
          </audio>
        ) : (
          /* Fallback: show script text when TTS failed */
          <div className="space-y-2">
            <p className="text-xs px-3 py-2 rounded-xl"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
              Audio generation was unavailable. Read the script below instead.
            </p>
            <div className="max-h-64 overflow-y-auto p-4 rounded-xl text-sm leading-7 whitespace-pre-wrap"
              style={{ background: "#0f172a", color: "var(--muted)" }}>
              {scriptText}
            </div>
          </div>
        )}

        {audioUrl && (
          <button
            onClick={() => setScriptOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--muted)" }}
          >
            <ChevronRight size={13} style={{ transform: scriptOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            {scriptOpen ? "Hide" : "Show"} transcript
          </button>
        )}
        {audioUrl && scriptOpen && (
          <div className="mt-2 p-4 rounded-xl text-sm leading-7 whitespace-pre-wrap max-h-64 overflow-y-auto"
            style={{ background: "#0f172a", color: "var(--muted)" }}>
            {scriptText}
          </div>
        )}
      </div>

      {/* Transition card: audio finished → start answering */}
      {isListening && (
        <div className="p-6 rounded-2xl space-y-4 text-center"
          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <p className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
            Done listening?
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Your answering timer starts when you click the button below. You can re-listen above before starting.
          </p>
          <button
            onClick={() => setPhase("answering")}
            className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
          >
            Start answering <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Questions */}
      <div className={`space-y-3 ${isListening ? "pointer-events-none opacity-40" : ""}`}>
        {!isListening && (
          /* Progress bar */
          <div className="w-full h-1 rounded-full mb-4" style={{ background: "var(--card-border)" }}>
            <div className="h-1 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%`, background: "linear-gradient(90deg, #6366f1, #3b82f6)" }} />
          </div>
        )}

        {questions.map((q, i) => (
          <QuestionCard
            key={q.question_id}
            q={q}
            index={i}
            answer={answers[q.question_id] ?? ""}
            onAnswer={(qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }))}
            disabled={isListening}
          />
        ))}

        {!isListening && (
          <>
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-2xl font-semibold text-white mt-4"
              style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}
            >
              Submit Answers ({answeredCount}/{questions.length})
            </button>
            {answeredCount < questions.length && (
              <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
                {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ListeningSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#6366f1", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    }>
      <ListeningSession />
    </Suspense>
  );
}
