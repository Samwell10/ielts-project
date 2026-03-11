"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, BookOpen, PenLine, AlertCircle } from "lucide-react";
import { type WritingSubmissionRecord, type ChartData } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color = score / max >= 0.78 ? "var(--success)" : score / max >= 0.61 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-bold" style={{ color }}>{score.toFixed(1)} / {max}</span>
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

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ── Inline chart components (mirrors writing/session/page.tsx) ────────────────
const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function BarChart({ data }: { data: ChartData }) {
  const { categories = [], series = [], unit = "", y_label } = data;
  const maxVal = Math.max(...series.flatMap((s) => s.values), 1);
  return (
    <div className="space-y-3">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {series.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{s.name}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2" style={{ height: "150px" }}>
        {y_label && <span className="text-xs shrink-0" style={{ color: "var(--muted)", writingMode: "vertical-rl" as const, transform: "rotate(180deg)" }}>{y_label}</span>}
        {categories.map((cat, ci) => (
          <div key={cat} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "118px" }}>
              {series.map((s, si) => {
                const pct = ((s.values[ci] ?? 0) / maxVal) * 100;
                return <div key={s.name} className="flex-1 rounded-t-sm" style={{ height: `${Math.max(pct, 1)}%`, background: COLORS[si % COLORS.length] }} />;
              })}
            </div>
            <span className="text-center leading-tight truncate w-full" style={{ color: "var(--muted)", fontSize: "10px" }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: ChartData }) {
  const { categories = [], series = [], unit = "" } = data;
  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allVals, 1), minVal = Math.min(...allVals, 0), range = maxVal - minVal || 1;
  const W = 480, H = 150, PL = 38, PR = 10, PT = 10, PB = 24;
  const chartW = W - PL - PR, chartH = H - PT - PB;
  const xStep = categories.length > 1 ? chartW / (categories.length - 1) : 0;
  const gx = (i: number) => PL + i * xStep;
  const gy = (v: number) => PT + (1 - (v - minVal) / range) * chartH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "160px" }}>
      {series.map((s, si) => {
        const color = COLORS[si % COLORS.length];
        const pts = s.values.map((v, i) => `${gx(i)},${gy(v)}`).join(" ");
        return (
          <g key={s.name}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
            {s.values.map((v, i) => <circle key={i} cx={gx(i)} cy={gy(v)} r="4" fill={color} stroke="#0f172a" strokeWidth="1.5"><title>{`${v}${unit}`}</title></circle>)}
          </g>
        );
      })}
      {categories.map((cat, i) => <text key={cat} x={gx(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">{cat.length > 8 ? cat.slice(0, 7) + "…" : cat}</text>)}
    </svg>
  );
}

function TableChart({ data }: { data: ChartData }) {
  const { headers = [], rows = [] } = data;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead><tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ borderBottom: "1px solid var(--card-border)", color: "var(--muted)" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-sm" style={{ borderBottom: ri < rows.length - 1 ? "1px solid var(--card-border)" : "none", color: ci === 0 ? "var(--foreground)" : "var(--muted)" }}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

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
            <div className="flex justify-between text-xs"><span style={{ color: "var(--muted)" }}>{seg.label}</span><span className="font-bold" style={{ color }}>{seg.value}{unit}</span></div>
            <div className="h-2 rounded-full" style={{ background: "var(--card-border)" }}><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function ChartDisplay({ chartType, chartData }: { chartType: string; chartData: ChartData }) {
  return (
    <div className="mt-3 p-4 rounded-xl" style={{ background: "#0f172a", border: "1px solid var(--card-border)" }}>
      {chartData.title && <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>{chartData.title}</p>}
      {chartType === "bar"   && <BarChart   data={chartData} />}
      {chartType === "line"  && <LineChart  data={chartData} />}
      {chartType === "table" && <TableChart data={chartData} />}
      {chartType === "pie"   && <PieChart   data={chartData} />}
    </div>
  );
}

const WRITING_TIPS = [
  "Review your essay for repeated grammatical structures and vary them deliberately.",
  "Practise using discourse markers (Furthermore, In contrast, Consequently) to improve cohesion.",
  "Spend 5 minutes planning before you write — a clear outline leads to a higher Task Achievement score.",
  "Aim to use at least 3 topic-specific vocabulary items per paragraph to boost Lexical Resource.",
];

export default function WritingFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<WritingSubmissionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const api = useApi();

  useEffect(() => {
    api.getWritingSubmission(id)
      .then(setSubmission)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (error || !submission) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{error || "Submission not found."}</p>
        <Link href="/writing/history" className="px-6 py-3 rounded-xl font-semibold text-white inline-block"
          style={{ background: "var(--accent)" }}>
          Back to History
        </Link>
      </div>
    );
  }

  const isIELTS = submission.exam_type === "IELTS";
  const maxScore = isIELTS ? 9 : 12;
  const overallScore = submission.overall_score ?? 0;
  const scoreColor = getScoreColor(overallScore, maxScore);

  const minutes = Math.floor((submission.time_spent_seconds ?? 0) / 60);
  const seconds = (submission.time_spent_seconds ?? 0) % 60;

  const criteria = isIELTS
    ? [
        { label: "Task Achievement", score: submission.task_achievement ?? 0 },
        { label: "Coherence & Cohesion", score: submission.coherence_cohesion ?? 0 },
        { label: "Lexical Resource", score: submission.lexical_resource ?? 0 },
        { label: "Grammatical Range & Accuracy", score: submission.grammatical_range ?? 0 },
      ]
    : [
        { label: "Content", score: submission.content ?? 0 },
        { label: "Organization", score: submission.organization ?? 0 },
        { label: "Vocabulary", score: submission.vocabulary ?? 0 },
        { label: "Readability", score: submission.readability ?? 0 },
        { label: "Task Fulfillment", score: submission.task_fulfillment ?? 0 },
      ];

  const wordCount = submission.word_count ?? (submission.response_text ? countWords(submission.response_text) : 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Writing Feedback</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {submission.exam_type} · {submission.task_type} · {submission.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          {minutes}m {seconds}s
        </div>
      </div>

      {/* Overall score card */}
      <div
        className="p-8 rounded-2xl text-center space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
          Estimated Score
        </p>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {submission.estimated_band ?? "—"}
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {isIELTS ? "Based on IELTS official Writing band descriptors" : "Based on CELPIP official Writing level descriptors"}
        </p>
      </div>

      {/* Criterion breakdown */}
      <div
        className="p-6 rounded-2xl space-y-5"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold" style={{ color: "var(--foreground)" }}>Score Breakdown</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg tag-purple">
            {submission.exam_type} · {submission.task_type}
          </span>
        </div>
        <div className="space-y-4">
          {criteria.map(({ label, score }) => (
            <ScoreBar key={label} label={label} score={score} max={maxScore} />
          ))}
        </div>
      </div>

      {/* Original prompt */}
      <div
        className="p-6 rounded-2xl space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-2">
          <PenLine size={14} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Writing Prompt
          </p>
        </div>
        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{submission.prompt_title}</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
          {submission.prompt_body}
        </p>
        {submission.chart_type && submission.chart_data && (
          <ChartDisplay chartType={submission.chart_type} chartData={submission.chart_data} />
        )}
      </div>

      {/* User's essay */}
      {submission.response_text && (
        <div
          className="p-6 rounded-2xl space-y-3"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Your Response
            </p>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{wordCount} words</span>
          </div>
          <div
            className="p-4 rounded-xl text-sm leading-relaxed font-mono max-h-80 overflow-y-auto whitespace-pre-wrap"
            style={{ background: "#0f172a", border: "1px solid var(--card-border)", color: "var(--muted)" }}
          >
            {submission.response_text}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {submission.feedback && (
        <div
          className="p-6 rounded-2xl space-y-3"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            AI Feedback
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {submission.feedback}
          </p>
        </div>
      )}

      {/* Tips */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <BookOpen size={18} style={{ color: "var(--accent)" }} />
          Keep Improving
        </h2>
        <ul className="space-y-3">
          {WRITING_TIPS.map((tip, i) => (
            <li key={i} className="flex gap-3">
              <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
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
          href="/writing"
          className="flex-1 py-3 rounded-xl font-semibold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "var(--accent)" }}
        >
          <PenLine size={16} /> Try another Writing
        </Link>
      </div>
    </div>
  );
}
