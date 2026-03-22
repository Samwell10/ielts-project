import type {
  SessionRecord,
  WritingSubmissionRecord,
  ReadingAttemptRecord,
  ListeningAttemptRecord,
  UserProfileRecord,
} from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ModuleKey = "speaking" | "writing" | "reading" | "listening";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface PlanModule {
  key: ModuleKey;
  label: string;
  weeklySessionCount: number;
  difficulty: Difficulty;
  estimatedMinutesPerSession: number;
  href: string;
  currentAvg: number | null;
  urgencyScore: number;
  color: string;
  activeBg: string;
}

export interface StudyPlan {
  generatedAt: string;       // ISO timestamp
  weeksLeft: number;
  daysLeft: number;
  sessionsPerDay: number;
  examDate: string | null;
  targetBand: string | null;
  examType: string;
  modules: PlanModule[];     // sorted highest urgency first
  tipOfTheWeek: string;
}

/* ── Static data ────────────────────────────────────────────────────────── */

const MODULE_META: Record<ModuleKey, { label: string; href: string; color: string; activeBg: string; minutes: number }> = {
  speaking:  { label: "Speaking",  href: "/setup",      color: "#7c3aed", activeBg: "#f5f3ff", minutes: 20 },
  writing:   { label: "Writing",   href: "/writing",    color: "#d97706", activeBg: "#fffbeb", minutes: 40 },
  reading:   { label: "Reading",   href: "/reading",    color: "#0891b2", activeBg: "#ecfeff", minutes: 25 },
  listening: { label: "Listening", href: "/listening",  color: "#be123c", activeBg: "#fff1f2", minutes: 20 },
};

// Canonical priority order when no history exists
const IELTS_CANONICAL: ModuleKey[] = ["speaking", "writing", "reading", "listening"];
const CELPIP_CANONICAL: ModuleKey[] = ["listening", "speaking", "reading", "writing"];

const BASELINE_BY_LEVEL: Record<string, number> = {
  Beginner: 4.5,
  Intermediate: 6.0,
  Advanced: 7.5,
};

// Tips table: key = `${examType}_${level}_${weakestKey}`
const TIPS: Record<string, string> = {
  // IELTS tips
  "IELTS_Beginner_speaking":  "Focus on answering simply and clearly. Don't worry about perfect grammar — keep talking and avoid long silences.",
  "IELTS_Beginner_writing":   "Start with Task 1 — practice describing charts with simple sentences. Build your word count before worrying about vocabulary.",
  "IELTS_Beginner_reading":   "Read every passage twice: once for the big idea, once for detail. Practise True/False/NG questions — they reward careful reading.",
  "IELTS_Beginner_listening": "Predict answers before the audio starts. Write while you listen — don't wait until the end.",
  "IELTS_Intermediate_speaking":  "Extend your answers with 'because', 'however', and examples. Aim for 2–3 sentences per response in Part 1.",
  "IELTS_Intermediate_writing":   "Your Task 2 essay needs a clear 4-paragraph structure: intro → argument 1 → argument 2 → conclusion. Practise this every session.",
  "IELTS_Intermediate_reading":   "Matching headings and True/False/NG are your quickest wins. Learn to skim topic sentences first.",
  "IELTS_Intermediate_listening": "Section 3 and 4 are hardest — prioritise academic listening practice to push your score from Band 6 toward Band 7.",
  "IELTS_Advanced_speaking":  "Vary your sentence structure and use low-frequency vocabulary naturally. Aim for Band 8 fluency: no hesitation fillers.",
  "IELTS_Advanced_writing":   "Band 8+ Task 2 essays need nuance: acknowledge counterarguments and avoid overused phrases. Vary your cohesive devices.",
  "IELTS_Advanced_reading":   "At Band 7.5+, errors come from subtle vocabulary and inference. Re-read your wrong answers from past sessions.",
  "IELTS_Advanced_listening": "Work on note-completion and form-filling under time pressure. Speed and spelling accuracy are what separate Band 7 from Band 8.",
  // CELPIP tips
  "CELPIP_Beginner_speaking":  "Practice giving advice and describing images using simple phrases. Focus on completing the full task within the time limit.",
  "CELPIP_Beginner_writing":   "For the email task, use a clear opening, 2 body points, and a polite close. Aim for 150 words before worrying about vocabulary.",
  "CELPIP_Beginner_reading":   "CELPIP reading rewards careful skimming. Read the questions first, then scan the passage for relevant sections.",
  "CELPIP_Beginner_listening": "Daily conversation practice (Part 1) is your best starting point. Build up to problem-solving and opinion tasks.",
  "CELPIP_Intermediate_speaking":  "Compare options clearly in Task 5 — use 'On one hand... on the other hand...' to organise your ideas.",
  "CELPIP_Intermediate_writing":   "Survey responses (Task 2) need 3 structured points. Practise planning for 1 minute before writing.",
  "CELPIP_Intermediate_reading":   "Diagram / viewpoint passages require understanding of text structure. Read for the author's main argument, not just facts.",
  "CELPIP_Intermediate_listening": "Part 3 (News Item) and Part 4 (Viewpoints) have the fastest speech. Train your ear with Canadian English content daily.",
  "CELPIP_Advanced_speaking":  "CLB 10+ speaking means zero hesitation and natural Canadian phrasing. Practice all 8 task types in rotation.",
  "CELPIP_Advanced_writing":   "At CLB 10+, grammar and vocabulary must be precise. Read your responses aloud to catch awkward phrasing.",
  "CELPIP_Advanced_reading":   "Viewpoints passages test inference and implied meaning. Practise identifying the author's attitude, not just the stated facts.",
  "CELPIP_Advanced_listening": "News and opinion segments at CLB 10+ test complex inference. Practise with real Canadian news audio to train your ear.",
  // Both
  "Both_Beginner_speaking":   "Start with IELTS Part 1 and CELPIP Task 1 — both test everyday topics. Build comfort with speaking before moving to advanced tasks.",
  "Both_Intermediate_writing": "IELTS Task 2 essays and CELPIP survey responses both reward structured paragraphs. Practise the format daily.",
  "Both_Advanced_listening":  "IELTS Section 4 and CELPIP Part 4 both test dense academic listening. Practise note-taking while listening.",
};

