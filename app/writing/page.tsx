"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PenLine } from "lucide-react";
import type { ExamType, Difficulty, WritingTaskType } from "@/types";

const IELTS_TASKS: { type: WritingTaskType; label: string; hint: string }[] = [
  { type: "Task 1 Academic", label: "Task 1 – Academic", hint: "Describe a chart or graph · 150+ words · 20 min" },
  { type: "Task 1 General", label: "Task 1 – General", hint: "Write a letter · 150+ words · 20 min" },
  { type: "Task 2",          label: "Task 2 – Essay",   hint: "Argumentative essay · 250+ words · 40 min" },
];

const CELPIP_TASKS: { type: WritingTaskType; label: string; hint: string }[] = [
  { type: "Task 1 Email",  label: "Task 1 – Email",  hint: "Write an email · 150–200 words · 27 min" },
  { type: "Task 2 Survey", label: "Task 2 – Survey", hint: "Respond to survey questions · 150–200 words · 27 min" },
];

const TOPICS = [
  "Work & Career",
  "Education",
  "Technology",
  "Environment",
  "Health & Fitness",
  "Family & Relationships",
  "Travel & Tourism",
  "Culture & Society",
  "Media & Communication",
  "Community & Society",
];

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

export default function WritingSetupPage() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>("IELTS");
  const [taskType, setTaskType] = useState<WritingTaskType>("Task 2");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [topic, setTopic] = useState("");

  const tasks = examType === "IELTS" ? IELTS_TASKS : CELPIP_TASKS;
  const selectedTask = tasks.find((t) => t.type === taskType) ?? tasks[0];

  function handleExamChange(e: ExamType) {
    setExamType(e);
    setTaskType(e === "IELTS" ? "Task 2" : "Task 1 Email");
    setTopic("");
  }

  function handleStart() {
    if (!topic) return;
    const params = new URLSearchParams({ examType, taskType, difficulty, topic });
    router.push(`/writing/session?${params.toString()}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #d946ef, #f43f5e)" }}>
          <PenLine size={22} color="white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Writing Practice
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Timed essays, letters &amp; emails with AI band scoring.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-3xl p-7 space-y-8"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>

        <Section title="Exam Type">
          <div className="flex gap-3">
            {(["IELTS", "CELPIP"] as ExamType[]).map((e) => (
              <Pill key={e} label={e} selected={examType === e} onClick={() => handleExamChange(e)} />
            ))}
          </div>
        </Section>

        <Section title="Task Type">
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <button
                key={t.type}
                onClick={() => setTaskType(t.type)}
                className="flex items-start justify-between p-3.5 rounded-2xl text-left transition-all"
                style={taskType === t.type ? {
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.5)",
                } : {
                  background: "transparent",
                  border: "1px solid var(--card-border)",
                }}
              >
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{t.label}</span>
                <span className="text-xs ml-4 shrink-0" style={{ color: "var(--muted)" }}>{t.hint}</span>
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

        <Section title="Topic">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
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
              <span> · {selectedTask.label} · {difficulty} · </span>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{topic}</span>
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedTask.hint}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!topic}
          className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
          style={topic
            ? { background: "linear-gradient(135deg, #d946ef, #f43f5e)", color: "white", boxShadow: "0 4px 20px rgba(217,70,239,0.35)" }
            : { background: "rgba(255,255,255,0.04)", color: "var(--muted)", border: "1px solid var(--card-border)", cursor: "not-allowed" }
          }
        >
          {topic ? "Start Writing" : "Select a topic to continue"}
          {topic && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
