from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
import requests
import asyncio
from typing import Dict, Any
import schemas
from database import engine, get_db
import warnings
from passlib.context import CryptContext
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List
from datetime import datetime
import models
import schemas
from database import engine, get_db
import warnings
from passlib.context import CryptContext
import json
import requests
import asyncio
from typing import Dict, Any
from datetime import datetime
# Suprimir warning de bcrypt
warnings.filterwarnings("ignore", category=UserWarning, module="passlib")

# Solo crear tablas si no existen, NO borrar datos existentes
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Career Plan API",
    description="Sistema de gestión de capacitaciones para Viamatica",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tags para organizar los endpoints
tags_metadata = [
    {"name": "Authentication", "description": "Operaciones de autenticación"},
    {"name": "Users", "description": "Gestión de usuarios del sistema"},
    {"name": "Persons", "description": "Gestión de datos personales"},
    {"name": "Courses", "description": "Gestión de cursos y capacitaciones"},
    {"name": "Career Plans", "description": "Gestión de planes de carrera"},
    {"name": "Catalogs", "description": "Catálogos del sistema (roles, géneros, etc.)"},
]

app.openapi_tags = tags_metadata

# ROOT ENDPOINT
@app.get("/", tags=["System"])
def read_root():
    return {
        "message": "Career Plan API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# SETUP ENDPOINT - Para crear datos iniciales
@app.post("/setup", tags=["System"], summary="Configuración inicial")
def setup_initial_data(db: Session = Depends(get_db)):
    """Crear datos iniciales para testing"""
    try:
        created_items = []
        
        # Crear géneros
        existing_genders = db.query(models.Gender).count()
        if existing_genders == 0:
            genders = [
                models.Gender(gender_name="Masculino"),
                models.Gender(gender_name="Femenino")
            ]
            db.add_all(genders)
            db.commit()
            created_items.append(f"Creados {len(genders)} géneros")
        else:
            created_items.append(f"Ya existen {existing_genders} géneros")
        
        # Crear roles
        existing_roles = db.query(models.Role).count()
        if existing_roles == 0:
            roles = [
                models.Role(role_name="Administrador", role_description="Gestiona toda la plataforma"),
                models.Role(role_name="Supervisor", role_description="Supervisa equipos de trabajo"),
                models.Role(role_name="Cliente", role_description="Usuario final del sistema"),
                models.Role(role_name="Instructor", role_description="Docente profesional")
            ]
            db.add_all(roles)
            db.commit()
            created_items.append(f"Creados {len(roles)} roles")
        else:
            created_items.append(f"Ya existen {existing_roles} roles")
        
        # Crear posiciones
        existing_positions = db.query(models.UserPosition).count()
        if existing_positions == 0:
            positions = [
                models.UserPosition(position_name="Desarrollador"),
                models.UserPosition(position_name="Analista"),
                models.UserPosition(position_name="Jefe de Proyecto"),
                models.UserPosition(position_name="Gerente")
            ]
            db.add_all(positions)
            db.commit()
            created_items.append(f"Creadas {len(positions)} posiciones")
        else:
            created_items.append(f"Ya existen {existing_positions} posiciones")
        
        # Crear personas de prueba
        existing_persons = db.query(models.Person).count()
        if existing_persons == 0:
            persons = [
                models.Person(person_dni=1234567890, person_first_name="Admin", person_last_name="Sistema", person_gender=1, person_email="admin@viamatica.com"),
                models.Person(person_dni=1234567891, person_first_name="Juan", person_last_name="Empleado", person_gender=1, person_email="empleado@viamatica.com"),
                models.Person(person_dni=1234567892, person_first_name="Maria", person_last_name="Supervisor", person_gender=2, person_email="supervisor@viamatica.com")
            ]
            db.add_all(persons)
            db.commit()
            created_items.append(f"Creadas {len(persons)} personas")
        else:
            created_items.append(f"Ya existen {existing_persons} personas")
        
        # Crear usuarios de prueba
        existing_users = db.query(models.User).count()
        if existing_users == 0:
            users = [
                models.User(user_username="admin", user_password=pwd_context.hash("admin123"), person_id=1, user_role=1, user_position_id=1),
                models.User(user_username="supervisor", user_password=pwd_context.hash("sup123"), person_id=2, user_role=2, user_position_id=3),
                models.User(user_username="cliente", user_password=pwd_context.hash("cli123"), person_id=3, user_role=3, user_position_id=1)
            ]
            db.add_all(users)
            db.commit()
            created_items.append(f"Creados {len(users)} usuarios")
        else:
            created_items.append(f"Ya existen {existing_users} usuarios")
        
        return {
            "message": "Setup completado exitosamente",
            "details": created_items
        }
    except Exception as e:
        db.rollback()
        return {"error": f"Error en setup: {str(e)}"}

# AUTHENTICATION ENDPOINTS
@app.post("/api/v1/auth/login", tags=["Authentication"], summary="Iniciar sesión")
def login(login_data: schemas.Login, db: Session = Depends(get_db)):
    """
    Iniciar sesión con username y password:
    - **username**: nombre de usuario
    - **password**: contraseña del usuario
    """
    user = db.query(models.User).filter(models.User.user_username == login_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    if not pwd_context.verify(login_data.password, user.user_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    return {
        "message": "Login exitoso",
        "user_id": user.user_id,
        "role_id": user.user_role,
        "username": user.user_username
    }

# USER ENDPOINTS
@app.get("/api/v1/users", response_model=List[schemas.User], tags=["Users"], summary="Listar usuarios")
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todos los usuarios del sistema"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.post("/api/v1/users", response_model=schemas.User, tags=["Users"], summary="Crear usuario")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Crear un nuevo usuario en el sistema"""
    # Verificar si el username ya existe
    db_user = db.query(models.User).filter(models.User.user_username == user.user_username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe"
        )
    
    hashed_password = pwd_context.hash(user.user_password)
    db_user = models.User(
        user_username=user.user_username,
        user_password=hashed_password,
        person_id=user.person_id,
        user_role=user.user_role,
        user_position_id=user.user_position_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/v1/users/{user_id}", response_model=schemas.User, tags=["Users"], summary="Obtener usuario por ID")
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener información de un usuario específico"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user

@app.put("/api/v1/users/{user_id}", response_model=schemas.User, tags=["Users"], summary="Actualizar usuario")
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Actualizar información de un usuario"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si el username ya existe en otro usuario
    if user.user_username != db_user.user_username:
        existing_user = db.query(models.User).filter(
            models.User.user_username == user.user_username,
            models.User.user_id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya existe"
            )
    
    db_user.user_username = user.user_username
    if user.user_password:
        db_user.user_password = pwd_context.hash(user.user_password)
    db_user.person_id = user.person_id
    db_user.user_role = user.user_role
    db_user.user_position_id = user.user_position_id
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/api/v1/users/{user_id}/password", tags=["Users"], summary="Cambiar contraseña")
def change_password(user_id: int, password_data: dict, db: Session = Depends(get_db)):
    """Cambiar solo la contraseña de un usuario"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    new_password = password_data.get("new_password")
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña es requerida"
        )
    
    db_user.user_password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(db_user)
    return {"message": "Contraseña actualizada correctamente"}

@app.delete("/api/v1/users/{user_id}", tags=["Users"], summary="Eliminar usuario")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Eliminar un usuario del sistema (soft delete)"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    db_user.user_status = 'I'  # Inactivo
    db.commit()
    return {"message": "Usuario eliminado correctamente"}

# PERSON ENDPOINTS
@app.get("/api/v1/persons", response_model=List[schemas.Person], tags=["Persons"], summary="Listar personas")
def read_persons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todas las personas registradas"""
    persons = db.query(models.Person).offset(skip).limit(limit).all()
    return persons

@app.post("/api/v1/persons", response_model=schemas.Person, tags=["Persons"], summary="Crear persona")
def create_person(person: schemas.PersonCreate, db: Session = Depends(get_db)):
    """Registrar una nueva persona"""
    # Verificar si el DNI ya existe
    db_person = db.query(models.Person).filter(models.Person.person_dni == person.person_dni).first()
    if db_person:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI ya está registrado"
        )
    
    db_person = models.Person(**person.dict())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

# COURSE ENDPOINTS
@app.get("/api/v1/courses", response_model=List[schemas.Course], tags=["Courses"], summary="Listar cursos")
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todos los cursos disponibles"""
    courses = db.query(models.Course).offset(skip).limit(limit).all()
    return courses

@app.post("/api/v1/courses", response_model=schemas.Course, tags=["Courses"], summary="Crear curso")
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    """Crear un nuevo curso"""
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@app.get("/api/v1/courses/{course_id}", response_model=schemas.Course, tags=["Courses"], summary="Obtener curso por ID")
def read_course(course_id: int, db: Session = Depends(get_db)):
    """Obtener información detallada de un curso"""
    course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    return course

@app.put("/api/v1/courses/{course_id}", response_model=schemas.Course, tags=["Courses"], summary="Actualizar curso")
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    """Actualizar información de un curso"""
    db_course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if db_course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@app.delete("/api/v1/courses/{course_id}", tags=["Courses"], summary="Eliminar curso")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Eliminar un curso del sistema"""
    db_course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if db_course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    db.delete(db_course)
    db.commit()
    return {"message": "Curso eliminado correctamente"}

# CAREER PLAN ENDPOINTS
@app.get("/api/v1/career-plans", response_model=List[schemas.CareerPlan], tags=["Career Plans"], summary="Listar planes de carrera")
def read_career_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todos los planes de carrera"""
    career_plans = db.query(models.CareerPlan).offset(skip).limit(limit).all()
    return career_plans

@app.post("/api/v1/career-plans", response_model=schemas.CareerPlan, tags=["Career Plans"], summary="Crear plan de carrera")
def create_career_plan(career_plan: schemas.CareerPlanCreate, db: Session = Depends(get_db)):
    """Crear un nuevo plan de carrera"""
    db_career_plan = models.CareerPlan(**career_plan.dict())
    db.add(db_career_plan)
    db.commit()
    db.refresh(db_career_plan)
    return db_career_plan

@app.get("/api/v1/career-plans/{plan_id}", response_model=schemas.CareerPlan, tags=["Career Plans"], summary="Obtener plan por ID")
def read_career_plan(plan_id: int, db: Session = Depends(get_db)):
    """Obtener información detallada de un plan de carrera"""
    career_plan = db.query(models.CareerPlan).filter(models.CareerPlan.career_plan_id == plan_id).first()
    if career_plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan de carrera no encontrado"
        )
    return career_plan

# USER CAREER PLAN ENDPOINTS
@app.get("/api/v1/user-career-plans", response_model=List[schemas.UserCareerPlan], tags=["Career Plans"], summary="Listar asignaciones de planes")
def read_user_career_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todas las asignaciones de planes de carrera a usuarios"""
    user_career_plans = db.query(models.UserCareerPlan).offset(skip).limit(limit).all()
    return user_career_plans

@app.post("/api/v1/user-career-plans", response_model=schemas.UserCareerPlan, tags=["Career Plans"], summary="Asignar plan a usuario")
def create_user_career_plan(user_career_plan: schemas.UserCareerPlanCreate, db: Session = Depends(get_db)):
    """Asignar un plan de carrera a un usuario"""
    db_user_career_plan = models.UserCareerPlan(**user_career_plan.dict())
    db.add(db_user_career_plan)
    db.commit()
    db.refresh(db_user_career_plan)
    return db_user_career_plan

@app.get("/api/v1/user-career-plans/user/{user_id}", response_model=List[schemas.UserCareerPlan], tags=["Career Plans"], summary="Planes por usuario")
def read_user_career_plans_by_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener todos los planes de carrera asignados a un usuario específico"""
    user_career_plans = db.query(models.UserCareerPlan).filter(
        models.UserCareerPlan.user_id == user_id
    ).all()
    return user_career_plans

# CATALOG ENDPOINTS
@app.get("/api/v1/genders", response_model=List[schemas.Gender], tags=["Catalogs"], summary="Listar géneros")
def read_genders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener catálogo de géneros"""
    genders = db.query(models.Gender).offset(skip).limit(limit).all()
    return genders

@app.post("/api/v1/genders", response_model=schemas.Gender, tags=["Catalogs"], summary="Crear género")
def create_gender(gender: schemas.GenderCreate, db: Session = Depends(get_db)):
    """Agregar un nuevo género al catálogo"""
    db_gender = models.Gender(**gender.dict())
    db.add(db_gender)
    db.commit()
    db.refresh(db_gender)
    return db_gender

@app.get("/api/v1/roles", response_model=List[schemas.Role], tags=["Catalogs"], summary="Listar roles")
def read_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener catálogo de roles del sistema"""
    roles = db.query(models.Role).offset(skip).limit(limit).all()
    return roles

@app.post("/api/v1/roles", response_model=schemas.Role, tags=["Catalogs"], summary="Crear rol")
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    """Agregar un nuevo rol al sistema"""
    db_role = models.Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@app.get("/api/v1/positions", response_model=List[schemas.UserPosition], tags=["Catalogs"], summary="Listar posiciones")
def read_positions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener catálogo de posiciones/cargos"""
    positions = db.query(models.UserPosition).offset(skip).limit(limit).all()
    return positions

@app.post("/api/v1/positions", response_model=schemas.UserPosition, tags=["Catalogs"], summary="Crear posición")
def create_position(position: schemas.UserPositionCreate, db: Session = Depends(get_db)):
    """Agregar una nueva posición/cargo"""
    db_position = models.UserPosition(**position.dict())
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

@app.get("/api/v1/technologies", response_model=List[schemas.Technology], tags=["Catalogs"], summary="Listar tecnologías")
def read_technologies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener catálogo de tecnologías"""
    technologies = db.query(models.Technology).offset(skip).limit(limit).all()
    return technologies

@app.post("/api/v1/technologies", response_model=schemas.Technology, tags=["Catalogs"], summary="Crear tecnología")
def create_technology(technology: schemas.TechnologyCreate, db: Session = Depends(get_db)):
    """Agregar una nueva tecnología"""
    db_technology = models.Technology(**technology.dict())
    db.add(db_technology)
    db.commit()
    db.refresh(db_technology)
    return db_technology

@app.get("/api/v1/modalities", response_model=List[schemas.CourseModality], tags=["Catalogs"], summary="Listar modalidades")
def read_modalities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener catálogo de modalidades de curso"""
    modalities = db.query(models.CourseModality).offset(skip).limit(limit).all()
    return modalities

@app.post("/api/v1/modalities", response_model=schemas.CourseModality, tags=["Catalogs"], summary="Crear modalidad")
def create_modality(modality: schemas.CourseModalityCreate, db: Session = Depends(get_db)):
    """Agregar una nueva modalidad de curso"""
    db_modality = models.CourseModality(**modality.dict())
    db.add(db_modality)
    db.commit()
    db.refresh(db_modality)
    return db_modality
# COURSE ASSIGNMENT ENDPOINTS
@app.get("/api/v1/course-assignments", response_model=List[schemas.CourseAssignment], tags=["Course Assignments"], summary="Listar asignaciones de cursos")
def read_course_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todas las asignaciones de cursos"""
    assignments = db.query(models.CourseAssignment).offset(skip).limit(limit).all()
    return assignments

@app.post("/api/v1/course-assignments", response_model=schemas.CourseAssignment, tags=["Course Assignments"], summary="Crear asignación de curso")
def create_course_assignment(assignment: schemas.CourseAssignmentCreate, db: Session = Depends(get_db)):
    """Asignar un curso a un cliente con un instructor"""
    db_assignment = models.CourseAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.get("/api/v1/course-assignments/{assignment_id}", response_model=schemas.CourseAssignment, tags=["Course Assignments"], summary="Obtener asignación por ID")
def read_course_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Obtener información detallada de una asignación"""
    assignment = db.query(models.CourseAssignment).filter(models.CourseAssignment.course_assignment_id == assignment_id).first()
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación no encontrada"
        )
    return assignment

@app.put("/api/v1/course-assignments/{assignment_id}", response_model=schemas.CourseAssignment, tags=["Course Assignments"], summary="Actualizar asignación")
def update_course_assignment(assignment_id: int, assignment: schemas.CourseAssignmentCreate, db: Session = Depends(get_db)):
    """Actualizar una asignación de curso"""
    db_assignment = db.query(models.CourseAssignment).filter(models.CourseAssignment.course_assignment_id == assignment_id).first()
    if db_assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación no encontrada"
        )
    
    for key, value in assignment.dict().items():
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.delete("/api/v1/course-assignments/{assignment_id}", tags=["Course Assignments"], summary="Eliminar asignación")
def delete_course_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Eliminar una asignación de curso"""
    db_assignment = db.query(models.CourseAssignment).filter(models.CourseAssignment.course_assignment_id == assignment_id).first()
    if db_assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación no encontrada"
        )
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Asignación eliminada correctamente"}

@app.get("/api/v1/course-assignments/user/{user_id}", response_model=List[schemas.CourseAssignment], tags=["Course Assignments"], summary="Asignaciones por usuario")
def read_course_assignments_by_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener todas las asignaciones de un usuario específico"""
    assignments = db.query(models.CourseAssignment).filter(
        models.CourseAssignment.client_id == user_id
    ).all()
    return assignments

@app.get("/api/v1/course-assignments/instructor/{instructor_id}", response_model=List[schemas.CourseAssignment], tags=["Course Assignments"], summary="Asignaciones por instructor")
def read_course_assignments_by_instructor(instructor_id: int, db: Session = Depends(get_db)):
    """Obtener todas las asignaciones de un instructor específico"""
    assignments = db.query(models.CourseAssignment).filter(
        models.CourseAssignment.instructor_id == instructor_id
    ).all()
    return assignments
# ===============================================
# ENDPOINTS ESPECIALIZADOS PARA POWER BI
# ===============================================

@app.get("/api/v1/powerbi/users-complete", tags=["Power BI"], summary="Datos completos de usuarios para Power BI")
def get_users_for_powerbi(db: Session = Depends(get_db)):
    """Endpoint optimizado para Power BI con datos completos de usuarios"""
    try:
        users = db.query(models.User).all()
        result = []
        
        for user in users:
            result.append({
                "user_id": user.user_id,
                "username": user.user_username,
                "person_id": user.person_id,
                "dni": user.person.person_dni,
                "first_name": user.person.person_first_name,
                "last_name": user.person.person_last_name,
                "full_name": f"{user.person.person_first_name} {user.person.person_last_name}",
                "email": user.person.person_email,
                "gender_id": user.person.person_gender,
                "gender_name": user.person.gender.gender_name,
                "role_id": user.user_role,
                "role_name": user.role.role_name,
                "role_description": user.role.role_description,
                "position_id": user.user_position_id,
                "position_name": user.position.position_name,
                "user_status": user.user_status,
                "user_created_at": user.user_created_at.isoformat() if user.user_created_at else None,
                "person_created_at": user.person.person_created_at.isoformat() if user.person.person_created_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuarios: {str(e)}")

@app.get("/api/v1/powerbi/courses-complete", tags=["Power BI"], summary="Datos completos de cursos para Power BI")
def get_courses_for_powerbi(db: Session = Depends(get_db)):
    """Endpoint optimizado para Power BI con datos completos de cursos"""
    try:
        courses = db.query(models.Course).all()
        result = []
        
        for course in courses:
            result.append({
                "course_id": course.course_id,
                "course_name": course.course_name,
                "course_link": course.course_link,
                "course_duration": str(course.course_duration) if course.course_duration else None,
                "course_duration_minutes": (course.course_duration.hour * 60 + course.course_duration.minute) if course.course_duration else 0,
                "technology_id": course.technology_id,
                "technology_name": course.technology.technology_name if course.technology else None,
                "modality_id": course.course_modality_id,
                "modality_name": course.modality.course_modality_name if course.modality else None,
                "course_credentials": course.course_credentials,
                "course_created_at": course.course_created_at.isoformat() if course.course_created_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener cursos: {str(e)}")

@app.get("/api/v1/powerbi/course-assignments-complete", tags=["Power BI"], summary="Datos completos de asignaciones para Power BI")
def get_course_assignments_for_powerbi(db: Session = Depends(get_db)):
    """Endpoint optimizado para Power BI con datos completos de asignaciones"""
    try:
        assignments = db.query(models.CourseAssignment).all()
        result = []
        
        for assignment in assignments:
            # Función auxiliar para obtener texto de estado
            def get_status_text(status_code):
                status_map = {
                    'P': 'Pendiente',
                    'E': 'En Progreso', 
                    'C': 'Completado',
                    'X': 'Cancelado',
                    'A': 'Activo',
                    'I': 'Inactivo'
                }
                return status_map.get(status_code, status_code)
            
            result.append({
                "assignment_id": assignment.course_assignment_id,
                "course_id": assignment.course_id,
                "course_name": assignment.course.course_name,
                "course_duration": str(assignment.course.course_duration) if assignment.course.course_duration else None,
                "course_duration_minutes": (assignment.course.course_duration.hour * 60 + assignment.course.course_duration.minute) if assignment.course.course_duration else 0,
                "client_id": assignment.client_id,
                "client_name": f"{assignment.client.person.person_first_name} {assignment.client.person.person_last_name}",
                "client_first_name": assignment.client.person.person_first_name,
                "client_last_name": assignment.client.person.person_last_name,
                "client_email": assignment.client.person.person_email,
                "client_position": assignment.client.position.position_name,
                "instructor_id": assignment.instructor_id,
                "instructor_name": f"{assignment.instructor.person.person_first_name} {assignment.instructor.person.person_last_name}" if assignment.instructor else "Sin Instructor",
                "instructor_email": assignment.instructor.person.person_email if assignment.instructor else None,
                "assignment_status": assignment.assignment_status,
                "assignment_status_text": get_status_text(assignment.assignment_status),
                "assignment_created_at": assignment.assignment_created_at.isoformat() if assignment.assignment_created_at else None,
                "assignment_start_date": assignment.assignment_start_date.isoformat() if assignment.assignment_start_date else None,
                "assignment_end_date": assignment.assignment_end_date.isoformat() if assignment.assignment_end_date else None,
                "technology_name": assignment.course.technology.technology_name if assignment.course.technology else None,
                "modality_name": assignment.course.modality.course_modality_name if assignment.course.modality else None,
                "course_credentials": assignment.course.course_credentials
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener asignaciones: {str(e)}")

@app.get("/api/v1/powerbi/career-plans-complete", tags=["Power BI"], summary="Datos completos de planes de carrera para Power BI")
def get_career_plans_for_powerbi(db: Session = Depends(get_db)):
    """Endpoint optimizado para Power BI con datos completos de planes de carrera"""
    try:
        user_career_plans = db.query(models.UserCareerPlan).all()
        result = []
        
        for ucp in user_career_plans:
            # Función auxiliar para obtener texto de estado
            def get_status_text(status_code):
                status_map = {
                    'P': 'Pendiente',
                    'E': 'En Progreso', 
                    'C': 'Completado',
                    'X': 'Cancelado',
                    'A': 'Activo',
                    'I': 'Inactivo'
                }
                return status_map.get(status_code, status_code)
            
            result.append({
                "user_career_plan_id": ucp.user_career_plan_id,
                "user_id": ucp.user_id,
                "user_name": f"{ucp.user.person.person_first_name} {ucp.user.person.person_last_name}",
                "user_email": ucp.user.person.person_email,
                "user_position": ucp.user.position.position_name,
                "career_plan_id": ucp.career_plan_id,
                "course_id": ucp.career_plan.course_id,
                "course_name": ucp.career_plan.course.course_name,
                "course_duration": str(ucp.career_plan.course.course_duration) if ucp.career_plan.course.course_duration else None,
                "technology_name": ucp.career_plan.course.technology.technology_name if ucp.career_plan.course.technology else None,
                "modality_name": ucp.career_plan.course.modality.course_modality_name if ucp.career_plan.course.modality else None,
                "career_plan_status": ucp.career_plan_status,
                "career_plan_status_text": get_status_text(ucp.career_plan_status),
                "created_at": ucp.user_career_plan_created_at.isoformat() if ucp.user_career_plan_created_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener planes de carrera: {str(e)}")

@app.get("/api/v1/powerbi/dashboard-metrics", tags=["Power BI"], summary="Métricas para dashboard de Power BI")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Métricas agregadas para dashboards de Power BI"""
    try:
        from sqlalchemy import func
        
        # Contar usuarios por rol
        users_by_role = db.query(
            models.Role.role_name,
            func.count(models.User.user_id).label('count')
        ).join(models.User).group_by(models.Role.role_name).all()
        
        # Contar asignaciones por estado
        assignments_by_status = db.query(
            models.CourseAssignment.assignment_status,
            func.count(models.CourseAssignment.course_assignment_id).label('count')
        ).group_by(models.CourseAssignment.assignment_status).all()
        
        # Cursos por tecnología
        courses_by_technology = db.query(
            models.Technology.technology_name,
            func.count(models.Course.course_id).label('count')
        ).join(models.Course).group_by(models.Technology.technology_name).all()
        
        # Totales generales
        total_users = db.query(models.User).count()
        total_courses = db.query(models.Course).count()
        total_assignments = db.query(models.CourseAssignment).count()
        total_technologies = db.query(models.Technology).count()
        
        return {
            "totals": {
                "users": total_users,
                "courses": total_courses,
                "assignments": total_assignments,
                "technologies": total_technologies
            },
            "users_by_role": [{"role": row[0], "count": row[1]} for row in users_by_role],
            "assignments_by_status": [{"status": row[0], "count": row[1]} for row in assignments_by_status],
            "courses_by_technology": [{"technology": row[0], "count": row[1]} for row in courses_by_technology]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener métricas: {str(e)}")

# Endpoint de prueba para verificar conexión con Turso
@app.get("/api/v1/powerbi/health-check", tags=["Power BI"], summary="Verificar conexión con base de datos")
def health_check_powerbi(db: Session = Depends(get_db)):
    """Verificar que la conexión con Turso funciona correctamente"""
    try:
        from sqlalchemy import text
        
        # Realizar una consulta simple
        result = db.execute(text("SELECT 1 as test")).fetchone()
        
        # Contar registros en tablas principales
        users_count = db.query(models.User).count()
        courses_count = db.query(models.Course).count()
        assignments_count = db.query(models.CourseAssignment).count()
        
        return {
            "status": "OK",
            "database": "Turso - Connected",
            "test_query": result[0] if result else None,
            "data_summary": {
                "users": users_count,
                "courses": courses_count,
                "assignments": assignments_count
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
@app.post("/api/v1/powerbi/create-test-data", tags=["Power BI"], summary="Crear datos de prueba para Power BI")
def create_test_data_for_powerbi(db: Session = Depends(get_db)):
    """Crear datos adicionales de prueba para visualización en Power BI"""
    try:
        created_items = []
        
        # Crear tecnologías adicionales
        technologies = [
            models.Technology(technology_name="Python"),
            models.Technology(technology_name="JavaScript"),
            models.Technology(technology_name="React"),
            models.Technology(technology_name="SQL"),
            models.Technology(technology_name="Power BI")
        ]
        
        for tech in technologies:
            existing = db.query(models.Technology).filter(models.Technology.technology_name == tech.technology_name).first()
            if not existing:
                db.add(tech)
        
        db.commit()
        
        # Crear modalidades adicionales
        modalities = [
            models.CourseModality(course_modality_name="Presencial"),
            models.CourseModality(course_modality_name="Virtual"),
            models.CourseModality(course_modality_name="Híbrido"),
            models.CourseModality(course_modality_name="Autoestudio")
        ]
        
        for modality in modalities:
            existing = db.query(models.CourseModality).filter(models.CourseModality.course_modality_name == modality.course_modality_name).first()
            if not existing:
                db.add(modality)
        
        db.commit()
        
        # Crear cursos de ejemplo
        from datetime import time
        
        courses = [
            models.Course(
                course_name="Fundamentos de Python",
                course_link="https://example.com/python",
                course_duration=time(40, 0),  # 40 horas
                technology_id=1,
                course_modality_id=1,
                course_credentials="Certificado de Programación Python"
            ),
            models.Course(
                course_name="JavaScript Avanzado",
                course_link="https://example.com/javascript",
                course_duration=time(30, 0),  # 30 horas
                technology_id=2,
                course_modality_id=2,
                course_credentials="Certificado JavaScript"
            ),
            models.Course(
                course_name="Power BI para Analistas",
                course_link="https://example.com/powerbi",
                course_duration=time(20, 0),  # 20 horas
                technology_id=5,
                course_modality_id=3,
                course_credentials="Certificado Power BI"
            )
        ]
        
        for course in courses:
            existing = db.query(models.Course).filter(models.Course.course_name == course.course_name).first()
            if not existing:
                db.add(course)
        
        db.commit()
        created_items.append("Datos de prueba creados para Power BI")
        
        return {
            "message": "Datos de prueba creados exitosamente",
            "details": created_items
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando datos de prueba: {str(e)}")
    
# ===============================================
# ENDPOINTS PARA TURSO Y POWER BI
# ===============================================

import requests
import asyncio
from typing import Dict, Any

# ===============================================
# ENDPOINTS PARA TURSO Y POWER BI (SIMPLIFICADO)
# ===============================================

import requests
import asyncio
from typing import Dict, Any

# ===============================================
# ENDPOINTS PARA TURSO Y POWER BI (CORREGIDO)
# ===============================================

# Configuración correcta de Turso
TURSO_DATABASE_URL = "https://app-dev-akira-jeffersonvegag.aws-us-east-1.turso.io"
TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTE1MTQ2NjYsImlkIjoiZWUyMzY1ZDUtOTJjMi00Nzk2LThiNzMtN2VkMGUxM2RkYWYxIiwicmlkIjoiMjVlZmJlNGEtNzBiYS00MDc4LTg0YTctZWViNGY4YjQ1MmQ1In0.78a5Alyo26j0m6CLeuY8LrePZFhnNvhs_gi-U8GWeocyRiFKKEY9sIUkxtexEk5bNkFE5w1Fd0YjYXOE_xz3Bw"

def execute_turso_query(sql_query: str, parameters: list = None):
    """Ejecutar consulta en Turso usando la API v2/pipeline correcta"""
    try:
        url = f"{TURSO_DATABASE_URL}/v2/pipeline"
        
        headers = {
            "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
        
        # Formato correcto según la documentación de Turso
        stmt_object = {
            "sql": sql_query
        }
        
        # Agregar parámetros si existen - TODOS LOS VALUES COMO STRING
        if parameters:
            stmt_object["args"] = []
            for param in parameters:
                if param is None:
                    stmt_object["args"].append({"type": "null"})
                elif isinstance(param, bool):
                    stmt_object["args"].append({"type": "integer", "value": "1" if param else "0"})
                elif isinstance(param, int):
                    stmt_object["args"].append({"type": "integer", "value": str(param)})
                elif isinstance(param, float):
                    stmt_object["args"].append({"type": "float", "value": str(param)})
                else:
                    # Para strings y todo lo demás
                    stmt_object["args"].append({"type": "text", "value": str(param)})
        
        payload = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": stmt_object
                },
                {
                    "type": "close"
                }
            ]
        }
        
        print(f"Enviando a Turso: {json.dumps(payload, indent=2)}")  # Debug
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Respuesta de Turso: {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.text}")
        else:
            print("✅ Consulta exitosa!")
        
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            return None
            
    except Exception as e:
        print(f"Error ejecutando consulta en Turso: {e}")
        return None
    
@app.get("/api/v1/turso/test", tags=["Turso"], summary="Probar conexión con Turso")
def test_turso_connection():
    """Probar la conexión con Turso usando la API correcta"""
    try:
        result = execute_turso_query("SELECT 1 as test, datetime('now') as current_time")
        
        if result:
            return {
                "status": "OK",
                "message": "Conexión exitosa con Turso",
                "response": result
            }
        else:
            return {
                "status": "ERROR",
                "message": "No se pudo conectar con Turso"
            }
            
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Error conectando con Turso: {str(e)}"
        }

@app.post("/api/v1/turso/create-tables", tags=["Turso"], summary="Crear tablas en Turso")
def create_turso_tables():
    """Crear las tablas necesarias en Turso"""
    try:
        # Comandos para crear las tablas
        create_commands = [
            """CREATE TABLE IF NOT EXISTS per_c_gender (
                gender_id INTEGER PRIMARY KEY,
                gender_name TEXT NOT NULL,
                gender_status TEXT DEFAULT 'A',
                gender_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS per_c_role (
                role_id INTEGER PRIMARY KEY,
                role_name TEXT NOT NULL,
                role_description TEXT NOT NULL,
                role_status TEXT DEFAULT 'A',
                role_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_m_user_position (
                user_position_id INTEGER PRIMARY KEY,
                position_name TEXT NOT NULL,
                position_status TEXT DEFAULT 'A',
                user_position_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS per_m_person (
                person_id INTEGER PRIMARY KEY,
                person_dni INTEGER UNIQUE NOT NULL,
                person_first_name TEXT NOT NULL,
                person_last_name TEXT NOT NULL,
                person_gender INTEGER,
                person_email TEXT UNIQUE NOT NULL,
                person_status TEXT DEFAULT 'A',
                person_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS per_m_user (
                user_id INTEGER PRIMARY KEY,
                user_username TEXT UNIQUE NOT NULL,
                user_password TEXT NOT NULL,
                person_id INTEGER NOT NULL,
                user_role INTEGER NOT NULL,
                user_position_id INTEGER NOT NULL,
                user_status TEXT DEFAULT 'A',
                user_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_m_technology (
                technology_id INTEGER PRIMARY KEY,
                technology_name TEXT NOT NULL,
                technology_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_c_course_modality (
                course_modality_id INTEGER PRIMARY KEY,
                course_modality_name TEXT NOT NULL,
                course_modality_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_m_course (
                course_id INTEGER PRIMARY KEY,
                course_name TEXT NOT NULL,
                course_link TEXT NOT NULL,
                course_duration TEXT,
                technology_id INTEGER,
                course_modality_id INTEGER,
                course_credentials TEXT DEFAULT '',
                course_created_at TEXT
            )"""
        ]
        
        # Ejecutar cada comando
        results = []
        for i, command in enumerate(create_commands):
            result = execute_turso_query(command)
            results.append({
                "table": i + 1,
                "success": result is not None,
                "result": result
            })
        
        return {
            "message": "Tablas creadas en Turso",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando tablas: {str(e)}")

@app.post("/api/v1/turso/sync-data", tags=["Turso"], summary="Sincronizar datos locales con Turso")
def sync_data_to_turso(db: Session = Depends(get_db)):
    """Sincronizar todos los datos locales con Turso"""
    try:
        results = {"success": [], "errors": []}
        
        # Primero limpiar las tablas de Turso
        execute_turso_query("DELETE FROM per_m_user")
        execute_turso_query("DELETE FROM per_m_person") 
        execute_turso_query("DELETE FROM acd_m_user_position")
        execute_turso_query("DELETE FROM per_c_role")
        execute_turso_query("DELETE FROM per_c_gender")
        
        # Sincronizar géneros
        genders = db.query(models.Gender).all()
        for gender in genders:
            query = "INSERT INTO per_c_gender (gender_id, gender_name, gender_status, gender_created_at) VALUES (?, ?, ?, ?)"
            params = [
                gender.gender_id,
                gender.gender_name,
                gender.gender_status,
                gender.gender_created_at.isoformat() if gender.gender_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Gender {gender.gender_name}")
            else:
                results["errors"].append(f"Gender {gender.gender_name}")
        
        # Sincronizar roles
        roles = db.query(models.Role).all()
        for role in roles:
            query = "INSERT INTO per_c_role (role_id, role_name, role_description, role_status, role_created_at) VALUES (?, ?, ?, ?, ?)"
            params = [
                role.role_id,
                role.role_name,
                role.role_description,
                role.role_status,
                role.role_created_at.isoformat() if role.role_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Role {role.role_name}")
            else:
                results["errors"].append(f"Role {role.role_name}")
        
        # Sincronizar posiciones
        positions = db.query(models.UserPosition).all()
        for position in positions:
            query = "INSERT INTO acd_m_user_position (user_position_id, position_name, position_status, user_position_created_at) VALUES (?, ?, ?, ?)"
            params = [
                position.user_position_id,
                position.position_name,
                position.position_status,
                position.user_position_created_at.isoformat() if position.user_position_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Position {position.position_name}")
            else:
                results["errors"].append(f"Position {position.position_name}")
        
        # Sincronizar personas
        persons = db.query(models.Person).all()
        for person in persons:
            query = "INSERT INTO per_m_person (person_id, person_dni, person_first_name, person_last_name, person_gender, person_email, person_status, person_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                person.person_id,
                person.person_dni,
                person.person_first_name,
                person.person_last_name,
                person.person_gender,
                person.person_email,
                person.person_status,
                person.person_created_at.isoformat() if person.person_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Person {person.person_first_name}")
            else:
                results["errors"].append(f"Person {person.person_first_name}")
        
        # Sincronizar usuarios
        users = db.query(models.User).all()
        for user in users:
            query = "INSERT INTO per_m_user (user_id, user_username, user_password, person_id, user_role, user_position_id, user_status, user_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                user.user_id,
                user.user_username,
                user.user_password,
                user.person_id,
                user.user_role,
                user.user_position_id,
                user.user_status,
                user.user_created_at.isoformat() if user.user_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"User {user.user_username}")
            else:
                results["errors"].append(f"User {user.user_username}")
        
        return {
            "message": "Sincronización completada",
            "details": results,
            "totals": {
                "success": len(results["success"]),
                "errors": len(results["errors"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sincronizando datos: {str(e)}")

@app.get("/api/v1/turso/query-data", tags=["Turso"], summary="Consultar datos en Turso")
def query_turso_data(table: str = "per_m_person"):
    """Consultar datos directamente en Turso"""
    try:
        # Consultas válidas por tabla
        valid_queries = {
            "per_m_person": "SELECT * FROM per_m_person LIMIT 10",
            "per_m_user": "SELECT * FROM per_m_user LIMIT 10", 
            "per_c_gender": "SELECT * FROM per_c_gender",
            "per_c_role": "SELECT * FROM per_c_role",
            "acd_m_user_position": "SELECT * FROM acd_m_user_position"
        }
        
        if table not in valid_queries:
            raise HTTPException(status_code=400, detail=f"Tabla no válida. Tablas disponibles: {list(valid_queries.keys())}")
        
        result = execute_turso_query(valid_queries[table])
        
        return {
            "table": table,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Turso: {str(e)}")

@app.get("/api/v1/powerbi/turso-data", tags=["Power BI"], summary="Datos desde Turso para Power BI")
def get_turso_data_for_powerbi():
    """Obtener datos desde Turso formateados para Power BI"""
    try:
        # Consulta para obtener datos completos de usuarios
        query = """
        SELECT 
            u.user_id,
            u.user_username as username,
            p.person_first_name as first_name,
            p.person_last_name as last_name,
            p.person_email as email,
            p.person_dni as dni,
            g.gender_name,
            r.role_name,
            r.role_description,
            pos.position_name,
            u.user_status,
            u.user_created_at
        FROM per_m_user u
        LEFT JOIN per_m_person p ON u.person_id = p.person_id
        LEFT JOIN per_c_gender g ON p.person_gender = g.gender_id
        LEFT JOIN per_c_role r ON u.user_role = r.role_id
        LEFT JOIN acd_m_user_position pos ON u.user_position_id = pos.user_position_id
        """
        
        result = execute_turso_query(query)
        
        if result and result.get("result") and result["result"].get("rows"):
            rows = result["result"]["rows"]
            
            # Convertir a formato JSON para Power BI
            data = []
            for row in rows:
                data.append({
                    "user_id": row[0],
                    "username": row[1], 
                    "first_name": row[2],
                    "last_name": row[3],
                    "email": row[4],
                    "dni": row[5],
                    "gender_name": row[6],
                    "role_name": row[7],
                    "role_description": row[8],
                    "position_name": row[9],
                    "user_status": row[10],
                    "user_created_at": row[11]
                })
            
            return data
        else:
            return []
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos de Turso: {str(e)}")

@app.get("/api/v1/turso/test-simple", tags=["Turso"], summary="Prueba simple con Turso")
def test_turso_simple():
    """Prueba muy simple con Turso"""
    try:
        # Primero probar sin parámetros
        result1 = execute_turso_query("SELECT 1 as test, 'hello' as message")
        
        # Luego probar con parámetros de diferentes tipos
        result2 = execute_turso_query(
            "SELECT ? as text_param, ? as int_param, ? as null_param", 
            ["hello world", 123, None]
        )
        
        return {
            "status": "OK",
            "test_without_params": result1,
            "test_with_params": result2,
            "message": "Ambas pruebas completadas"
        }
            
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Exception: {str(e)}"
        }
    
@app.post("/api/v1/turso/test-insert", tags=["Turso"], summary="Probar inserción simple")
def test_turso_insert():
    """Probar insertar un registro simple en Turso"""
    try:
        # Primero crear la tabla de prueba
        create_result = execute_turso_query("""
            CREATE TABLE IF NOT EXISTS test_table (
                id INTEGER PRIMARY KEY,
                name TEXT,
                value INTEGER
            )
        """)
        
        print(f"Crear tabla: {create_result}")
        
        # Luego insertar un registro
        insert_result = execute_turso_query(
            "INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)", 
            [1, "test", 42]
        )
        
        print(f"Insertar: {insert_result}")
        
        # Verificar que se insertó
        select_result = execute_turso_query("SELECT * FROM test_table")
        
        print(f"Seleccionar: {select_result}")
        
        return {
            "status": "OK",
            "create_table": create_result,
            "insert": insert_result,
            "select": select_result
        }
        
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Error: {str(e)}"
        }
@app.post("/api/v1/turso/test-insert-fixed", tags=["Turso"], summary="Probar inserción con valores como string")
def test_turso_insert_fixed():
    """Probar insertar con todos los valores como string"""
    try:
        # Limpiar tabla de prueba
        execute_turso_query("DROP TABLE IF EXISTS test_table")
        
        # Crear tabla
        create_result = execute_turso_query("""
            CREATE TABLE test_table (
                id INTEGER PRIMARY KEY,
                name TEXT,
                value INTEGER
            )
        """)
        
        # Insertar con valores como strings
        insert_result = execute_turso_query(
            "INSERT INTO test_table (id, name, value) VALUES (?, ?, ?)", 
            [1, "test", 42]  # Serán convertidos a string automáticamente
        )
        
        # Verificar inserción
        select_result = execute_turso_query("SELECT * FROM test_table")
        
        return {
            "status": "OK",
            "create_table": create_result,
            "insert": insert_result,
            "select": select_result,
            "message": "Prueba con valores como string"
        }
        
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)