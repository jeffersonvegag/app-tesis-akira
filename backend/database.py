import os
import requests
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

# Configuración de Turso
TURSO_DATABASE_URL = "app-dev-akira-pro-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTQ4NjA0MzYsImlkIjoiOTIyYWJkNTctYjVjYi00Mjg5LWE3MGMtZDI1Nzg3N2NhZTc3IiwicmlkIjoiMzViNDA3MjQtMzQ1Mi00MDVhLWFhODEtMTE3ZWU1ZmQ5N2UyIn0.uCGnCVnFs36H6jDLJ99hbAXiUyy3jyZiDWIfeJau5HHnJ0mE1clGO0YLqcX7n-RSZTsZ38SPgjXMX918n42bDQ"

# Intentar usar Turso directamente, fallback a SQLite en desarrollo
import os
if os.getenv("RENDER"):  # En producción (Render)
    try:
        from sqlalchemy_libsql import create_libsql_engine
        SQLALCHEMY_DATABASE_URL = f"libsql://{TURSO_DATABASE_URL}?authToken={TURSO_TOKEN}&secure=true"
        engine = create_libsql_engine(SQLALCHEMY_DATABASE_URL, echo=False)
        print("✅ Conectado a Turso en producción")
    except ImportError:
        # Fallback usando el cliente HTTP
        SQLALCHEMY_DATABASE_URL = "sqlite:///./career_plan.db"
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )
        print("⚠️  Fallback a SQLite, usando cliente HTTP para Turso")
else:  # En desarrollo local
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
    
    def execute_query(self, sql: str, params=None):
        """Ejecutar consulta SQL en Turso via HTTP API"""
        payload = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {
                        "sql": sql,
                        "args": params or []
                    }
                }
            ]
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload, timeout=30)
            result = response.json()
            if response.status_code == 200:
                return result
            else:
                print(f"Error HTTP {response.status_code}: {result}")
                return None
        except Exception as e:
            print(f"Error ejecutando consulta en Turso: {e}")
            return None
    
    def execute_multiple(self, queries):
        """Ejecutar múltiples consultas en una transacción"""
        requests_list = []
        for query_data in queries:
            if isinstance(query_data, str):
                requests_list.append({
                    "type": "execute",
                    "stmt": {"sql": query_data}
                })
            else:
                requests_list.append({
                    "type": "execute", 
                    "stmt": {
                        "sql": query_data.get("sql"),
                        "args": query_data.get("params", [])
                    }
                })
        
        payload = {"requests": requests_list}
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload, timeout=60)
            return response.json()
        except Exception as e:
            print(f"Error ejecutando múltiples consultas: {e}")
            return None

# Instancia global del cliente Turso
turso_client = TursoHTTPClient()
