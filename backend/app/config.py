import os
from pathlib import Path
from typing import List

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "OnionVision AI Inspection Backend"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Agricultural computer vision inspection and automated grading system "
        "for onions. Exposes RESTful endpoints for image capture, AI defect "
        "detection, human-in-the-loop verification, and digital quality certs."
    )
    API_V1_STR: str = "/api/v1"
    
    # Database Configurations
    # Production PostgreSQL: "postgresql+asyncpg://postgres:postgres@localhost:5432/onionvision_db"
    # Local Async SQLite fallback: "sqlite+aiosqlite:///./onionvision.db"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite+aiosqlite:///{BASE_DIR / 'onionvision.db'}"
    )
    # Optional MongoDB Motor URI
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "national_onion_intelligence")
    DB_ECHO_SQL: bool = os.getenv("DB_ECHO_SQL", "false").lower() == "true"

    # Upload Configurations
    UPLOAD_PATH: Path = UPLOAD_DIR
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]
    
    # CORS Origins - Allowed to accept requests from ReactJS/Vite frontends
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "*"
    ]
    
    # Agricultural Mandi / APMC Defaults
    BASE_MSP_PER_QTL: int = 2400  # INR per quintal benchmark
    GRADE_A_MIN_DIAMETER_MM: float = 50.0

settings = Settings()
