from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import engine, get_db
import warnings
from passlib.context import CryptContext

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)