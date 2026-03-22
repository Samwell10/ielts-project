"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ExamType, Difficulty, IELTSPart } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const IELTS_PARTS: { part: IELTSPart; label: string; format: string; time: string; tip: string }[] = [
  {
    part: "Part 1",
    label: "Part 1 — Introduction",
    format: "Short questions about you & familiar topics",
    time: "4–5 min",
    tip: "Examiner asks about home, work, studies, hobbies",
  },
  {
    part: "Part 2",
    label: "Part 2 — Long Turn",
    format: "1 min prep, then 2 min monologue on a cue card",
    time: "3–4 min",
    tip: "Use your prep time to jot bullet points on the topic card",
  },
  {
    part: "Part 3",
    label: "Part 3 — Discussion",
    format: "Abstract opinion questions linked to Part 2 topic",
    time: "4–5 min",
    tip: "Justify your opinions and develop ideas in depth",
  },
];

const CELPIP_TASKS = [
  { type: "Task 1", label: "Task 1 — Give Advice", format: "Give advice to a friend in 90 sec", time: "90 sec" },
  { type: "Task 2", label: "Task 2 — Talk About Event", format: "Describe a personal experience", time: "60 sec" },
  { type: "Task 3", label: "Task 3 — Describe Scene", format: "Describe an image in detail", time: "60 sec" },
  { type: "Task 4", label: "Task 4 — Make Predictions", format: "Predict what will happen next", time: "60 sec" },
  { type: "Task 5", label: "Task 5 — Compare Options", format: "Compare two images or choices", time: "60 sec" },
  { type: "Task 6", label: "Task 6 — Express Opinion", format: "Give and defend your opinion", time: "90 sec" },
  { type: "Task 7", label: "Task 7 — Situation Proposal", format: "Propose solution to a scenario", time: "60 sec" },
  { type: "Task 8", label: "Task 8 — Problematic Situation", format: "Describe and resolve a problem", time: "60 sec" },
];

const IELTS_TOPICS = [
  "Work & Career", "Education", "Family & Relationships", "Technology",
  "Environment", "Travel & Tourism", "Health & Fitness", "Culture & Society",
  "Hobbies & Free Time", "Media & Communication",
];

const CELPIP_TOPICS = [
  "Giving Advice", "Talking About a Past Event", "Describing a Scene",
  "Making Predictions", "Comparing Two Options", "Expressing Opinions",
  "Talking About Daily Routines", "Describing Graphs or Charts",
];

const DIFFICULTIES: { level: Difficulty; dot: string; ielts: string; celpip: string; desc: string }[] = [
  { level: "Beginner",     dot: "#22c55e", ielts: "Band 4.5–6.0", celpip: "Level 4–6",  desc: "Foundation questions, everyday topics" },
  { level: "Intermediate", dot: "#f59e0b", ielts: "Band 6.0–7.5", celpip: "Level 6–9",  desc: "Mixed abstract & familiar questions" },
  { level: "Advanced",     dot: "#ef4444", ielts: "Band 7.5–9.0", celpip: "Level 9–12", desc: "Complex opinions, nuanced language" },
];

/* ── Section card component ─────────────────────────────────────────────────── */

