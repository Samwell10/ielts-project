"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic } from "lucide-react";
import type { ExamType, Difficulty, IELTSPart } from "@/types";

const IELTS_TOPICS = [
  "Work & Career",
  "Education",
  "Family & Relationships",
  "Technology",
  "Environment",
  "Travel & Tourism",
  "Health & Fitness",
  "Culture & Society",
  "Hobbies & Free Time",
  "Media & Communication",
];

const CELPIP_TOPICS = [
  "Giving Advice",
  "Talking About a Past Event",
  "Describing a Scene",
  "Making Predictions",
  "Comparing Two Options",
  "Expressing Opinions",
  "Talking About Daily Routines",
  "Describing Graphs or Charts",
];

const IELTS_PARTS: IELTSPart[] = ["Part 1", "Part 2", "Part 3"];

const PART_DESC: Record<IELTSPart, string> = {
  "Part 1": "Short questions about yourself and familiar topics (4–5 min)",
  "Part 2": "1-minute preparation then 2-minute monologue on a cue card",
  "Part 3": "Abstract discussion and opinion questions (4–5 min)",
};

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={selected ? {
        background: "rgba(139, 92, 246, 0.16)",
        border: "1px solid rgba(139, 92, 246, 0.55)",
        color: "#c4b5fd",
        boxShadow: "0 0 0 1px rgba(139, 92, 246, 0.2)",
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

export default function SetupPage() {
  const router = useRouter();
  const [examType, setExamType]     = useState<ExamType>("IELTS");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [topic, setTopic]           = useState<string>("");
  const [part, setPart]             = useState<IELTSPart>("Part 1");

  const topics = examType === "IELTS" ? IELTS_TOPICS : CELPIP_TOPICS;

  function handleStart() {
    if (!topic) return;
    const params = new URLSearchParams({
      examType, difficulty, topic,
      ...(examType === "IELTS" ? { part } : {}),
    });
    router.push(`/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
          <Mic size={22} color="white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Speaking Practice
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Configure your session and start speaking with the AI examiner.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl p-7 space-y-8"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>

        <Section title="Exam Type">
          <div className="flex gap-3">
            {(["IELTS", "CELPIP"] as ExamType[]).map((e) => (
              <Pill key={e} label={e} selected={examType === e}
                onClick={() => { setExamType(e); setTopic(""); }} />
            ))}
          </div>
        </Section>

        {examType === "IELTS" && (
          <Section title="IELTS Part">
            <div className="flex gap-3 flex-wrap">
              {IELTS_PARTS.map((p) => (
                <Pill key={p} label={p} selected={part === p} onClick={() => setPart(p)} />
              ))}
            </div>
            <p className="text-xs mt-1 pl-0.5" style={{ color: "var(--muted)" }}>
              {PART_DESC[part]}
            </p>
          </Section>
        )}

        <Section title="Difficulty Level">
          <div className="flex gap-3 flex-wrap">
            {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
              <Pill key={d} label={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
            ))}
          </div>
        </Section>

        <Section title="Topic">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Pill key={t} label={t} selected={topic === t} onClick={() => setTopic(t)} />
            ))}
          </div>
        </Section>

        {topic && (
          <div className="p-4 rounded-2xl space-y-1 text-sm"
            style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
            <p className="font-semibold text-xs uppercase tracking-widest" style={{ color: "#a78bfa" }}>
              Session Summary
            </p>
            <p style={{ color: "var(--muted)" }}>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{examType}</span>
              {examType === "IELTS" && <span> · {part}</span>}
              <span> · {difficulty} · </span>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{topic}</span>
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!topic}
          className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
          style={topic
            ? { background: "linear-gradient(135deg, #8b5cf6, #d946ef)", color: "white", boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }
            : { background: "rgba(255,255,255,0.04)", color: "var(--muted)", border: "1px solid var(--card-border)", cursor: "not-allowed" }
          }
        >
          {topic ? "Start Speaking" : "Select a topic to continue"}
          {topic && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
