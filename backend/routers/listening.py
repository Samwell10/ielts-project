import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession
from models.database import get_db
from models.db_models import ListeningAttempt
from models.schemas import (
    ListeningPromptRequest, ListeningPromptOut, ListeningQuestionOut,
    ListeningSubmitRequest, ListeningAttemptOut,
)
from services.listening_script_gen import generate_listening_script
from services.tts import text_to_speech
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api/listening", tags=["listening"])


# ── Band estimation (identical to reading) ─────────────────────────────────────

def _estimate_ielts_band(pct: float) -> str:
    if pct >= 0.90: return "Band 9"
    if pct >= 0.80: return "Band 8"
    if pct >= 0.70: return "Band 7"
    if pct >= 0.60: return "Band 6.5"
    if pct >= 0.50: return "Band 6"
    if pct >= 0.40: return "Band 5.5"
    if pct >= 0.30: return "Band 5"
    return "Band 4.5"


def _estimate_celpip_level(pct: float) -> str:
    if pct >= 0.90: return "Level 12"
    if pct >= 0.80: return "Level 11"
    if pct >= 0.70: return "Level 9"
    if pct >= 0.60: return "Level 8"
    if pct >= 0.50: return "Level 7"
    if pct >= 0.40: return "Level 6"
    return "Level 5"


def _score_answers(full_questions: list, user_answers: dict) -> int:
    score = 0
    for q in full_questions:
        qid = q.get("question_id", "")
        user_ans = str(user_answers.get(qid, "")).strip().lower()
        correct = str(q.get("correct_answer", "")).strip().lower()
        if q.get("question_type") == "fill_in":
            accepted_raw = q.get("accepted_answers") or [q.get("correct_answer", "")]
            accepted = [str(a).strip().lower() for a in accepted_raw]
            if user_ans in accepted:
                score += 1
        else:
            if user_ans == correct:
                score += 1
    return score


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/prompt", response_model=ListeningPromptOut)
def get_listening_prompt(req: ListeningPromptRequest):
    """Generate script, questions and TTS audio. No auth required."""
    try:
        result = generate_listening_script(
            exam_type=req.exam_type,
            section_type=req.section_type,
            difficulty=req.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script generation failed: {e}")

    full_questions = result.get("questions", [])
    num_speakers = result.get("num_speakers", 1)
    script_text = result.get("script_text", "")

    # Strip correct_answer before sending to frontend
    frontend_questions = [
        ListeningQuestionOut(
            question_id=q["question_id"],
            question_type=q["question_type"],
            question_text=q["question_text"],
            options=q.get("options"),
        )
        for q in full_questions
    ]

    # Generate TTS audio — graceful fallback if it fails
    audio_url: str | None = None
    try:
        audio_url = text_to_speech(script_text, num_speakers)
    except Exception as tts_err:
        # Non-fatal: frontend will show script text as fallback
        print(f"[TTS] Warning: audio generation failed — {tts_err}")

    return ListeningPromptOut(
        section_title=result.get("section_title", "Listening Passage"),
        script_text=script_text,
        audio_url=audio_url,
        questions=frontend_questions,
        time_limit_minutes=result.get("time_limit_minutes", 15),
        correct_answers_json=json.dumps(full_questions),
    )


@router.post("/submit", response_model=ListeningAttemptOut)
def submit_listening(
    req: ListeningSubmitRequest,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Grade user answers and save the attempt. Auth required."""
    try:
        full_questions = json.loads(req.correct_answers_json)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid correct_answers_json: {e}")

    total = len(full_questions)
    if total == 0:
        raise HTTPException(status_code=400, detail="No questions found in submission.")

    score = _score_answers(full_questions, req.user_answers)
    pct = score / total
    overall_score = round(pct, 4)

    estimated_band = (
        _estimate_ielts_band(pct) if req.exam_type == "IELTS" else _estimate_celpip_level(pct)
    )

    row = ListeningAttempt(
        attempt_id=str(uuid.uuid4()),
        user_id=user_id,
        exam_type=req.exam_type,
        section_type=req.section_type,
        difficulty=req.difficulty,
        section_title=req.section_title,
        script_text=req.script_text,
        audio_url=req.audio_url,
        questions_json=req.questions_json,
        answers_json=json.dumps(req.user_answers),
        correct_answers_json=req.correct_answers_json,
        score=score,
        total_questions=total,
        overall_score=overall_score,
        estimated_band=estimated_band,
        time_spent_seconds=req.time_spent_seconds,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[ListeningAttemptOut])
def list_attempts(
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all listening attempts for the authenticated user."""
    return (
        db.query(ListeningAttempt)
        .filter(ListeningAttempt.user_id == user_id)
        .order_by(ListeningAttempt.created_at.desc())
        .all()
    )


@router.get("/{attempt_id}", response_model=ListeningAttemptOut)
def get_attempt(
    attempt_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a single listening attempt. Only the owner can access it."""
    row = db.query(ListeningAttempt).filter(ListeningAttempt.attempt_id == attempt_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return row


@router.delete("/{attempt_id}", status_code=204)
def delete_attempt(
    attempt_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete a listening attempt. Only the owner can delete it."""
    row = db.query(ListeningAttempt).filter(ListeningAttempt.attempt_id == attempt_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    db.delete(row)
    db.commit()
