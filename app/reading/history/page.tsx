"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Clock, Filter, AlertCircle, TrendingUp } from "lucide-react";
import { type ReadingAttemptRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function ScoreBadge({ score, total, band }: { score: number; total: number; band: string }) {
  const pct = total > 0 ? score / total : 0;
  const color = pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";
  const bg = pct >= 0.7 ? "rgba(16,185,129,0.12)" : pct >= 0.5 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const border = pct >= 0.7 ? "rgba(16,185,129,0.3)" : pct >= 0.5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
  return (
    <div className="px-3 py-1.5 rounded-xl text-sm font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {score}/{total} · {band}
    </div>
  );
}

function ExamBadge({ type }: { type: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg ${type === "IELTS" ? "tag-purple" : "tag-blue"}`}>
      {type}
    </span>
  );
}

export default function ReadingHistoryPage() {
  const [attempts, setAttempts] = useState<ReadingAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"All" | "IELTS" | "CELPIP">("All");
  const api = useApi();

  useEffect(() => {
    api.listReadingAttempts()
      .then(setAttempts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "All" ? attempts : attempts.filter((a) => a.exam_type === filter);

  const scored = attempts.filter((a) => a.overall_score != null);
  const avgPct = scored.length > 0
    ? scored.reduce((sum, a) => sum + (a.overall_score ?? 0), 0) / scored.length
    : 0;
  const bestPct = scored.length > 0 ? Math.max(...scored.map((a) => a.overall_score ?? 0)) : 0;
  const totalTime = attempts.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);

  const sortedByDate = [...attempts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Reading History</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>Review your past reading attempts and track your progress.</p>
        </div>
        <Link
          href="/reading"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
        >
          <BookOpen size={15} /> New Attempt
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Attempts",   value: attempts.length },
          { label: "Avg Accuracy",     value: avgPct > 0 ? `${Math.round(avgPct * 100)}%` : "—" },
          { label: "Best Accuracy",    value: bestPct > 0 ? `${Math.round(bestPct * 100)}%` : "—" },
          { label: "Total Practice",   value: totalTime > 0 ? formatDuration(totalTime) : "—" },
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

      {/* Score trend */}
      {sortedByDate.filter((a) => a.overall_score != null).length >= 2 && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: "#10b981" }} />
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Accuracy Trend</h2>
          </div>
          {/* Label row */}
          <div className="flex gap-3">
            {sortedByDate.filter((a) => a.overall_score != null).map((a, i) => {
              const pct = a.overall_score ?? 0;
              const color = pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} className="flex-1 text-center text-xs font-bold truncate" style={{ color }}>
                  {Math.round(pct * 100)}%
                </div>
              );
            })}
          </div>
          {/* Bar row — fixed pixel heights */}
          <div className="flex items-end gap-3" style={{ height: "64px" }}>
            {sortedByDate.filter((a) => a.overall_score != null).map((a, i) => {
              const pct = a.overall_score ?? 0;
              const hPx = Math.max(4, Math.round(pct * 64));
              const color = pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} className="flex-1 rounded-t-md"
                  style={{ height: `${hPx}px`, background: color, opacity: 0.85 }}
                  title={`${formatDate(a.created_at)}: ${a.estimated_band}`}
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
              background: filter === f ? "linear-gradient(135deg, #10b981, #0891b2)" : "var(--card)",
              color: filter === f ? "white" : "var(--muted)",
              border: "1px solid var(--card-border)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Attempt list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 space-y-3">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin mx-auto"
              style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading attempts…</p>
          </div>
        )}

        {error && (
          <div
            className="p-5 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <AlertCircle size={18} style={{ color: "var(--danger)" }} />
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              Could not load attempts: {error}. Make sure the backend is running.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="p-10 rounded-2xl text-center"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <p style={{ color: "var(--muted)" }}>No reading attempts yet. Complete a session to see it here!</p>
          </div>
        )}

        {filtered.map((attempt) => (
          <div
            key={attempt.attempt_id}
            className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <BookOpen size={18} style={{ color: "#10b981" }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={attempt.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {attempt.passage_type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                <span>{attempt.difficulty}</span>
                <span>·</span>
                <span className="truncate max-w-[180px]">{attempt.passage_title}</span>
                {attempt.time_spent_seconds != null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{formatDuration(attempt.time_spent_seconds)}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{formatDate(attempt.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {attempt.score != null && attempt.estimated_band ? (
                <ScoreBadge score={attempt.score} total={attempt.total_questions} band={attempt.estimated_band} />
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-xl font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", color: "var(--muted)" }}>
                  No score
                </span>
              )}
              <Link
                href={`/reading/feedback/${attempt.attempt_id}`}
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
