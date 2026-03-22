"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Headphones, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ExamType, Difficulty, ListeningSectionType } from "@/types";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const IELTS_SECTIONS: { type: ListeningSectionType; label: string; format: string; time: string; questionTypes: string }[] = [
  {
    type: "Section 1",
    label: "Section 1 — Social Conversation",
    format: "2 speakers · Everyday practical context",
    time: "~15 min",
    questionTypes: "MCQ · Fill-in · Short Answer",
  },
  {
    type: "Section 2",
    label: "Section 2 — Public Monologue",
    format: "1 speaker · Tour guide, announcement or radio",
    time: "~15 min",
    questionTypes: "MCQ · Matching · Fill-in",
  },
  {
    type: "Section 3",
    label: "Section 3 — Academic Discussion",
    format: "2–3 speakers · Students & tutor",
    time: "~15 min",
    questionTypes: "MCQ · Matching · Fill-in",
  },
  {
    type: "Section 4",
    label: "Section 4 — Academic Lecture",
    format: "1 speaker · Formal academic talk",
    time: "~15 min",
    questionTypes: "MCQ · Fill-in · Note Completion",
  },
];

const CELPIP_SECTIONS: { type: ListeningSectionType; label: string; format: string; time: string; questionTypes: string }[] = [
  {
    type: "Part 1",
    label: "Part 1 — Daily Conversation",
    format: "2 speakers · Everyday Canadian context",
    time: "~12 min",
    questionTypes: "MCQ · Fill-in",
  },
  {
    type: "Part 2",
    label: "Part 2 — Problem Solving",
    format: "2 speakers · Resolving an issue together",
    time: "~12 min",
    questionTypes: "MCQ · True/False/NG",
  },
  {
    type: "Part 3",
    label: "Part 3 — News Item",
    format: "1 speaker · Newsreader or reporter",
    time: "~12 min",
    questionTypes: "MCQ · Short Answer",
  },
  {
    type: "Part 4",
    label: "Part 4 — Opinion / Viewpoint",
    format: "1 speaker · Opinion or podcast segment",
    time: "~12 min",
    questionTypes: "MCQ · Matching · Fill-in",
  },
];

const DIFFICULTIES: { level: Difficulty; dot: string; ielts: string; celpip: string; desc: string }[] = [
  { level: "Beginner",     dot: "#22c55e", ielts: "Band 4.5–6.0", celpip: "Level 4–6",  desc: "Clear speech, familiar topics" },
  { level: "Intermediate", dot: "#f59e0b", ielts: "Band 6.0–7.5", celpip: "Level 6–9",  desc: "Natural pace, mixed accents" },
  { level: "Advanced",     dot: "#ef4444", ielts: "Band 7.5–9.0", celpip: "Level 9–12", desc: "Fast speech, complex vocabulary" },
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

function SectionCard({
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
        ? { borderColor: "#4f46e5", background: "#eef2ff" }
        : { borderColor: "#e2e8f0", background: "#ffffff" }
      }
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
        style={selected
          ? { borderColor: "#4f46e5", background: "#4f46e5" }
          : { borderColor: "#cbd5e1", background: "white" }
        }
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: selected ? "#3730a3" : "#1e293b" }}>{label}</p>
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "#64748b" }}>
            <Clock size={11} /> {time}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{format}</p>
        {selected && (
          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg font-medium" style={{ background: "#e0e7ff", color: "#3730a3" }}>
            {questionTypes}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function ListeningSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [sectionType, setSectionType] = useState<ListeningSectionType>("Section 1");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  const sections = examType === "IELTS" ? IELTS_SECTIONS : CELPIP_SECTIONS;

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setSectionType(e === "IELTS" ? "Section 1" : "Part 1");
  }

  function handleStart() {
    const params = new URLSearchParams({ examType, sectionType, difficulty });
    router.push(`/listening/session?${params.toString()}`);
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
            style={{ background: "linear-gradient(135deg, #4f46e5, #818cf8)" }}
          >
            <Headphones size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>Listening Practice</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>AI-generated audio passages with MCQ, Fill-in & matching questions</p>
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
              detail: "Sections 1–4 (Social to Academic)",
              color: "#1d4ed8",
              bg: "#eff6ff",
              border: "#bfdbfe",
            },
            {
              key: "CELPIP",
              flag: "🍁",
              name: "CELPIP",
              full: "Canadian English Language Proficiency Index Program",
              detail: "Parts 1–4 (Conversation to Viewpoints)",
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

      {/* Section / Part */}
      <FormCard title="Select Section">
        <div className="space-y-2">
          {sections.map((s) => (
            <SectionCard
              key={s.type}
              selected={sectionType === s.type}
              onClick={() => setSectionType(s.type)}
              label={s.label}
              format={s.format}
              time={s.time}
              questionTypes={s.questionTypes}
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

      {/* Audio generation notice */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl border"
        style={{ background: "#f0f9ff", borderColor: "#bae6fd" }}
      >
        <Clock size={15} className="shrink-0 mt-0.5" style={{ color: "#0369a1" }} />
        <p className="text-xs leading-relaxed" style={{ color: "#0369a1" }}>
          <span className="font-semibold">Audio generation takes ~20–30 seconds.</span>{" "}
          Please wait after clicking Start — do not navigate away while the audio is being prepared.
        </p>
      </div>

      {/* Start */}
      <button
        onClick={handleStart}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
        style={{ background: "#4f46e5", boxShadow: "0 4px 16px rgba(79,70,229,0.3)" }}
      >
        <Headphones size={15} />
        Start Listening Session
      </button>

    </div>
  );
}