function getTip(examType: string, level: string, weakestKey: ModuleKey): string {
  const key = `${examType}_${level}_${weakestKey}`;
  return TIPS[key] ?? `Focus on ${weakestKey} sessions this week — it's your biggest opportunity for score improvement.`;
}

/* ── Helper: average band from session arrays ───────────────────────────── */

function avgBandFrom(bands: (string | undefined)[]): number | null {
  const vals = bands
    .map(b => parseFloat(b ?? ""))
    .filter(v => !isNaN(v) && v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/* ── Core algorithm ─────────────────────────────────────────────────────── */

export function generateStudyPlan(
  profile: UserProfileRecord,
  speaking: SessionRecord[],
  writing: WritingSubmissionRecord[],
  reading: ReadingAttemptRecord[],
  listening: ListeningAttemptRecord[]
): StudyPlan {
  const now = new Date();

  // Step A — time horizon
  let daysLeft = 84; // 12-week default
  if (profile.exam_date) {
    const examTs = new Date(profile.exam_date).getTime();
    daysLeft = Math.max(1, Math.ceil((examTs - now.getTime()) / 86400000));
  }
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

  // Step B — sessions per day budget
  const baseMap: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const base = baseMap[profile.current_level] ?? 2;
  const urgencyBonus = daysLeft <= 14 ? 1 : 0;
  const sessionsPerDay = Math.min(4, base + urgencyBonus);

  // Step C — module urgency scores
  const baseline = BASELINE_BY_LEVEL[profile.current_level] ?? 6.0;
  const targetBandNum = parseFloat(profile.target_band ?? "") || (baseline + 1.5);

  const speakingAvg = avgBandFrom(speaking.map(s => s.estimated_band));
  const writingAvg  = avgBandFrom(writing.map(s => s.estimated_band));
  const readingAvg  = avgBandFrom(reading.map(s => s.estimated_band));
  const listeningAvg = avgBandFrom(listening.map(s => s.estimated_band));

  const avgs: Record<ModuleKey, number | null> = {
    speaking:  speakingAvg,
    writing:   writingAvg,
    reading:   readingAvg,
    listening: listeningAvg,
  };

  const hasAnyHistory = Object.values(avgs).some(v => v !== null);

  let urgencies: Record<ModuleKey, number>;

  if (!hasAnyHistory) {
    // Use canonical order: assign descending urgency scores
    const canonical = profile.exam_type === "CELPIP" ? CELPIP_CANONICAL : IELTS_CANONICAL;
    urgencies = { speaking: 0, writing: 0, reading: 0, listening: 0 };
    canonical.forEach((key, i) => {
      urgencies[key] = canonical.length - i; // e.g. 4, 3, 2, 1
    });
  } else {
    urgencies = {
      speaking:  Math.max(1, targetBandNum - (avgs.speaking  ?? baseline)),
      writing:   Math.max(1, targetBandNum - (avgs.writing   ?? baseline)),
      reading:   Math.max(1, targetBandNum - (avgs.reading   ?? baseline)),
      listening: Math.max(1, targetBandNum - (avgs.listening ?? baseline)),
    };
  }

  // Step D — distribute sessions per week
  const totalWeight = Object.values(urgencies).reduce((a, b) => a + b, 0);
  const weekTotal = sessionsPerDay * 7;
  const rawCounts: Record<ModuleKey, number> = {
    speaking:  Math.max(1, Math.round((urgencies.speaking  / totalWeight) * weekTotal)),
    writing:   Math.max(1, Math.round((urgencies.writing   / totalWeight) * weekTotal)),
    reading:   Math.max(1, Math.round((urgencies.reading   / totalWeight) * weekTotal)),
    listening: Math.max(1, Math.round((urgencies.listening / totalWeight) * weekTotal)),
  };

  // Normalise sum to weekTotal by adjusting the highest urgency module
  const keys: ModuleKey[] = ["speaking", "writing", "reading", "listening"];
  const currentSum = keys.reduce((a, k) => a + rawCounts[k], 0);
  const diff = weekTotal - currentSum;
  if (diff !== 0) {
    const topKey = keys.reduce((max, k) => urgencies[k] > urgencies[max] ? k : max, keys[0]);
    rawCounts[topKey] = Math.max(1, rawCounts[topKey] + diff);
  }

  // Step E — difficulty per module
  const levelOrder: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
  const baseLevel = (profile.current_level as Difficulty) || "Intermediate";
  const baseLevelIdx = levelOrder.indexOf(baseLevel);

  function moduleDifficulty(avg: number | null): Difficulty {
    if (avg !== null && avg >= targetBandNum && baseLevelIdx < 2) {
      return levelOrder[baseLevelIdx + 1];
    }
    return baseLevel;
  }

  // Step F — build sorted module list
  const modules: PlanModule[] = keys
    .map(key => ({
      key,
      label: MODULE_META[key].label,
      weeklySessionCount: rawCounts[key],
      difficulty: moduleDifficulty(avgs[key]),
      estimatedMinutesPerSession: MODULE_META[key].minutes,
      href: MODULE_META[key].href,
      currentAvg: avgs[key],
      urgencyScore: urgencies[key],
      color: MODULE_META[key].color,
      activeBg: MODULE_META[key].activeBg,
    }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const weakestKey = modules[0].key;
  const tipOfTheWeek = getTip(profile.exam_type, profile.current_level, weakestKey);

  return {
    generatedAt: now.toISOString(),
    weeksLeft,
    daysLeft,
    sessionsPerDay,
    examDate: profile.exam_date,
    targetBand: profile.target_band,
    examType: profile.exam_type,
    modules,
    tipOfTheWeek,
  };
}

/* ── localStorage helpers (SSR-safe) ────────────────────────────────────── */

const PLAN_KEY = (userId: string) => `studyPlan_${userId}`;
const WEEK_PROGRESS_KEY = (userId: string, monday: string) => `weekProgress_${userId}_${monday}`;

export function getStoredPlan(userId: string): StudyPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY(userId));
    return raw ? (JSON.parse(raw) as StudyPlan) : null;
  } catch {
    return null;
  }
}

export function storePlan(userId: string, plan: StudyPlan): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAN_KEY(userId), JSON.stringify(plan));
  } catch { /* quota exceeded — silent fail */ }
}

