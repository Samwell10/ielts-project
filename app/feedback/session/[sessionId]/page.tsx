"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ChevronRight, Clock, BookOpen, Mic, AlertCircle } from "lucide-react";
import { type SessionRecord } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color = score / max >= 0.78 ? "var(--success)" : score / max >= 0.61 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-bold" style={{ color }}>{score} / {max}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--card-border)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function getScoreColor(score: number, max: number) {
  const r = score / max;
  return r >= 0.78 ? "var(--success)" : r >= 0.61 ? "var(--warning)" : "var(--danger)";
}

export default function SessionFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const api = useApi();

  useEffect(() => {
    api.getSession(sessionId)
      .then(setSession)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
        <p style={{ color: "var(--muted)" }}>Loading your feedback...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <AlertCircle size={40} style={{ color: "var(--danger)" }} className="mx-auto" />
        <p style={{ color: "var(--muted)" }}>{error || "Session not found."}</p>
        <Link href="/history" className="px-6 py-3 rounded-xl font-semibold text-white inline-block"
          style={{ background: "var(--accent)" }}>
          Back to History
        </Link>
      </div>
    );
  }

  const isIELTS = session.exam_type === "IELTS";
  const maxScore = isIELTS ? 9 : 12;
  const overallScore = session.overall_score ?? 0;
  const scoreColor = getScoreColor(overallScore, maxScore);
  const minutes = Math.floor((session.duration_seconds ?? 0) / 60);
  const seconds = (session.duration_seconds ?? 0) % 60;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Feedback Report</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {session.exam_type} {session.part ? `· ${session.part}` : ""} · {session.topic}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <Clock size={14} />
          {minutes}m {seconds}s
        </div>
      </div>

      {/* Overall score */}
      <div
        className="p-8 rounded-2xl text-center space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
          Estimated Score
        </p>
        <div className="text-6xl font-black" style={{ color: scoreColor }}>
          {session.estimated_band ?? "—"}
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {isIELTS ? "Based on IELTS official band descriptors" : "Based on CELPIP official level descriptors"}
        </p>
      </div>

      {/* Per-question breakdowns */}
      {session.responses.map((r, i) => {
        const rScore = r.overall_score ?? 0;
        const color = getScoreColor(rScore, maxScore);

        const criteria = isIELTS
          ? [
              { key: "Fluency & Coherence", score: r.fluency_coherence ?? 0 },
              { key: "Lexical Resource", score: r.lexical_resource ?? 0 },
              { key: "Grammatical Range", score: r.grammatical_range ?? 0 },
              { key: "Pronunciation", score: r.pronunciation ?? 0 },
            ]
          : [
              { key: "Content & Coherence", score: r.content_coherence ?? 0 },
              { key: "Vocabulary", score: r.vocabulary ?? 0 },
              { key: "Listenability", score: r.listenability ?? 0 },
              { key: "Task Fulfillment", score: r.task_fulfillment ?? 0 },
            ];

        return (
          <div
            key={r.response_id}
            className="p-6 rounded-2xl space-y-5"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                  Question {i + 1}
                </p>
                <p className="font-medium" style={{ color: "var(--foreground)" }}>{r.question_text}</p>
              </div>
              <div
                className="shrink-0 text-xl font-black px-4 py-1.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color }}
              >
                {rScore.toFixed(1)}
              </div>
            </div>

            <div className="space-y-3">
              {criteria.map(({ key, score }) => (
                <ScoreBar key={key} label={key} score={score} max={maxScore} />
              ))}
            </div>

            {r.transcript && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Your Response (Transcript)
                </p>
                <div
                  className="p-4 rounded-xl text-sm leading-relaxed"
                  style={{ background: "#0f172a", border: "1px solid var(--card-border)", color: "var(--muted)" }}
                >
                  {r.transcript}
                </div>
              </div>
            )}

            {r.feedback && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  AI Feedback
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{r.feedback}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic tips keyed to lowest-scoring criterion */}
      {session.responses.length > 0 && (() => {
        // Compute average per criterion across all responses
        const isIELTSSession = session.exam_type === "IELTS";
        const criteriaAvg = isIELTSSession ? {
          "Fluency & Coherence": session.responses.reduce((s, r) => s + (r.fluency_coherence ?? 0), 0) / session.responses.length,
          "Lexical Resource": session.responses.reduce((s, r) => s + (r.lexical_resource ?? 0), 0) / session.responses.length,
          "Grammatical Range": session.responses.reduce((s, r) => s + (r.grammatical_range ?? 0), 0) / session.responses.length,
          "Pronunciation": session.responses.reduce((s, r) => s + (r.pronunciation ?? 0), 0) / session.responses.length,
        } : {
          "Content & Coherence": session.responses.reduce((s, r) => s + (r.content_coherence ?? 0), 0) / session.responses.length,
          "Vocabulary": session.responses.reduce((s, r) => s + (r.vocabulary ?? 0), 0) / session.responses.length,
          "Listenability": session.responses.reduce((s, r) => s + (r.listenability ?? 0), 0) / session.responses.length,
          "Task Fulfillment": session.responses.reduce((s, r) => s + (r.task_fulfillment ?? 0), 0) / session.responses.length,
        };
        const lowest = Object.entries(criteriaAvg).sort(([, a], [, b]) => a - b)[0]?.[0] ?? "";

        const CRITERION_TIPS: Record<string, string[]> = {
          "Fluency & Coherence": [
            "Reduce filler words ('um', 'uh', 'like') — pause silently instead to sound more natural.",
            "Use discourse markers like 'firstly', 'on the other hand', 'to sum up' to link ideas smoothly.",
            "Practise speaking non-stop for 60 seconds on random topics to build fluency stamina.",
            "Record yourself, then transcribe — you will spot where you lose coherence.",
          ],
          "Lexical Resource": [
            "Paraphrase question keywords instead of repeating them word-for-word.",
            "Learn 3 collocations a day (e.g. 'make a decision', 'heavy traffic') and use them actively.",
            "Aim to use at least one idiomatic expression per answer without forcing it.",
            "Read English news articles and note how writers express complex ideas concisely.",
          ],
          "Grammatical Range": [
            "Mix simple, compound, and complex sentences — avoid relying only on short sentences.",
            "Practise conditionals (If I had…, Were I to…) and passive voice in your answers.",
            "Use a variety of tenses: present perfect for experience, past simple for events, future for plans.",
            "After each session, pick one grammar error from your transcript and drill it for 5 minutes.",
          ],
          "Pronunciation": [
            "Focus on word stress — mis-stressing a word is more confusing than a slight accent.",
            "Practise linking: 'turned off' → 'turned_off', 'an apple' → 'an_apple'.",
            "Shadow native-speaker audio: pause after each sentence and repeat with identical rhythm.",
            "Record yourself and compare your pronunciation with a reference speaker on the same passage.",
          ],
          "Content & Coherence": [
            "Structure each answer: point → reason → example → conclusion.",
            "Stay on topic — re-read the question mentally before speaking if you drift.",
            "Use examples from personal experience to add authenticity and detail.",
            "Practice PEEL: Point, Evidence, Explanation, Link-back.",
          ],
          "Vocabulary": [
            "Replace general words with precise ones: 'good' → 'beneficial', 'bad' → 'detrimental'.",
            "Learn synonyms for common exam topics: environment, technology, health, education.",
            "Use context clues when you don't know a word — paraphrase confidently.",
            "Keep a vocabulary journal and review it before each practice session.",
          ],
          "Listenability": [
            "Speak at a steady pace — slowing down slightly improves clarity more than speaking fast.",
            "Articulate final consonants clearly ('want' not 'wan', 'asked' not 'ask').",
            "Use intonation to highlight key words — this helps listeners follow your main point.",
            "Reduce background noise and ensure your microphone is close when recording.",
          ],
          "Task Fulfillment": [
            "Answer the question directly in your first sentence, then expand.",
            "If given a cue card, cover all bullet points — examiners check each one.",
            "Don't go off on tangents; return to the question after each supporting point.",
            "Practise summarising your answer in one sentence at the end.",
          ],
        };

        const tips = CRITERION_TIPS[lowest] ?? [
          "Review your transcripts and look for repeated grammar errors.",
          "Practise extending answers with 'for example…' and 'such as…'.",
          "Record yourself daily for 5 minutes on a random topic.",
          "Focus on the criteria where your score was lowest this session.",
        ];

        return (
          <div
            className="p-6 rounded-2xl space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <BookOpen size={18} style={{ color: "var(--accent)" }} />
              Keep Improving
            </h2>
            {lowest && (
              <p className="text-xs px-3 py-1.5 rounded-lg w-fit"
                style={{ background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.25)" }}>
                Focus area: <strong>{lowest}</strong>
              </p>
            )}
            <ul className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link
          href="/dashboard"
          className="flex-1 py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
        >
          Back to Dashboard
        </Link>
        <Link
          href="/setup"
          className="flex-1 py-3 rounded-xl font-semibold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "var(--accent)" }}
        >
          <Mic size={16} /> Try another Speaking
        </Link>
      </div>
    </div>
  );
}
