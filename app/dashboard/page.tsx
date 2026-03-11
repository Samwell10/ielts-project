"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth, useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  Mic, PenLine, BookOpen, Headphones,
  ArrowRight, TrendingUp, Award, BarChart2, Zap,
} from "lucide-react";
import {
  listSessions, listWritingSubmissions,
  listReadingAttempts, listListeningAttempts,
  type SessionRecord, type WritingSubmissionRecord,
  type ReadingAttemptRecord, type ListeningAttemptRecord,
} from "@/lib/api";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function avgBand(items: { estimated_band?: string }[]): number | null {
  const vals = items
    .map(i => parseFloat(i.estimated_band ?? ""))
    .filter(v => !isNaN(v) && v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function bestBand(items: { estimated_band?: string }[]): number | null {
  const vals = items
    .map(i => parseFloat(i.estimated_band ?? ""))
    .filter(v => !isNaN(v) && v > 0);
  return vals.length ? Math.max(...vals) : null;
}

function bandPct(avg: number | null): number {
  return avg != null ? Math.round((avg / 9) * 100) : 0;
}

function fmtBand(n: number | null): string {
  return n != null ? n.toFixed(1) : "—";
}

/* ── Spark line (SVG) ────────────────────────────────────────────────────── */

function SparkLine({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data) || 9;
  const range = max - min || 1;
  const W = 300, H = 60;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const [lx, ly] = pts[pts.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill="url(#sf)" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="4" fill="#7C3AED" />
    </svg>
  );
}

/* ── Skill progress bar ──────────────────────────────────────────────────── */

function SkillBar({
  label, value, color,
}: { label: string; value: number; color: string }) {
  const pct = value > 0 ? Math.round((value / 9) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-36 shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#ede9fe" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.3 }}
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: "var(--foreground)" }}>
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

/* ── Module card ─────────────────────────────────────────────────────────── */

const MODULE_DEFS = [
  {
    key: "speaking" as const,
    label: "Speaking",
    subtitle: "IELTS Parts 1–3 · CELPIP",
    icon: Mic,
    href: "/setup",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #a855f7 100%)",
  },
  {
    key: "writing" as const,
    label: "Writing",
    subtitle: "Task 1 & 2 · Emails",
    icon: PenLine,
    href: "/writing",
    gradient: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
  },
  {
    key: "reading" as const,
    label: "Reading",
    subtitle: "Academic · MCQ · Fill-in",
    icon: BookOpen,
    href: "/reading",
    gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
  },
  {
    key: "listening" as const,
    label: "Listening",
    subtitle: "AI Audio · MCQ · Fill-in",
    icon: Headphones,
    href: "/listening",
    gradient: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
  },
];

function ModuleCard({
  def,
  sessions,
  index,
}: {
  def: (typeof MODULE_DEFS)[number];
  sessions: { estimated_band?: string }[];
  index: number;
}) {
  const avg = avgBand(sessions);
  const pct = bandPct(avg);
  const Icon = def.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={def.href}
        className="group block rounded-2xl p-5 relative overflow-hidden transition-transform hover:-translate-y-0.5"
        style={{ background: def.gradient }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 pointer-events-none"
          style={{ background: "#ffffff" }}
        />
        <div
          className="absolute -right-2 bottom-3 w-16 h-16 rounded-full opacity-10 pointer-events-none"
          style={{ background: "#ffffff" }}
        />

        <div className="relative space-y-3">
          {/* Icon row */}
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.22)" }}
            >
              <Icon size={18} color="white" />
            </div>
            <ArrowRight
              size={14}
              className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all"
            />
          </div>

          {/* Percentage */}
          <div>
            <p className="text-4xl font-black text-white leading-none">
              {pct > 0 ? `${pct}%` : "—"}
            </p>
            <p className="text-xs text-white/70 font-medium mt-1">
              {avg != null ? `Avg. Band ${fmtBand(avg)}` : "No sessions yet"}
            </p>
          </div>

          {/* Label */}
          <div>
            <p className="text-sm font-bold text-white">{def.label}</p>
            <p className="text-[11px] text-white/55">{def.subtitle}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Recent activity row ─────────────────────────────────────────────────── */

interface ActivityRow {
  id: string;
  module: string;
  icon: typeof Mic;
  color: string;
  topic?: string;
  band?: string;
  date: string;
  url: string;
}

function ActivityItem({ item }: { item: ActivityRow }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      className="flex items-center gap-3 py-3 group hover:opacity-80 transition-opacity"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: item.color + "18" }}
      >
        <Icon size={15} style={{ color: item.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
          {item.topic || item.module}
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {item.module} ·{" "}
          {new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </p>
      </div>
      {item.band && (
        <span
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--accent-light)", color: "var(--purple)" }}
        >
          {item.band}
        </span>
      )}
      <ArrowRight
        size={12}
        className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
        style={{ color: "var(--muted)" }}
      />
    </Link>
  );
}

/* ── Skeleton loader ─────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-xl" style={{ background: "#e2ddf8" }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: "#e2ddf8" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 rounded-2xl" style={{ background: "#e2ddf8" }} />
          <div className="h-36 rounded-2xl" style={{ background: "#e2ddf8" }} />
        </div>
        <div className="space-y-4">
          <div className="h-60 rounded-2xl" style={{ background: "#e2ddf8" }} />
          <div className="h-48 rounded-2xl" style={{ background: "#e2ddf8" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard page ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  const [speaking, setSpeaking]   = useState<SessionRecord[]>([]);
  const [writing, setWriting]     = useState<WritingSubmissionRecord[]>([]);
  const [reading, setReading]     = useState<ReadingAttemptRecord[]>([]);
  const [listening, setListening] = useState<ListeningAttemptRecord[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        const [s, w, r, l] = await Promise.all([
          listSessions(token).catch(() => [] as SessionRecord[]),
          listWritingSubmissions(token).catch(() => [] as WritingSubmissionRecord[]),
          listReadingAttempts(token).catch(() => [] as ReadingAttemptRecord[]),
          listListeningAttempts(token).catch(() => [] as ListeningAttemptRecord[]),
        ]);
        setSpeaking(s);
        setWriting(w);
        setReading(r);
        setListening(l);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLoaded, isSignedIn, getToken]);

  if (isLoaded && !isSignedIn) return <RedirectToSignIn />;

  /* ── computed stats ─────────────────────────────────────────────────── */

  const totalSessions = speaking.length + writing.length + reading.length + listening.length;

  const allItems = [
    ...speaking.map(s => ({ estimated_band: s.estimated_band })),
    ...writing.map(s => ({ estimated_band: s.estimated_band })),
    ...reading.map(s => ({ estimated_band: s.estimated_band })),
    ...listening.map(s => ({ estimated_band: s.estimated_band })),
  ];

  const allAvg  = avgBand(allItems);
  const allBest = bestBand(allItems);
  const activeModules = [speaking, writing, reading, listening].filter(m => m.length > 0).length;

  /* ── trend data ─────────────────────────────────────────────────────── */

  const trendData = useMemo(() => {
    const all = [
      ...speaking.map(s => ({ b: s.estimated_band, d: s.created_at })),
      ...writing.map(s =>  ({ b: s.estimated_band, d: s.created_at })),
      ...reading.map(s =>  ({ b: s.estimated_band, d: s.created_at })),
      ...listening.map(s => ({ b: s.estimated_band, d: s.created_at })),
    ];
    return all
      .sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime())
      .slice(-12)
      .map(s => parseFloat(s.b ?? "0"))
      .filter(v => v > 0);
  }, [speaking, writing, reading, listening]);

  /* ── speaking skill averages ────────────────────────────────────────── */

  function skillAvg(key: "fluency_coherence" | "lexical_resource" | "grammatical_range" | "pronunciation") {
    const vals = speaking
      .flatMap(s => s.responses.map(r => r[key]))
      .filter((v): v is number => typeof v === "number" && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  /* ── recent activity ────────────────────────────────────────────────── */

  const recentActivity = useMemo((): ActivityRow[] => {
    const rows: ActivityRow[] = [
      ...speaking.map(s => ({
        id: s.session_id,
        module: "Speaking",
        icon: Mic,
        color: "#7C3AED",
        topic: s.topic,
        band: s.estimated_band,
        date: s.created_at,
        url: `/feedback/session/${s.session_id}`,
      })),
      ...writing.map(s => ({
        id: s.submission_id,
        module: "Writing",
        icon: PenLine,
        color: "#d97706",
        topic: s.prompt_title,
        band: s.estimated_band,
        date: s.created_at,
        url: `/writing/feedback/${s.submission_id}`,
      })),
      ...reading.map(s => ({
        id: s.attempt_id,
        module: "Reading",
        icon: BookOpen,
        color: "#0891b2",
        topic: s.passage_title,
        band: s.estimated_band,
        date: s.created_at,
        url: `/reading/feedback/${s.attempt_id}`,
      })),
      ...listening.map(s => ({
        id: s.attempt_id,
        module: "Listening",
        icon: Headphones,
        color: "#e11d48",
        topic: s.section_title,
        band: s.estimated_band,
        date: s.created_at,
        url: `/listening/feedback/${s.attempt_id}`,
      })),
    ];
    return rows
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [speaking, writing, reading, listening]);

  const firstName = user?.firstName ?? "there";

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <div
      className="-mx-4 -mt-8 px-4 pt-8 pb-16 min-h-[calc(100vh-3.5rem)]"
      style={{ background: "#f5f4fb" }}
    >
      <div className="max-w-6xl mx-auto space-y-7">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
              Your personal dashboard overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--foreground)" }}>
              Welcome back, {firstName} 👋
            </h1>
          </div>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white btn-gradient text-sm self-start sm:self-auto"
          >
            <Mic size={14} /> Start Practising
          </Link>
        </div>

        {(!isLoaded || loading) ? <Skeleton /> : (
          <>
            {/* ── Stats row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BarChart2, label: "Total Sessions",  value: totalSessions.toString(),  color: "#7C3AED", bg: "#ede9fe" },
                { icon: TrendingUp, label: "Avg Band",       value: fmtBand(allAvg),           color: "#0891b2", bg: "#cffafe" },
                { icon: Award,      label: "Best Band",      value: fmtBand(allBest),           color: "#d97706", bg: "#fef3c7" },
                { icon: Zap,        label: "Active Modules", value: `${activeModules}/4`,       color: "#e11d48", bg: "#ffe4e6" },
              ].map(({ icon: Icon, label, value, color, bg }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid #ede9fe",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black leading-none" style={{ color: "var(--foreground)" }}>
                      {value}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Main 3-col grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left — 2/3 width ─────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Module cards 2×2 */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid #ede9fe",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                        Practice Modules
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Click any module to start a new session
                      </p>
                    </div>
                    <Link
                      href="/history"
                      className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ color: "var(--purple)" }}
                    >
                      View all <ArrowRight size={11} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {MODULE_DEFS.map((def, i) => {
                      const data =
                        def.key === "speaking" ? speaking :
                        def.key === "writing"  ? writing  :
                        def.key === "reading"  ? reading  : listening;
                      return (
                        <ModuleCard key={def.key} def={def} sessions={data} index={i} />
                      );
                    })}
                  </div>
                </div>

                {/* Score trend */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid #ede9fe",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                        Score trend
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Band score across all modules (last 12 sessions)
                      </p>
                    </div>
                    {allAvg != null && (
                      <div className="text-right">
                        <p className="text-2xl font-black" style={{ color: "var(--purple)" }}>
                          {fmtBand(allAvg)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>overall avg</p>
                      </div>
                    )}
                  </div>
                  <div className="h-20 mt-3">
                    {trendData.length >= 2 ? (
                      <SparkLine data={trendData} />
                    ) : (
                      <div
                        className="flex items-center justify-center h-full text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        Complete more sessions to see your score trend
                      </div>
                    )}
                  </div>
                  {trendData.length >= 2 && (
                    <div
                      className="flex justify-between mt-1 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>Oldest</span>
                      <span>Most recent</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — 1/3 width ────────────────────────────────────── */}
              <div className="space-y-6">

                {/* Recent sessions */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid #ede9fe",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-black text-base" style={{ color: "var(--foreground)" }}>
                      Recent sessions
                    </p>
                    <Link
                      href="/history"
                      className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ color: "var(--purple)" }}
                    >
                      See all <ArrowRight size={11} />
                    </Link>
                  </div>

                  {recentActivity.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-sm" style={{ color: "var(--muted)" }}>No sessions yet</p>
                      <Link
                        href="/setup"
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white btn-gradient"
                      >
                        <Mic size={12} /> Start Speaking
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "#f5f3ff" }}>
                      {recentActivity.map(item => (
                        <ActivityItem key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Speaking skills breakdown */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid #ede9fe",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                  }}
                >
                  <p className="font-black text-base mb-0.5" style={{ color: "var(--foreground)" }}>
                    Speaking skills
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                    Average across all speaking sessions
                  </p>

                  {speaking.length === 0 ? (
                    <p className="text-sm py-3 text-center" style={{ color: "var(--muted)" }}>
                      Complete a speaking session to see skill breakdown.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      <SkillBar label="Fluency & Coherence" value={skillAvg("fluency_coherence")}  color="#7C3AED" />
                      <SkillBar label="Lexical Resource"    value={skillAvg("lexical_resource")}   color="#0891b2" />
                      <SkillBar label="Grammar Range"       value={skillAvg("grammatical_range")}  color="#d97706" />
                      <SkillBar label="Pronunciation"       value={skillAvg("pronunciation")}      color="#e11d48" />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
