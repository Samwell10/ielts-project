"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Headphones } from "lucide-react";
import type { ExamType, Difficulty, ListeningSectionType } from "@/types";

const IELTS_SECTIONS: { type: ListeningSectionType; label: string; hint: string }[] = [
  { type: "Section 1", label: "Section 1 – Social Conversation",  hint: "2 speakers · Everyday/practical context · 15 min" },
  { type: "Section 2", label: "Section 2 – Public Monologue",     hint: "1 speaker · Tour guide, announcement, radio · 15 min" },
  { type: "Section 3", label: "Section 3 – Academic Discussion",  hint: "2–3 speakers · Students & tutor · 15 min" },
  { type: "Section 4", label: "Section 4 – Academic Lecture",     hint: "1 speaker · Formal academic talk · 15 min" },
];

const CELPIP_SECTIONS: { type: ListeningSectionType; label: string; hint: string }[] = [
  { type: "Part 1", label: "Part 1 – Daily Conversation",   hint: "2 speakers · Everyday Canadian context · 12 min" },
  { type: "Part 2", label: "Part 2 – Problem Solving",      hint: "2 speakers · Resolving an issue · 12 min" },
  { type: "Part 3", label: "Part 3 – News Item",            hint: "1 speaker · Newsreader / reporter · 12 min" },
  { type: "Part 4", label: "Part 4 – Opinion / Viewpoint",  hint: "1 speaker · Opinion or podcast · 12 min" },
];

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={selected ? {
        background: "rgba(99, 102, 241, 0.18)",
        border: "1px solid rgba(99, 102, 241, 0.55)",
        color: "#a5b4fc",
        boxShadow: "0 0 0 1px rgba(99, 102, 241, 0.2)",
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

export default function ListeningSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [sectionType, setSectionType] = useState<ListeningSectionType>("Section 1");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  const sections = examType === "IELTS" ? IELTS_SECTIONS : CELPIP_SECTIONS;
  const selectedSection = sections.find((s) => s.type === sectionType) ?? sections[0];

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setSectionType(e === "IELTS" ? "Section 1" : "Part 1");
  }

  function handleStart() {
    const params = new URLSearchParams({ examType, sectionType, difficulty });
    router.push(`/listening/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}
        >
          <Headphones size={22} color="white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Listening Practice
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            AI-generated audio passages with MCQ &amp; fill-in questions. Auto-graded.
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

        <Section title="Section / Part">
          <div className="flex flex-col gap-2">
            {sections.map((s) => (
              <button
                key={s.type}
                onClick={() => setSectionType(s.type)}
                className="flex items-start justify-between p-3.5 rounded-2xl text-left transition-all"
                style={sectionType === s.type ? {
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.5)",
                } : {
                  background: "transparent",
                  border: "1px solid var(--card-border)",
                }}
              >
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{s.label}</span>
                <span className="text-xs ml-4 shrink-0" style={{ color: "var(--muted)" }}>{s.hint}</span>
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
          style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)" }}
        >
          <p className="font-semibold text-xs uppercase tracking-widest" style={{ color: "#a5b4fc" }}>
            Session Summary
          </p>
          <p style={{ color: "var(--muted)" }}>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{examType}</span>
            <span> · {selectedSection.label} · {difficulty}</span>
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedSection.hint}</p>
          <p className="text-xs pt-1" style={{ color: "#a5b4fc" }}>
            ⏱ Audio generation takes ~20–30 seconds — please wait after clicking Start.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all text-white"
          style={{
            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          Generate Listening <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
