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

# Eliminar y recrear tablas para limpiar la estructura
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

# Crear géneros por defecto si no existen
def create_default_genders():
    db = next(get_db())
    try:
        if not db.query(models.Gender).first():
            genders = [
                models.Gender(gender_name="Masculino"),
                models.Gender(gender_name="Femenino")
            ]
            db.add_all(genders)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

# Ejecutar al iniciar la aplicación
create_default_genders()

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.get("/", tags=["Health"])
def root():
    return {"message": "Career Plan API - Sistema de Capacitaciones Viamatica"}

@app.post("/api/v1/init-data", tags=["System"], summary="Inicializar datos del sistema")
def initialize_data(db: Session = Depends(get_db)):
    """
    Inicializa datos básicos del sistema: géneros, roles, posiciones y datos de prueba.
    """
    try:
        # Verificar si ya existen usuarios
        if db.query(models.User).first():
            raise HTTPException(status_code=400, detail="Los datos ya han sido inicializados")
        
        # Crear género "Otro" si no existe
        if not db.query(models.Gender).filter(models.Gender.gender_name == "Otro").first():
            gender_otro = models.Gender(gender_name="Otro")
            db.add(gender_otro)
        
        # Crear roles
        roles = [
            models.Role(role_name="Administrador", role_description="Acceso completo al sistema"),
            models.Role(role_name="Supervisor", role_description="Gestión de equipos y seguimiento"),
            models.Role(role_name="Cliente", role_description="Consumo de capacitaciones"),
            models.Role(role_name="Instructor", role_description="Facilitación de capacitaciones")
        ]
        db.add_all(roles)
        
        db.commit()
        
        # Crear personas de prueba
        persons = [
            models.Person(person_dni=12345678, person_first_name="Admin", person_last_name="Sistema", person_gender=1, person_email="admin@viamatica.com"),
            models.Person(person_dni=23456789, person_first_name="Juan", person_last_name="Supervisor", person_gender=1, person_email="supervisor@viamatica.com"),
            models.Person(person_dni=34567890, person_first_name="Maria", person_last_name="Cliente", person_gender=2, person_email="cliente@viamatica.com"),
            models.Person(person_dni=45678901, person_first_name="Carlos", person_last_name="Instructor", person_gender=1, person_email="instructor@viamatica.com")
        ]
        db.add_all(persons)
        db.commit()
        
        # Crear usuarios de prueba
        users = [
            models.User(user_username="admin", user_password=pwd_context.hash("admin123"), person_id=1, user_role=1),
            models.User(user_username="supervisor", user_password=pwd_context.hash("sup123"), person_id=2, user_role=2),
            models.User(user_username="cliente", user_password=pwd_context.hash("cli123"), person_id=3, user_role=3),
            models.User(user_username="instructor", user_password=pwd_context.hash("ins123"), person_id=4, user_role=4)
        ]
        db.add_all(users)
        db.commit()
        
        return {"message": "Datos inicializados correctamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al inicializar datos: {str(e)}")

