"""
Gamification router — XP, streaks, badges, daily goals.

All endpoints require a Clerk user_id passed as a query param or
extracted from the Bearer token header via a simple helper.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from models.database import get_db
from models.db_models import (
    DailyGoal, UserBadge, UserStreak, UserXP,
    Session as SpeakingSession, WritingSubmission, ReadingAttempt, ListeningAttempt,
)

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

# ── XP constants ──────────────────────────────────────────────────────────────

XP_PER_MODULE: dict[str, int] = {
    "speaking":  60,
    "writing":   80,
    "reading":   50,
    "listening": 50,
}

# XP thresholds per level (index = level - 1)
LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800, 8000]


def xp_to_level(total_xp: int) -> int:
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            level = i + 1
    return min(level, len(LEVEL_THRESHOLDS))


def next_level_xp(level: int) -> int:
    if level >= len(LEVEL_THRESHOLDS):
        return LEVEL_THRESHOLDS[-1]
    return LEVEL_THRESHOLDS[level]  # threshold for next level


# ── Badge catalog ──────────────────────────────────────────────────────────────

BADGE_CATALOG: dict[str, dict] = {
    "first_session":    {"name": "First Step",      "icon": "🎯", "description": "Completed your first practice session"},
    "streak_3":         {"name": "On a Roll",        "icon": "🔥", "description": "3-day practice streak"},
    "streak_7":         {"name": "Week Warrior",     "icon": "⚡", "description": "7-day practice streak"},
    "streak_30":        {"name": "Monthly Master",   "icon": "🏆", "description": "30-day practice streak"},
    "xp_500":           {"name": "XP Grinder",       "icon": "⭐", "description": "Earned 500 total XP"},
    "xp_2000":          {"name": "Scholar",          "icon": "🎓", "description": "Earned 2,000 total XP"},
    "all_modules":      {"name": "Well-Rounded",     "icon": "🌟", "description": "Practiced all 4 modules"},
    "speaking_10":      {"name": "Confident Speaker","icon": "🎤", "description": "Completed 10 speaking sessions"},
    "writing_10":       {"name": "Skilled Writer",   "icon": "✍️",  "description": "Completed 10 writing sessions"},
    "reading_10":       {"name": "Speed Reader",     "icon": "📖", "description": "Completed 10 reading sessions"},
    "listening_10":     {"name": "Sharp Ear",        "icon": "👂", "description": "Completed 10 listening sessions"},
    "daily_goal":       {"name": "Goal Getter",      "icon": "💪", "description": "Completed a daily goal"},
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_create_xp(user_id: str, db: DBSession) -> UserXP:
    row = db.query(UserXP).filter(UserXP.user_id == user_id).first()
    if not row:
        row = UserXP(user_id=user_id, total_xp=0, level=1)
        db.add(row)
        db.flush()
    return row


def _get_or_create_streak(user_id: str, db: DBSession) -> UserStreak:
    row = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
    if not row:
        row = UserStreak(user_id=user_id, current_streak=0, longest_streak=0)
        db.add(row)
        db.flush()
    return row


def _get_or_create_daily_goal(user_id: str, db: DBSession) -> DailyGoal:
    today = date.today().isoformat()
    row = db.query(DailyGoal).filter(
        DailyGoal.user_id == user_id,
        DailyGoal.date == today
    ).first()
    if not row:
        row = DailyGoal(user_id=user_id, date=today, target_xp=100, earned_xp=0)
        db.add(row)
        db.flush()
    return row


def _award_badge_if_missing(user_id: str, badge_id: str, db: DBSession) -> Optional[str]:
    """Awards badge and returns badge_id if newly awarded, else None."""
    exists = db.query(UserBadge).filter(
        UserBadge.user_id == user_id,
        UserBadge.badge_id == badge_id,
    ).first()
    if not exists:
        db.add(UserBadge(user_id=user_id, badge_id=badge_id))
        return badge_id
    return None


def _check_and_award_badges(
    user_id: str, xp_row: UserXP, streak_row: UserStreak, db: DBSession
) -> list[str]:
    """Return list of newly awarded badge IDs."""
    new_badges: list[str] = []

    def _try(badge_id: str):
        b = _award_badge_if_missing(user_id, badge_id, db)
        if b:
            new_badges.append(b)

    # XP milestones
    if xp_row.total_xp >= 500:
        _try("xp_500")
    if xp_row.total_xp >= 2000:
        _try("xp_2000")

    # Streak milestones
    if streak_row.current_streak >= 3:
        _try("streak_3")
    if streak_row.current_streak >= 7:
        _try("streak_7")
    if streak_row.current_streak >= 30:
        _try("streak_30")

    # Per-module session counts
    speaking_count  = db.query(SpeakingSession).filter(SpeakingSession.user_id == user_id).count()
    writing_count   = db.query(WritingSubmission).filter(WritingSubmission.user_id == user_id).count()
    reading_count   = db.query(ReadingAttempt).filter(ReadingAttempt.user_id == user_id).count()
    listening_count = db.query(ListeningAttempt).filter(ListeningAttempt.user_id == user_id).count()

    if speaking_count >= 10:
        _try("speaking_10")
    if writing_count >= 10:
        _try("writing_10")
    if reading_count >= 10:
        _try("reading_10")
    if listening_count >= 10:
        _try("listening_10")

    # All 4 modules attempted at least once
    if all(c >= 1 for c in [speaking_count, writing_count, reading_count, listening_count]):
        _try("all_modules")

    # First session ever (any module)
    total = speaking_count + writing_count + reading_count + listening_count
    if total >= 1:
        _try("first_session")

    return new_badges


# ── Schemas ───────────────────────────────────────────────────────────────────

class AwardXPRequest(BaseModel):
    user_id: str
    module: str          # "speaking" | "writing" | "reading" | "listening"
    bonus_xp: int = 0    # optional extra XP (e.g. high score bonus)


class AwardXPResponse(BaseModel):
    total_xp: int
    xp_gained: int
    level: int
    next_level_xp: int
    level_up: bool
    new_badges: list[str]
    streak: int


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[str]


class BadgeOut(BaseModel):
    badge_id: str
    name: str
    icon: str
    description: str
    awarded_at: str


class DailyGoalResponse(BaseModel):
    date: str
    target_xp: int
    earned_xp: int
    completed: bool
    pct: float


class XPStatusResponse(BaseModel):
    total_xp: int
    level: int
    next_level_xp: int
    level_pct: float
    streak: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/xp/award", response_model=AwardXPResponse)
def award_xp(body: AwardXPRequest, db: DBSession = Depends(get_db)):
    """Called after each session completes to award XP, update streak, check badges."""
    module = body.module.lower()
    base_xp = XP_PER_MODULE.get(module, 50)
    xp_gained = base_xp + body.bonus_xp

    # ── XP ──
    xp_row = _get_or_create_xp(body.user_id, db)
    old_level = xp_row.level
    xp_row.total_xp += xp_gained
    xp_row.level = xp_to_level(xp_row.total_xp)
    level_up = xp_row.level > old_level

    # ── Streak ──
    streak_row = _get_or_create_streak(body.user_id, db)
    today = date.today().isoformat()
    yesterday = (date.today().replace(day=date.today().day - 1)).isoformat()

    if streak_row.last_active_date == today:
        pass  # already logged today
    elif streak_row.last_active_date == yesterday:
        streak_row.current_streak += 1
    else:
        streak_row.current_streak = 1  # reset

    streak_row.last_active_date = today
    if streak_row.current_streak > streak_row.longest_streak:
        streak_row.longest_streak = streak_row.current_streak

    # ── Daily goal ──
    goal_row = _get_or_create_daily_goal(body.user_id, db)
    goal_row.earned_xp += xp_gained
    if goal_row.earned_xp >= goal_row.target_xp:
        goal_row.completed = True
        _award_badge_if_missing(body.user_id, "daily_goal", db)

    # ── Badges ──
    new_badges = _check_and_award_badges(body.user_id, xp_row, streak_row, db)

    db.commit()

    return AwardXPResponse(
        total_xp=xp_row.total_xp,
        xp_gained=xp_gained,
        level=xp_row.level,
        next_level_xp=next_level_xp(xp_row.level),
        level_up=level_up,
        new_badges=new_badges,
        streak=streak_row.current_streak,
    )


@router.get("/status/{user_id}", response_model=XPStatusResponse)
def get_status(user_id: str, db: DBSession = Depends(get_db)):
    """Returns XP + level + streak for the navbar widgets."""
    xp_row = _get_or_create_xp(user_id, db)
    streak_row = _get_or_create_streak(user_id, db)
    db.commit()

    current_threshold = LEVEL_THRESHOLDS[xp_row.level - 1]
    next_threshold = next_level_xp(xp_row.level)
    span = next_threshold - current_threshold or 1
    level_pct = min((xp_row.total_xp - current_threshold) / span, 1.0)

    return XPStatusResponse(
        total_xp=xp_row.total_xp,
        level=xp_row.level,
        next_level_xp=next_threshold,
        level_pct=round(level_pct, 3),
        streak=streak_row.current_streak,
    )


@router.get("/streak/{user_id}", response_model=StreakResponse)
def get_streak(user_id: str, db: DBSession = Depends(get_db)):
    row = _get_or_create_streak(user_id, db)
    db.commit()
    return StreakResponse(
        current_streak=row.current_streak,
        longest_streak=row.longest_streak,
        last_active_date=row.last_active_date,
    )


@router.get("/badges/{user_id}", response_model=list[BadgeOut])
def get_badges(user_id: str, db: DBSession = Depends(get_db)):
    rows = db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    result = []
    for row in rows:
        meta = BADGE_CATALOG.get(row.badge_id, {})
        result.append(BadgeOut(
            badge_id=row.badge_id,
            name=meta.get("name", row.badge_id),
            icon=meta.get("icon", "🏅"),
            description=meta.get("description", ""),
            awarded_at=row.awarded_at.isoformat(),
        ))
    return result


@router.get("/daily-goal/{user_id}", response_model=DailyGoalResponse)
def get_daily_goal(user_id: str, db: DBSession = Depends(get_db)):
    row = _get_or_create_daily_goal(user_id, db)
    db.commit()
    pct = min(row.earned_xp / row.target_xp, 1.0) if row.target_xp > 0 else 0.0
    return DailyGoalResponse(
        date=row.date,
        target_xp=row.target_xp,
        earned_xp=row.earned_xp,
        completed=row.completed,
        pct=round(pct, 3),
    )
