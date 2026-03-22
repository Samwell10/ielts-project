"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mic, PenLine, BookOpen, Headphones,
  Clock, ChevronRight, TrendingUp, Filter, AlertCircle,
} from "lucide-react";
import {
  type SessionRecord,
  type WritingSubmissionRecord,
  type ReadingAttemptRecord,
  type ListeningAttemptRecord,
} from "@/lib/api";
import { useApi } from "@/hooks/useApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function scoreColor(pct: number) {
  return pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";
}

// ─── Shared small components ──────────────────────────────────────────────────

function ExamBadge({ type }: { type: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg ${type === "IELTS" ? "tag-purple" : "tag-blue"}`}>
      {type}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl text-center space-y-1"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function FilterBar({
  filter, setFilter, grad,
}: { filter: string; setFilter: (f: "All" | "IELTS" | "CELPIP") => void; grad: string }) {
  return (
    <div className="flex items-center gap-3">
      <Filter size={14} style={{ color: "var(--muted)" }} />
      <span className="text-sm" style={{ color: "var(--muted)" }}>Filter:</span>
      {(["All", "IELTS", "CELPIP"] as const).map((f) => (
        <button key={f} onClick={() => setFilter(f)} className="px-3 py-1 rounded-lg text-sm font-medium"
          style={{
            background: filter === f ? grad : "var(--card)",
            color: filter === f ? "white" : "var(--muted)",
            border: "1px solid var(--card-border)",
          }}>
          {f}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-10 rounded-2xl text-center"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
      <p style={{ color: "var(--muted)" }}>{message}</p>
    </div>
  );
}

// ─── Fixed Trend Chart ────────────────────────────────────────────────────────
// Bug fix: use pixel heights so bars render correctly inside flex container

interface TrendPoint { pct: number; label: string; date: string }

function TrendChart({ points }: { points: TrendPoint[] }) {
  const CHART_H = 64;
  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex gap-2">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center text-xs font-bold truncate"
            style={{ color: scoreColor(p.pct) }}>
            {p.label}
          </div>
        ))}
      </div>
      {/* Bar row — fixed pixel heights */}
      <div className="flex items-end gap-2" style={{ height: `${CHART_H}px` }}>
        {points.map((p, i) => {
          const hPx = Math.max(4, Math.round(p.pct * CHART_H));
          return (
            <div key={i} className="flex-1 rounded-t-md"
              style={{ height: `${hPx}px`, background: scoreColor(p.pct), opacity: 0.85 }}
              title={p.date} />
          );
        })}
      </div>
      {/* Date range */}
      <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function TrendCard({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center gap-2">
        <TrendingUp size={16} style={{ color: accentColor }} />
        <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Score badges ─────────────────────────────────────────────────────────────

function NumericBadge({ score, band, max }: { score: number; band: string; max: number }) {
  const pct = score / max;
  const color = scoreColor(pct);
  const bg = pct >= 0.7 ? "rgba(16,185,129,0.12)" : pct >= 0.5 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const border = pct >= 0.7 ? "rgba(16,185,129,0.3)" : pct >= 0.5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
  return (
    <div className="px-3 py-1.5 rounded-xl text-sm font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {band}
    </div>
  );
}

function AccuracyBadge({ score, total, band }: { score: number; total: number; band: string }) {
  const pct = total > 0 ? score / total : 0;
  const color = scoreColor(pct);
  const bg = pct >= 0.7 ? "rgba(16,185,129,0.12)" : pct >= 0.5 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const border = pct >= 0.7 ? "rgba(16,185,129,0.3)" : pct >= 0.5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
  return (
    <div className="px-3 py-1.5 rounded-xl text-sm font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {score}/{total} · {band}
    </div>
  );
}

function NoScoreBadge() {
  return (
    <span className="text-xs px-3 py-1.5 rounded-xl font-medium"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)", color: "var(--muted)" }}>
      No score
    </span>
  );
}

// ─── Per-module tab content ───────────────────────────────────────────────────

function SpeakingTab({ sessions, filter, setFilter }: {
  sessions: SessionRecord[];
  filter: string;
  setFilter: (f: "All" | "IELTS" | "CELPIP") => void;
}) {
  const grad = "linear-gradient(135deg,#8b5cf6,#6366f1)";
  const filtered = filter === "All" ? sessions : sessions.filter((s) => s.exam_type === filter);
  const scored = sessions.filter((s) => s.overall_score != null);
  const avg = scored.length > 0 ? scored.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scored.length : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((s) => s.overall_score ?? 0)) : 0;
  const totalTime = sessions.reduce((a, s) => a + (s.duration_seconds ?? 0), 0);
  const sortedByDate = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const trendPoints: TrendPoint[] = sortedByDate
    .filter((s) => s.overall_score != null)
    .map((s) => ({ pct: (s.overall_score ?? 0) / 9, label: s.overall_score?.toFixed(1) ?? "", date: formatDate(s.created_at) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Sessions"  value={sessions.length || "—"} />
        <StatCard label="Avg Score"       value={avg > 0 ? avg.toFixed(1) : "—"} />
        <StatCard label="Best Score"      value={best > 0 ? best.toFixed(1) : "—"} />
        <StatCard label="Total Practice"  value={totalTime > 0 ? formatDuration(totalTime) : "—"} />
      </div>
      {trendPoints.length >= 2 && (
        <TrendCard title="Score Trend" accentColor="#a78bfa">
          <TrendChart points={trendPoints} />
        </TrendCard>
      )}
      <FilterBar filter={filter} setFilter={setFilter} grad={grad} />
      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState message="No speaking sessions yet. Complete a practice session to see it here!" />}
        {filtered.map((s) => (
          <div key={s.session_id} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Mic size={18} style={{ color: "#a78bfa" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={s.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{s.topic}</span>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                {s.part && <span>{s.part}</span>}
                {s.part && <span>·</span>}
                <span>{s.difficulty}</span>
                {s.duration_seconds != null && (
                  <><span>·</span><span className="flex items-center gap-1"><Clock size={11} />{formatDuration(s.duration_seconds)}</span></>
                )}
                <span>·</span><span>{formatDate(s.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {s.overall_score != null && s.estimated_band
                ? <NumericBadge score={s.overall_score} band={s.estimated_band} max={9} />
                : <NoScoreBadge />}
              <Link href={`/feedback/session/${s.session_id}`} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WritingTab({ submissions, filter, setFilter }: {
  submissions: WritingSubmissionRecord[];
  filter: string;
  setFilter: (f: "All" | "IELTS" | "CELPIP") => void;
}) {
  const grad = "linear-gradient(135deg,#d946ef,#f43f5e)";
  const filtered = filter === "All" ? submissions : submissions.filter((s) => s.exam_type === filter);
  const scored = submissions.filter((s) => s.overall_score != null);
  const avg = scored.length > 0 ? scored.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scored.length : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((s) => s.overall_score ?? 0)) : 0;
  const totalTime = submissions.reduce((a, s) => a + (s.time_spent_seconds ?? 0), 0);
  const sortedByDate = [...submissions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const trendPoints: TrendPoint[] = sortedByDate
    .filter((s) => s.overall_score != null)
    .map((s) => {
      const max = s.exam_type === "IELTS" ? 9 : 12;
      return { pct: (s.overall_score ?? 0) / max, label: s.overall_score?.toFixed(1) ?? "", date: formatDate(s.created_at) };
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={submissions.length || "—"} />
        <StatCard label="Avg Score"         value={avg > 0 ? avg.toFixed(1) : "—"} />
        <StatCard label="Best Score"        value={best > 0 ? best.toFixed(1) : "—"} />
        <StatCard label="Total Practice"    value={totalTime > 0 ? formatDuration(totalTime) : "—"} />
      </div>
      {trendPoints.length >= 2 && (
        <TrendCard title="Score Trend" accentColor="#f0abfc">
          <TrendChart points={trendPoints} />
        </TrendCard>
      )}
      <FilterBar filter={filter} setFilter={setFilter} grad={grad} />
      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState message="No writing submissions yet. Complete a writing session to see it here!" />}
        {filtered.map((s) => (
          <div key={s.submission_id} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(217,70,239,0.12)", border: "1px solid rgba(217,70,239,0.25)" }}>
              <PenLine size={18} style={{ color: "#f0abfc" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={s.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{s.task_type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                <span>{s.difficulty}</span>
                {s.word_count != null && <><span>·</span><span>{s.word_count} words</span></>}
                {s.time_spent_seconds != null && (
                  <><span>·</span><span className="flex items-center gap-1"><Clock size={11} />{formatDuration(s.time_spent_seconds)}</span></>
                )}
                <span>·</span><span>{formatDate(s.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {s.overall_score != null && s.estimated_band
                ? <NumericBadge score={s.overall_score} band={s.estimated_band} max={s.exam_type === "IELTS" ? 9 : 12} />
                : <NoScoreBadge />}
              <Link href={`/writing/feedback/${s.submission_id}`} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingTab({ attempts, filter, setFilter }: {
  attempts: ReadingAttemptRecord[];
  filter: string;
  setFilter: (f: "All" | "IELTS" | "CELPIP") => void;
}) {
  const grad = "linear-gradient(135deg,#10b981,#0891b2)";
  const filtered = filter === "All" ? attempts : attempts.filter((a) => a.exam_type === filter);
  const scored = attempts.filter((a) => a.overall_score != null);
  const avg = scored.length > 0 ? scored.reduce((a, r) => a + (r.overall_score ?? 0), 0) / scored.length : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((a) => a.overall_score ?? 0)) : 0;
  const totalTime = attempts.reduce((a, r) => a + (r.time_spent_seconds ?? 0), 0);
  const sortedByDate = [...attempts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const trendPoints: TrendPoint[] = sortedByDate
    .filter((a) => a.overall_score != null)
    .map((a) => ({ pct: a.overall_score ?? 0, label: `${Math.round((a.overall_score ?? 0) * 100)}%`, date: formatDate(a.created_at) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Attempts"  value={attempts.length || "—"} />
        <StatCard label="Avg Accuracy"    value={avg > 0 ? `${Math.round(avg * 100)}%` : "—"} />
        <StatCard label="Best Accuracy"   value={best > 0 ? `${Math.round(best * 100)}%` : "—"} />
        <StatCard label="Total Practice"  value={totalTime > 0 ? formatDuration(totalTime) : "—"} />
      </div>
      {trendPoints.length >= 2 && (
        <TrendCard title="Accuracy Trend" accentColor="#6ee7b7">
          <TrendChart points={trendPoints} />
        </TrendCard>
      )}
      <FilterBar filter={filter} setFilter={setFilter} grad={grad} />
      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState message="No reading attempts yet. Complete a session to see it here!" />}
        {filtered.map((a) => (
          <div key={a.attempt_id} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <BookOpen size={18} style={{ color: "#10b981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={a.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{a.passage_type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                <span>{a.difficulty}</span>
                <span>·</span><span className="truncate max-w-[160px]">{a.passage_title}</span>
                {a.time_spent_seconds != null && (
                  <><span>·</span><span className="flex items-center gap-1"><Clock size={11} />{formatDuration(a.time_spent_seconds)}</span></>
                )}
                <span>·</span><span>{formatDate(a.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {a.score != null && a.estimated_band
                ? <AccuracyBadge score={a.score} total={a.total_questions} band={a.estimated_band} />
                : <NoScoreBadge />}
              <Link href={`/reading/feedback/${a.attempt_id}`} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListeningTab({ attempts, filter, setFilter }: {
  attempts: ListeningAttemptRecord[];
  filter: string;
  setFilter: (f: "All" | "IELTS" | "CELPIP") => void;
}) {
  const grad = "linear-gradient(135deg,#6366f1,#3b82f6)";
  const filtered = filter === "All" ? attempts : attempts.filter((a) => a.exam_type === filter);
  const scored = attempts.filter((a) => a.overall_score != null);
  const avg = scored.length > 0 ? scored.reduce((a, r) => a + (r.overall_score ?? 0), 0) / scored.length : 0;
  const best = scored.length > 0 ? Math.max(...scored.map((a) => a.overall_score ?? 0)) : 0;
  const totalTime = attempts.reduce((a, r) => a + (r.time_spent_seconds ?? 0), 0);
  const sortedByDate = [...attempts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const trendPoints: TrendPoint[] = sortedByDate
    .filter((a) => a.overall_score != null)
    .map((a) => ({ pct: a.overall_score ?? 0, label: `${Math.round((a.overall_score ?? 0) * 100)}%`, date: formatDate(a.created_at) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Attempts"  value={attempts.length || "—"} />
        <StatCard label="Avg Accuracy"    value={avg > 0 ? `${Math.round(avg * 100)}%` : "—"} />
        <StatCard label="Best Accuracy"   value={best > 0 ? `${Math.round(best * 100)}%` : "—"} />
        <StatCard label="Total Practice"  value={totalTime > 0 ? formatDuration(totalTime) : "—"} />
      </div>
      {trendPoints.length >= 2 && (
        <TrendCard title="Accuracy Trend" accentColor="#a5b4fc">
          <TrendChart points={trendPoints} />
        </TrendCard>
      )}
      <FilterBar filter={filter} setFilter={setFilter} grad={grad} />
      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState message="No listening attempts yet. Complete a session to see it here!" />}
        {filtered.map((a) => (
          <div key={a.attempt_id} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <Headphones size={18} style={{ color: "#6366f1" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ExamBadge type={a.exam_type} />
                <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{a.section_type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                <span>{a.difficulty}</span>
                <span>·</span><span className="truncate max-w-[160px]">{a.section_title}</span>
                {a.time_spent_seconds != null && (
                  <><span>·</span><span className="flex items-center gap-1"><Clock size={11} />{formatDuration(a.time_spent_seconds)}</span></>
                )}
                <span>·</span><span>{formatDate(a.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {a.score != null && a.estimated_band
                ? <AccuracyBadge score={a.score} total={a.total_questions} band={a.estimated_band} />
                : <NoScoreBadge />}
              <Link href={`/listening/feedback/${a.attempt_id}`} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "speaking",  label: "Speaking",  Icon: Mic,        grad: "linear-gradient(135deg,#8b5cf6,#6366f1)" },
  { key: "writing",   label: "Writing",   Icon: PenLine,    grad: "linear-gradient(135deg,#d946ef,#f43f5e)" },
  { key: "reading",   label: "Reading",   Icon: BookOpen,   grad: "linear-gradient(135deg,#10b981,#0891b2)" },
  { key: "listening", label: "Listening", Icon: Headphones, grad: "linear-gradient(135deg,#6366f1,#3b82f6)" },
] as const;

type Tab = typeof TABS[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [tab, setTab]       = useState<Tab>("speaking");
  const [filter, setFilter] = useState<"All" | "IELTS" | "CELPIP">("All");

  const [sessions,   setSessions]   = useState<SessionRecord[]>([]);
  const [writings,   setWritings]   = useState<WritingSubmissionRecord[]>([]);
  const [readings,   setReadings]   = useState<ReadingAttemptRecord[]>([]);
  const [listenings, setListenings] = useState<ListeningAttemptRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const api = useApi();

  useEffect(() => {
    Promise.all([
      api.listSessions(),
      api.listWritingSubmissions(),
      api.listReadingAttempts(),
      api.listListeningAttempts(),
    ])
      .then(([s, w, r, l]) => { setSessions(s); setWritings(w); setReadings(r); setListenings(l); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(key: Tab) {
    setTab(key);
    setFilter("All");
  }

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--muted)" }}>Loading your history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl flex items-center gap-3 max-w-2xl mx-auto mt-16"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <AlertCircle size={18} style={{ color: "var(--danger)" }} />
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          Could not load history: {error}. Make sure the backend is running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Practice History</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>Track your progress across all practice modules.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, Icon, grad }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => switchTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? grad : "var(--card)",
                color: active ? "white" : "var(--muted)",
                border: `1px solid ${active ? "transparent" : "var(--card-border)"}`,
              }}>
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "speaking"  && <SpeakingTab  sessions={sessions}   filter={filter} setFilter={setFilter} />}
      {tab === "writing"   && <WritingTab   submissions={writings} filter={filter} setFilter={setFilter} />}
      {tab === "reading"   && <ReadingTab   attempts={readings}    filter={filter} setFilter={setFilter} />}
      {tab === "listening" && <ListeningTab attempts={listenings}  filter={filter} setFilter={setFilter} />}
    </div>
  );
}
