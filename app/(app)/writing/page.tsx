"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PenLine, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ExamType, Difficulty, WritingTaskType } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const IELTS_TASKS: { type: WritingTaskType; label: string; format: string; time: string; words: string }[] = [
  { type: "Task 1 Academic", label: "Task 1 — Academic",        format: "Describe a chart, graph, table or process", time: "20 min", words: "150+ words" },
  { type: "Task 1 General",  label: "Task 1 — General Training", format: "Write a formal, semi-formal or informal letter", time: "20 min", words: "150+ words" },
  { type: "Task 2",          label: "Task 2 — Essay",            format: "Argumentative or discussion essay", time: "40 min", words: "250+ words" },
];

const CELPIP_TASKS: { type: WritingTaskType; label: string; format: string; time: string; words: string }[] = [
  { type: "Task 1 Email",  label: "Task 1 — Email",  format: "Write a professional or casual email to a person", time: "27 min", words: "150–200 words" },
  { type: "Task 2 Survey", label: "Task 2 — Survey", format: "Respond to a survey with structured opinions", time: "27 min", words: "150–200 words" },
];

const TOPICS = [
  "Work & Career", "Education", "Technology", "Environment",
  "Health & Fitness", "Family & Relationships", "Travel & Tourism",
  "Culture & Society", "Media & Communication", "Community & Society",
];

const DIFFICULTIES: { level: Difficulty; dot: string; ielts: string; celpip: string; desc: string }[] = [
  { level: "Beginner",     dot: "#22c55e", ielts: "Band 4.5–6.0", celpip: "Level 4–6",  desc: "Straightforward prompts, clear structure" },
  { level: "Intermediate", dot: "#f59e0b", ielts: "Band 6.0–7.5", celpip: "Level 6–9",  desc: "Abstract topics, nuanced arguments" },
  { level: "Advanced",     dot: "#ef4444", ielts: "Band 7.5–9.0", celpip: "Level 9–12", desc: "Complex multi-part prompts, precise language" },
];

/* ── Shared sub-components ─────────────────────────────────────────────────── */

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

function TaskCard({
  selected,
  onClick,
  label,
  format,
  time,
  words,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  format: string;
  time: string;
  words: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start"
      style={selected
        ? { borderColor: "#d97706", background: "#fffbeb" }
        : { borderColor: "#e2e8f0", background: "#ffffff" }
      }
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
        style={selected
          ? { borderColor: "#d97706", background: "#d97706" }
          : { borderColor: "#cbd5e1", background: "white" }
        }
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: selected ? "#b45309" : "#1e293b" }}>{label}</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#64748b" }}>
              <Clock size={11} /> {time}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fef3c7", color: "#b45309" }}>
              {words}
            </span>
          </div>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{format}</p>
      </div>
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function WritingSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [taskType, setTaskType] = useState<WritingTaskType>("Task 2");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [topic, setTopic] = useState("");

  const tasks = examType === "IELTS" ? IELTS_TASKS : CELPIP_TASKS;
  const canStart = !!topic;

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setTaskType(e === "IELTS" ? "Task 2" : "Task 1 Email");
    setTopic("");
  }

  function handleStart() {
    if (!canStart) return;
    const params = new URLSearchParams({ examType, taskType, difficulty, topic });
    router.push(`/writing/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#64748b" }}>
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="flex items-center gap-3 ml-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #d97706, #fbbf24)" }}
          >
            <PenLine size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>Writing Practice</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Timed essays, letters & emails with AI band scoring</p>
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
              detail: "Task 1 (Academic/General) & Task 2",
              color: "#1d4ed8",
              bg: "#eff6ff",
              border: "#bfdbfe",
            },
            {
              key: "CELPIP",
              flag: "🍁",
              name: "CELPIP",
              full: "Canadian English Language Proficiency Index Program",
              detail: "Email (Task 1) & Survey (Task 2)",
              color: "#0f766e",
              bg: "#f0fdfa",
              border: "#99f6e4",
            },
          ] as const).map(({ key, flag, name, full, detail, color, bg, border }) => (
            <button
              key={key}
              onClick={() => handleExamChange(key as ExamType)}
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

      {/* Task type */}
      <FormCard title="Select Task">
        <div className="space-y-2">
          {tasks.map((t) => (
            <TaskCard
              key={t.type}
              selected={taskType === t.type}
              onClick={() => setTaskType(t.type)}
              label={t.label}
              format={t.format}
              time={t.time}
              words={t.words}
            />
          ))}
        </div>
      </FormCard>

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
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={topic === t
                ? { borderColor: "#d97706", background: "#fffbeb", color: "#b45309" }
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
          ? { background: "#d97706", color: "white", boxShadow: "0 4px 16px rgba(217,119,6,0.3)" }
          : { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }
        }
      >
        <PenLine size={15} />
        {canStart ? "Start Writing Session" : "Select a topic to continue"}
      </button>

    </div>
  );
}
