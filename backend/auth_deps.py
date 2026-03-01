"""Firebase auth dependency for protecting routes."""
import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

# Ensure FIREBASE_* env vars are available regardless of working directory
BACKEND_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=BACKEND_ENV_PATH)
load_dotenv()


def _build_firebase_cert_from_env() -> dict | None:
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

    if not project_id or not private_key or not client_email:
        return None

    return {
        "type": "service_account",
        "project_id": project_id,
        "private_key": private_key.replace("\\n", "\n"),
        "client_email": client_email,
        "token_uri": "https://oauth2.googleapis.com/token",
    }


def _initialize_firebase_admin() -> None:
    try:
        firebase_admin.get_app()
        return
    except ValueError:
        pass

    cert_data = _build_firebase_cert_from_env()
    if cert_data:
        cred = credentials.Certificate(cert_data)
        firebase_admin.initialize_app(
            cred,
            {
                "projectId": cert_data["project_id"],
            },
        )
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", cert_data["project_id"])
        logger.info("Firebase Admin initialized from FIREBASE_* env vars (projectId=%s)", cert_data["project_id"])
        return

    firebase_admin.initialize_app()
    logger.info("Firebase Admin initialized using default application credentials")


_initialize_firebase_admin()


security = HTTPBearer()


async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to verify Firebase ID token from Authorization header.
    Returns the decoded token (user info).
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.exception("Firebase token verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )

