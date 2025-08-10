import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de Turso
TURSO_URL = "libsql://app-dev-akira-pro-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NTQ4NTM5OTksImlkIjoiOTIyYWJkNTctYjVjYi00Mjg5LWE3MGMtZDI1Nzg3N2NhZTc3IiwicmlkIjoiMzViNDA3MjQtMzQ1Mi00MDVhLWFhODEtMTE3ZWU1ZmQ5N2UyIn0.J6m6bW8K5EGPtqVJih5ufWS4pYxP5O_cZeWoraZe_YMtyKMKKhP9WistCQPzIhY82HWT4xoXgoIx7crL34q5DA"

# Usar Turso como base de datos principal
SQLALCHEMY_DATABASE_URL = f"{TURSO_URL}?authToken={TURSO_TOKEN}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
