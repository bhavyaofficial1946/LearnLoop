import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.config.settings import settings

logger = logging.getLogger("learnloop.db")

def create_db_engine():
    # Attempt connecting to PostgreSQL first
    try:
        if settings.DATABASE_URL.startswith("postgresql"):
            engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Connected successfully to primary database: {settings.DATABASE_URL.split('@')[-1]}")
            return engine
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite database at {settings.SQLITE_FALLBACK_URL}")
    
    # Fallback to SQLite with check_same_thread=False
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )
    logger.info(f"Using SQLite database: {settings.SQLITE_FALLBACK_URL}")
    return engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
