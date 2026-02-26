"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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

function SelectCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
      style={{
        background: selected ? "var(--accent)" : "var(--card)",
        borderColor: selected ? "var(--accent)" : "var(--card-border)",
        color: selected ? "white" : "var(--muted)",
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [topic, setTopic] = useState<string>("");
  const [part, setPart] = useState<IELTSPart>("Part 1");

  const topics = examType === "IELTS" ? IELTS_TOPICS : CELPIP_TOPICS;

  function handleStart() {
    if (!topic) return;
    const params = new URLSearchParams({
      examType,
      difficulty,
      topic,
      ...(examType === "IELTS" ? { part } : {}),
    });
    router.push(`/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Practice Setup
        </h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          Configure your speaking session before you begin.
        </p>
      </div>

      <div
        className="p-6 rounded-2xl space-y-8"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        {/* Exam Type */}
        <Section title="Exam Type">
          <div className="flex gap-3">
            {(["IELTS", "CELPIP"] as ExamType[]).map((e) => (
              <SelectCard
                key={e}
                label={e}
                selected={examType === e}
                onClick={() => {
                  setExamType(e);
                  setTopic("");
                }}
              />
            ))}
          </div>
        </Section>

        {/* IELTS Part */}
        {examType === "IELTS" && (
          <Section title="IELTS Part">
            <div className="flex gap-3">
              {IELTS_PARTS.map((p) => (
                <SelectCard key={p} label={p} selected={part === p} onClick={() => setPart(p)} />
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {part === "Part 1" && "Short questions about yourself and familiar topics (4–5 min)"}
              {part === "Part 2" && "1-minute preparation then 2-minute monologue on a cue card"}
              {part === "Part 3" && "Abstract discussion and opinion questions (4–5 min)"}
            </p>
          </Section>
        )}

        {/* Difficulty */}
        <Section title="Difficulty Level">
          <div className="flex gap-3">
            {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
              <SelectCard key={d} label={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
            ))}
          </div>
        </Section>

        {/* Topic */}
        <Section title="Topic">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <SelectCard key={t} label={t} selected={topic === t} onClick={() => setTopic(t)} />
            ))}
          </div>
        </Section>

        {/* Summary */}
        {topic && (
          <div
            className="p-4 rounded-xl space-y-1 text-sm"
            style={{ background: "#1e1b4b", border: "1px solid #312e81" }}
          >
            <p style={{ color: "#a5b4fc" }} className="font-medium">
              Session Summary
            </p>
            <p style={{ color: "var(--muted)" }}>
              <span style={{ color: "var(--foreground)" }}>{examType}</span>
              {examType === "IELTS" && (
                <span> · {part}</span>
              )}
              {" · "}
              <span style={{ color: "var(--foreground)" }}>{difficulty}</span>
              {" · "}
              <span style={{ color: "var(--foreground)" }}>{topic}</span>
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!topic}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: topic ? "var(--accent)" : "#334155",
            opacity: topic ? 1 : 0.5,
            cursor: topic ? "pointer" : "not-allowed",
          }}
        >
          Start Session
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
