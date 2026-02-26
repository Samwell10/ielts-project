from fastapi import APIRouter, HTTPException
from models.schemas import QuestionRequest, QuestionResponse
from services.question_gen import generate_questions

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.post("/generate", response_model=QuestionResponse)
def generate(req: QuestionRequest):
    """Generate exam-style speaking questions via GPT-4o."""
    try:
        questions = generate_questions(
            exam_type=req.exam_type,
            difficulty=req.difficulty,
            topic=req.topic,
            part=req.part,
            count=req.count,
        )
        return QuestionResponse(questions=questions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {e}")
