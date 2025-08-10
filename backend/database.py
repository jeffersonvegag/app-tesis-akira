import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de Turso
TURSO_DATABASE_URL = "app-dev-akira-pro-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NTQ4NTM5OTksImlkIjoiOTIyYWJkNTctYjVjYi00Mjg5LWE3MGMtZDI1Nzg3N2NhZTc3IiwicmlkIjoiMzViNDA3MjQtMzQ1Mi00MDVhLWFhODEtMTE3ZWU1ZmQ5N2UyIn0.J6m6bW8K5EGPtqVJih5ufWS4pYxP5O_cZeWoraZe_YMtyKMKKhP9WistCQPzIhY82HWT4xoXgoIx7crL34q5DA"

# Usar Turso como base de datos principal con el formato correcto de SQLAlchemy
SQLALCHEMY_DATABASE_URL = f"libsql://{TURSO_DATABASE_URL}?authToken={TURSO_TOKEN}&secure=true"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
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
