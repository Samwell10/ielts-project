"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Map, RefreshCw, Calendar, Zap, Target, CheckCircle2,
  Mic, PenLine, BookOpen, Headphones, ArrowRight, Lightbulb,
  Clock,
} from "lucide-react";
import {
  listSessions, listWritingSubmissions, listReadingAttempts,
  listListeningAttempts, getProfile,
  type SessionRecord, type WritingSubmissionRecord,
  type ReadingAttemptRecord, type ListeningAttemptRecord,
  type UserProfileRecord,
} from "@/lib/api";
import {
  generateStudyPlan, getStoredPlan, storePlan, clearPlan, isPlanStale,
  deriveWeekProgress,
  type StudyPlan, type PlanModule, type WeekProgress,
} from "@/lib/studyPlan";

/* ── Icon map ───────────────────────────────────────────────────────────── */

const MODULE_ICONS = {
  speaking:  Mic,
  writing:   PenLine,
  reading:   BookOpen,
  listening: Headphones,
};

/* ── Skeleton ───────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-16 rounded-2xl" style={{ background: "#e2e8f0" }} />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl" style={{ background: "#e2e8f0" }} />)}
      </div>
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl" style={{ background: "#e2e8f0" }} />)}
    </div>
  );
}

/* ── Session progress dots ──────────────────────────────────────────────── */

function ProgressDots({ done, total, color }: { done: number; total: number; color: string }) {
  const capped = Math.min(done, total);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < capped ? color : "#e2e8f0" }}
        />
      ))}
    </div>
  );
}

/* ── Module priority card ───────────────────────────────────────────────── */

