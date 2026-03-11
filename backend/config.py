import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./speakprep.db")
AUDIO_STORAGE_PATH: str = os.getenv("AUDIO_STORAGE_PATH", "./storage/audio_files")
CLERK_JWKS_URL: str = os.getenv("CLERK_JWKS_URL", "")

# Comma-separated allowed frontend origins, e.g.:
# "http://localhost:3000,https://your-app.vercel.app"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Ensure audio storage directory exists
os.makedirs(AUDIO_STORAGE_PATH, exist_ok=True)