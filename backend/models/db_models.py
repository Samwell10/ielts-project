import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, nullable=False, default="anonymous")
    exam_type = Column(String, nullable=False)       # "IELTS" | "CELPIP"
    difficulty = Column(String, nullable=False)      # "Beginner" | "Intermediate" | "Advanced"
    topic = Column(String, nullable=False)
    part = Column(String, nullable=True)             # "Part 1" | "Part 2" | "Part 3" (IELTS only)
    overall_score = Column(Float, nullable=True)
    estimated_band = Column(String, nullable=True)   # e.g. "6.5" or "Level 9"
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    responses = relationship("Response", back_populates="session", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    response_id = Column(String, primary_key=True, default=new_uuid)
    session_id = Column(String, ForeignKey("sessions.session_id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)

    # IELTS criteria
    fluency_coherence = Column(Float, nullable=True)
    lexical_resource = Column(Float, nullable=True)
    grammatical_range = Column(Float, nullable=True)
    pronunciation = Column(Float, nullable=True)

    # CELPIP criteria
    content_coherence = Column(Float, nullable=True)
    vocabulary = Column(Float, nullable=True)
    listenability = Column(Float, nullable=True)
    task_fulfillment = Column(Float, nullable=True)

    overall_score = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    session = relationship("Session", back_populates="responses")


class WritingSubmission(Base):
    __tablename__ = "writing_submissions"

    submission_id   = Column(String,  primary_key=True, default=new_uuid)
    user_id         = Column(String,  nullable=False)
    exam_type       = Column(String,  nullable=False)   # "IELTS" | "CELPIP"
    task_type       = Column(String,  nullable=False)
    # IELTS: "Task 1 Academic" | "Task 1 General" | "Task 2"
    # CELPIP: "Task 1 Email" | "Task 2 Survey"
    difficulty      = Column(String,  nullable=False)
    prompt_title    = Column(String,  nullable=False)
    prompt_body     = Column(Text,    nullable=False)
    response_text   = Column(Text,    nullable=True)
    word_count      = Column(Integer, nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)
    feedback        = Column(Text,    nullable=True)
    overall_score   = Column(Float,   nullable=True)
    estimated_band  = Column(String,  nullable=True)

    # IELTS writing criteria
    task_achievement   = Column(Float, nullable=True)
    coherence_cohesion = Column(Float, nullable=True)
    lexical_resource   = Column(Float, nullable=True)
    grammatical_range  = Column(Float, nullable=True)

    # CELPIP writing criteria
    content          = Column(Float, nullable=True)
    organization     = Column(Float, nullable=True)
    vocabulary       = Column(Float, nullable=True)
    readability      = Column(Float, nullable=True)
    task_fulfillment = Column(Float, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ReadingAttempt(Base):
    __tablename__ = "reading_attempts"

    attempt_id        = Column(String,  primary_key=True, default=new_uuid)
    user_id           = Column(String,  nullable=False)
    exam_type         = Column(String,  nullable=False)   # "IELTS" | "CELPIP"
    passage_type      = Column(String,  nullable=False)   # "Academic"|"General"|"Part 1"-"Part 4"
    difficulty        = Column(String,  nullable=False)
    passage_title     = Column(String,  nullable=False)
    passage_body      = Column(Text,    nullable=False)
    questions_json    = Column(Text,    nullable=False)   # JSON list of questions WITHOUT correct_answer
    answers_json      = Column(Text,    nullable=True)    # JSON dict {"q1":"A","q2":"True",...}
    correct_answers_json = Column(Text, nullable=False)   # full questions WITH correct_answer+explanation
    score             = Column(Integer, nullable=True)    # number correct
    total_questions   = Column(Integer, nullable=False)
    overall_score     = Column(Float,   nullable=True)    # 0.0-1.0 (score / total)
    estimated_band    = Column(String,  nullable=True)    # "Band 7" or "Level 9"
    time_spent_seconds = Column(Integer, nullable=True)
    created_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ListeningAttempt(Base):
    __tablename__ = "listening_attempts"

    attempt_id           = Column(String,  primary_key=True, default=new_uuid)
    user_id              = Column(String,  nullable=False)
    exam_type            = Column(String,  nullable=False)  # "IELTS" | "CELPIP"
    section_type         = Column(String,  nullable=False)  # "Section 1-4" | "Part 1-4"
    difficulty           = Column(String,  nullable=False)
    section_title        = Column(String,  nullable=False)  # AI-generated title
    script_text          = Column(Text,    nullable=False)  # full listening transcript
    audio_url            = Column(String,  nullable=True)   # served via /api/audio/files/
    questions_json       = Column(Text,    nullable=False)  # questions WITHOUT correct_answer
    answers_json         = Column(Text,    nullable=True)   # {"q1":"A","q4":"increased"}
    correct_answers_json = Column(Text,    nullable=False)  # full questions WITH answers
    score                = Column(Integer, nullable=True)
    total_questions      = Column(Integer, nullable=False)
    overall_score        = Column(Float,   nullable=True)   # 0.0-1.0
    estimated_band       = Column(String,  nullable=True)   # "Band 7" or "Level 9"
    time_spent_seconds   = Column(Integer, nullable=True)
    created_at           = Column(DateTime, default=lambda: datetime.now(timezone.utc))