function ModuleCard({
  mod,
  rank,
  progress,
}: {
  mod: PlanModule;
  rank: number;
  progress: WeekProgress;
}) {
  const Icon = MODULE_ICONS[mod.key];
  const done = progress[mod.key];
  const allDone = done >= mod.weeklySessionCount;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: "4px", borderLeftColor: mod.color }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
            style={{ background: mod.activeBg, color: mod.color }}
          >
            {rank}
          </div>

          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: mod.activeBg }}
          >
            <Icon size={16} style={{ color: mod.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold" style={{ color: "#1e293b" }}>{mod.label}</p>
              {allDone && (
                <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
              )}
            </div>

            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs" style={{ color: "#64748b" }}>
                {mod.weeklySessionCount} session{mod.weeklySessionCount !== 1 ? "s" : ""}/week
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: mod.activeBg, color: mod.color }}>
                {mod.difficulty}
              </span>
              <span className="flex items-center gap-0.5 text-xs" style={{ color: "#94a3b8" }}>
                <Clock size={10} /> ~{mod.estimatedMinutesPerSession} min
              </span>
            </div>

            {/* Progress dots + avg */}
            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-center gap-2">
                <ProgressDots
                  done={done}
                  total={mod.weeklySessionCount}
                  color={mod.color}
                />
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {done}/{mod.weeklySessionCount} this week
                </span>
              </div>
              {mod.currentAvg != null && (
                <span className="text-xs font-semibold" style={{ color: "#475569" }}>
                  Avg {mod.currentAvg.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <Link
            href={mod.href}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: mod.color }}
          >
            Start <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function StudyPlanPage() {
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [weekProgress, setWeekProgress] = useState<WeekProgress>({ speaking: 0, writing: 0, reading: 0, listening: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data and generate/load plan
  const loadPlan = useCallback(async (force: boolean) => {
    if (!userId) return;
    const token = await getToken();
    if (!token) return;

    // Check for cached plan first (unless forced or new)
    if (!force && !isNew) {
      const cached = getStoredPlan(userId);
      if (cached && !isPlanStale(cached)) {
        setPlan(cached);
        // Still fetch history for accurate weekly progress
        const [s, w, r, l] = await Promise.all([
          listSessions(token).catch(() => [] as SessionRecord[]),
          listWritingSubmissions(token).catch(() => [] as WritingSubmissionRecord[]),
          listReadingAttempts(token).catch(() => [] as ReadingAttemptRecord[]),
          listListeningAttempts(token).catch(() => [] as ListeningAttemptRecord[]),
        ]);
        setWeekProgress(deriveWeekProgress(s, w, r, l));
        setLoading(false);
        return;
      }
    }

    if (isNew) clearPlan(userId);

    // Fetch all data in parallel
    const [prof, s, w, r, l] = await Promise.all([
      getProfile(userId, token).catch(() => null),
      listSessions(token).catch(() => [] as SessionRecord[]),
      listWritingSubmissions(token).catch(() => [] as WritingSubmissionRecord[]),
      listReadingAttempts(token).catch(() => [] as ReadingAttemptRecord[]),
      listListeningAttempts(token).catch(() => [] as ListeningAttemptRecord[]),
    ]);

    if (prof) {
      const generated = generateStudyPlan(prof, s, w, r, l);
      storePlan(userId, generated);
      setPlan(generated);
      setWeekProgress(deriveWeekProgress(s, w, r, l));
    }
    setLoading(false);
  }, [userId, getToken, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    loadPlan(false);
  }, [isLoaded, isSignedIn, loadPlan]);

  async function handleRefresh() {
    if (!userId || refreshing) return;
    setRefreshing(true);
    await loadPlan(true);
    setRefreshing(false);
  }

  if (isLoaded && !isSignedIn) return <RedirectToSignIn />;

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* New plan success banner */}
      {isNew && !loading && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background: "#f0fdf4", borderColor: "#86efac" }}
        >
          <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
          <p className="text-sm font-medium" style={{ color: "#166534" }}>
            Your personalised study plan is ready! We've tailored it based on your exam goal and current level.
          </p>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}
          >
            <Map size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>Your Study Plan</h1>
            {plan && (
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                {plan.examType}
                {plan.targetBand ? ` · Target ${plan.examType === "CELPIP" ? `CLB ${plan.targetBand}` : `Band ${plan.targetBand}`}` : ""}
                {plan.examDate ? ` · ${Math.max(0, plan.daysLeft)} days to exam` : ""}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
          style={{
            borderColor: "#e2e8f0",
            background: "#ffffff",
            color: refreshing ? "#94a3b8" : "#475569",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Updating…" : "Refresh"}
        </button>
      </div>

      {(!isLoaded || loading) ? <Skeleton /> : !plan ? (
        /* Error / empty state */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <p className="text-sm" style={{ color: "#64748b" }}>
            We couldn't generate your plan. Make sure you've completed onboarding.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0f766e" }}
          >
            Complete onboarding <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <>
          {/* Summary stat pills */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: Calendar,
                label: "Days left",
                value: plan.examDate ? `${Math.max(0, plan.daysLeft)}` : "No date set",
                color: "#0891b2",
                bg: "#ecfeff",
                sub: plan.examDate ? (plan.daysLeft <= 14 ? "Exam crunch mode!" : `${plan.weeksLeft} week${plan.weeksLeft !== 1 ? "s" : ""}`) : "Set a date →",
                href: plan.examDate ? undefined : "/onboarding",
              },
              {
                icon: Zap,
                label: "Sessions/day",
                value: `${plan.sessionsPerDay}`,
                color: "#d97706",
                bg: "#fffbeb",
                sub: "Recommended",
              },
              {
                icon: Target,
                label: "This week",
                value: `${plan.sessionsPerDay * 7}`,
                color: "#7c3aed",
                bg: "#f5f3ff",
                sub: "Total sessions",
              },
            ].map(({ icon: Icon, label, value, color, bg, sub, href }) => {
              const inner = (
                <div
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center space-y-1"
                  style={{ borderTopWidth: "3px", borderTopColor: color }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
                    style={{ background: bg }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <p className="text-xl font-black" style={{ color: "#1e293b" }}>{value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</p>
                  <p className="text-[11px]" style={{ color }}>{sub}</p>
                </div>
              );
              return href ? (
                <Link key={label} href={href}>{inner}</Link>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}
          </div>

          {/* Module priority cards */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
              Module Priority — Week Focus
            </p>
            {plan.modules.map((mod, i) => (
              <ModuleCard
                key={mod.key}
                mod={mod}
                rank={i + 1}
                progress={weekProgress}
              />
            ))}
          </div>

          {/* Tip of the week */}
          <div
            className="flex gap-3 p-4 rounded-2xl border"
            style={{ background: "#f5f3ff", borderColor: "#ddd6fe" }}
          >
            <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: "#7c3aed" }} />
            <div>
              <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: "#7c3aed" }}>
                Tip of the Week
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#4c1d95" }}>
                {plan.tipOfTheWeek}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs" style={{ color: "#94a3b8" }}>
            <span>
              Plan updated {new Date(plan.generatedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <Link href="/onboarding" className="hover:underline" style={{ color: "#64748b" }}>
              Edit exam goal →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