@app.post("/api/v1/init-technologies-trainings", tags=["System"], summary="Inicializar tecnologías y capacitaciones")
def initialize_technologies_trainings(db: Session = Depends(get_db)):
    """
    Inicializa tecnologías y capacitaciones de prueba (mitad de los datos).
    """
    try:
        # Verificar si ya existen tecnologías
        if db.query(models.Technology).first():
            raise HTTPException(status_code=400, detail="Las tecnologías ya han sido inicializadas")
        
        # 25 Tecnologías (mitad)
        technologies_data = [
            "Rust", "Go (Golang)", "Python", "JavaScript", "TypeScript", 
            "PHP", "Ruby", "Java", "Kotlin", "Django", 
            "Flask", "FastAPI", "Node.js", "Express.js", "Spring Boot", 
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "React", 
            "Vue.js", "Angular", "Docker", "AWS", "Git"
        ]
        
        technologies = [models.Technology(technology_name=name) for name in technologies_data]
        db.add_all(technologies)
        db.commit()
        
        # 8 Capacitaciones (mitad)
        trainings_data = [
            {
                "name": "Control de Versiones & CI/CD",
                "description": "Manejo profesional de código con Git y automatización",
                "technologies": ["Git"]
            },
            {
                "name": "Bases de Datos SQL Avanzadas", 
                "description": "Administración y optimización de bases de datos relacionales",
                "technologies": ["PostgreSQL", "MySQL"]
            },
            {
                "name": "Backend con JavaScript/TypeScript",
                "description": "Desarrollo backend moderno con Node.js",
                "technologies": ["Node.js", "Express.js", "TypeScript", "JavaScript"]
            },
            {
                "name": "Python Backend Completo",
                "description": "Desarrollo backend con Python y frameworks modernos", 
                "technologies": ["Django", "FastAPI", "Flask", "Python"]
            },
            {
                "name": "Rust & Go para Backend",
                "description": "Desarrollo de alta performance con Rust y Go",
                "technologies": ["Rust", "Go (Golang)"]
            },
            {
                "name": "Bases de Datos NoSQL",
                "description": "Modelado y gestión de datos no relacionales",
                "technologies": ["MongoDB", "Redis"]
            },
            {
                "name": "Frontend Moderno",
                "description": "Desarrollo frontend con las últimas tecnologías",
                "technologies": ["React", "TypeScript", "JavaScript"]
            },
            {
                "name": "PHP & Frameworks",
                "description": "Desarrollo web con PHP",
                "technologies": ["PHP", "MySQL"]
            }
        ]
        
        for training_data in trainings_data:
            training = models.Training(
                training_name=training_data["name"],
                training_description=training_data["description"]
            )
            db.add(training)
            db.commit()
            
            # Asociar tecnologías a la capacitación
            for tech_name in training_data["technologies"]:
                technology = db.query(models.Technology).filter(models.Technology.technology_name == tech_name).first()
                if technology:
                    training_tech = models.TrainingTechnology(
                        training_id=training.training_id,
                        technology_id=technology.technology_id
                    )
                    db.add(training_tech)
            
            db.commit()
        
        return {"message": "Tecnologías y capacitaciones inicializadas correctamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al inicializar tecnologías: {str(e)}")

