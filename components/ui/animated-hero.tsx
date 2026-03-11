"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MoveRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["fluent", "confident", "prepared", "unstoppable", "band-ready"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  /* ── Parallax background — moves at 35% of scroll speed ── */
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 210]);

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Parallax gradient layer */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          y: bgY,
          background:
            "radial-gradient(ellipse 80% 60% at 15% 50%, rgba(124,58,237,0.13) 0%, transparent 65%)," +
            "radial-gradient(ellipse 60% 70% at 88% 20%, rgba(252,211,77,0.22) 0%, transparent 60%)",
        }}
      />
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">

          {/* Badge pill */}
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              AI-Powered IELTS &amp; CELPIP Practice{" "}
              <MoveRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Heading + cycling word */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span style={{ color: "var(--foreground)" }}>
                Practice until you&apos;re
              </span>

              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    style={{ color: "var(--purple)" }}
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              AI scores your speaking, writing, reading and listening against
              official IELTS and CELPIP rubrics — no examiner, no waiting.
              Get your band score in seconds and improve with every session.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" asChild>
              <Link href="/history">
                View my progress <BookOpen className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" className="gap-4 btn-gradient text-white" asChild>
              <Link href="/setup">
                Start practising <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

export { Hero };