export function clearPlan(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PLAN_KEY(userId));
  } catch { /* silent */ }
}

export function isPlanStale(plan: StudyPlan): boolean {
  const age = Date.now() - new Date(plan.generatedAt).getTime();
  return age > 7 * 24 * 60 * 60 * 1000; // 7 days
}

/** Returns the ISO date string for the Monday of the current week */
export function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day); // days to subtract to get to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export type WeekProgress = { speaking: number; writing: number; reading: number; listening: number };

export function getWeekProgress(userId: string): WeekProgress {
  const monday = getMondayISO();
  if (typeof window === "undefined") return { speaking: 0, writing: 0, reading: 0, listening: 0 };
  try {
    const raw = localStorage.getItem(WEEK_PROGRESS_KEY(userId, monday));
    return raw ? JSON.parse(raw) : { speaking: 0, writing: 0, reading: 0, listening: 0 };
  } catch {
    return { speaking: 0, writing: 0, reading: 0, listening: 0 };
  }
}

/**
 * Derives week progress from actual session history (more accurate than manual tracking).
 * Counts sessions created during the current week (Mon–Sun).
 */
export function deriveWeekProgress(
  speaking: SessionRecord[],
  writing: WritingSubmissionRecord[],
  reading: ReadingAttemptRecord[],
  listening: ListeningAttemptRecord[]
): WeekProgress {
  const monday = getMondayISO();
  const mondayMs = new Date(monday + "T00:00:00").getTime();
  const nextMondayMs = mondayMs + 7 * 24 * 60 * 60 * 1000;

  function count(items: { created_at: string }[]): number {
    return items.filter(i => {
      const t = new Date(i.created_at).getTime();
      return t >= mondayMs && t < nextMondayMs;
    }).length;
  }

  return {
    speaking:  count(speaking),
    writing:   count(writing),
    reading:   count(reading),
    listening: count(listening),
  };
}
