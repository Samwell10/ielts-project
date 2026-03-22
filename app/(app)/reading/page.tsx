"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ExamType, Difficulty, ReadingPassageType } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const IELTS_PASSAGES: { type: ReadingPassageType; label: string; format: string; time: string; questionTypes: string }[] = [
  {
    type: "Academic",
    label: "Academic",
    format: "Scholarly texts from books, journals, magazines",
    time: "20 min",
    questionTypes: "MCQ · True/False/NG · Matching · Fill-in",
  },
  {
    type: "General",
    label: "General Training",
    format: "Everyday & workplace texts (ads, notices, letters)",
    time: "20 min",
    questionTypes: "MCQ · True/False/NG · Fill-in · Short Answer",
  },
];

const CELPIP_PASSAGES: { type: ReadingPassageType; label: string; format: string; time: string; questionTypes: string }[] = [
  {
    type: "Part 1",
    label: "Part 1 — Correspondence",
    format: "Email or letter reading comprehension",
    time: "15 min",
    questionTypes: "MCQ · True/False/NG",
  },
  {
    type: "Part 2",
    label: "Part 2 — Diagram",
    format: "Process or flow chart with descriptive text",
    time: "15 min",
    questionTypes: "MCQ · Fill-in",
  },
  {
    type: "Part 3",
    label: "Part 3 — Information",
    format: "Factual article or informational text",
    time: "15 min",
    questionTypes: "MCQ · Matching · Fill-in",
  },
  {
    type: "Part 4",
    label: "Part 4 — Viewpoints",
    format: "Opinion or persuasive passage",
    time: "15 min",
    questionTypes: "MCQ · True/False/NG · Matching",
  },
];

const DIFFICULTIES: { level: Difficulty; dot: string; ielts: string; celpip: string; desc: string }[] = [
  { level: "Beginner",     dot: "#22c55e", ielts: "Band 4.5–6.0", celpip: "Level 4–6",  desc: "Clear vocabulary, shorter passages" },
  { level: "Intermediate", dot: "#f59e0b", ielts: "Band 6.0–7.5", celpip: "Level 6–9",  desc: "Mixed difficulty, inference required" },
  { level: "Advanced",     dot: "#ef4444", ielts: "Band 7.5–9.0", celpip: "Level 9–12", desc: "Dense academic text, complex questions" },
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

function PassageCard({
  selected,
  onClick,
  label,
  format,
  time,
  questionTypes,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  format: string;
  time: string;
  questionTypes: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start"
      style={selected
        ? { borderColor: "#0891b2", background: "#ecfeff" }
        : { borderColor: "#e2e8f0", background: "#ffffff" }
      }
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
        style={selected
          ? { borderColor: "#0891b2", background: "#0891b2" }
          : { borderColor: "#cbd5e1", background: "white" }
        }
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: selected ? "#0e7490" : "#1e293b" }}>{label}</p>
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "#64748b" }}>
            <Clock size={11} /> {time}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{format}</p>
        {selected && (
          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg font-medium" style={{ background: "#cffafe", color: "#0e7490" }}>
            {questionTypes}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function ReadingSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [passageType, setPassageType] = useState<ReadingPassageType>("Academic");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  const passages = examType === "IELTS" ? IELTS_PASSAGES : CELPIP_PASSAGES;

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setPassageType(e === "IELTS" ? "Academic" : "Part 1");
  }

  function handleStart() {
    const params = new URLSearchParams({ examType, passageType, difficulty });
    router.push(`/reading/session?${params.toString()}`);
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
            style={{ background: "linear-gradient(135deg, #0891b2, #22d3ee)" }}
          >
            <BookOpen size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>Reading Practice</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Timed passages with MCQ, T/F/NG, Matching & Fill-in questions</p>
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
              detail: "Academic & General Training",
              color: "#1d4ed8",
              bg: "#eff6ff",
              border: "#bfdbfe",
            },
            {
              key: "CELPIP",
              flag: "🍁",
              name: "CELPIP",
              full: "Canadian English Language Proficiency Index Program",
              detail: "Parts 1–4 (Correspondence to Viewpoints)",
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

      {/* Passage type */}
      <FormCard title="Select Passage Type">
        <div className="space-y-2">
          {passages.map((p) => (
            <PassageCard
              key={p.type}
              selected={passageType === p.type}
              onClick={() => setPassageType(p.type)}
              label={p.label}
              format={p.format}
              time={p.time}
              questionTypes={p.questionTypes}
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

      {/* Start */}
      <button
        onClick={handleStart}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
        style={{ background: "#0891b2", boxShadow: "0 4px 16px rgba(8,145,178,0.3)" }}
      >
        <BookOpen size={15} />
        Start Reading Session
      </button>

    </div>
  );
}
