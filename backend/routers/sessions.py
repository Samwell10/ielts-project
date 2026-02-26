import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession
from models.database import get_db
from models.db_models import Session as SessionModel, Response as ResponseModel
from models.schemas import (
    SessionCreate, SessionOut, SessionComplete,
    ResponseCreate, ResponseOut,
)
from dependencies.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ── Create a new session ──────────────────────────────────────────────────────

@router.post("", response_model=SessionOut, status_code=201)
def create_session(
    body: SessionCreate,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),   # requires auth
):
    session = SessionModel(
        session_id=str(uuid.uuid4()),
        user_id=user_id,   # always from the verified JWT, never from request body
        exam_type=body.exam_type,
        difficulty=body.difficulty,
        topic=body.topic,
        part=body.part,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ── List sessions for the authenticated user ──────────────────────────────────

@router.get("", response_model=List[SessionOut])
def list_sessions(
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id)
        .order_by(SessionModel.created_at.desc())
        .all()
    )


# ── Get one session (only owner can access) ───────────────────────────────────

@router.get("/{session_id}", response_model=SessionOut)
def get_session(
    session_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return session


# ── Add a response to a session ───────────────────────────────────────────────

@router.post("/{session_id}/responses", response_model=ResponseOut, status_code=201)
def add_response(
    session_id: str,
    body: ResponseCreate,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    response = ResponseModel(
        response_id=str(uuid.uuid4()),
        session_id=session_id,
        question_index=body.question_index,
        question_text=body.question_text,
        transcript=body.transcript,
        audio_url=body.audio_url,
        duration_seconds=body.duration_seconds,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


# ── Complete a session ────────────────────────────────────────────────────────

@router.post("/{session_id}/complete", response_model=SessionOut)
def complete_session(
    session_id: str,
    body: SessionComplete,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    scored = [r for r in session.responses if r.overall_score is not None]
    if scored:
        avg = sum(r.overall_score for r in scored) / len(scored)
        session.overall_score = round(avg * 2) / 2
        if session.exam_type == "IELTS":
            session.estimated_band = f"Band {session.overall_score}"
        else:
            level = round(session.overall_score * (12 / 9))
            session.estimated_band = f"Level {level}"

    session.duration_seconds = body.duration_seconds
    db.commit()
    db.refresh(session)
    return session


# ── Delete a session ──────────────────────────────────────────────────────────

@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    db.delete(session)
    db.commit()
