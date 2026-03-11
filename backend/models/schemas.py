from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime


# ── Session ──────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    user_id: str = "anonymous"
    exam_type: str        # "IELTS" | "CELPIP"
    difficulty: str       # "Beginner" | "Intermediate" | "Advanced"
    topic: str
    part: Optional[str] = None  # IELTS only


class SessionOut(BaseModel):
    session_id: str
    user_id: str
    exam_type: str
    difficulty: str
    topic: str
    part: Optional[str]
    overall_score: Optional[float]
    estimated_band: Optional[str]
    duration_seconds: Optional[int]
    created_at: datetime
    responses: List["ResponseOut"] = []

    model_config = {"from_attributes": True}


class SessionComplete(BaseModel):
    """Sent by the frontend when the session ends to finalise the score."""
    duration_seconds: int


# ── Response ─────────────────────────────────────────────────────────────────

class ResponseCreate(BaseModel):
    question_index: int
    question_text: str
    transcript: str
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None


class ResponseOut(BaseModel):
    response_id: str
    session_id: str
    question_index: int
    question_text: str
    audio_url: Optional[str]
    transcript: Optional[str]
    feedback: Optional[str]
    fluency_coherence: Optional[float]
    lexical_resource: Optional[float]
    grammatical_range: Optional[float]
    pronunciation: Optional[float]
    content_coherence: Optional[float]
    vocabulary: Optional[float]
    listenability: Optional[float]
    task_fulfillment: Optional[float]
    overall_score: Optional[float]
    duration_seconds: Optional[int]

    model_config = {"from_attributes": True}


SessionOut.model_rebuild()


# ── Questions ─────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    exam_type: str        # "IELTS" | "CELPIP"
    difficulty: str
    topic: str
    part: Optional[str] = None   # IELTS: "Part 1" | "Part 2" | "Part 3"
    count: int = 3


class QuestionResponse(BaseModel):
    questions: List[str]


# ── Transcription ─────────────────────────────────────────────────────────────

class TranscriptOut(BaseModel):
    transcript: str
    duration_seconds: Optional[float] = None
    audio_url: Optional[str] = None
    gemini_file_uri: Optional[str] = None   # kept alive for the evaluator
    gemini_file_name: Optional[str] = None  # used to delete the file after eval


# ── Evaluation ────────────────────────────────────────────────────────────────

class EvaluationRequest(BaseModel):
    session_id: str
    response_id: str
    exam_type: str
    transcript: str
    question_text: str
    difficulty: str
    gemini_file_uri: Optional[str] = None   # audio for pronunciation scoring
    gemini_file_name: Optional[str] = None  # deleted after evaluation


class EvaluationOut(BaseModel):
    response_id: str
    feedback: str
    overall_score: float
    estimated_band: str
    # IELTS
    fluency_coherence: Optional[float] = None
    lexical_resource: Optional[float] = None
    grammatical_range: Optional[float] = None
    pronunciation: Optional[float] = None
    # CELPIP
    content_coherence: Optional[float] = None
    vocabulary: Optional[float] = None
    listenability: Optional[float] = None
    task_fulfillment: Optional[float] = None


# ── Writing ───────────────────────────────────────────────────────────────────

class WritingPromptRequest(BaseModel):
    exam_type: str    # "IELTS" | "CELPIP"
    task_type: str    # "Task 1 Academic" | "Task 1 General" | "Task 2" | "Task 1 Email" | "Task 2 Survey"
    difficulty: str
    topic: str


class WritingPromptOut(BaseModel):
    prompt_title: str
    prompt_body: str
    word_limit: int
    time_limit_minutes: int
    chart_type: Optional[str] = None   # "bar" | "line" | "table" | "pie" — Task 1 Academic only
    chart_data: Optional[Any] = None   # structured chart data for frontend rendering


class WritingSubmitRequest(BaseModel):
    exam_type: str
    task_type: str
    difficulty: str
    prompt_title: str
    prompt_body: str
    response_text: str
    time_spent_seconds: Optional[int] = None