@app.post("/api/v1/auth/login", tags=["Authentication"])
def login(login_data: schemas.Login, db: Session = Depends(get_db)):
    """
    Autenticación de usuarios
    """
    user = db.query(models.User).filter(models.User.user_username == login_data.username).first()
    
    if not user or not pwd_context.verify(login_data.password, user.user_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    return {
        "user_id": user.user_id,
        "username": user.user_username,
        "role": user.user_role,
        "person": {
            "name": f"{user.person.person_first_name} {user.person.person_last_name}",
            "email": user.person.person_email
        }
    }

@app.get("/api/v1/technologies", response_model=List[schemas.Technology], tags=["Technologies"])
def get_technologies(db: Session = Depends(get_db)):
    """
    Obtener todas las tecnologías
    """
    return db.query(models.Technology).all()

@app.get("/api/v1/trainings", response_model=List[schemas.Training], tags=["Trainings"])
def get_trainings(db: Session = Depends(get_db)):
    """
    Obtener todas las capacitaciones
    """
    return db.query(models.Training).all()

@app.get("/api/v1/users", response_model=List[schemas.User], tags=["Users"])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtener todos los usuarios con paginación
    """
    return db.query(models.User).offset(skip).limit(limit).all()

@app.get("/api/v1/users/{user_id}", response_model=schemas.User, tags=["Users"])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Obtener un usuario específico por ID
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@app.post("/api/v1/users", response_model=schemas.User, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo usuario
    """
    # Verificar si ya existe el username
    existing_user = db.query(models.User).filter(models.User.user_username == user.user_username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este nombre de usuario")
    
    # Verificar que la persona existe
    person = db.query(models.Person).filter(models.Person.person_id == user.person_id).first()
    if not person:
        raise HTTPException(status_code=400, detail="La persona especificada no existe")
    
    # Verificar que la persona no tenga ya un usuario
    existing_person_user = db.query(models.User).filter(models.User.person_id == user.person_id).first()
    if existing_person_user:
        raise HTTPException(status_code=400, detail="Esta persona ya tiene un usuario asignado")
    
    # Encriptar contraseña
    hashed_password = pwd_context.hash(user.user_password)
    user_data = user.dict()
    user_data['user_password'] = hashed_password
    
    db_user = models.User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/v1/roles", response_model=List[schemas.Role], tags=["Roles"])
def get_roles(db: Session = Depends(get_db)):
    """
    Obtener todos los roles
    """
    return db.query(models.Role).all()

@app.get("/api/v1/persons", response_model=List[schemas.Person], tags=["Persons"])
def get_persons(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtener todas las personas con paginación
    """
    return db.query(models.Person).offset(skip).limit(limit).all()

@app.post("/api/v1/persons", response_model=schemas.Person, tags=["Persons"])
def create_person(person: schemas.PersonCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva persona
    """
    # Verificar si ya existe el DNI o email
    existing_dni = db.query(models.Person).filter(models.Person.person_dni == person.person_dni).first()
    if existing_dni:
        raise HTTPException(status_code=400, detail="Ya existe una persona con este DNI")
    
    existing_email = db.query(models.Person).filter(models.Person.person_email == person.person_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Ya existe una persona con este email")
    
    db_person = models.Person(**person.dict())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

@app.get("/api/v1/genders", response_model=List[schemas.Gender], tags=["Genders"])
def get_genders(db: Session = Depends(get_db)):
    """
    Obtener todos los géneros
    """
    return db.query(models.Gender).all()

@app.get("/api/v1/positions", tags=["Positions"])
def get_positions():
    """
    Endpoint legacy para posiciones (ya no se usa)
    """
    return []

@app.post("/api/v1/user-training-assignments", response_model=schemas.UserTrainingAssignment, tags=["Training Assignments"])
def create_user_training_assignment(assignment: schemas.UserTrainingAssignmentCreate, db: Session = Depends(get_db)):
    """
    Crear asignación de capacitación a usuario
    """
    db_assignment = models.UserTrainingAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.get("/api/v1/user-training-assignments", response_model=List[schemas.UserTrainingAssignment], tags=["Training Assignments"])
def get_user_training_assignments(db: Session = Depends(get_db)):
    """
    Obtener todas las asignaciones de capacitación
    """
    return db.query(models.UserTrainingAssignment).all()

@app.get("/api/v1/user-training-assignments/{assignment_id}", response_model=schemas.UserTrainingAssignment, tags=["Training Assignments"])
def get_user_training_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """
    Obtener una asignación específica por ID
    """
    assignment = db.query(models.UserTrainingAssignment).filter(models.UserTrainingAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return assignment

@app.put("/api/v1/user-training-assignments/training/{training_id}/instructor", tags=["Training Assignments"])
def assign_instructor_to_training(training_id: int, instructor_data: dict, db: Session = Depends(get_db)):
    """
    Asignar instructor a una capacitación
    """
    instructor_id = instructor_data.get("instructor_id")
    
    if not instructor_id:
        raise HTTPException(status_code=400, detail="instructor_id es requerido")
    
    # Verificar que el instructor existe y es del rol correcto (role_id = 4)
    instructor = db.query(models.User).filter(
        models.User.user_id == instructor_id,
        models.User.user_role == 4  # Rol instructor
    ).first()
    
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado o no tiene el rol correcto")
    
    # Verificar que la capacitación existe
    training = db.query(models.Training).filter(models.Training.training_id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Capacitación no encontrada")
    
    # Actualizar todas las asignaciones de esta capacitación para asignar el instructor
    assignments = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.training_id == training_id
    ).all()
    
    if not assignments:
        raise HTTPException(status_code=404, detail="No hay asignaciones para esta capacitación")
    
    for assignment in assignments:
        assignment.instructor_id = instructor_id
    
    db.commit()
    
    return {"message": f"Instructor asignado exitosamente a {len(assignments)} asignaciones de la capacitación"}

@app.get("/api/v1/users/by-role/{role_id}", response_model=List[schemas.User], tags=["Users"])
def get_users_by_role(role_id: int, db: Session = Depends(get_db)):
    """
    Obtener usuarios filtrados por rol
    """
    users = db.query(models.User).filter(models.User.user_role == role_id).all()
    return users