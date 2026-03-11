"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── FadeInSection ─────────────────────────────────────────────────────────
   Wraps children in a whileInView fade + slide-up animation.               */

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}

export function FadeInSection({
  children,
  className,
  delay = 0,
  distance = 48,
}: FadeInSectionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── ParallaxBlob ──────────────────────────────────────────────────────────
   A positioned blob/shape that drifts at `speed` × scrollY.
   Positive speed  → moves down as user scrolls down (slower than page).
   Negative speed  → moves up as user scrolls down (counter-scroll).        */

interface ParallaxBlobProps {
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}

export function ParallaxBlob({ className, style, speed = 0.08 }: ParallaxBlobProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * speed);

  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      style={{ ...style, y }}
    />
  );
}

/* ── ParallaxY ─────────────────────────────────────────────────────────────
   Wrapper that scrolls its children at a reduced speed relative to the
   viewport — classic parallax for background layers or decorative elements. */

interface ParallaxYProps {
  children: React.ReactNode;
  className?: string;
  /** Total px travel across the element's viewport lifespan. */
  distance?: number;
}

export function ParallaxY({ children, className, distance = 80 }: ParallaxYProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * -(distance / 1200));

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
