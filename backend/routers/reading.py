import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession
from models.database import get_db
from models.db_models import ReadingAttempt
from models.schemas import (
    ReadingPromptRequest, ReadingPromptOut, ReadingQuestionOut,
    ReadingSubmitRequest, ReadingAttemptOut,
)
from services.reading_prompt_gen import generate_reading_passage
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api/reading", tags=["reading"])


# ── Band estimation ────────────────────────────────────────────────────────────

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
    """Return number of correct answers."""
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

@router.post("/prompt", response_model=ReadingPromptOut)
def get_reading_prompt(req: ReadingPromptRequest):
    """Generate a reading passage and questions. No auth required."""
    try:
        result = generate_reading_passage(
            exam_type=req.exam_type,
            passage_type=req.passage_type,
            difficulty=req.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Passage generation failed: {e}")

    full_questions = result.get("questions", [])

    # Build frontend-safe questions (strip correct_answer, accepted_answers, explanation)
    frontend_questions = [
        ReadingQuestionOut(
            question_id=q["question_id"],
            question_type=q["question_type"],
            question_text=q["question_text"],
            options=q.get("options"),
        )
        for q in full_questions
    ]

    return ReadingPromptOut(
        passage_title=result["passage_title"],
        passage_body=result["passage_body"],
        questions=frontend_questions,
        time_limit_minutes=result.get("time_limit_minutes", 20),
        correct_answers_json=json.dumps(full_questions),
    )


@router.post("/submit", response_model=ReadingAttemptOut)
def submit_reading(
    req: ReadingSubmitRequest,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Grade the user's answers and save the attempt. Auth required."""
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

    if req.exam_type == "IELTS":
        estimated_band = _estimate_ielts_band(pct)
    else:
        estimated_band = _estimate_celpip_level(pct)

    row = ReadingAttempt(
        attempt_id=str(uuid.uuid4()),
        user_id=user_id,
        exam_type=req.exam_type,
        passage_type=req.passage_type,
        difficulty=req.difficulty,
        passage_title=req.passage_title,
        passage_body=req.passage_body,
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


@router.get("", response_model=list[ReadingAttemptOut])
def list_attempts(
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all reading attempts for the authenticated user."""
    return (
        db.query(ReadingAttempt)
        .filter(ReadingAttempt.user_id == user_id)
        .order_by(ReadingAttempt.created_at.desc())
        .all()
    )


@router.get("/{attempt_id}", response_model=ReadingAttemptOut)
def get_attempt(
    attempt_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a single reading attempt. Only the owner can access it."""
    row = db.query(ReadingAttempt).filter(ReadingAttempt.attempt_id == attempt_id).first()
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
    """Delete a reading attempt. Only the owner can delete it."""
    row = db.query(ReadingAttempt).filter(ReadingAttempt.attempt_id == attempt_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    db.delete(row)
    db.commit()
