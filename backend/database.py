import os
import requests
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

# Configuración de Turso
TURSO_DATABASE_URL = "app-dev-akira-pro-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NTQ4NTM5OTksImlkIjoiOTIyYWJkNTctYjVjYi00Mjg5LWE3MGMtZDI1Nzg3N2NhZTc3IiwicmlkIjoiMzViNDA3MjQtMzQ1Mi00MDVhLWFhODEtMTE3ZWU1ZmQ5N2UyIn0.J6m6bW8K5EGPtqVJih5ufWS4pYxP5O_cZeWoraZe_YMtyKMKKhP9WistCQPzIhY82HWT4xoXgoIx7crL34q5DA"

# Como fallback, usar SQLite local para desarrollo y conexión HTTP para lectura de Turso
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

# Cliente HTTP para consultas a Turso
class TursoHTTPClient:
    def __init__(self):
        self.base_url = f"https://{TURSO_DATABASE_URL}/v2/pipeline"
        self.headers = {
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def execute_query(self, sql: str):
        """Ejecutar consulta SQL en Turso via HTTP API"""
        payload = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {
                        "sql": sql
                    }
                }
            ]
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload, timeout=30)
            return response.json()
        except Exception as e:
            print(f"Error ejecutando consulta en Turso: {e}")
            return None

# Instancia global del cliente Turso
turso_client = TursoHTTPClient()
