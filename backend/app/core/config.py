import os
import secrets
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(BACKEND_DIR / ".env")
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"
DATASET_PATH = PROJECT_ROOT / "data" / "bank-full.csv"
DATABASE_PATH = BACKEND_DIR / "app.db"
DATABASE_URL = os.getenv("TDI_DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")

APP_NAME = "DepositIQ API"
JWT_SECRET_KEY = os.getenv("TDI_SECRET_KEY") or secrets.token_urlsafe(48)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("TDI_ACCESS_TOKEN_MINUTES", "480"))

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("TDI_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]
