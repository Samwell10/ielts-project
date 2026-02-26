import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import TranscriptOut
from services.stt import transcribe_audio
from config import AUDIO_STORAGE_PATH

router = APIRouter(prefix="/api/audio", tags=["audio"])

ALLOWED_EXTENSIONS = {".webm", ".mp3", ".mp4", ".wav", ".m4a", ".mpeg", ".mpga"}
MAX_FILE_SIZE_MB = 25


@router.post("/upload", response_model=dict)
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload an audio recording. Returns the saved file URL/path.
    Accepts webm (MediaRecorder default), mp3, wav, m4a.
    """
    ext = os.path.splitext(file.filename or "audio.webm")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )

    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    dest_path = os.path.join(AUDIO_STORAGE_PATH, filename)

    # Stream to disk
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max is {MAX_FILE_SIZE_MB} MB.",
        )

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    audio_url = f"/api/audio/files/{filename}"
    return {"audio_url": audio_url, "file_id": file_id, "filename": filename}


@router.post("/transcribe", response_model=TranscriptOut)
async def transcribe(file: UploadFile = File(...)):
    """
    Upload audio, transcribe via Gemini, and return the transcript + Gemini file URI.
    The file is saved permanently (so its URL can be stored) and the Gemini upload is
    kept alive so the evaluator can use it for pronunciation scoring.
    """
    ext = os.path.splitext(file.filename or "audio.webm")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    # Save permanently so we can store audio_url and pass to evaluator
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    saved_path = os.path.join(AUDIO_STORAGE_PATH, filename)
    audio_url = f"/api/audio/files/{filename}"

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max is {MAX_FILE_SIZE_MB} MB.",
        )

    async with aiofiles.open(saved_path, "wb") as f:
        await f.write(content)

    try:
        result = transcribe_audio(saved_path)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    return TranscriptOut(
        transcript=result["transcript"],
        duration_seconds=result.get("duration_seconds"),
        audio_url=audio_url,
        gemini_file_uri=result.get("gemini_file_uri"),
        gemini_file_name=result.get("gemini_file_name"),
    )
