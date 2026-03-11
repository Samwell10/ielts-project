"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, AlertCircle, CheckCircle, PenLine } from "lucide-react";
import type { ExamType, Difficulty, WritingTaskType } from "@/types";
import type { ChartData } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

const MIN_WORDS: Record<string, number> = {
  "Task 1 Academic": 150,
  "Task 1 General":  150,
  "Task 2":          250,
  "Task 1 Email":    150,
  "Task 2 Survey":   150,
};

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function Timer({ seconds, danger }: { seconds: number; danger: boolean }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return (
    <span className="font-mono font-bold" style={{ color: danger ? "var(--danger)" : "var(--foreground)" }}>
      {m}:{s}
    </span>
  );
}

// ── Chart colours ─────────────────────────────────────────────────────────────
const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

// ── Bar chart (vertical grouped bars) ────────────────────────────────────────
function BarChart({ data }: { data: ChartData }) {
  const { categories = [], series = [], unit = "", y_label } = data;
  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allVals, 1);

  return (
    <div className="space-y-3">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {series.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2" style={{ height: "150px" }}>
        {y_label && (
          <span className="text-xs shrink-0" style={{ color: "var(--muted)", writingMode: "vertical-rl" as const, transform: "rotate(180deg)" }}>
            {y_label}
          </span>
        )}
        {categories.map((cat, ci) => (
          <div key={cat} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "118px" }}>
              {series.map((s, si) => {
                const pct = ((s.values[ci] ?? 0) / maxVal) * 100;
                return (
                  <div key={s.name} className="flex-1 rounded-t-sm"
                    title={`${s.name ? s.name + ": " : ""}${s.values[ci]}${unit}`}
                    style={{ height: `${Math.max(pct, 1)}%`, background: COLORS[si % COLORS.length] }} />
                );
              })}
            </div>
            <span className="text-center leading-tight truncate w-full"
              style={{ color: "var(--muted)", fontSize: "10px" }}>{cat}</span>
            {series.length === 1 && (
              <span className="font-bold" style={{ color: COLORS[0], fontSize: "10px" }}>
                {series[0].values[ci]}{unit}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line chart (SVG) ──────────────────────────────────────────────────────────
function LineChart({ data }: { data: ChartData }) {
  const { categories = [], series = [], unit = "" } = data;
  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const W = 480, H = 150, PL = 38, PR = 10, PT = 10, PB = 24;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const xStep = categories.length > 1 ? chartW / (categories.length - 1) : 0;
  const gx = (i: number) => PL + i * xStep;
  const gy = (v: number) => PT + (1 - (v - minVal) / range) * chartH;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => minVal + f * range);

  return (
    <div className="space-y-2">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {series.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <div className="w-4 h-0.5" style={{ background: COLORS[i % COLORS.length] }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "160px" }}>
        {gridVals.map((v, i) => {
          const y = gy(v);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">
                {Number.isInteger(v) ? v : v.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => {
          const color = COLORS[si % COLORS.length];
          const pts = s.values.map((v, i) => `${gx(i)},${gy(v)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={gx(i)} cy={gy(v)} r="4" fill={color} stroke="#0f172a" strokeWidth="1.5">
                  <title>{`${s.name ? s.name + ": " : ""}${v}${unit}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {categories.map((cat, i) => (
          <text key={cat} x={gx(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">
            {cat.length > 8 ? cat.slice(0, 7) + "…" : cat}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Table chart ───────────────────────────────────────────────────────────────
function TableChart({ data }: { data: ChartData }) {
  const { headers = [], rows = [] } = data;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--card-border)", color: "var(--muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-sm"
                  style={{
                    borderBottom: ri < rows.length - 1 ? "1px solid var(--card-border)" : "none",
                    color: ci === 0 ? "var(--foreground)" : "var(--muted)",
                    fontWeight: ci === 0 ? "500" : "400",
                  }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pie chart (percentage bars) ───────────────────────────────────────────────
function PieChart({ data }: { data: ChartData }) {
  const { segments = [], unit = "%" } = data;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className="space-y-2.5">
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={seg.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--muted)" }}>{seg.label}</span>
              <span className="font-bold" style={{ color }}>{seg.value}{unit}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--card-border)" }}>
              <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chart dispatcher ──────────────────────────────────────────────────────────
function ChartDisplay({ chartType, chartData }: { chartType: string; chartData: ChartData }) {
  return (
    <div className="mt-3 p-4 rounded-xl" style={{ background: "#0f172a", border: "1px solid var(--card-border)" }}>
      {chartData.title && (
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>{chartData.title}</p>
      )}
      {chartType === "bar"   && <BarChart   data={chartData} />}
      {chartType === "line"  && <LineChart  data={chartData} />}
      {chartType === "table" && <TableChart data={chartData} />}
      {chartType === "pie"   && <PieChart   data={chartData} />}
    </div>
  );
}

// ── Session phases ─────────────────────────────────────────────────────────────
type Phase = "loading" | "planning" | "writing" | "submitting" | "done" | "error";

function WritingSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = useApi();

  const examType   = (searchParams.get("examType")   || "IELTS") as ExamType;
  const taskType   = (searchParams.get("taskType")   || "Task 2") as WritingTaskType;
  const difficulty = (searchParams.get("difficulty") || "Intermediate") as Difficulty;
  const topic      = searchParams.get("topic") || "General";

  const [phase, setPhase]             = useState<Phase>("loading");
  const [promptTitle, setPromptTitle] = useState("");
  const [promptBody, setPromptBody]   = useState("");
  const [chartType, setChartType]     = useState<string | null>(null);
  const [chartData, setChartData]     = useState<ChartData | null>(null);
  const [wordLimit]             = useState(() => MIN_WORDS[taskType] ?? 150);
  const [timeLeft, setTimeLeft] = useState(0);
  const [text, setText]               = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [submissionId, setSubmissionId]   = useState("");
  const [planNotes, setPlanNotes]     = useState("");
  const [planTimeLeft, setPlanTimeLeft] = useState(60);
  const [showLowTimeToast, setShowLowTimeToast] = useState(false);
  const [showAutoSubmitOverlay, setShowAutoSubmitOverlay] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(5);

  const startTimeRef = useRef<number>(Date.now());
  const DRAFT_KEY = `writing_autosave_${examType}_${taskType}`;

  // Load prompt on mount
  useEffect(() => {
    async function init() {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const { text: savedText } = JSON.parse(saved);
          if (savedText) { setText(savedText); setDraftRestored(true); }
        }
      } catch { /* ignore */ }

      try {
        const result = await api.generateWritingPrompt({ exam_type: examType, task_type: taskType, difficulty, topic });
        setPromptTitle(result.prompt_title);
        setPromptBody(result.prompt_body);
        setTimeLeft(result.time_limit_minutes * 60);
        if (result.chart_type && result.chart_data) {
          setChartType(result.chart_type);
          setChartData(result.chart_data);
        }
        startTimeRef.current = Date.now();
        // Show planning modal for essay tasks; skip directly to writing for shorter tasks
        const showPlanning = taskType === "Task 2" || taskType === "Task 2 Survey";
        setPhase(showPlanning ? "planning" : "writing");
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to load prompt.");
        setPhase("error");
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save every 5 seconds
  useEffect(() => {
    if (phase !== "writing") return;
    const id = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, timestamp: Date.now() }));
    }, 5000);
    return () => clearInterval(id);
  }, [phase, text, DRAFT_KEY]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    const currentText = text;
    if (!autoSubmit && countWords(currentText) < wordLimit) return;
    setPhase("submitting");
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      const result = await api.submitWriting({
        exam_type: examType,
        task_type: taskType,
        difficulty,
        prompt_title: promptTitle,
        prompt_body: promptBody,
        response_text: currentText,
        time_spent_seconds: timeSpent,
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmissionId(result.submission_id);
      setPhase("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Submission failed.");
      setPhase("error");
    }
  }, [text, wordLimit, examType, taskType, difficulty, promptTitle, promptBody, DRAFT_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer + T-60 warning + auto-submit overlay
  useEffect(() => {
    if (phase !== "writing") return;
    if (timeLeft <= 0) {
      // Show 5-second overlay before submitting
      setShowAutoSubmitOverlay(true);
      setAutoSubmitCountdown(5);
      return;
    }
    if (timeLeft === 60) setShowLowTimeToast(true);
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft, handleSubmit]);

  // Auto-submit overlay countdown
  useEffect(() => {
    if (!showAutoSubmitOverlay) return;
    if (autoSubmitCountdown <= 0) { handleSubmit(true); return; }
    const id = setTimeout(() => setAutoSubmitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [showAutoSubmitOverlay, autoSubmitCountdown, handleSubmit]);

  const words = countWords(text);
  const underMinimum = words < wordLimit;

  // Planning phase timer
  useEffect(() => {
    if (phase !== "planning") return;
    if (planTimeLeft <= 0) { setPhase("writing"); return; }
    const id = setInterval(() => setPlanTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, planTimeLeft]);

  // ── Phases ────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-4 py-24">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--muted)" }}>Generating your writing prompt...</p>
      </div>
    );
  }

  if (phase === "planning") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Plan your answer</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Use this time to outline your essay. Your notes will not be submitted.
          </p>
        </div>

        {/* Timer pill */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: planTimeLeft < 15 ? "rgba(239,68,68,0.12)" : "rgba(139,92,246,0.12)",
              border: `1px solid ${planTimeLeft < 15 ? "rgba(239,68,68,0.3)" : "rgba(139,92,246,0.3)"}`,
              color: planTimeLeft < 15 ? "var(--danger)" : "var(--accent)" }}>
            <Clock size={14} />
            {Math.floor(planTimeLeft / 60).toString().padStart(2, "0")}:{(planTimeLeft % 60).toString().padStart(2, "0")} planning time
          </div>
        </div>

        {/* Prompt summary */}
        <div className="p-4 rounded-2xl space-y-1"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Prompt</p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{promptTitle}</p>
        </div>

        {/* Notes scratchpad */}
        <textarea
          value={planNotes}
          onChange={(e) => setPlanNotes(e.target.value)}
          placeholder="• Outline your main points here&#10;• Add supporting ideas&#10;• Note vocabulary you want to use"
          className="w-full rounded-2xl p-5 text-sm leading-relaxed resize-none outline-none font-mono"
          style={{
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            color: "var(--foreground)",
            minHeight: "200px",
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={() => setPhase("writing")}
            className="flex-1 py-3 rounded-xl font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Start writing →
          </button>
          <button
            onClick={() => setPhase("writing")}
            className="px-5 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--muted)" }}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={28} style={{ color: "var(--danger)" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Something went wrong</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{errorMsg}</p>
        </div>
        <button onClick={() => router.push("/writing")} className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent)" }}>Back to Setup</button>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-4 py-24">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--muted)" }}>Evaluating your writing with AI...</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <CheckCircle size={32} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Writing Evaluated!</h1>
          <p style={{ color: "var(--muted)" }}>Your essay has been scored by AI using official {examType} rubrics.</p>
        </div>
        <button onClick={() => router.push(`/writing/feedback/${submissionId}`)}
          className="px-8 py-3 rounded-xl font-semibold text-white"
          style={{ background: "var(--accent)" }}>
          View Feedback &amp; Scores
        </button>
      </div>
    );
  }

  // ── Writing phase ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Auto-submit overlay */}
      {showAutoSubmitOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="text-center space-y-5 p-8 rounded-3xl max-w-sm"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="text-5xl font-black" style={{ color: "var(--danger)" }}>{autoSubmitCountdown}</div>
            <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Time&apos;s up!</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Your essay will be submitted automatically in {autoSubmitCountdown} second{autoSubmitCountdown !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      )}

      {/* T-60s toast */}
      {showLowTimeToast && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#fcd34d" }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>⚠️ 1 minute left — your essay will auto-submit when time runs out.</span>
          </div>
          <button onClick={() => setShowLowTimeToast(false)} className="shrink-0 text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded"
          className="tag-purple">
          {examType} · {taskType}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: underMinimum ? "var(--warning)" : "var(--success)" }}>
            {words} / {wordLimit} words
          </span>
          <div className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Clock size={14} />
            <Timer seconds={timeLeft} danger={timeLeft < 300} />
          </div>
        </div>
      </div>

      {/* Draft restored notice */}
      {draftRestored && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: "#1e293b", color: "var(--success)", border: "1px solid var(--card-border)" }}>
          <CheckCircle size={12} /> Draft restored from your last session.
        </div>
      )}

      {/* Prompt card */}
      <div className="p-5 rounded-2xl space-y-2"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <PenLine size={14} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Writing Prompt
          </p>
        </div>
        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{promptTitle}</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{promptBody}</p>

        {/* Chart — Task 1 Academic only */}
        {chartType && chartData && (
          <ChartDisplay chartType={chartType} chartData={chartData} />
        )}
      </div>

      {/* Text editor */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setDraftRestored(false); }}
        placeholder="Start writing here..."
        className="w-full rounded-2xl p-5 text-sm leading-relaxed resize-none outline-none font-mono"
        style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          color: "var(--foreground)",
          minHeight: "420px",
        }}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-4">
        {underMinimum ? (
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--warning)" }}>
            <AlertCircle size={12} />
            Write at least {wordLimit} words to submit ({wordLimit - words} more needed)
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--success)" }}>
            Minimum word count reached. You can submit when ready.
          </p>
        )}
        <button
          onClick={() => handleSubmit(false)}
          disabled={underMinimum}
          className="px-6 py-2.5 rounded-xl font-semibold text-white shrink-0"
          style={{
            background: underMinimum ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #8b5cf6, #d946ef)",
            opacity: underMinimum ? 0.5 : 1,
            cursor: underMinimum ? "not-allowed" : "pointer",
          }}
        >
          Submit
        </button>
      </div>

      {/* Tips */}
      <p className="text-center text-xs pb-4" style={{ color: "var(--muted)" }}>
        {examType === "IELTS" && taskType === "Task 2"
          ? "Tip: Plan your essay structure before writing — introduction, 2 body paragraphs, conclusion."
          : "Tip: Stay on topic and cover all the points in the prompt."}
      </p>
    </div>
  );
}

export default function WritingSessionPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>Loading writing session...</div>
    }>
      <WritingSessionContent />
    </Suspense>
  );
}
