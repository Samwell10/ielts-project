"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface BadgeInfo {
  badge_id: string;
  name: string;
  icon: string;
  description: string;
}

// Badge catalog mirrored from backend (icon + description for display)
const BADGE_META: Record<string, { icon: string; description: string }> = {
  first_session:    { icon: "🎯", description: "Completed your first session!" },
  streak_3:         { icon: "🔥", description: "3-day practice streak!" },
  streak_7:         { icon: "⚡", description: "7-day practice streak!" },
  streak_30:        { icon: "🏆", description: "30-day practice streak!" },
  xp_500:           { icon: "⭐", description: "Earned 500 total XP!" },
  xp_2000:          { icon: "🎓", description: "Earned 2,000 total XP!" },
  all_modules:      { icon: "🌟", description: "Practiced all 4 modules!" },
  speaking_10:      { icon: "🎤", description: "10 speaking sessions complete!" },
  writing_10:       { icon: "✍️",  description: "10 writing sessions complete!" },
  reading_10:       { icon: "📖", description: "10 reading sessions complete!" },
  listening_10:     { icon: "👂", description: "10 listening sessions complete!" },
  daily_goal:       { icon: "💪", description: "Daily goal completed!" },
};

interface Props {
  /** List of badge_ids returned from POST /api/gamification/xp/award */
  newBadgeIds: string[];
}

export default function BadgeToast({ newBadgeIds }: Props) {
  const [queue, setQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  // When new badge ids arrive, add them to the queue
  useEffect(() => {
    if (newBadgeIds.length > 0) {
      setQueue((q) => [...q, ...newBadgeIds]);
    }
  }, [newBadgeIds]);

  // Pop one badge from queue at a time, show for 3.5 s then advance
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      const timer = setTimeout(() => setCurrent(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [current, queue]);

  const meta = current ? BADGE_META[current] ?? { icon: "🏅", description: "Badge unlocked!" } : null;

  return (
    <AnimatePresence>
      {current && meta && (
        <motion.div
          key={current}
          initial={{ y: 80, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            border: "1px solid rgba(139,92,246,0.5)",
            borderRadius: "1rem",
            padding: "0.875rem 1.5rem",
            boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
            minWidth: "260px",
            maxWidth: "90vw",
          }}
        >
          {/* Glow ring around icon */}
          <div style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            background: "rgba(139,92,246,0.2)",
            border: "2px solid rgba(139,92,246,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
          }}>
            {meta.icon}
          </div>

          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.1rem" }}>
              Badge Unlocked!
            </p>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              {meta.description}
            </p>
          </div>

          {/* Progress bar auto-dismiss indicator */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3.5, ease: "linear" }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(90deg, #6366f1, #a78bfa)",
              borderRadius: "0 0 1rem 1rem",
              transformOrigin: "left",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
