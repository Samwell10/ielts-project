"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, Square, ChevronRight, Clock, Volume2, AlertCircle } from "lucide-react";
import type { ExamType, Difficulty, IELTSPart } from "@/types";
import { useApi } from "@/hooks/useApi";

type Phase = "loading" | "intro" | "question" | "recording" | "processing" | "between" | "done" | "error";

function Timer({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  const isLow = seconds < 30;
  return (
    <span
      className="font-mono text-lg font-bold"
      style={{ color: isLow ? "var(--danger)" : "var(--foreground)" }}
    >
      {m}:{s}
    </span>
  );
}

function AudioWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1 h-12">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            background: active ? "var(--accent)" : "var(--card-border)",
            animation: active ? `wave ${0.5 + i * 0.07}s ease-in-out infinite alternate` : "none",
            height: active ? undefined : "8px",
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 8px; }
          to { height: 40px; }
        }
      `}</style>
    </div>
  );
}

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = useApi();

  const examType = (searchParams.get("examType") || "IELTS") as ExamType;
  const difficulty = (searchParams.get("difficulty") || "Intermediate") as Difficulty;
  const topic = searchParams.get("topic") || "General";
  const part = (searchParams.get("part") || "Part 1") as IELTSPart;

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [processingLabel, setProcessingLabel] = useState("Processing your response...");

  // Stable refs for use inside callbacks
  const currentQRef = useRef(0);
  const elapsedRef = useRef(0);
  const questionsRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string>("");
  const responseIdsRef = useRef<string[]>([]);
  const transcriptsRef = useRef<string[]>([]);

  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── Load questions + create session on mount ──────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        // 1. Generate questions from GPT-4o
        const { questions: qs } = await api.generateQuestions({
          exam_type: examType,
          difficulty,
          topic,
          part: examType === "IELTS" ? part : undefined,
          count: examType === "IELTS" && part === "Part 2" ? 1 : 3,
        });
        setQuestions(qs);
        questionsRef.current = qs;

        // 2. Create session in database
        const { session_id } = await api.createSession({
          exam_type: examType,
          difficulty,
          topic,
          part: examType === "IELTS" ? part : undefined,
        });
        sessionIdRef.current = session_id;

        setPhase("intro");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setErrorMsg(`Failed to start session: ${msg}`);
        setPhase("error");
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Total elapsed timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "loading" || phase === "intro" || phase === "done" || phase === "error") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Per-question countdown ────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
      setIsRecording(false);
      setPhase("processing");
    }
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const cd = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(cd);
  }, [phase, stopRecording]);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Process audio after recording stops ──────────────────────────────────
  const processRecording = useCallback(async (audioBlob: Blob) => {
    const qIndex = currentQRef.current;
    const qs = questionsRef.current;
    const sessionId = sessionIdRef.current;

    try {
      // Step 1: Transcribe (returns Gemini file URI for audio-based pronunciation scoring)
      setProcessingLabel("Transcribing your response...");
      const { transcript, duration_seconds, audio_url, gemini_file_uri, gemini_file_name } =
        await api.uploadAndTranscribe(audioBlob);
      transcriptsRef.current = [...transcriptsRef.current, transcript];

      // Step 2: Save response row
      setProcessingLabel("Saving response...");
      const { response_id } = await api.addResponse(sessionId, {
        question_index: qIndex,
        question_text: qs[qIndex],
        transcript,
        audio_url,
        duration_seconds: duration_seconds ? Math.round(duration_seconds) : undefined,
      });
      responseIdsRef.current = [...responseIdsRef.current, response_id];

      // Step 3: AI evaluation — pass audio URI so Gemini can score pronunciation from real audio
      setProcessingLabel("Evaluating with AI...");
      await api.evaluateResponse({
        session_id: sessionId,
        response_id,
        exam_type: examType,
        transcript,
        question_text: qs[qIndex],
        difficulty,
        gemini_file_uri,
        gemini_file_name,
      });

      // Step 4: Advance
      const isLast = qIndex >= qs.length - 1;
      if (isLast) {
        setProcessingLabel("Finalising your session...");
        await api.completeSession(sessionId, elapsedRef.current);
        setPhase("done");
      } else {
        setPhase("between");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErrorMsg(`Processing failed: ${msg}`);
      setPhase("error");
    }
  }, [examType, difficulty]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        processRecording(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setIsRecording(true);
      setTimeLeft(120);
      setPhase("recording");
    } catch {
      alert("Microphone access is required. Please allow microphone permission and try again.");
    }
  }, [processRecording]);

  function nextQuestion() {
    setCurrentQ((q) => q + 1);
    setPhase("question");
    setTimeLeft(120);
  }

  function goToFeedback() {
    router.push(`/feedback/session/${sessionIdRef.current}`);
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-24">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
        <p style={{ color: "var(--muted)" }}>Generating your questions with AI...</p>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#450a0a" }}
        >
          <AlertCircle size={28} style={{ color: "var(--danger)" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Something went wrong
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
        </div>
        <button
          onClick={() => router.push("/setup")}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Back to Setup
        </button>
      </div>
    );
  }

  // ── Render: intro ─────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#312e81" }}
        >
          <Volume2 size={32} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Ready to Begin?
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {examType} · {examType === "IELTS" ? part : "Speaking Task"} · {difficulty} · {topic}
          </p>
        </div>
        <div
          className="p-5 rounded-2xl text-left space-y-3 text-sm"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>Instructions:</p>
          <ul className="space-y-2 list-disc list-inside" style={{ color: "var(--muted)" }}>
            <li>You will be asked {questions.length} question{questions.length !== 1 ? "s" : ""}.</li>
            <li>Press <strong style={{ color: "var(--foreground)" }}>Start Recording</strong> when ready.</li>
            <li>You have up to 2 minutes per answer.</li>
            <li>Speak clearly and at a natural pace.</li>
            <li>Your responses are transcribed and evaluated automatically by AI.</li>
          </ul>
        </div>
        <button
          onClick={() => setPhase("question")}
          className="px-8 py-3 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Begin Session
        </button>
      </div>
    );
  }

  // ── Render: done ──────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#14532d" }}
        >
          <ChevronRight size={32} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Session Complete!
          </h1>
          <p style={{ color: "var(--muted)" }}>
            Great job! You answered all {questions.length} question{questions.length !== 1 ? "s" : ""}.
            {" "}Total time: <Timer seconds={elapsed} />
          </p>
        </div>
        <button
          onClick={goToFeedback}
          className="px-8 py-3 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          View Feedback &amp; Scores
        </button>
      </div>
    );
  }

  // ── Render: active session ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded"
          style={{ background: "#312e81", color: "#a5b4fc" }}
        >
          {examType} {examType === "IELTS" ? part : ""}
        </span>
        <div className="flex items-center gap-2" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          <Timer seconds={elapsed} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round((currentQ / questions.length) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "var(--card-border)" }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${(currentQ / questions.length) * 100}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className="p-6 rounded-2xl space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Question {currentQ + 1}
        </p>
        <p className="text-xl font-medium leading-relaxed" style={{ color: "var(--foreground)" }}>
          {questions[currentQ]}
        </p>
      </div>

      {/* Recording / processing area */}
      <div
        className="p-6 rounded-2xl space-y-4 text-center"
        style={{
          background: "var(--card)",
          border: `1px solid ${isRecording ? "var(--accent)" : "var(--card-border)"}`,
        }}
      >
        {phase === "processing" ? (
          <div className="space-y-3 py-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>{processingLabel}</p>
          </div>
        ) : phase === "between" ? (
          <div className="space-y-4">
            <p className="font-medium" style={{ color: "var(--success)" }}>Response recorded!</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Ready for the next question?</p>
            <button
              onClick={nextQuestion}
              className="px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 mx-auto"
              style={{ background: "var(--accent)" }}
            >
              Next Question <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <AudioWave active={isRecording} />
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                <span>Time remaining:</span>
                <Timer seconds={timeLeft} />
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  <Mic size={18} /> Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: "var(--danger)" }}
                >
                  <Square size={16} /> Stop Recording
                </button>
              )}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--danger)" }} />
                <span className="text-xs" style={{ color: "var(--danger)" }}>Recording</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tip */}
      <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
        {examType === "IELTS" && part === "Part 2"
          ? "Tip: Use the first minute to organise your thoughts before speaking."
          : "Tip: Speak naturally and extend your answers with examples and reasons."}
      </p>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>Loading session...</div>
    }>
      <SessionContent />
    </Suspense>
  );
}
