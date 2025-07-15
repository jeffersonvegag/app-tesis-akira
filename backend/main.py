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
    {"name": "Power BI Analytics", "description": "Endpoints para gráficas y análisis de Power BI"},
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
                models.Person(person_dni=1234567892, person_first_name="Maria", person_last_name="Supervisor", person_gender=2, person_email="supervisor@viamatica.com"),
                models.Person(person_dni=1234567893, person_first_name="Carlos", person_last_name="Instructor", person_gender=1, person_email="instructor@viamatica.com")
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
                models.User(user_username="cliente", user_password=pwd_context.hash("cli123"), person_id=3, user_role=3, user_position_id=1),
                models.User(user_username="instructor", user_password=pwd_context.hash("ins123"), person_id=4, user_role=4, user_position_id=2)
            ]
            db.add_all(users)
            db.commit()
            created_items.append(f"Creados {len(users)} usuarios")
        else:
            # Verificar si existe el usuario instructor
            instructor_user = db.query(models.User).filter(models.User.user_username == "instructor").first()
            if not instructor_user:
                # Crear persona instructor si no existe
                instructor_person = db.query(models.Person).filter(models.Person.person_dni == 1234567893).first()
                if not instructor_person:
                    instructor_person = models.Person(
                        person_dni=1234567893, 
                        person_first_name="Carlos", 
                        person_last_name="Instructor", 
                        person_gender=1, 
                        person_email="instructor@viamatica.com"
                    )
                    db.add(instructor_person)
                    db.commit()
                    db.refresh(instructor_person)
                
                # Crear usuario instructor
                instructor_user = models.User(
                    user_username="instructor", 
                    user_password=pwd_context.hash("ins123"), 
                    person_id=instructor_person.person_id, 
                    user_role=4, 
                    user_position_id=2
                )
                db.add(instructor_user)
                db.commit()
                created_items.append("Creado usuario instructor faltante")
            
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
            )""",
            """CREATE TABLE IF NOT EXISTS acd_m_training (
                training_id INTEGER PRIMARY KEY,
                training_name TEXT NOT NULL,
                training_description TEXT,
                training_status TEXT DEFAULT 'A',
                training_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_training_technology (
                training_technology_id INTEGER PRIMARY KEY,
                training_id INTEGER NOT NULL,
                technology_id INTEGER NOT NULL,
                created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_user_training_assignment (
                assignment_id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                training_id INTEGER NOT NULL,
                instructor_id INTEGER,
                assignment_status TEXT DEFAULT 'assigned',
                assignment_created_at TEXT,
                completion_percentage REAL DEFAULT 0.00,
                instructor_meeting_link TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_user_training_status (
                status_id INTEGER PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                total_trainings_assigned INTEGER DEFAULT 0,
                trainings_completed INTEGER DEFAULT 0,
                trainings_in_progress INTEGER DEFAULT 0,
                overall_status TEXT DEFAULT 'no_training',
                last_updated TEXT,
                created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_user_technology_progress (
                progress_id INTEGER PRIMARY KEY,
                assignment_id INTEGER NOT NULL,
                technology_id INTEGER NOT NULL,
                is_completed TEXT DEFAULT 'N',
                completed_at TEXT,
                created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_m_career_plan (
                career_plan_id INTEGER PRIMARY KEY,
                course_id INTEGER NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_user_career_plan (
                user_career_plan_id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                career_plan_id INTEGER NOT NULL,
                career_plan_status TEXT DEFAULT 'P',
                user_career_plan_created_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS acd_t_course_assignment (
                course_assignment_id INTEGER PRIMARY KEY,
                course_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                instructor_id INTEGER,
                assignment_status TEXT DEFAULT 'P',
                assignment_created_at TEXT,
                assignment_start_date TEXT,
                assignment_end_date TEXT
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
        
        # Primero limpiar las tablas de Turso (orden importante por FK)
        execute_turso_query("DELETE FROM acd_t_user_technology_progress")
        execute_turso_query("DELETE FROM acd_t_user_training_assignment")
        execute_turso_query("DELETE FROM acd_t_user_training_status")
        execute_turso_query("DELETE FROM acd_t_user_career_plan")
        execute_turso_query("DELETE FROM acd_t_course_assignment")
        execute_turso_query("DELETE FROM acd_m_career_plan")
        execute_turso_query("DELETE FROM acd_t_training_technology")
        execute_turso_query("DELETE FROM acd_m_training")
        execute_turso_query("DELETE FROM acd_m_course")
        execute_turso_query("DELETE FROM acd_c_course_modality")
        execute_turso_query("DELETE FROM acd_m_technology")
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

        # Sincronizar tecnologías
        technologies = db.query(models.Technology).all()
        for tech in technologies:
            query = "INSERT INTO acd_m_technology (technology_id, technology_name, technology_created_at) VALUES (?, ?, ?)"
            params = [
                tech.technology_id,
                tech.technology_name,
                tech.technology_created_at.isoformat() if tech.technology_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Technology {tech.technology_name}")
            else:
                results["errors"].append(f"Technology {tech.technology_name}")

        # Sincronizar modalidades de curso
        modalities = db.query(models.CourseModality).all()
        for modality in modalities:
            query = "INSERT INTO acd_c_course_modality (course_modality_id, course_modality_name, course_modality_created_at) VALUES (?, ?, ?)"
            params = [
                modality.course_modality_id,
                modality.course_modality_name,
                modality.course_modality_created_at.isoformat() if modality.course_modality_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Modality {modality.course_modality_name}")
            else:
                results["errors"].append(f"Modality {modality.course_modality_name}")

        # Sincronizar cursos
        courses = db.query(models.Course).all()
        for course in courses:
            # Convertir time a string para Turso
            duration_str = str(course.course_duration) if course.course_duration else None
            query = "INSERT INTO acd_m_course (course_id, course_name, course_link, course_duration, technology_id, course_modality_id, course_credentials, course_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                course.course_id,
                course.course_name,
                course.course_link,
                duration_str,
                course.technology_id,
                course.course_modality_id,
                course.course_credentials,
                course.course_created_at.isoformat() if course.course_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Course {course.course_name[:50]}...")
            else:
                results["errors"].append(f"Course {course.course_name[:50]}...")

        # Sincronizar capacitaciones
        trainings = db.query(models.Training).all()
        for training in trainings:
            query = "INSERT INTO acd_m_training (training_id, training_name, training_description, training_status, training_created_at) VALUES (?, ?, ?, ?, ?)"
            params = [
                training.training_id,
                training.training_name,
                training.training_description,
                training.training_status,
                training.training_created_at.isoformat() if training.training_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Training {training.training_name}")
            else:
                results["errors"].append(f"Training {training.training_name}")

        # Sincronizar relaciones capacitación-tecnología
        training_techs = db.query(models.TrainingTechnology).all()
        for tt in training_techs:
            query = "INSERT INTO acd_t_training_technology (training_technology_id, training_id, technology_id, created_at) VALUES (?, ?, ?, ?)"
            params = [
                tt.training_technology_id,
                tt.training_id,
                tt.technology_id,
                tt.created_at.isoformat() if tt.created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"TrainingTech {tt.training_technology_id}")
            else:
                results["errors"].append(f"TrainingTech {tt.training_technology_id}")

        # Sincronizar asignaciones de capacitación
        assignments = db.query(models.UserTrainingAssignment).all()
        for assignment in assignments:
            query = "INSERT INTO acd_t_user_training_assignment (assignment_id, user_id, training_id, instructor_id, assignment_status, assignment_created_at, completion_percentage, instructor_meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                assignment.assignment_id,
                assignment.user_id,
                assignment.training_id,
                assignment.instructor_id,
                assignment.assignment_status,
                assignment.assignment_created_at.isoformat() if assignment.assignment_created_at else None,
                float(assignment.completion_percentage) if assignment.completion_percentage else 0.0,
                assignment.instructor_meeting_link
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Assignment {assignment.assignment_id}")
            else:
                results["errors"].append(f"Assignment {assignment.assignment_id}")

        # Sincronizar estados de capacitación de usuarios
        statuses = db.query(models.UserTrainingStatus).all()
        for status in statuses:
            query = "INSERT INTO acd_t_user_training_status (status_id, user_id, total_trainings_assigned, trainings_completed, trainings_in_progress, overall_status, last_updated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                status.status_id,
                status.user_id,
                status.total_trainings_assigned,
                status.trainings_completed,
                status.trainings_in_progress,
                status.overall_status,
                status.last_updated.isoformat() if status.last_updated else None,
                status.created_at.isoformat() if status.created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"UserStatus {status.user_id}")
            else:
                results["errors"].append(f"UserStatus {status.user_id}")

        # Sincronizar progreso de tecnología por usuario
        progresses = db.query(models.UserTechnologyProgress).all()
        for progress in progresses:
            query = "INSERT INTO acd_t_user_technology_progress (progress_id, assignment_id, technology_id, is_completed, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            params = [
                progress.progress_id,
                progress.assignment_id,
                progress.technology_id,
                progress.is_completed,
                progress.completed_at.isoformat() if progress.completed_at else None,
                progress.created_at.isoformat() if progress.created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"Progress {progress.progress_id}")
            else:
                results["errors"].append(f"Progress {progress.progress_id}")

        # Sincronizar planes de carrera
        career_plans = db.query(models.CareerPlan).all()
        for cp in career_plans:
            query = "INSERT INTO acd_m_career_plan (career_plan_id, course_id) VALUES (?, ?)"
            params = [cp.career_plan_id, cp.course_id]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"CareerPlan {cp.career_plan_id}")
            else:
                results["errors"].append(f"CareerPlan {cp.career_plan_id}")

        # Sincronizar asignaciones de planes de carrera
        user_career_plans = db.query(models.UserCareerPlan).all()
        for ucp in user_career_plans:
            query = "INSERT INTO acd_t_user_career_plan (user_career_plan_id, user_id, career_plan_id, career_plan_status, user_career_plan_created_at) VALUES (?, ?, ?, ?, ?)"
            params = [
                ucp.user_career_plan_id,
                ucp.user_id,
                ucp.career_plan_id,
                ucp.career_plan_status,
                ucp.user_career_plan_created_at.isoformat() if ucp.user_career_plan_created_at else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"UserCareerPlan {ucp.user_career_plan_id}")
            else:
                results["errors"].append(f"UserCareerPlan {ucp.user_career_plan_id}")

        # Sincronizar asignaciones de cursos (CourseAssignment)
        course_assignments = db.query(models.CourseAssignment).all()
        for ca in course_assignments:
            query = "INSERT INTO acd_t_course_assignment (course_assignment_id, course_id, client_id, instructor_id, assignment_status, assignment_created_at, assignment_start_date, assignment_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            params = [
                ca.course_assignment_id,
                ca.course_id,
                ca.client_id,
                ca.instructor_id,
                ca.assignment_status,
                ca.assignment_created_at.isoformat() if ca.assignment_created_at else None,
                ca.assignment_start_date.isoformat() if ca.assignment_start_date else None,
                ca.assignment_end_date.isoformat() if ca.assignment_end_date else None
            ]
            result = execute_turso_query(query, params)
            if result:
                results["success"].append(f"CourseAssignment {ca.course_assignment_id}")
            else:
                results["errors"].append(f"CourseAssignment {ca.course_assignment_id}")
        
        return {
            "message": "Sincronización completada - Todas las tablas incluidas",
            "details": results,
            "totals": {
                "success": len(results["success"]),
                "errors": len(results["errors"])
            },
            "tables_synced": [
                "per_c_gender", "per_c_role", "acd_m_user_position", "per_m_person", "per_m_user",
                "acd_m_technology", "acd_c_course_modality", "acd_m_course", "acd_m_training",
                "acd_t_training_technology", "acd_t_user_training_assignment", "acd_t_user_training_status",
                "acd_t_user_technology_progress", "acd_m_career_plan", "acd_t_user_career_plan",
                "acd_t_course_assignment"
            ]
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
            "acd_m_user_position": "SELECT * FROM acd_m_user_position",
            "acd_m_technology": "SELECT * FROM acd_m_technology LIMIT 10",
            "acd_c_course_modality": "SELECT * FROM acd_c_course_modality",
            "acd_m_course": "SELECT * FROM acd_m_course LIMIT 10",
            "acd_m_training": "SELECT * FROM acd_m_training LIMIT 10",
            "acd_t_training_technology": "SELECT * FROM acd_t_training_technology LIMIT 10",
            "acd_t_user_training_assignment": "SELECT * FROM acd_t_user_training_assignment LIMIT 10",
            "acd_t_user_training_status": "SELECT * FROM acd_t_user_training_status LIMIT 10",
            "acd_t_user_technology_progress": "SELECT * FROM acd_t_user_technology_progress LIMIT 10",
            "acd_m_career_plan": "SELECT * FROM acd_m_career_plan LIMIT 10",
            "acd_t_user_career_plan": "SELECT * FROM acd_t_user_career_plan LIMIT 10",
            "acd_t_course_assignment": "SELECT * FROM acd_t_course_assignment LIMIT 10"
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

@app.post("/api/v1/generar_cursos-capacitaciones", tags=["System"], summary="Generar tecnologías y capacitaciones masivamente")
def generate_technologies_and_trainings(db: Session = Depends(get_db)):
    """
    Generar las 40 tecnologías y 15 capacitaciones de forma masiva.
    Este endpoint crea todas las tecnologías y capacitaciones con sus relaciones.
    """
    try:
        # 50 Tecnologías (actualizada)
        technologies_data = [
            "Rust", "Go (Golang)", "Python", "JavaScript", "TypeScript", "PHP", "Ruby", "Java", "Kotlin", "Elixir",
            "Swift", "C#", "Django", "Flask", "FastAPI", "Node.js", "Express.js", "NestJS", "Spring Boot",
            "Ruby on Rails", "Laravel", "Phoenix", "Actix-Web", "Gin", "Fiber", "PostgreSQL", "MySQL", "MariaDB",
            "MongoDB", "Redis", "SQLite", "Cassandra", "Firebase", "React", "Vue.js", "Angular", "Svelte",
            "Next.js", "Nuxt.js", "Astro", "Docker", "Kubernetes", "Terraform", "AWS", "Google Cloud Platform",
            "Azure", "Jenkins", "GitHub Actions", "Ansible", "Jest", "Git", "JWT", "OWASP", "Cypress", "Selenium"
        ]
        
        # 15 Capacitaciones con sus tecnologías asociadas
        trainings_data = [
            {
                "name": "Control de Versiones & CI/CD",
                "description": "Manejo profesional de código con Git y automatización",
                "technologies": ["Git", "GitHub Actions", "Jenkins"]
            },
            {
                "name": "Bases de Datos SQL Avanzadas",
                "description": "Administración y optimización de bases de datos relacionales",
                "technologies": ["PostgreSQL", "MySQL", "MariaDB", "SQLite"]
            },
            {
                "name": "Backend con JavaScript/TypeScript",
                "description": "Desarrollo backend moderno con Node.js",
                "technologies": ["Node.js", "Express.js", "NestJS", "TypeScript", "JavaScript"]
            },
            {
                "name": "Python Backend Completo",
                "description": "Desarrollo backend con Python y frameworks modernos",
                "technologies": ["Django", "FastAPI", "Flask", "Python", "PostgreSQL"]
            },
            {
                "name": "Rust & Go para Backend",
                "description": "Desarrollo de alta performance con Rust y Go",
                "technologies": ["Rust", "Actix-Web", "Go (Golang)", "Gin", "Fiber"]
            },
            {
                "name": "Bases de Datos NoSQL",
                "description": "Modelado y gestión de datos no relacionales",
                "technologies": ["MongoDB", "Redis", "Cassandra", "Firebase"]
            },
            {
                "name": "DevOps & Cloud",
                "description": "Infraestructura como código y despliegue en la nube",
                "technologies": ["Docker", "Kubernetes", "AWS", "Terraform", "Ansible"]
            },
            {
                "name": "Frontend Moderno",
                "description": "Desarrollo frontend con las últimas tecnologías",
                "technologies": ["React", "Next.js", "TypeScript", "JavaScript"]
            },
            {
                "name": "PHP & Laravel",
                "description": "Desarrollo web con PHP y el framework Laravel",
                "technologies": ["PHP", "Laravel", "MySQL"]
            },
            {
                "name": "Microservicios con Go",
                "description": "Arquitectura de microservicios escalable",
                "technologies": ["Go (Golang)", "Gin", "Docker", "Kubernetes"]
            },
            {
                "name": "Testing & QA Automatizado",
                "description": "Pruebas automatizadas y aseguramiento de calidad",
                "technologies": ["Jest", "Cypress", "Selenium", "GitHub Actions", "Docker"]
            },
            {
                "name": "Seguridad Web",
                "description": "Implementación de seguridad en aplicaciones web",
                "technologies": ["OWASP", "JWT", "Node.js", "Python"]
            },
            {
                "name": "Serverless & Cloud Functions",
                "description": "Desarrollo sin servidor en la nube",
                "technologies": ["AWS", "Azure", "Google Cloud Platform", "JavaScript"]
            },
            {
                "name": "GraphQL Moderno",
                "description": "APIs modernas con GraphQL",
                "technologies": ["Node.js", "MongoDB", "TypeScript"]
            },
            {
                "name": "Elixir & Phoenix",
                "description": "Desarrollo funcional escalable con Elixir",
                "technologies": ["Elixir", "Phoenix", "PostgreSQL"]
            }
        ]
        
        results = {"technologies": [], "trainings": [], "relations": []}
        
        # Insertar tecnologías
        tech_id_map = {}
        for tech_name in technologies_data:
            # Verificar si ya existe
            existing_tech = db.query(models.Technology).filter(models.Technology.technology_name == tech_name).first()
            if not existing_tech:
                new_tech = models.Technology(technology_name=tech_name)
                db.add(new_tech)
                db.commit()
                db.refresh(new_tech)
                tech_id_map[tech_name] = new_tech.technology_id
                results["technologies"].append(f"Creada: {tech_name}")
            else:
                tech_id_map[tech_name] = existing_tech.technology_id
                results["technologies"].append(f"Ya existe: {tech_name}")
        
        # Insertar capacitaciones y relaciones
        for training_data in trainings_data:
            # Verificar si ya existe la capacitación
            existing_training = db.query(models.Training).filter(models.Training.training_name == training_data["name"]).first()
            if not existing_training:
                new_training = models.Training(
                    training_name=training_data["name"],
                    training_description=training_data["description"]
                )
                db.add(new_training)
                db.commit()
                db.refresh(new_training)
                training_id = new_training.training_id
                results["trainings"].append(f"Creada: {training_data['name']}")
            else:
                training_id = existing_training.training_id
                results["trainings"].append(f"Ya existe: {training_data['name']}")
            
            # Crear relaciones con tecnologías
            for tech_name in training_data["technologies"]:
                if tech_name in tech_id_map:
                    # Verificar si la relación ya existe
                    existing_relation = db.query(models.TrainingTechnology).filter(
                        models.TrainingTechnology.training_id == training_id,
                        models.TrainingTechnology.technology_id == tech_id_map[tech_name]
                    ).first()
                    
                    if not existing_relation:
                        new_relation = models.TrainingTechnology(
                            training_id=training_id,
                            technology_id=tech_id_map[tech_name]
                        )
                        db.add(new_relation)
                        results["relations"].append(f"Relacionado: {training_data['name']} -> {tech_name}")
                    else:
                        results["relations"].append(f"Ya existe relación: {training_data['name']} -> {tech_name}")
        
        db.commit()
        
        # Sincronizar con Turso
        try:
            # Crear tablas de capacitaciones en Turso si no existen
            create_training_table = execute_turso_query("""
                CREATE TABLE IF NOT EXISTS acd_m_training (
                    training_id INTEGER PRIMARY KEY,
                    training_name TEXT NOT NULL,
                    training_description TEXT,
                    training_status TEXT DEFAULT 'A',
                    training_created_at TEXT
                )
            """)
            
            create_training_tech_table = execute_turso_query("""
                CREATE TABLE IF NOT EXISTS acd_t_training_technology (
                    training_technology_id INTEGER PRIMARY KEY,
                    training_id INTEGER NOT NULL,
                    technology_id INTEGER NOT NULL,
                    created_at TEXT
                )
            """)
            
            # Sincronizar tecnologías
            technologies = db.query(models.Technology).all()
            for tech in technologies:
                # Verificar si ya existe en Turso
                check_result = execute_turso_query(
                    "SELECT technology_id FROM acd_m_technology WHERE technology_name = ?",
                    [tech.technology_name]
                )
                
                if not check_result or not check_result.get("result", {}).get("rows"):
                    # No existe, insertar
                    execute_turso_query(
                        "INSERT INTO acd_m_technology (technology_id, technology_name, technology_created_at) VALUES (?, ?, ?)",
                        [tech.technology_id, tech.technology_name, tech.technology_created_at.isoformat() if tech.technology_created_at else None]
                    )
            
            # Sincronizar capacitaciones
            trainings = db.query(models.Training).all()
            for training in trainings:
                execute_turso_query(
                    "INSERT OR REPLACE INTO acd_m_training (training_id, training_name, training_description, training_status, training_created_at) VALUES (?, ?, ?, ?, ?)",
                    [training.training_id, training.training_name, training.training_description, training.training_status, training.training_created_at.isoformat() if training.training_created_at else None]
                )
            
            # Sincronizar relaciones
            relations = db.query(models.TrainingTechnology).all()
            for relation in relations:
                execute_turso_query(
                    "INSERT OR REPLACE INTO acd_t_training_technology (training_technology_id, training_id, technology_id, created_at) VALUES (?, ?, ?, ?)",
                    [relation.training_technology_id, relation.training_id, relation.technology_id, relation.created_at.isoformat() if relation.created_at else None]
                )
            
            results["turso_sync"] = "Datos sincronizados con Turso exitosamente"
            
        except Exception as turso_error:
            results["turso_sync"] = f"Error sincronizando con Turso: {str(turso_error)}"
        
        return {
            "message": "Tecnologías y capacitaciones generadas exitosamente",
            "summary": {
                "technologies_processed": len(technologies_data),
                "trainings_processed": len(trainings_data),
                "relations_created": len([r for r in results["relations"] if "Relacionado:" in r])
            },
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generando datos: {str(e)}")

# TRAINING ENDPOINTS
@app.get("/api/v1/trainings", response_model=List[schemas.Training], tags=["Trainings"], summary="Listar capacitaciones")
def read_trainings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todas las capacitaciones disponibles"""
    trainings = db.query(models.Training).offset(skip).limit(limit).all()
    return trainings

@app.post("/api/v1/trainings", response_model=schemas.Training, tags=["Trainings"], summary="Crear capacitación")
def create_training(training: schemas.TrainingCreate, db: Session = Depends(get_db)):
    """Crear una nueva capacitación"""
    db_training = models.Training(**training.dict())
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    return db_training

@app.get("/api/v1/trainings/{training_id}", response_model=schemas.Training, tags=["Trainings"], summary="Obtener capacitación por ID")
def read_training(training_id: int, db: Session = Depends(get_db)):
    """Obtener información detallada de una capacitación"""
    training = db.query(models.Training).filter(models.Training.training_id == training_id).first()
    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Capacitación no encontrada"
        )
    return training

@app.get("/api/v1/trainings/{training_id}/technologies", response_model=List[schemas.Technology], tags=["Trainings"], summary="Tecnologías de una capacitación")
def read_training_technologies(training_id: int, db: Session = Depends(get_db)):
    """Obtener todas las tecnologías asociadas a una capacitación"""
    training = db.query(models.Training).filter(models.Training.training_id == training_id).first()
    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Capacitación no encontrada"
        )
    
    # Obtener tecnologías a través de la tabla de relación
    technologies = db.query(models.Technology).join(
        models.TrainingTechnology, 
        models.Technology.technology_id == models.TrainingTechnology.technology_id
    ).filter(
        models.TrainingTechnology.training_id == training_id
    ).all()
    
    return technologies

# USER TRAINING ASSIGNMENT ENDPOINTS
@app.get("/api/v1/user-training-assignments", response_model=List[schemas.UserTrainingAssignment], tags=["User Training Assignments"], summary="Listar asignaciones de capacitaciones")
def read_user_training_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de todas las asignaciones de capacitaciones"""
    assignments = db.query(models.UserTrainingAssignment).offset(skip).limit(limit).all()
    return assignments

@app.post("/api/v1/user-training-assignments", response_model=schemas.UserTrainingAssignment, tags=["User Training Assignments"], summary="Crear asignación de capacitación")
def create_user_training_assignment(assignment: schemas.UserTrainingAssignmentCreate, db: Session = Depends(get_db)):
    """Crear una nueva asignación de capacitación a un usuario"""
    try:
        # Verificar que no exista ya una asignación para el mismo usuario y capacitación
        existing = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.user_id == assignment.user_id,
            models.UserTrainingAssignment.training_id == assignment.training_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya tiene asignada esta capacitación"
            )
        
        # Crear la asignación
        db_assignment = models.UserTrainingAssignment(**assignment.dict())
        db.add(db_assignment)
        db.commit()
        db.refresh(db_assignment)
        
        # Crear registros de progreso para cada tecnología de la capacitación
        training_technologies = db.query(models.TrainingTechnology).filter(
            models.TrainingTechnology.training_id == assignment.training_id
        ).all()
        
        for tech_relation in training_technologies:
            progress = models.UserTechnologyProgress(
                assignment_id=db_assignment.assignment_id,
                technology_id=tech_relation.technology_id,
                is_completed='N'
            )
            db.add(progress)
        
        db.commit()
        
        # Actualizar estado de capacitaciones del usuario
        update_user_training_status(assignment.user_id, db)
        
        return db_assignment
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando asignación: {str(e)}")

@app.get("/api/v1/user-training-assignments/user/{user_id}", response_model=List[schemas.UserTrainingAssignment], tags=["User Training Assignments"], summary="Obtener asignaciones por usuario")
def read_user_training_assignments_by_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener todas las asignaciones de capacitaciones de un usuario específico"""
    assignments = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.user_id == user_id
    ).all()
    return assignments

@app.put("/api/v1/user-training-assignments/{assignment_id}/meeting-link", response_model=schemas.UserTrainingAssignment, tags=["User Training Assignments"], summary="Actualizar enlace de reunión")
def update_meeting_link(assignment_id: int, meeting_link_data: dict, db: Session = Depends(get_db)):
    """Actualizar el enlace de reunión de una asignación"""
    assignment = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.assignment_id == assignment_id
    ).first()
    
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación no encontrada"
        )
    
    assignment.instructor_meeting_link = meeting_link_data.get('instructor_meeting_link')
    db.commit()
    db.refresh(assignment)
    
    return assignment

@app.put("/api/v1/user-training-assignments/training/{training_id}/instructor", tags=["User Training Assignments"], summary="Actualizar instructor de capacitación")
def update_training_instructor(training_id: int, request: dict, db: Session = Depends(get_db)):
    """Actualizar instructor para todas las asignaciones de una capacitación"""
    try:
        instructor_id = request.get("instructor_id")
        
        # Verificar que el instructor existe si se proporciona
        if instructor_id:
            instructor = db.query(models.User).filter(
                models.User.user_id == instructor_id,
                models.User.user_role == 4  # Rol instructor
            ).first()
            
            if not instructor:
                raise HTTPException(status_code=404, detail="Instructor no encontrado")
        
        # Actualizar todas las asignaciones de la capacitación
        assignments = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.training_id == training_id
        ).all()
        
        if not assignments:
            raise HTTPException(status_code=404, detail="No se encontraron asignaciones para esta capacitación")
        
        for assignment in assignments:
            assignment.instructor_id = instructor_id
        
        db.commit()
        
        return {
            "message": f"Instructor {'asignado' if instructor_id else 'removido'} exitosamente",
            "training_id": training_id,
            "instructor_id": instructor_id,
            "updated_assignments": len(assignments)
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error actualizando instructor: {str(e)}")

# USER TECHNOLOGY PROGRESS ENDPOINTS
@app.get("/api/v1/user-technology-progress/assignment/{assignment_id}", response_model=List[schemas.UserTechnologyProgress], tags=["User Technology Progress"], summary="Obtener progreso por asignación")
def read_user_technology_progress_by_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Obtener el progreso de tecnologías para una asignación específica"""
    progress = db.query(models.UserTechnologyProgress).filter(
        models.UserTechnologyProgress.assignment_id == assignment_id
    ).all()
    return progress

@app.put("/api/v1/user-technology-progress/{progress_id}", response_model=schemas.UserTechnologyProgress, tags=["User Technology Progress"], summary="Actualizar progreso de tecnología")
def update_user_technology_progress(progress_id: int, progress_data: schemas.UserTechnologyProgressUpdate, db: Session = Depends(get_db)):
    """Actualizar el estado de completitud de una tecnología"""
    try:
        progress = db.query(models.UserTechnologyProgress).filter(
            models.UserTechnologyProgress.progress_id == progress_id
        ).first()
        
        if progress is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Progreso no encontrado"
            )
        
        # Actualizar estado
        progress.is_completed = 'Y' if progress_data.is_completed else 'N'
        
        if progress_data.is_completed:
            progress.completed_at = datetime.now()
        else:
            progress.completed_at = None
        
        db.commit()
        
        # Recalcular porcentaje de completitud de la asignación
        assignment = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.assignment_id == progress.assignment_id
        ).first()
        
        if assignment:
            total_technologies = db.query(models.UserTechnologyProgress).filter(
                models.UserTechnologyProgress.assignment_id == progress.assignment_id
            ).count()
            
            completed_technologies = db.query(models.UserTechnologyProgress).filter(
                models.UserTechnologyProgress.assignment_id == progress.assignment_id,
                models.UserTechnologyProgress.is_completed == 'Y'
            ).count()
            
            if total_technologies > 0:
                completion_percentage = (completed_technologies / total_technologies) * 100
                assignment.completion_percentage = completion_percentage
                
                # Actualizar estado de la asignación
                if completion_percentage == 100:
                    assignment.assignment_status = 'completed'
                elif completion_percentage > 0:
                    assignment.assignment_status = 'in_progress'
                else:
                    assignment.assignment_status = 'assigned'
                
                db.commit()
                
                # Actualizar estado de capacitaciones del usuario
                update_user_training_status(assignment.user_id, db)
        
        db.refresh(progress)
        return progress
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error actualizando progreso: {str(e)}")

# Función auxiliar para actualizar estado de capacitaciones del usuario
def update_user_training_status(user_id: int, db: Session):
    """Actualizar estado de capacitaciones de un usuario"""
    try:
        # Obtener o crear estado del usuario
        user_status = db.query(models.UserTrainingStatus).filter(
            models.UserTrainingStatus.user_id == user_id
        ).first()
        
        if not user_status:
            user_status = models.UserTrainingStatus(user_id=user_id)
            db.add(user_status)
        
        # Contar asignaciones por estado
        assignments = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.user_id == user_id
        ).all()
        
        total_assigned = len(assignments)
        completed = len([a for a in assignments if a.assignment_status == 'completed'])
        in_progress = len([a for a in assignments if a.assignment_status == 'in_progress'])
        
        # Actualizar contadores
        user_status.total_trainings_assigned = total_assigned
        user_status.trainings_completed = completed
        user_status.trainings_in_progress = in_progress
        user_status.last_updated = datetime.now()
        
        # Determinar estado general
        if total_assigned == 0:
            user_status.overall_status = 'no_training'
        elif completed == total_assigned:
            user_status.overall_status = 'all_completed'
        elif in_progress > 0 or completed > 0:
            user_status.overall_status = 'in_progress'
        else:
            user_status.overall_status = 'assigned'
        
        db.commit()
        return user_status
        
    except Exception as e:
        db.rollback()
        raise e

# USER TRAINING STATUS ENDPOINTS
@app.get("/api/v1/user-training-status", response_model=List[schemas.UserTrainingStatus], tags=["User Training Status"], summary="Listar estados de capacitación")
def read_user_training_statuses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener estados de capacitación de todos los usuarios"""
    statuses = db.query(models.UserTrainingStatus).offset(skip).limit(limit).all()
    return statuses

@app.get("/api/v1/user-training-status/user/{user_id}", response_model=schemas.UserTrainingStatus, tags=["User Training Status"], summary="Obtener estado por usuario")
def read_user_training_status_by_user(user_id: int, db: Session = Depends(get_db)):
    """Obtener estado de capacitación de un usuario específico"""
    status = db.query(models.UserTrainingStatus).filter(
        models.UserTrainingStatus.user_id == user_id
    ).first()
    
    if not status:
        # Crear y retornar estado inicial
        status = update_user_training_status(user_id, db)
    
    return status

@app.put("/api/v1/user-training-status/refresh/{user_id}", response_model=schemas.UserTrainingStatus, tags=["User Training Status"], summary="Actualizar estado de usuario")
def refresh_user_training_status(user_id: int, db: Session = Depends(get_db)):
    """Recalcular y actualizar estado de capacitación de un usuario"""
    status = update_user_training_status(user_id, db)
    return status

# =====================================
# POWER BI ANALYTICS ENDPOINTS
# =====================================

@app.get("/api/v1/pro/powerbi/users/total-count", tags=["Power BI Analytics"], summary="Total de usuarios registrados")
def get_total_users_count(db: Session = Depends(get_db)):
    """Obtener el total de usuarios registrados en el sistema"""
    total = db.query(models.User).filter(models.User.user_status == 'A').count()
    return {"total_users": total, "metric": "total_count"}

@app.get("/api/v1/pro/powerbi/users/by-role", tags=["Power BI Analytics"], summary="Usuarios por rol")
def get_users_by_role(db: Session = Depends(get_db)):
    """Distribución de usuarios por rol"""
    result = db.query(
        models.Role.role_name,
        func.count(models.User.user_id).label('count')
    ).join(
        models.User, models.Role.role_id == models.User.user_role
    ).filter(
        models.User.user_status == 'A'
    ).group_by(
        models.Role.role_name
    ).all()
    
    return {
        "data": [{"role": r.role_name, "count": r.count} for r in result],
        "metric": "users_by_role"
    }

@app.get("/api/v1/pro/powerbi/users/by-gender", tags=["Power BI Analytics"], summary="Usuarios por género")
def get_users_by_gender(db: Session = Depends(get_db)):
    """Distribución de usuarios por género"""
    result = db.query(
        models.Gender.gender_name,
        func.count(models.User.user_id).label('count')
    ).join(
        models.Person, models.Gender.gender_id == models.Person.person_gender
    ).join(
        models.User, models.Person.person_id == models.User.person_id
    ).filter(
        models.User.user_status == 'A'
    ).group_by(
        models.Gender.gender_name
    ).all()
    
    return {
        "data": [{"gender": r.gender_name, "count": r.count} for r in result],
        "metric": "users_by_gender"
    }

@app.get("/api/v1/pro/powerbi/users/by-position", tags=["Power BI Analytics"], summary="Usuarios por posición")
def get_users_by_position(db: Session = Depends(get_db)):
    """Distribución de usuarios por posición laboral"""
    result = db.query(
        models.UserPosition.position_name,
        func.count(models.User.user_id).label('count')
    ).join(
        models.User, models.UserPosition.user_position_id == models.User.user_position_id
    ).filter(
        models.User.user_status == 'A'
    ).group_by(
        models.UserPosition.position_name
    ).all()
    
    return {
        "data": [{"position": r.position_name, "count": r.count} for r in result],
        "metric": "users_by_position"
    }

@app.get("/api/v1/pro/powerbi/courses/total-count", tags=["Power BI Analytics"], summary="Total de cursos disponibles")
def get_total_courses_count(db: Session = Depends(get_db)):
    """Obtener el total de cursos disponibles en el sistema"""
    total = db.query(models.Course).count()
    return {"total_courses": total, "metric": "total_count"}

@app.get("/api/v1/pro/powerbi/courses/by-technology", tags=["Power BI Analytics"], summary="Cursos por tecnología")
def get_courses_by_technology(db: Session = Depends(get_db)):
    """Distribución de cursos por tecnología"""
    result = db.query(
        models.Technology.technology_name,
        func.count(models.Course.course_id).label('count')
    ).join(
        models.Course, models.Technology.technology_id == models.Course.technology_id
    ).group_by(
        models.Technology.technology_name
    ).all()
    
    return {
        "data": [{"technology": r.technology_name, "count": r.count} for r in result],
        "metric": "courses_by_technology"
    }

@app.get("/api/v1/pro/powerbi/courses/by-modality", tags=["Power BI Analytics"], summary="Cursos por modalidad")
def get_courses_by_modality(db: Session = Depends(get_db)):
    """Distribución de cursos por modalidad (presencial, virtual, etc.)"""
    result = db.query(
        models.CourseModality.course_modality_name,
        func.count(models.Course.course_id).label('count')
    ).join(
        models.Course, models.CourseModality.course_modality_id == models.Course.course_modality_id
    ).group_by(
        models.CourseModality.course_modality_name
    ).all()
    
    return {
        "data": [{"modality": r.course_modality_name, "count": r.count} for r in result],
        "metric": "courses_by_modality"
    }

@app.get("/api/v1/pro/powerbi/trainings/enrollment-stats", tags=["Power BI Analytics"], summary="Estadísticas de inscripciones a capacitaciones")
def get_training_enrollment_stats(db: Session = Depends(get_db)):
    """Estadísticas de usuarios inscritos en capacitaciones"""
    # Total de usuarios con capacitaciones asignadas
    users_with_trainings = db.query(models.UserTrainingAssignment.user_id).distinct().count()
    
    # Total de usuarios sin capacitaciones
    total_users = db.query(models.User).filter(models.User.user_status == 'A').count()
    users_without_trainings = total_users - users_with_trainings
    
    # Distribución por estado de capacitación
    status_stats = db.query(
        models.UserTrainingAssignment.assignment_status,
        func.count(models.UserTrainingAssignment.assignment_id).label('count')
    ).group_by(
        models.UserTrainingAssignment.assignment_status
    ).all()
    
    return {
        "enrollment_summary": {
            "users_with_trainings": users_with_trainings,
            "users_without_trainings": users_without_trainings,
            "total_users": total_users,
            "enrollment_percentage": round((users_with_trainings / total_users * 100), 2) if total_users > 0 else 0
        },
        "status_distribution": [{"status": s.assignment_status, "count": s.count} for s in status_stats],
        "metric": "enrollment_stats"
    }

@app.get("/api/v1/pro/powerbi/trainings/progress-overview", tags=["Power BI Analytics"], summary="Resumen de progreso de capacitaciones")
def get_training_progress_overview(db: Session = Depends(get_db)):
    """Resumen general del progreso de todas las capacitaciones"""
    # Promedios de progreso
    avg_progress = db.query(
        func.avg(models.UserTrainingAssignment.completion_percentage).label('avg_completion')
    ).scalar() or 0
    
    # Capacitaciones por estado general
    overall_status_stats = db.query(
        models.UserTrainingStatus.overall_status,
        func.count(models.UserTrainingStatus.user_id).label('count')
    ).group_by(
        models.UserTrainingStatus.overall_status
    ).all()
    
    # Top usuarios con mejor progreso
    top_performers = db.query(
        models.Person.person_first_name,
        models.Person.person_last_name,
        func.avg(models.UserTrainingAssignment.completion_percentage).label('avg_completion')
    ).join(
        models.User, models.Person.person_id == models.User.person_id
    ).join(
        models.UserTrainingAssignment, models.User.user_id == models.UserTrainingAssignment.user_id
    ).group_by(
        models.User.user_id, models.Person.person_first_name, models.Person.person_last_name
    ).order_by(
        func.avg(models.UserTrainingAssignment.completion_percentage).desc()
    ).limit(10).all()
    
    return {
        "overall_metrics": {
            "average_completion_percentage": round(float(avg_progress), 2),
            "total_active_assignments": db.query(models.UserTrainingAssignment).count()
        },
        "status_overview": [{"status": s.overall_status, "count": s.count} for s in overall_status_stats],
        "top_performers": [
            {
                "name": f"{p.person_first_name} {p.person_last_name}",
                "avg_completion": round(float(p.avg_completion), 2)
            } for p in top_performers
        ],
        "metric": "progress_overview"
    }

@app.get("/api/v1/pro/powerbi/technologies/popularity", tags=["Power BI Analytics"], summary="Popularidad de tecnologías")
def get_technology_popularity(db: Session = Depends(get_db)):
    """Análisis de popularidad de tecnologías basado en capacitaciones asignadas"""
    # Tecnologías más populares por número de asignaciones
    popular_technologies = db.query(
        models.Technology.technology_name,
        func.count(models.UserTrainingAssignment.assignment_id).label('assignments_count')
    ).join(
        models.TrainingTechnology, models.Technology.technology_id == models.TrainingTechnology.technology_id
    ).join(
        models.Training, models.TrainingTechnology.training_id == models.Training.training_id
    ).join(
        models.UserTrainingAssignment, models.Training.training_id == models.UserTrainingAssignment.training_id
    ).group_by(
        models.Technology.technology_name
    ).order_by(
        func.count(models.UserTrainingAssignment.assignment_id).desc()
    ).all()
    
    # Tecnologías con mejor tasa de completación
    completion_rate_by_tech = db.query(
        models.Technology.technology_name,
        func.avg(models.UserTrainingAssignment.completion_percentage).label('avg_completion'),
        func.count(models.UserTrainingAssignment.assignment_id).label('total_assignments')
    ).join(
        models.TrainingTechnology, models.Technology.technology_id == models.TrainingTechnology.technology_id
    ).join(
        models.Training, models.TrainingTechnology.training_id == models.Training.training_id
    ).join(
        models.UserTrainingAssignment, models.Training.training_id == models.UserTrainingAssignment.training_id
    ).group_by(
        models.Technology.technology_name
    ).having(
        func.count(models.UserTrainingAssignment.assignment_id) >= 3  # Solo tecnologías con al menos 3 asignaciones
    ).order_by(
        func.avg(models.UserTrainingAssignment.completion_percentage).desc()
    ).all()
    
    return {
        "popularity_ranking": [
            {"technology": t.technology_name, "assignments": t.assignments_count} 
            for t in popular_technologies
        ],
        "completion_effectiveness": [
            {
                "technology": t.technology_name, 
                "avg_completion": round(float(t.avg_completion), 2),
                "total_assignments": t.total_assignments
            } 
            for t in completion_rate_by_tech
        ],
        "metric": "technology_popularity"
    }

@app.get("/api/v1/pro/powerbi/instructors/performance", tags=["Power BI Analytics"], summary="Rendimiento de instructores")
def get_instructor_performance(db: Session = Depends(get_db)):
    """Análisis del rendimiento de instructores"""
    instructor_stats = db.query(
        models.Person.person_first_name,
        models.Person.person_last_name,
        func.count(models.UserTrainingAssignment.assignment_id).label('total_assignments'),
        func.avg(models.UserTrainingAssignment.completion_percentage).label('avg_completion'),
        func.count(
            func.nullif(models.UserTrainingAssignment.assignment_status != 'completed', True)
        ).label('completed_assignments')
    ).join(
        models.User, models.Person.person_id == models.User.person_id
    ).join(
        models.UserTrainingAssignment, models.User.user_id == models.UserTrainingAssignment.instructor_id
    ).group_by(
        models.User.user_id, models.Person.person_first_name, models.Person.person_last_name
    ).having(
        func.count(models.UserTrainingAssignment.assignment_id) >= 1
    ).order_by(
        func.avg(models.UserTrainingAssignment.completion_percentage).desc()
    ).all()
    
    return {
        "instructor_performance": [
            {
                "instructor_name": f"{s.person_first_name} {s.person_last_name}",
                "total_assignments": s.total_assignments,
                "avg_completion_rate": round(float(s.avg_completion), 2),
                "completed_assignments": s.completed_assignments or 0
            } for s in instructor_stats
        ],
        "metric": "instructor_performance"
    }

@app.get("/api/v1/pro/powerbi/timeline/user-registrations", tags=["Power BI Analytics"], summary="Registros de usuarios por tiempo")
def get_user_registrations_timeline(db: Session = Depends(get_db)):
    """Línea de tiempo de registros de usuarios"""
    # Registros por mes
    monthly_registrations = db.query(
        func.DATE_FORMAT(models.User.user_created_at, '%Y-%m').label('month'),
        func.count(models.User.user_id).label('registrations')
    ).filter(
        models.User.user_status == 'A'
    ).group_by(
        func.DATE_FORMAT(models.User.user_created_at, '%Y-%m')
    ).order_by(
        func.DATE_FORMAT(models.User.user_created_at, '%Y-%m').asc()
    ).all()
    
    # Registros por día (últimos 30 días)
    daily_registrations = db.query(
        func.DATE(models.User.user_created_at).label('date'),
        func.count(models.User.user_id).label('registrations')
    ).filter(
        models.User.user_status == 'A',
        models.User.user_created_at >= func.DATE_SUB(func.NOW(), text('INTERVAL 30 DAY'))
    ).group_by(
        func.DATE(models.User.user_created_at)
    ).order_by(
        func.DATE(models.User.user_created_at).asc()
    ).all()
    
    return {
        "monthly_timeline": [
            {"month": r.month, "registrations": r.registrations} 
            for r in monthly_registrations
        ],
        "recent_daily_timeline": [
            {"date": str(r.date), "registrations": r.registrations} 
            for r in daily_registrations
        ],
        "metric": "user_registrations_timeline"
    }

@app.get("/api/v1/pro/powerbi/summary/dashboard", tags=["Power BI Analytics"], summary="Resumen ejecutivo del dashboard")
def get_executive_dashboard_summary(db: Session = Depends(get_db)):
    """Métricas clave para dashboard ejecutivo"""
    # Métricas principales
    total_users = db.query(models.User).filter(models.User.user_status == 'A').count()
    total_courses = db.query(models.Course).count()
    total_trainings = db.query(models.Training).filter(models.Training.training_status == 'A').count()
    total_assignments = db.query(models.UserTrainingAssignment).count()
    
    # Progreso general
    avg_completion = db.query(
        func.avg(models.UserTrainingAssignment.completion_percentage)
    ).scalar() or 0
    
    # Usuarios activos (con al menos una capacitación asignada)
    active_users = db.query(models.UserTrainingAssignment.user_id).distinct().count()
    
    # Capacitaciones completadas vs en progreso
    completed_assignments = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.assignment_status == 'completed'
    ).count()
    
    in_progress_assignments = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.assignment_status == 'in_progress'
    ).count()
    
    # Tecnología más popular
    most_popular_tech = db.query(
        models.Technology.technology_name,
        func.count(models.UserTrainingAssignment.assignment_id).label('count')
    ).join(
        models.TrainingTechnology, models.Technology.technology_id == models.TrainingTechnology.technology_id
    ).join(
        models.Training, models.TrainingTechnology.training_id == models.Training.training_id
    ).join(
        models.UserTrainingAssignment, models.Training.training_id == models.UserTrainingAssignment.training_id
    ).group_by(
        models.Technology.technology_name
    ).order_by(
        func.count(models.UserTrainingAssignment.assignment_id).desc()
    ).first()
    
    return {
        "key_metrics": {
            "total_users": total_users,
            "total_courses": total_courses,
            "total_trainings": total_trainings,
            "total_assignments": total_assignments,
            "active_users": active_users,
            "user_engagement_rate": round((active_users / total_users * 100), 2) if total_users > 0 else 0
        },
        "progress_metrics": {
            "average_completion_percentage": round(float(avg_completion), 2),
            "completed_assignments": completed_assignments,
            "in_progress_assignments": in_progress_assignments,
            "pending_assignments": total_assignments - completed_assignments - in_progress_assignments
        },
        "insights": {
            "most_popular_technology": most_popular_tech.technology_name if most_popular_tech else "N/A",
            "completion_rate": round((completed_assignments / total_assignments * 100), 2) if total_assignments > 0 else 0
        },
        "metric": "executive_dashboard"
    }

# =====================================
# POWER BI TURSO ANALYTICS ENDPOINTS
# =====================================

@app.get("/api/v1/pro/powerbi/turso/users/stats", tags=["Power BI Analytics"], summary="Estadísticas de usuarios desde Turso")
def get_turso_users_stats():
    """Estadísticas de usuarios consultando directamente desde Turso"""
    try:
        # Total usuarios
        total_result = execute_turso_query("SELECT COUNT(*) as total FROM per_m_user WHERE user_status = 'A'")
        total_users = total_result.get("result", {}).get("rows", [[0]])[0][0] if total_result else 0
        
        # Usuarios por rol
        roles_result = execute_turso_query("""
            SELECT r.role_name, COUNT(u.user_id) as count 
            FROM per_c_role r 
            LEFT JOIN per_m_user u ON r.role_id = u.user_role AND u.user_status = 'A'
            GROUP BY r.role_name
        """)
        
        roles_data = []
        if roles_result and "result" in roles_result and "rows" in roles_result["result"]:
            roles_data = [{"role": row[0], "count": row[1]} for row in roles_result["result"]["rows"]]
        
        return {
            "total_users": total_users,
            "users_by_role": roles_data,
            "source": "turso",
            "metric": "users_stats"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Turso: {str(e)}")

@app.get("/api/v1/pro/powerbi/turso/trainings/progress", tags=["Power BI Analytics"], summary="Progreso de capacitaciones desde Turso")
def get_turso_training_progress():
    """Progreso de capacitaciones consultando directamente desde Turso"""
    try:
        # Promedio de progreso
        avg_result = execute_turso_query("SELECT AVG(completion_percentage) as avg_completion FROM acd_t_user_training_assignment")
        avg_completion = avg_result.get("result", {}).get("rows", [[0]])[0][0] if avg_result else 0
        
        # Estados de asignaciones
        status_result = execute_turso_query("""
            SELECT assignment_status, COUNT(*) as count 
            FROM acd_t_user_training_assignment 
            GROUP BY assignment_status
        """)
        
        status_data = []
        if status_result and "result" in status_result and "rows" in status_result["result"]:
            status_data = [{"status": row[0], "count": row[1]} for row in status_result["result"]["rows"]]
        
        # Top usuarios por progreso
        top_users_result = execute_turso_query("""
            SELECT p.person_first_name, p.person_last_name, AVG(uta.completion_percentage) as avg_completion
            FROM acd_t_user_training_assignment uta
            JOIN per_m_user u ON uta.user_id = u.user_id
            JOIN per_m_person p ON u.person_id = p.person_id
            GROUP BY u.user_id, p.person_first_name, p.person_last_name
            ORDER BY avg_completion DESC
            LIMIT 10
        """)
        
        top_users = []
        if top_users_result and "result" in top_users_result and "rows" in top_users_result["result"]:
            top_users = [
                {"name": f"{row[0]} {row[1]}", "avg_completion": round(float(row[2]), 2)} 
                for row in top_users_result["result"]["rows"]
            ]
        
        return {
            "average_completion": round(float(avg_completion), 2) if avg_completion else 0,
            "status_distribution": status_data,
            "top_performers": top_users,
            "source": "turso",
            "metric": "training_progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Turso: {str(e)}")

@app.get("/api/v1/pro/powerbi/turso/technologies/analytics", tags=["Power BI Analytics"], summary="Análisis de tecnologías desde Turso")
def get_turso_technology_analytics():
    """Análisis de tecnologías consultando directamente desde Turso"""
    try:
        # Tecnologías más populares
        popular_result = execute_turso_query("""
            SELECT t.technology_name, COUNT(uta.assignment_id) as assignments
            FROM acd_m_technology t
            LEFT JOIN acd_t_training_technology tt ON t.technology_id = tt.technology_id
            LEFT JOIN acd_m_training tr ON tt.training_id = tr.training_id
            LEFT JOIN acd_t_user_training_assignment uta ON tr.training_id = uta.training_id
            GROUP BY t.technology_name
            ORDER BY assignments DESC
        """)
        
        popular_techs = []
        if popular_result and "result" in popular_result and "rows" in popular_result["result"]:
            popular_techs = [
                {"technology": row[0], "assignments": row[1]} 
                for row in popular_result["result"]["rows"]
            ]
        
        # Tasa de completación por tecnología
        completion_result = execute_turso_query("""
            SELECT t.technology_name, AVG(uta.completion_percentage) as avg_completion, COUNT(uta.assignment_id) as total
            FROM acd_m_technology t
            JOIN acd_t_training_technology tt ON t.technology_id = tt.technology_id
            JOIN acd_m_training tr ON tt.training_id = tr.training_id
            JOIN acd_t_user_training_assignment uta ON tr.training_id = uta.training_id
            GROUP BY t.technology_name
            HAVING COUNT(uta.assignment_id) >= 1
            ORDER BY avg_completion DESC
        """)
        
        completion_data = []
        if completion_result and "result" in completion_result and "rows" in completion_result["result"]:
            completion_data = [
                {
                    "technology": row[0], 
                    "avg_completion": round(float(row[1]), 2),
                    "total_assignments": row[2]
                } 
                for row in completion_result["result"]["rows"]
            ]
        
        return {
            "popularity_ranking": popular_techs,
            "completion_effectiveness": completion_data,
            "source": "turso",
            "metric": "technology_analytics"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Turso: {str(e)}")

@app.get("/api/v1/pro/powerbi/turso/summary/complete", tags=["Power BI Analytics"], summary="Resumen completo desde Turso")
def get_turso_complete_summary():
    """Resumen completo del sistema consultando directamente desde Turso"""
    try:
        # Métricas básicas
        users_result = execute_turso_query("SELECT COUNT(*) FROM per_m_user WHERE user_status = 'A'")
        courses_result = execute_turso_query("SELECT COUNT(*) FROM acd_m_course")
        trainings_result = execute_turso_query("SELECT COUNT(*) FROM acd_m_training WHERE training_status = 'A'")
        assignments_result = execute_turso_query("SELECT COUNT(*) FROM acd_t_user_training_assignment")
        
        total_users = users_result.get("result", {}).get("rows", [[0]])[0][0] if users_result else 0
        total_courses = courses_result.get("result", {}).get("rows", [[0]])[0][0] if courses_result else 0
        total_trainings = trainings_result.get("result", {}).get("rows", [[0]])[0][0] if trainings_result else 0
        total_assignments = assignments_result.get("result", {}).get("rows", [[0]])[0][0] if assignments_result else 0
        
        # Usuarios activos
        active_users_result = execute_turso_query("SELECT COUNT(DISTINCT user_id) FROM acd_t_user_training_assignment")
        active_users = active_users_result.get("result", {}).get("rows", [[0]])[0][0] if active_users_result else 0
        
        # Progreso promedio
        avg_progress_result = execute_turso_query("SELECT AVG(completion_percentage) FROM acd_t_user_training_assignment")
        avg_progress = avg_progress_result.get("result", {}).get("rows", [[0]])[0][0] if avg_progress_result else 0
        
        # Asignaciones completadas
        completed_result = execute_turso_query("SELECT COUNT(*) FROM acd_t_user_training_assignment WHERE assignment_status = 'completed'")
        completed = completed_result.get("result", {}).get("rows", [[0]])[0][0] if completed_result else 0
        
        return {
            "key_metrics": {
                "total_users": total_users,
                "total_courses": total_courses,
                "total_trainings": total_trainings,
                "total_assignments": total_assignments,
                "active_users": active_users,
                "engagement_rate": round((active_users / total_users * 100), 2) if total_users > 0 else 0
            },
            "progress_metrics": {
                "average_completion": round(float(avg_progress), 2) if avg_progress else 0,
                "completed_assignments": completed,
                "completion_rate": round((completed / total_assignments * 100), 2) if total_assignments > 0 else 0
            },
            "source": "turso",
            "metric": "complete_summary"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Turso: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)