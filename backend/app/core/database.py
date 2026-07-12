import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configured to fall back to the provided US Oregon Render PostgreSQL credentials
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://assetflow_db_xeh2_user:AA8yrgAidfIOHAq21OhEqOHKDcA6wXdG@dpg-d99gtpgk1i2s73e58va0-a.oregon-postgres.render.com/assetflow_db_xeh2"
)

# Connect with production pooling parameters
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI Session yield dependency context manager
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
