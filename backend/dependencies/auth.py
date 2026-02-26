"""
Clerk JWT verification for FastAPI.
Verifies Bearer tokens issued by Clerk using their JWKS public keys.
"""
import jwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import Header, HTTPException, Depends
from typing import Optional
from config import CLERK_JWKS_URL

# Cache the JWKS client (fetches public keys once, refreshes automatically)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not CLERK_JWKS_URL:
            raise RuntimeError(
                "CLERK_JWKS_URL is not set. Add it to your .env file.\n"
                "Format: https://<your-clerk-frontend-api>/.well-known/jwks.json\n"
                "Find it in: Clerk Dashboard → API Keys → Frontend API"
            )
        _jwks_client = PyJWKClient(CLERK_JWKS_URL, cache_keys=True)
    return _jwks_client


def _decode_token(token: str) -> dict:
    client = _get_jwks_client()
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True},
            leeway=60,  # Allow 60s clock skew between client and server
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please sign in again.")
    except (jwt.InvalidTokenError, PyJWKClientError) as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency — requires a valid Clerk JWT.
    Returns the Clerk user ID (sub claim).
    Raises 401 if the token is missing or invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing. Expected: Bearer <token>",
        )
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user ID (sub).")
    return user_id


def get_optional_user(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency — same as get_current_user but falls back to 'anonymous'
    instead of raising 401. Used for routes that work with or without auth.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return "anonymous"
    try:
        token = authorization.split(" ", 1)[1]
        payload = _decode_token(token)
        return payload.get("sub", "anonymous")
    except HTTPException:
        return "anonymous"