function SectionCard({
  selected,
  onClick,
  label,
  format,
  time,
  tip,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  format: string;
  time: string;
  tip?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start"
      style={selected
        ? { borderColor: "#7c3aed", background: "#f5f3ff" }
        : { borderColor: "#e2e8f0", background: "#ffffff" }
      }
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
        style={selected
          ? { borderColor: "#7c3aed", background: "#7c3aed" }
          : { borderColor: "#cbd5e1", background: "white" }
        }
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: selected ? "#6d28d9" : "#1e293b" }}>{label}</p>
          <span
            className="flex items-center gap-1 text-xs font-medium shrink-0"
            style={{ color: "#64748b" }}
          >
            <Clock size={11} /> {time}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{format}</p>
        {tip && selected && (
          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg" style={{ background: "#ede9fe", color: "#6d28d9" }}>
            💡 {tip}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Form section wrapper ───────────────────────────────────────────────────── */

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function SetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [topic, setTopic] = useState<string>("");
  const [part, setPart] = useState<IELTSPart>("Part 1");
  const [celpipTask, setCelpipTask] = useState("Task 1");

  const topics = examType === "IELTS" ? IELTS_TOPICS : CELPIP_TOPICS;
  const canStart = !!topic;

  function handleStart() {
    if (!canStart) return;
    const params = new URLSearchParams({
      examType,
      difficulty,
      topic,
      ...(examType === "IELTS" ? { part } : { part: celpipTask }),
    });
    router.push(`/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#64748b" }}
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="flex items-center gap-3 ml-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <Mic size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>Speaking Practice</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Configure your session and start with the AI examiner</p>
          </div>
        </div>
      </div>

      {/* Exam type */}
      <FormCard title="Select Exam">
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              key: "IELTS",
              flag: "🇬🇧",
              name: "IELTS",
              full: "International English Language Testing System",
              detail: "Academic & General · Parts 1–3",
              color: "#1d4ed8",
              bg: "#eff6ff",
              border: "#bfdbfe",
            },
            {
              key: "CELPIP",
              flag: "🍁",
              name: "CELPIP",
              full: "Canadian English Language Proficiency Index Program",
              detail: "General Training · Tasks 1–8",
              color: "#0f766e",
              bg: "#f0fdfa",
              border: "#99f6e4",
            },
          ] as const).map(({ key, flag, name, full, detail, color, bg, border }) => (
            <button
              key={key}
              onClick={() => { setExamType(key as ExamType); setTopic(""); }}
              className="p-4 rounded-xl border-2 text-left transition-all space-y-2"
              style={examType === key
                ? { borderColor: color, background: bg }
                : { borderColor: "#e2e8f0", background: "#ffffff" }
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{flag}</span>
                {examType === key && <CheckCircle2 size={16} style={{ color }} />}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: examType === key ? color : "#1e293b" }}>{name}</p>
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: "#64748b" }}>{full}</p>
              </div>
              <p
                className="text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
                style={{ background: examType === key ? border : "#f1f5f9", color: examType === key ? color : "#64748b" }}
              >
                {detail}
              </p>
            </button>
          ))}
        </div>
      </FormCard>

      {/* Part / Task */}
      {examType === "IELTS" ? (
        <FormCard title="Select Part">
          <div className="space-y-2">
            {IELTS_PARTS.map(({ part: p, label, format, time, tip }) => (
              <SectionCard
                key={p}
                selected={part === p}
                onClick={() => setPart(p)}
                label={label}
                format={format}
                time={time}
                tip={tip}
              />
            ))}
          </div>
        </FormCard>
      ) : (
        <FormCard title="Select Task">
          <div className="space-y-2">
            {CELPIP_TASKS.map(({ type, label, format, time }) => (
              <SectionCard
                key={type}
                selected={celpipTask === type}
                onClick={() => setCelpipTask(type)}
                label={label}
                format={format}
                time={time}
              />
            ))}
          </div>
        </FormCard>
      )}

      {/* Difficulty */}
      <FormCard title="Difficulty Level">
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map(({ level, dot, ielts, celpip, desc }) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className="p-3.5 rounded-xl border-2 text-left transition-all space-y-1.5"
              style={difficulty === level
                ? { borderColor: dot, background: dot + "12" }
                : { borderColor: "#e2e8f0", background: "#ffffff" }
              }
            >
              <div className="flex items-center justify-between">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                {difficulty === level && <CheckCircle2 size={13} style={{ color: dot }} />}
              </div>
              <p className="text-sm font-bold" style={{ color: difficulty === level ? dot : "#1e293b" }}>{level}</p>
              <p className="text-[11px] font-medium" style={{ color: "#475569" }}>
                {examType === "IELTS" ? ielts : celpip}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "#94a3b8" }}>{desc}</p>
            </button>
          ))}
        </div>
      </FormCard>

      {/* Topic */}
      <FormCard title="Select Topic">
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={topic === t
                ? { borderColor: "#7c3aed", background: "#f5f3ff", color: "#6d28d9" }
                : { borderColor: "#e2e8f0", background: "#ffffff", color: "#475569" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </FormCard>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        style={canStart
          ? { background: "#7c3aed", color: "white", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }
          : { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }
        }
      >
        <Mic size={15} />
        {canStart ? "Start Speaking Session" : "Select a topic to continue"}
      </button>

    </div>
  );
}
