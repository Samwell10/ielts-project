"""
Audio file storage — switches between local disk and Cloudflare R2.

If R2 credentials are set in the environment the file is uploaded to R2
and a public URL is returned. Otherwise it is saved to the local
AUDIO_STORAGE_PATH directory and served as a static file by FastAPI.
"""
import os
import boto3
from botocore.config import Config
from functools import lru_cache
from config import (
    AUDIO_STORAGE_PATH,
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    USE_R2,
)


@lru_cache(maxsize=1)
def _r2_client():
    """Create and cache a boto3 S3 client pointed at Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def save_audio(local_path: str, filename: str) -> str:
    """
    Persist an audio file and return its public URL.

    - If R2 is configured: uploads to R2, returns R2 public URL.
    - Otherwise: the file is already on local disk; returns the local API path.

    `local_path` must already exist on disk (written by the caller).
    """
    if not USE_R2:
        # File is already saved locally by the caller — just return the static URL
        return f"/api/audio/files/{filename}"

    # Upload to R2
    s3 = _r2_client()
    object_key = f"audio/{filename}"

    s3.upload_file(
        local_path,
        R2_BUCKET_NAME,
        object_key,
        ExtraArgs={"ContentType": _mime_for(filename)},
    )

    # Delete local temp copy after successful upload
    try:
        os.remove(local_path)
    except OSError:
        pass

    if R2_PUBLIC_URL:
        return f"{R2_PUBLIC_URL}/{object_key}"

    # Fallback: R2 managed public URL (only works if bucket has public access enabled)
    return f"https://{R2_BUCKET_NAME}.{R2_ACCOUNT_ID}.r2.dev/{object_key}"


def _mime_for(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return {
        ".webm": "audio/webm",
        ".mp3":  "audio/mpeg",
        ".mp4":  "audio/mp4",
        ".wav":  "audio/wav",
        ".m4a":  "audio/mp4",
        ".ogg":  "audio/ogg",
    }.get(ext, "audio/webm")