class WritingSubmissionOut(BaseModel):
    submission_id: str
    user_id: str
    exam_type: str
    task_type: str
    difficulty: str
    prompt_title: str
    prompt_body: str
    response_text: Optional[str]
    word_count: Optional[int]
    time_spent_seconds: Optional[int]
    feedback: Optional[str]
    overall_score: Optional[float]
    estimated_band: Optional[str]
    # IELTS writing criteria
    task_achievement: Optional[float] = None
    coherence_cohesion: Optional[float] = None
    lexical_resource: Optional[float] = None
    grammatical_range: Optional[float] = None
    # CELPIP writing criteria
    content: Optional[float] = None
    organization: Optional[float] = None
    vocabulary: Optional[float] = None
    readability: Optional[float] = None
    task_fulfillment: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Reading ───────────────────────────────────────────────────────────────────

class ReadingPromptRequest(BaseModel):
    exam_type: str      # "IELTS" | "CELPIP"
    passage_type: str   # "Academic"|"General"|"Part 1"|"Part 2"|"Part 3"|"Part 4"
    difficulty: str


class ReadingQuestionOut(BaseModel):
    """A single question sent to the frontend — correct_answer is stripped."""
    question_id: str
    question_type: str          # "mcq" | "tfng" | "matching" | "fill_in"
    question_text: str
    options: Optional[List[str]] = None   # None for fill_in


class ReadingPromptOut(BaseModel):
    passage_title: str
    passage_body: str
    questions: List[ReadingQuestionOut]
    time_limit_minutes: int
    correct_answers_json: str   # JSON string — full questions with answers, stored in client useRef


class ReadingSubmitRequest(BaseModel):
    exam_type: str
    passage_type: str
    difficulty: str
    passage_title: str
    passage_body: str
    questions_json: str         # questions without correct_answer (for storage)
    correct_answers_json: str   # full questions with answers (client sends back for grading)
    user_answers: dict          # {"q1":"A","q2":"True","q4":"increased"}
    time_spent_seconds: Optional[int] = None


class ReadingAttemptOut(BaseModel):
    attempt_id: str
    user_id: str
    exam_type: str
    passage_type: str
    difficulty: str
    passage_title: str
    passage_body: str
    questions_json: str
    answers_json: Optional[str]
    correct_answers_json: str
    score: Optional[int]
    total_questions: int
    overall_score: Optional[float]
    estimated_band: Optional[str]
    time_spent_seconds: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Listening ─────────────────────────────────────────────────────────────────

class ListeningPromptRequest(BaseModel):
    exam_type: str      # "IELTS" | "CELPIP"
    section_type: str   # "Section 1"-"Section 4" | "Part 1"-"Part 4"
    difficulty: str


class ListeningQuestionOut(BaseModel):
    """A single question sent to the frontend — correct_answer is stripped."""
    question_id: str
    question_type: str          # "mcq" | "fill_in"
    question_text: str
    options: Optional[List[str]] = None   # None for fill_in


class ListeningPromptOut(BaseModel):
    section_title: str
    script_text: str
    audio_url: Optional[str] = None    # WAV file served via /api/audio/files/; null if TTS failed
    questions: List[ListeningQuestionOut]
    time_limit_minutes: int
    correct_answers_json: str          # JSON string — stored in client useRef


class ListeningSubmitRequest(BaseModel):
    exam_type: str
    section_type: str
    difficulty: str
    section_title: str
    script_text: str
    audio_url: Optional[str] = None
    questions_json: str                # questions without correct_answer (for storage)
    correct_answers_json: str          # full questions with answers (sent back for grading)
    user_answers: dict                 # {"q1":"A","q6":"increased"}
    time_spent_seconds: Optional[int] = None


class ListeningAttemptOut(BaseModel):
    attempt_id: str
    user_id: str
    exam_type: str
    section_type: str
    difficulty: str
    section_title: str
    script_text: str
    audio_url: Optional[str]
    questions_json: str
    answers_json: Optional[str]
    correct_answers_json: str
    score: Optional[int]
    total_questions: int
    overall_score: Optional[float]
    estimated_band: Optional[str]
    time_spent_seconds: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
