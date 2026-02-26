"""
Speech-to-text using Gemini 2.0 Flash multimodal audio understanding.
Gemini can receive audio directly - no separate STT service needed.
"""
import os
import mimetypes
from services.llm import get_client

# Supported audio MIME types
AUDIO_MIME_TYPES = {
    ".webm": "audio/webm",
    ".mp3":  "audio/mpeg",
    ".mp4":  "audio/mp4",
    ".wav":  "audio/wav",
    ".m4a":  "audio/mp4",
    ".mpeg": "audio/mpeg",
    ".mpga": "audio/mpeg",
    ".ogg":  "audio/ogg",
}


def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe an audio file using Gemini's native multimodal capability.
    Uploads the file to Gemini Files API, then requests a verbatim transcript.
    Returns {"transcript": str, "duration_seconds": None}
    """
    client = get_client()

    ext = os.path.splitext(file_path)[1].lower()
    mime_type = AUDIO_MIME_TYPES.get(ext, "audio/webm")

    # Upload the audio file to Gemini Files API
    uploaded = client.files.upload(
        file=file_path,
        config={"mime_type": mime_type},
    )

    # Ask Gemini to transcribe
    from google.genai import types
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_uri(
                file_uri=uploaded.uri,
                mime_type=uploaded.mime_type,
            ),
            "Please transcribe this audio recording word for word. "
            "Return only the spoken words, no timestamps or labels.",
        ],
    )

    transcript = (response.text or "").strip()

    # Keep the file alive — the evaluator will use it for pronunciation scoring,
    # then delete it. Gemini Files auto-expire after 48 h if not deleted explicitly.
    return {
        "transcript": transcript,
        "duration_seconds": None,
        "gemini_file_uri": uploaded.uri,   # passed to evaluator for audio scoring
        "gemini_file_name": uploaded.name, # used for cleanup after evaluation
    }
