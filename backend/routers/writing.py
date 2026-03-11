import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession
from models.database import get_db
from models.db_models import WritingSubmission
from models.schemas import (
    WritingPromptRequest, WritingPromptOut,
    WritingSubmitRequest, WritingSubmissionOut,
)
from services.writing_prompt_gen import generate_writing_prompt
from services.writing_evaluator import evaluate_writing
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api/writing", tags=["writing"])


@router.post("/prompt", response_model=WritingPromptOut)
def get_writing_prompt(req: WritingPromptRequest):
    """Generate a writing prompt. No auth required."""
    try:
        result = generate_writing_prompt(
            exam_type=req.exam_type,
            task_type=req.task_type,
            difficulty=req.difficulty,
            topic=req.topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt generation failed: {e}")
    return WritingPromptOut(**result)


@router.post("/submit", response_model=WritingSubmissionOut)
def submit_writing(
    req: WritingSubmitRequest,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Evaluate a writing submission and persist it. Auth required."""
    word_count = len(req.response_text.split())

    try:
        result = evaluate_writing(
            exam_type=req.exam_type,
            task_type=req.task_type,
            prompt_body=req.prompt_body,
            response_text=req.response_text,
            difficulty=req.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    row = WritingSubmission(
        submission_id=str(uuid.uuid4()),
        user_id=user_id,
        exam_type=req.exam_type,
        task_type=req.task_type,
        difficulty=req.difficulty,
        prompt_title=req.prompt_title,
        prompt_body=req.prompt_body,
        response_text=req.response_text,
        word_count=word_count,
        time_spent_seconds=req.time_spent_seconds,
        feedback=result.get("feedback", ""),
        overall_score=result.get("overall_score"),
        estimated_band=result.get("estimated_band", ""),
        # IELTS
        task_achievement=result.get("task_achievement"),
        coherence_cohesion=result.get("coherence_cohesion"),
        lexical_resource=result.get("lexical_resource"),
        grammatical_range=result.get("grammatical_range"),
        # CELPIP
        content=result.get("content"),
        organization=result.get("organization"),
        vocabulary=result.get("vocabulary"),
        readability=result.get("readability"),
        task_fulfillment=result.get("task_fulfillment"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[WritingSubmissionOut])
def list_submissions(
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all writing submissions for the authenticated user."""
    return (
        db.query(WritingSubmission)
        .filter(WritingSubmission.user_id == user_id)
        .order_by(WritingSubmission.created_at.desc())
        .all()
    )


@router.get("/{submission_id}", response_model=WritingSubmissionOut)
def get_submission(
    submission_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a single writing submission. Only the owner can access it."""
    row = db.query(WritingSubmission).filter(
        WritingSubmission.submission_id == submission_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return row


@router.delete("/{submission_id}", status_code=204)
def delete_submission(
    submission_id: str,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete a writing submission. Only the owner can delete it."""
    row = db.query(WritingSubmission).filter(
        WritingSubmission.submission_id == submission_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if row.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    db.delete(row)
    db.commit()
