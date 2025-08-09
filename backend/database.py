# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración para Turso
DATABASE_URL = os.getenv("DATABASE_URL", "libsql://app-dev-akira-jeffersonvegag.aws-us-east-1.turso.io")
DATABASE_TOKEN = os.getenv("DATABASE_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NTQ3MjIzMzIsImlkIjoiZWUyMzY1ZDUtOTJjMi00Nzk2LThiNzMtN2VkMGUxM2RkYWYxIiwicmlkIjoiMjVlZmJlNGEtNzBiYS00MDc4LTg0YTctZWViNGY4YjQ1MmQ1In0.8TCn-KosFIMXcz64ekeMOzd9SgWsOw-XsxchTR6vn0kUTXghwDzyoidQkSzbfFb0j2M6DZDu8qE5LuSzwSKtBw")

# Para Turso, usamos una conexión especial
engine = create_engine(
    f"sqlite+pysqlite:///:memory:",  # Turso es compatible con SQLite
    connect_args={
        "check_same_thread": False,
        "url": DATABASE_URL,
        "authToken": DATABASE_TOKEN
    },
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
