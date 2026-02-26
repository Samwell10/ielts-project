from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from models.database import Base, engine
import models.db_models  # noqa: F401 — ensures models are registered before create_all
from routers import questions, audio, evaluation, sessions
from config import AUDIO_STORAGE_PATH, ALLOWED_ORIGINS

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpeakPrep AI – Backend API",
    description="IELTS & CELPIP speaking practice: question generation, STT, and AI evaluation.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins are read from the ALLOWED_ORIGINS env var (comma-separated).
# Default: localhost:3000 for local dev.
# Production: add your Vercel URL via the env var, e.g.:
#   ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve stored audio files statically ──────────────────────────────────────
os.makedirs(AUDIO_STORAGE_PATH, exist_ok=True)
app.mount("/api/audio/files", StaticFiles(directory=AUDIO_STORAGE_PATH), name="audio_files")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(questions.router)
app.include_router(audio.router)
app.include_router(evaluation.router)
app.include_router(sessions.router)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SpeakPrep AI API is running.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
