"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Clock, ChevronRight, TrendingUp, Filter, AlertCircle } from "lucide-react";
import { type SessionRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function ScoreBadge({ score, band }: { score: number; band: string }) {
  const color = score >= 7 ? "var(--success)" : score >= 5.5 ? "var(--warning)" : "var(--danger)";
  const bg   = score >= 7 ? "#14532d"        : score >= 5.5 ? "#451a03"        : "#450a0a";
  return (
    <div className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: bg, color }}>
      {band}
    </div>
  );
}

function ExamBadge({ type }: { type: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded"
      style={{
        background: type === "IELTS" ? "#312e81" : "#1e3a5f",
        color:      type === "IELTS" ? "#a5b4fc" : "#93c5fd",
      }}
    >
      {type}
    </span>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState<"All" | "IELTS" | "CELPIP">("All");
  const api = useApi();

  useEffect(() => {
    api.listSessions()
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "All" ? sessions : sessions.filter((s) => s.exam_type === filter);

  const scored = sessions.filter((s) => s.overall_score != null);
  const avgScore = scored.length > 0 ? scored.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scored.length : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((s) => s.overall_score ?? 0)) : 0;
  const totalTime = sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0);

  const sortedByDate = [...sessions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Practice History</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>Review your past sessions and track your progress.</p>
        </div>
        <Link
          href="/setup"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: "var(--accent)" }}
        >
          <Mic size={15} /> New Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions",  value: sessions.length },
          { label: "Avg Score",       value: avgScore > 0 ? avgScore.toFixed(1) : "—" },
          { label: "Best Score",      value: best > 0 ? best.toFixed(1) : "—" },
          { label: "Total Practice",  value: totalTime > 0 ? formatDuration(totalTime) : "—" },
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

      {/* Score trend — only shown when there are scored sessions */}
      {sortedByDate.filter((s) => s.overall_score != null).length >= 2 && (
        <div
          className="p-6 rounded-2xl space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Score Trend</h2>
          </div>
          <div className="flex items-end gap-3 h-20">
            {sortedByDate.filter((s) => s.overall_score != null).map((s, i) => {
              const h = ((s.overall_score ?? 0) / 9) * 100;
              const color = (s.overall_score ?? 0) >= 7 ? "var(--success)" : (s.overall_score ?? 0) >= 5.5 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold" style={{ color }}>{s.overall_score?.toFixed(1)}</span>
                  <div
                    className="w-full rounded-t-md"
                    style={{ height: `${h}%`, background: color, opacity: 0.8 }}
                    title={`${formatDate(s.created_at)}: ${s.estimated_band}`}
                  />
                </div>
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

      {/* Session list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 space-y-3">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading sessions...</p>
          </div>
        )}

        {error && (
          <div
            className="p-5 rounded-2xl flex items-center gap-3"
            style={{ background: "#450a0a", border: "1px solid #7f1d1d" }}
          >
            <AlertCircle size={18} style={{ color: "var(--danger)" }} />
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              Could not load sessions: {error}. Make sure the backend is running.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div
            className="p-10 rounded-2xl text-center"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <p style={{ color: "var(--muted)" }}>No sessions yet. Complete a practice session to see it here!</p>
          </div>
        )}

        {filtered.map((session) => (
          <div
            key={session.session_id}
            className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#1e293b" }}
            >
              <Mic size={18} style={{ color: "var(--accent)" }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={session.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {session.topic}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                {session.part && <span>{session.part}</span>}
                <span>·</span>
                <span>{session.difficulty}</span>
                {session.duration_seconds != null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{formatDuration(session.duration_seconds)}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{formatDate(session.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {session.overall_score != null && session.estimated_band ? (
                <ScoreBadge score={session.overall_score} band={session.estimated_band} />
              ) : (
                <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#1e293b", color: "var(--muted)" }}>
                  In progress
                </span>
              )}
              <Link
                href={`/feedback/session/${session.session_id}`}
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
