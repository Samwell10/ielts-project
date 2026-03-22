"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { saveProfile } from "@/lib/api";
import { ChevronRight, BookOpen, Target, Calendar, BarChart2, CheckCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ExamType = "IELTS" | "CELPIP" | "Both";
type Level = "Beginner" | "Intermediate" | "Advanced";

interface OnboardingData {
  exam_type: ExamType;
  target_band: string | null;
  exam_date: string | null;
  current_level: Level;
}

// ── Step config ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

// Band options for IELTS
const IELTS_BANDS = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];
// CLB levels for CELPIP
const CELPIP_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    exam_type: "IELTS",
    target_band: null,
    exam_date: null,
    current_level: "Intermediate",
  });

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  const bandOptions = data.exam_type === "CELPIP" ? CELPIP_LEVELS : IELTS_BANDS;
  const progress = (step / TOTAL_STEPS) * 100;

  function next() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }
  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function finish() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token || !userId) return;
      await saveProfile(userId, { ...data, onboarding_done: true }, token);
      router.push("/study-plan?new=1");
    } catch {
      router.push("/study-plan?new=1"); // fail gracefully
    }
  }

  // ── Exam type card ──────────────────────────────────────────────────────────
  function ExamCard({ type, desc }: { type: ExamType; desc: string }) {
    const active = data.exam_type === type;
    return (
      <button
        onClick={() => {
          setData((d) => ({ ...d, exam_type: type, target_band: null }));
        }}
        style={{
          width: "100%",
          padding: "1.25rem 1.5rem",
          borderRadius: "1rem",
          border: `2px solid ${active ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
          background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.18s",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{
          width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", flexShrink: 0,
          background: active ? "#6366f1" : "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", fontWeight: 800, color: active ? "#fff" : "var(--muted)",
        }}>
          {type === "Both" ? "B" : type[0]}
        </div>
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: active ? "#a5b4fc" : "var(--foreground)", margin: 0 }}>{type}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>{desc}</p>
        </div>
        {active && <CheckCircle size={18} style={{ color: "#6366f1", marginLeft: "auto" }} />}
      </button>
    );
  }

  // ── Level card ──────────────────────────────────────────────────────────────
  function LevelCard({ level, emoji, desc }: { level: Level; emoji: string; desc: string }) {
    const active = data.current_level === level;
    return (
      <button
        onClick={() => setData((d) => ({ ...d, current_level: level }))}
        style={{
          padding: "1.25rem",
          borderRadius: "1rem",
          border: `2px solid ${active ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
          background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.18s",
          flex: 1,
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{emoji}</div>
        <p style={{ fontSize: "0.95rem", fontWeight: 700, color: active ? "#a5b4fc" : "var(--foreground)", margin: 0 }}>{level}</p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.25rem 0 0" }}>{desc}</p>
      </button>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      background: "var(--background)",
    }}>
      <div style={{ width: "100%", maxWidth: "520px" }}>

        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--foreground)", margin: 0 }}>
            Prep<span style={{ color: "#6366f1" }}>AI</span>
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Let's personalise your study plan
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#a5b4fc", fontWeight: 600 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #6366f1, #a78bfa)" }}
            />
          </div>
        </div>

        {/* Step card */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── Step 1: Exam type ───────────────────────────────────── */}
              {step === 1 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={18} style={{ color: "#a5b4fc" }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--foreground)" }}>
                        Which exam are you preparing for?
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Choose the test you want to practice</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <ExamCard type="IELTS" desc="Academic & General Training — accepted globally" />
                    <ExamCard type="CELPIP" desc="Canadian English Language Proficiency — for Canadian PR/citizenship" />
                    <ExamCard type="Both" desc="I want to prepare for both exams" />
                  </div>
                </div>
              )}

              {/* ── Step 2: Target band ─────────────────────────────────── */}
              {step === 2 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Target size={18} style={{ color: "#a5b4fc" }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--foreground)" }}>
                        What's your target {data.exam_type === "CELPIP" ? "CLB level" : "band score"}?
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                        {data.exam_type === "CELPIP" ? "CLB 6 is entry-level; CLB 9+ for most PR pathways" : "Band 6.5–7.0 is required for most universities & PR"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                    {bandOptions.map((band) => {
                      const active = data.target_band === band;
                      return (
                        <button
                          key={band}
                          onClick={() => setData((d) => ({ ...d, target_band: band }))}
                          style={{
                            padding: "0.6rem 1.1rem",
                            borderRadius: "0.75rem",
                            border: `2px solid ${active ? "#6366f1" : "rgba(255,255,255,0.12)"}`,
                            background: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            color: active ? "#a5b4fc" : "var(--foreground)",
                            fontWeight: active ? 700 : 500,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {data.exam_type === "CELPIP" ? `CLB ${band}` : `Band ${band}`}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setData((d) => ({ ...d, target_band: null }))}
                    style={{
                      marginTop: "1rem",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textDecoration: data.target_band === null ? "underline" : "none",
                      padding: 0,
                    }}
                  >
                    I'm not sure yet — skip this step
                  </button>
                </div>
              )}

              {/* ── Step 3: Exam date ───────────────────────────────────── */}
              {step === 3 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} style={{ color: "#a5b4fc" }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--foreground)" }}>
                        When is your exam?
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                        We'll adjust your daily practice intensity to match your timeline
                      </p>
                    </div>
                  </div>

                  <input
                    type="date"
                    value={data.exam_date ?? ""}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setData((d) => ({ ...d, exam_date: e.target.value || null }))}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      border: "2px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--foreground)",
                      fontSize: "1rem",
                      outline: "none",
                      boxSizing: "border-box",
                      colorScheme: "dark",
                    }}
                  />

                  {data.exam_date && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: "1rem",
                        padding: "0.875rem 1rem",
                        borderRadius: "0.75rem",
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.3)",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#a5b4fc", fontWeight: 600 }}>
                        📅 {Math.max(0, Math.ceil((new Date(data.exam_date).getTime() - Date.now()) / 86400000))} days to your exam
                      </p>
                    </motion.div>
                  )}

                  <button
                    onClick={() => setData((d) => ({ ...d, exam_date: null }))}
                    style={{
                      marginTop: "1rem",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textDecoration: data.exam_date === null ? "underline" : "none",
                      padding: 0,
                    }}
                  >
                    My exam isn't scheduled yet — skip
                  </button>
                </div>
              )}

              {/* ── Step 4: Current level ───────────────────────────────── */}
              {step === 4 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart2 size={18} style={{ color: "#a5b4fc" }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--foreground)" }}>
                        How's your current English level?
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                        This sets the starting difficulty of your practice sessions
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <LevelCard level="Beginner"     emoji="🌱" desc="Band 4–5 / CLB 4–6" />
                    <LevelCard level="Intermediate" emoji="📈" desc="Band 5.5–6.5 / CLB 7–8" />
                    <LevelCard level="Advanced"     emoji="🏆" desc="Band 7+ / CLB 9+" />
                  </div>

                  {/* Summary card */}
                  <div style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Your study plan
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)" }}>
                        🎯 Exam: <strong>{data.exam_type}</strong>
                      </p>
                      {data.target_band && (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)" }}>
                          🏅 Target: <strong>{data.exam_type === "CELPIP" ? `CLB ${data.target_band}` : `Band ${data.target_band}`}</strong>
                        </p>
                      )}
                      {data.exam_date && (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)" }}>
                          📅 Exam date: <strong>{new Date(data.exam_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)" }}>
                        📊 Starting level: <strong>{data.current_level}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          {step > 1 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: "0.875rem",
                borderRadius: "0.875rem",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              style={{
                flex: 3,
                padding: "0.875rem",
                borderRadius: "0.875rem",
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              style={{
                flex: 3,
                padding: "0.875rem",
                borderRadius: "0.875rem",
                border: "none",
                background: saving ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {saving ? "Saving…" : "Let's start practising 🚀"}
            </button>
          )}
        </div>

        {/* Skip entirely */}
        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", fontSize: "inherit" }}
          >
            Skip for now
          </button>
        </p>

      </div>
    </div>
  );
}
