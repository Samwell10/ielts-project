"use client";

import Link from "next/link";
import { ArrowLeft, Mic, Clock, Play } from "lucide-react";

// Placeholder — in production this would fetch real session data
export default function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <ArrowLeft size={15} />
          Back to History
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Session Details
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Session ID: {params.sessionId}
        </p>
      </div>

      <div
        className="p-10 rounded-2xl text-center space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "#312e81" }}
        >
          <Play size={22} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            Audio Playback & Full Transcript
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            This view will show the audio recording, full transcript, per-question
            scores, and AI feedback once connected to the backend.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/setup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: "var(--accent)" }}
          >
            <Mic size={15} />
            New Practice Session
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--foreground)",
            }}
          >
            <Clock size={15} />
            All Sessions
          </Link>
        </div>
      </div>
    </div>
  );
}
