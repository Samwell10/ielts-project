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
