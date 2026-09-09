from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnLoop"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/learnloop",
        description="PostgreSQL Database Connection URL with SQLite fallback"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./learnloop.db"
    
    # File Storage
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_FILE_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
