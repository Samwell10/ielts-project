"use client";

/**
 * SessionCelebration
 * Shown at the top of every feedback page.
 * Receives the result from POST /api/gamification/xp/award and
 * displays: XP gained, streak pill, level-up banner.
 */

import { motion } from "framer-motion";

interface Props {
  module: "speaking" | "writing" | "reading" | "listening";
  xpGained: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  streak: number;
}

const MODULE_COLOR: Record<string, string> = {
  speaking:  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  writing:   "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  reading:   "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
  listening: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
};

const MODULE_LABEL: Record<string, string> = {
  speaking:  "Speaking",
  writing:   "Writing",
  reading:   "Reading",
  listening: "Listening",
};

const XP_PER_MODULE: Record<string, number> = {
  speaking:  60,
  writing:   80,
  reading:   50,
  listening: 50,
};

export default function SessionCelebration({ module, xpGained, totalXp, level, levelUp, streak }: Props) {
  const bg = MODULE_COLOR[module] ?? MODULE_COLOR.speaking;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: bg,
        borderRadius: "1.25rem",
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blurred orb */}
      <div style={{
        position: "absolute", top: "-2rem", right: "-2rem",
        width: "10rem", height: "10rem",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        filter: "blur(24px)",
        pointerEvents: "none",
      }} />

      {/* Level-up banner */}
      {levelUp && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: "999px",
            padding: "0.25rem 0.875rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "1rem",
            letterSpacing: "0.05em",
          }}
        >
          🎉 LEVEL UP — Now Level {level}!
        </motion.div>
      )}

      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "0.35rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {MODULE_LABEL[module]} Session Complete
      </p>

      {/* XP earned */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
        style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <span style={{ fontSize: "3rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          +{xpGained}
        </span>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          XP
        </span>
      </motion.div>

      {/* Pills row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {/* Streak pill */}
        <Pill icon="🔥" label={streak > 0 ? `${streak}-day streak` : "Start a streak tomorrow"} />

        {/* Total XP pill */}
        <Pill icon="⭐" label={`${totalXp} total XP`} />

        {/* Level pill */}
        <Pill icon="🏅" label={`Level ${level}`} />
      </div>
    </motion.div>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      background: "rgba(255,255,255,0.18)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.3)",
      borderRadius: "999px",
      padding: "0.3rem 0.875rem",
      fontSize: "0.82rem",
      fontWeight: 600,
      color: "#fff",
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
