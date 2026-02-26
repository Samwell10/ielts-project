from typing import Optional, List
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
