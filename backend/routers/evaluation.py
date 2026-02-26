from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession
from models.database import get_db
from models.db_models import Response as ResponseModel, Session as SessionModel
from models.schemas import EvaluationRequest, EvaluationOut
from services.evaluator import evaluate_response
from dependencies.auth import get_current_user

router = APIRouter(prefix="/api/evaluate", tags=["evaluation"])


@router.post("", response_model=EvaluationOut)
def evaluate(
    req: EvaluationRequest,
    db: DBSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Evaluate a transcript via Gemini and persist scores to the Response row.
    Only the session owner can trigger evaluation.
    """
    response_row = db.query(ResponseModel).filter(
        ResponseModel.response_id == req.response_id
    ).first()
    if not response_row:
        raise HTTPException(status_code=404, detail="Response not found.")

    # Verify the response belongs to the authenticated user
    session = db.query(SessionModel).filter(
        SessionModel.session_id == response_row.session_id
    ).first()
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        result = evaluate_response(
            exam_type=req.exam_type,
            transcript=req.transcript,
            question_text=req.question_text,
            difficulty=req.difficulty,
            gemini_file_uri=req.gemini_file_uri,
            gemini_file_name=req.gemini_file_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    response_row.transcript = req.transcript
    response_row.feedback = result.get("feedback", "")
    response_row.overall_score = result.get("overall_score")

    if req.exam_type == "IELTS":
        response_row.fluency_coherence = result.get("fluency_coherence")
        response_row.lexical_resource = result.get("lexical_resource")
        response_row.grammatical_range = result.get("grammatical_range")
        response_row.pronunciation = result.get("pronunciation")
    else:
        response_row.content_coherence = result.get("content_coherence")
        response_row.vocabulary = result.get("vocabulary")
        response_row.listenability = result.get("listenability")
        response_row.task_fulfillment = result.get("task_fulfillment")

    db.commit()
    db.refresh(response_row)

    return EvaluationOut(
        response_id=req.response_id,
        feedback=result.get("feedback", ""),
        overall_score=result.get("overall_score", 0),
        estimated_band=result.get("estimated_band", ""),
        fluency_coherence=result.get("fluency_coherence"),
        lexical_resource=result.get("lexical_resource"),
        grammatical_range=result.get("grammatical_range"),
        pronunciation=result.get("pronunciation"),
        content_coherence=result.get("content_coherence"),
        vocabulary=result.get("vocabulary"),
        listenability=result.get("listenability"),
        task_fulfillment=result.get("task_fulfillment"),
    )
