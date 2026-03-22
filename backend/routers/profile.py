"""
User profile router — stores onboarding answers (exam type, target band, exam date, level).
GET  /api/profile/{user_id}   → return profile or 404
POST /api/profile/{user_id}   → upsert profile (create or update)
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession
from typing import Optional

from models.database import get_db
from models.db_models import UserProfile

router = APIRouter(prefix="/api/profile", tags=["profile"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProfileIn(BaseModel):
    exam_type: str          # "IELTS" | "CELPIP" | "Both"
    target_band: Optional[str] = None   # "7.0" / "9" etc.
    exam_date: Optional[str] = None     # "YYYY-MM-DD" or null
    current_level: str      # "Beginner" | "Intermediate" | "Advanced"
    onboarding_done: bool = True


class ProfileOut(BaseModel):
    user_id: str
    exam_type: str
    target_band: Optional[str]
    exam_date: Optional[str]
    current_level: str
    onboarding_done: bool
    created_at: str
    updated_at: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_out(row: UserProfile) -> ProfileOut:
    return ProfileOut(
        user_id=row.user_id,
        exam_type=row.exam_type,
        target_band=row.target_band,
        exam_date=row.exam_date,
        current_level=row.current_level,
        onboarding_done=row.onboarding_done,
        created_at=row.created_at.isoformat(),
        updated_at=row.updated_at.isoformat() if row.updated_at else row.created_at.isoformat(),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=ProfileOut)
def get_profile(user_id: str, db: DBSession = Depends(get_db)):
    row = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _to_out(row)


@router.post("/{user_id}", response_model=ProfileOut)
def upsert_profile(user_id: str, body: ProfileIn, db: DBSession = Depends(get_db)):
    row = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if row:
        row.exam_type = body.exam_type
        row.target_band = body.target_band
        row.exam_date = body.exam_date
        row.current_level = body.current_level
        row.onboarding_done = body.onboarding_done
        row.updated_at = datetime.now(timezone.utc)
    else:
        row = UserProfile(
            user_id=user_id,
            exam_type=body.exam_type,
            target_band=body.target_band,
            exam_date=body.exam_date,
            current_level=body.current_level,
            onboarding_done=body.onboarding_done,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)
