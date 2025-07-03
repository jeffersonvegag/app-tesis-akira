import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

# Por ahora usamos SQLite local y luego sincronizamos con Turso via API
SQLALCHEMY_DATABASE_URL = "sqlite:///./career_plan.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configuración de Turso para uso posterior
TURSO_URL = "libsql://app-dev-akira-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTE1MTQ2NjYsImlkIjoiZWUyMzY1ZDUtOTJjMi00Nzk2LThiNzMtN2VkMGUxM2RkYWYxIiwicmlkIjoiMjVlZmJlNGEtNzBiYS00MDc4LTg0YTctZWViNGY4YjQ1MmQ1In0.78a5Alyo26j0m6CLeuY8LrePZFhnNvhs_gi-U8GWeocyRiFKKEY9sIUkxtexEk5bNkFE5w1Fd0YjYXOE_xz3Bw"

# Función para sincronizar con Turso usando HTTP API
async def sync_with_turso_http(query, params=None):
    """Ejecutar consulta en Turso usando HTTP API"""
    import requests
    
    url = f"https://app-dev-akira-jeffersonvegag.aws-us-east-1.turso.io/v2/pipeline"
    
    headers = {
        "Authorization": f"Bearer {TURSO_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": query,
                    "args": params or []
                }
            }
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        return response.json()
    except Exception as e:
        print(f"Error sincronizando con Turso: {e}")
        return None