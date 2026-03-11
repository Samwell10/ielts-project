const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Questions (no auth required) ─────────────────────────────────────────────

export async function generateQuestions(params: {
  exam_type: string;
  difficulty: string;
  topic: string;
  part?: string;
  count?: number;
}): Promise<{ questions: string[] }> {
  return request("/api/questions/generate", {
    method: "POST",
    body: JSON.stringify({ count: 3, ...params }),
  });
}

// ── Sessions (auth required) ──────────────────────────────────────────────────

export async function createSession(
  params: { exam_type: string; difficulty: string; topic: string; part?: string },
  token: string
) {
  return request<{ session_id: string }>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function addResponse(
  sessionId: string,
  params: {
    question_index: number;
    question_text: string;
    transcript: string;
    audio_url?: string;
    duration_seconds?: number;
  },
  token: string
) {
  return request<{ response_id: string }>(`/api/sessions/${sessionId}/responses`, {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function completeSession(
  sessionId: string,
  durationSeconds: number,
  token: string
) {
  return request(`/api/sessions/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ duration_seconds: durationSeconds }),
    token,
  });
}

export async function listSessions(token: string) {
  return request<SessionRecord[]>("/api/sessions", { token });
}

export async function getSession(sessionId: string, token: string) {
  return request<SessionRecord>(`/api/sessions/${sessionId}`, { token });
}

// ── Audio (auth required) ─────────────────────────────────────────────────────

export async function uploadAndTranscribe(
  audioBlob: Blob,
  token: string
): Promise<{ transcript: string; duration_seconds?: number; audio_url?: string; gemini_file_uri?: string; gemini_file_name?: string }> {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");
  const res = await fetch(`${BASE}/api/audio/transcribe`, {
    method: "POST",
    body: form,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Transcription error ${res.status}`);
  }
  return res.json();
}

// ── Evaluation (auth required) ────────────────────────────────────────────────

export async function evaluateResponse(
  params: {
    session_id: string;
    response_id: string;
    exam_type: string;
    transcript: string;
    question_text: string;
    difficulty: string;
    gemini_file_uri?: string;
    gemini_file_name?: string;
  },
  token: string
) {
  return request<EvaluationResult>("/api/evaluate", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionRecord {
  session_id: string;
  user_id: string;
  exam_type: string;
  difficulty: string;
  topic: string;
  part?: string;
  overall_score?: number;
  estimated_band?: string;
  duration_seconds?: number;
  created_at: string;
  responses: ResponseRecord[];
}

export interface ResponseRecord {
  response_id: string;
  session_id: string;
  question_index: number;
  question_text: string;
  audio_url?: string;
  transcript?: string;
  feedback?: string;
  fluency_coherence?: number;
  lexical_resource?: number;
  grammatical_range?: number;
  pronunciation?: number;
  content_coherence?: number;
  vocabulary?: number;
  listenability?: number;
  task_fulfillment?: number;
  overall_score?: number;
  duration_seconds?: number;
}

export interface EvaluationResult {
  response_id: string;
  feedback: string;
  overall_score: number;
  estimated_band: string;
  fluency_coherence?: number;
  lexical_resource?: number;
  grammatical_range?: number;
  pronunciation?: number;
  content_coherence?: number;
  vocabulary?: number;
  listenability?: number;
  task_fulfillment?: number;
}

// ── Writing ───────────────────────────────────────────────────────────────────

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartData {
  title?: string;
  x_label?: string;
  y_label?: string;
  unit?: string;
  // bar / line
  categories?: string[];
  series?: ChartSeries[];
  // table
  headers?: string[];
  rows?: string[][];
  // pie
  segments?: { label: string; value: number }[];
}

export interface WritingPromptRecord {
  prompt_title: string;
  prompt_body: string;
  word_limit: number;
  time_limit_minutes: number;
  chart_type?: string;   // "bar" | "line" | "table" | "pie" — Task 1 Academic only
  chart_data?: ChartData;
}

export interface WritingSubmissionRecord {
  submission_id: string;
  user_id: string;
  exam_type: string;
  task_type: string;
  difficulty: string;
  prompt_title: string;
  prompt_body: string;
  response_text?: string;
  word_count?: number;
  time_spent_seconds?: number;
  feedback?: string;
  overall_score?: number;
  estimated_band?: string;
  chart_type?: string;
  chart_data?: ChartData;
  // IELTS
  task_achievement?: number;
  coherence_cohesion?: number;
  lexical_resource?: number;
  grammatical_range?: number;
  // CELPIP
  content?: number;
  organization?: number;
  vocabulary?: number;
  readability?: number;
  task_fulfillment?: number;
  created_at: string;
}

export async function generateWritingPrompt(params: {
  exam_type: string;
  task_type: string;
  difficulty: string;
  topic: string;
}): Promise<WritingPromptRecord> {
  return request("/api/writing/prompt", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function submitWriting(
  params: {
    exam_type: string;
    task_type: string;
    difficulty: string;
    prompt_title: string;
    prompt_body: string;
    response_text: string;
    time_spent_seconds?: number;
  },
  token: string
): Promise<WritingSubmissionRecord> {
  return request("/api/writing/submit", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function listWritingSubmissions(token: string): Promise<WritingSubmissionRecord[]> {
  return request("/api/writing", { token });
}

export async function getWritingSubmission(id: string, token: string): Promise<WritingSubmissionRecord> {
  return request(`/api/writing/${id}`, { token });
}

// ── Reading ───────────────────────────────────────────────────────────────────

export interface ReadingQuestionFE {
  question_id: string;
  question_type: string; // "mcq" | "tfng" | "matching" | "fill_in"
  question_text: string;
  options?: string[];
}

export interface ReadingPromptRecord {
  passage_title: string;
  passage_body: string;
  questions: ReadingQuestionFE[];
  time_limit_minutes: number;
  correct_answers_json: string; // JSON string — stored in useRef on client
}

export interface ReadingAttemptRecord {
  attempt_id: string;
  user_id: string;
  exam_type: string;
  passage_type: string;
  difficulty: string;
  passage_title: string;
  passage_body: string;
  questions_json: string;
  answers_json?: string;
  correct_answers_json: string;
  score?: number;
  total_questions: number;
  overall_score?: number;
  estimated_band?: string;
  time_spent_seconds?: number;
  created_at: string;
}

export async function generateReadingPassage(params: {
  exam_type: string;
  passage_type: string;
  difficulty: string;
}): Promise<ReadingPromptRecord> {
  return request("/api/reading/prompt", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function submitReading(
  params: {
    exam_type: string;
    passage_type: string;
    difficulty: string;
    passage_title: string;
    passage_body: string;
    questions_json: string;
    correct_answers_json: string;
    user_answers: Record<string, string>;
    time_spent_seconds?: number;
  },
  token: string
): Promise<ReadingAttemptRecord> {
  return request("/api/reading/submit", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function listReadingAttempts(token: string): Promise<ReadingAttemptRecord[]> {
  return request("/api/reading", { token });
}

export async function getReadingAttempt(id: string, token: string): Promise<ReadingAttemptRecord> {
  return request(`/api/reading/${id}`, { token });
}

// ── Listening ─────────────────────────────────────────────────────────────────

export interface ListeningQuestionFE {
  question_id: string;
  question_type: string; // "mcq" | "fill_in"
  question_text: string;
  options?: string[];
}

export interface ListeningPromptRecord {
  section_title: string;
  script_text: string;
  audio_url?: string;       // null when TTS failed — frontend shows text fallback
  questions: ListeningQuestionFE[];
  time_limit_minutes: number;
  correct_answers_json: string;
}

export interface ListeningAttemptRecord {
  attempt_id: string;
  user_id: string;
  exam_type: string;
  section_type: string;
  difficulty: string;
  section_title: string;
  script_text: string;
  audio_url?: string;
  questions_json: string;
  answers_json?: string;
  correct_answers_json: string;
  score?: number;
  total_questions: number;
  overall_score?: number;
  estimated_band?: string;
  time_spent_seconds?: number;
  created_at: string;
}

export async function generateListeningScript(params: {
  exam_type: string;
  section_type: string;
  difficulty: string;
}): Promise<ListeningPromptRecord> {
  return request("/api/listening/prompt", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function submitListening(
  params: {
    exam_type: string;
    section_type: string;
    difficulty: string;
    section_title: string;
    script_text: string;
    audio_url?: string;
    questions_json: string;
    correct_answers_json: string;
    user_answers: Record<string, string>;
    time_spent_seconds?: number;
  },
  token: string
): Promise<ListeningAttemptRecord> {
  return request("/api/listening/submit", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function listListeningAttempts(token: string): Promise<ListeningAttemptRecord[]> {
  return request("/api/listening", { token });
}

export async function getListeningAttempt(id: string, token: string): Promise<ListeningAttemptRecord> {
  return request(`/api/listening/${id}`, { token });
}
