"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine, ChevronRight, TrendingUp, Filter, AlertCircle } from "lucide-react";
import { type WritingSubmissionRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ScoreBadge({ score, band, examType }: { score: number; band: string; examType: string }) {
  const max = examType === "IELTS" ? 9 : 12;
  const r = score / max;
  const color = r >= 0.78 ? "var(--success)" : r >= 0.61 ? "var(--warning)" : "var(--danger)";
  const bg     = r >= 0.78 ? "rgba(16,185,129,0.12)"  : r >= 0.61 ? "rgba(245,158,11,0.12)"  : "rgba(239,68,68,0.12)";
  const border = r >= 0.78 ? "rgba(16,185,129,0.3)"   : r >= 0.61 ? "rgba(245,158,11,0.3)"   : "rgba(239,68,68,0.3)";
  return (
    <div className="px-3 py-1.5 rounded-xl text-sm font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {band}
    </div>
  );
}

function ExamBadge({ type }: { type: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded"
      style={{
        background: type === "IELTS" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
        color:      type === "IELTS" ? "#c4b5fd" : "#93c5fd",
        border:     `1px solid ${type === "IELTS" ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)"}`,
      }}
    >
      {type}
    </span>
  );
}

export default function WritingHistoryPage() {
  const [submissions, setSubmissions] = useState<WritingSubmissionRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filter, setFilter]           = useState<"All" | "IELTS" | "CELPIP">("All");
  const api = useApi();

  useEffect(() => {
    api.listWritingSubmissions()
      .then(setSubmissions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "All" ? submissions : submissions.filter((s) => s.exam_type === filter);

  const scored = submissions.filter((s) => s.overall_score != null);
  const avgScore = scored.length > 0
    ? scored.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scored.length
    : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((s) => s.overall_score ?? 0)) : 0;

  const sortedByDate = [...submissions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Writing History</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>Review your past essays and track your progress.</p>
        </div>
        <Link
          href="/writing"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: "var(--accent)" }}
        >
          <PenLine size={15} /> New Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Submissions", value: submissions.length || "—" },
          { label: "Avg Score",         value: avgScore > 0 ? avgScore.toFixed(1) : "—" },
          { label: "Best Score",        value: best > 0 ? best.toFixed(1) : "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-4 rounded-xl text-center space-y-1"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Score trend — only when ≥2 scored submissions */}
      {sortedByDate.filter((s) => s.overall_score != null).length >= 2 && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Score Trend</h2>
          </div>
          {/* Label row */}
          <div className="flex gap-3">
            {sortedByDate.filter((s) => s.overall_score != null).map((s, i) => {
              const max = s.exam_type === "IELTS" ? 9 : 12;
              const r = (s.overall_score ?? 0) / max;
              const color = r >= 0.78 ? "var(--success)" : r >= 0.61 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} className="flex-1 text-center text-xs font-bold truncate" style={{ color }}>
                  {s.overall_score?.toFixed(1)}
                </div>
              );
            })}
          </div>
          {/* Bar row — fixed pixel heights */}
          <div className="flex items-end gap-3" style={{ height: "64px" }}>
            {sortedByDate.filter((s) => s.overall_score != null).map((s, i) => {
              const max = s.exam_type === "IELTS" ? 9 : 12;
              const r = (s.overall_score ?? 0) / max;
              const hPx = Math.max(4, Math.round(r * 64));
              const color = r >= 0.78 ? "var(--success)" : r >= 0.61 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} className="flex-1 rounded-t-md"
                  style={{ height: `${hPx}px`, background: color, opacity: 0.85 }}
                  title={`${formatDate(s.created_at)}: ${s.estimated_band}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>{formatDate(sortedByDate[0]?.created_at || "")}</span>
            <span>{formatDate(sortedByDate[sortedByDate.length - 1]?.created_at || "")}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={14} style={{ color: "var(--muted)" }} />
        <span className="text-sm" style={{ color: "var(--muted)" }}>Filter:</span>
        {(["All", "IELTS", "CELPIP"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-lg text-sm font-medium"
            style={{
              background: filter === f ? "var(--accent)" : "var(--card)",
              color: filter === f ? "white" : "var(--muted)",
              border: "1px solid var(--card-border)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Submission list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 space-y-3">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading submissions...</p>
          </div>
        )}

        {error && (
          <div
            className="p-5 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertCircle size={18} style={{ color: "var(--danger)" }} />
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              Could not load submissions: {error}. Make sure the backend is running.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="p-10 rounded-2xl text-center"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <p style={{ color: "var(--muted)" }}>No writing submissions yet. Complete a writing session to see it here!</p>
          </div>
        )}

        {filtered.map((sub) => (
          <div
            key={sub.submission_id}
            className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <PenLine size={18} style={{ color: "var(--accent)" }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <ExamBadge type={sub.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {sub.task_type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                <span>{sub.difficulty}</span>
                {sub.word_count != null && (
                  <>
                    <span>·</span>
                    <span>{sub.word_count} words</span>
                  </>
                )}
                <span>·</span>
                <span>{formatDate(sub.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {sub.overall_score != null && sub.estimated_band ? (
                <ScoreBadge score={sub.overall_score} band={sub.estimated_band} examType={sub.exam_type} />
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", color: "var(--muted)" }}>
                  In progress
                </span>
              )}
              <Link
                href={`/writing/feedback/${sub.submission_id}`}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--muted)" }}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
