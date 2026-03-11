export type ExamType = "IELTS" | "CELPIP";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type IELTSPart = "Part 1" | "Part 2" | "Part 3";

export type WritingTaskType =
  | "Task 1 Academic"
  | "Task 1 General"
  | "Task 2"
  | "Task 1 Email"
  | "Task 2 Survey";

export type ReadingPassageType =
  | "Academic"
  | "General"
  | "Part 1"
  | "Part 2"
  | "Part 3"
  | "Part 4";

export type ReadingQuestionType = "mcq" | "tfng" | "matching" | "fill_in";

export type ListeningSectionType =
  | "Section 1" | "Section 2" | "Section 3" | "Section 4"  // IELTS
  | "Part 1" | "Part 2" | "Part 3" | "Part 4";              // CELPIP

export interface SessionConfig {
  examType: ExamType;
  difficulty: Difficulty;
  topic: string;
  part?: IELTSPart;
}

export interface ScoreBreakdown {
  // IELTS
  fluencyCoherence?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  pronunciation?: number;
  // CELPIP
  contentCoherence?: number;
  vocabulary?: number;
  listenability?: number;
  taskFulfillment?: number;
  // Overall
  overall: number;
}

export interface Response {
  questionId: string;
  question: string;
  audioUrl?: string;
  transcript: string;
  feedback: string;
  scoreBreakdown: ScoreBreakdown;
  durationSeconds: number;
}

export interface Session {
  sessionId: string;
  userId: string;
  examType: ExamType;
  difficulty: Difficulty;
  topic: string;
  overallScore: number;
  estimatedBand?: string;   // e.g. "6.5" for IELTS
  estimatedLevel?: string;  // e.g. "Level 9" for CELPIP
  responses: Response[];
  durationSeconds: number;
  createdAt: string;
}
