"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import type { ExamType, Difficulty, ReadingPassageType } from "@/types";

const IELTS_PASSAGES: { type: ReadingPassageType; label: string; hint: string }[] = [
  { type: "Academic", label: "Academic",          hint: "Scholarly texts · MCQ, T/F/NG, Matching, Fill-in · 20 min" },
  { type: "General",  label: "General Training",  hint: "Everyday & workplace texts · MCQ, T/F/NG, Fill-in · 20 min" },
];

const CELPIP_PASSAGES: { type: ReadingPassageType; label: string; hint: string }[] = [
  { type: "Part 1", label: "Part 1 – Correspondence", hint: "Email or letter reading · MCQ & T/F/NG · 15 min" },
  { type: "Part 2", label: "Part 2 – Diagram",        hint: "Process or chart description · MCQ & Fill-in · 15 min" },
  { type: "Part 3", label: "Part 3 – Information",    hint: "Factual article · MCQ, Matching & Fill-in · 15 min" },
  { type: "Part 4", label: "Part 4 – Viewpoints",     hint: "Opinion passage · MCQ, T/F/NG & Matching · 15 min" },
];

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={selected ? {
        background: "rgba(16, 185, 129, 0.16)",
        border: "1px solid rgba(16, 185, 129, 0.55)",
        color: "#6ee7b7",
        boxShadow: "0 0 0 1px rgba(16, 185, 129, 0.2)",
      } : {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--card-border)",
        color: "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="section-label">{title}</div>
      {children}
    </div>
  );
}

export default function ReadingSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [passageType, setPassageType] = useState<ReadingPassageType>("Academic");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  const passages = examType === "IELTS" ? IELTS_PASSAGES : CELPIP_PASSAGES;
  const selectedPassage = passages.find((p) => p.type === passageType) ?? passages[0];

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setPassageType(e === "IELTS" ? "Academic" : "Part 1");
  }

  function handleStart() {
    const params = new URLSearchParams({ examType, passageType, difficulty });
    router.push(`/reading/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
        >
          <BookOpen size={22} color="white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Reading Practice
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Timed passages with MCQ, T/F/NG, Matching &amp; Fill-in questions.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="rounded-3xl p-7 space-y-8"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <Section title="Exam Type">
          <div className="flex gap-3">
            {(["IELTS", "CELPIP"] as ExamType[]).map((e) => (
              <Pill key={e} label={e} selected={examType === e} onClick={() => handleExamChange(e)} />
            ))}
          </div>
        </Section>

        <Section title="Passage Type">
          <div className="flex flex-col gap-2">
            {passages.map((p) => (
              <button
                key={p.type}
                onClick={() => setPassageType(p.type)}
                className="flex items-start justify-between p-3.5 rounded-2xl text-left transition-all"
                style={passageType === p.type ? {
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.5)",
                } : {
                  background: "transparent",
                  border: "1px solid var(--card-border)",
                }}
              >
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{p.label}</span>
                <span className="text-xs ml-4 shrink-0" style={{ color: "var(--muted)" }}>{p.hint}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Difficulty Level">
          <div className="flex gap-3 flex-wrap">
            {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
              <Pill key={d} label={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
            ))}
          </div>
        </Section>

        {/* Summary */}
        <div
          className="p-4 rounded-2xl space-y-1 text-sm"
          style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
        >
          <p className="font-semibold text-xs uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
            Session Summary
          </p>
          <p style={{ color: "var(--muted)" }}>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{examType}</span>
            <span> · {selectedPassage.label} · {difficulty}</span>
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedPassage.hint}</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all text-white"
          style={{ background: "linear-gradient(135deg, #10b981, #0891b2)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
        >
          Start Reading <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
