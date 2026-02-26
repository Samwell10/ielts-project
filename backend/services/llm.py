"""Gemini client shared across all services."""
from google import genai
from config import GEMINI_API_KEY

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file. "
                "Get a free key at https://aistudio.google.com"
            )
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client
