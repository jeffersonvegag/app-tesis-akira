from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
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
    allow_origins=[
        "https://app-tesis-akira-frontend.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173"  # para desarrollo con Vite
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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
            # Admin
            models.Person(person_dni=12345678, person_first_name="Admin", person_last_name="Sistema", person_gender=1, person_email="admin@viamatica.com"),
            
            # 4 Supervisores
            models.Person(person_dni=20000001, person_first_name="Ana", person_last_name="Supervisor", person_gender=2, person_email="supervisor1@viamatica.com"),
            models.Person(person_dni=20000002, person_first_name="Carlos", person_last_name="Supervisor", person_gender=1, person_email="supervisor2@viamatica.com"),
            models.Person(person_dni=20000003, person_first_name="María", person_last_name="Supervisor", person_gender=2, person_email="supervisor3@viamatica.com"),
            models.Person(person_dni=20000004, person_first_name="Luis", person_last_name="Supervisor", person_gender=1, person_email="supervisor4@viamatica.com"),
            
            # 5 Clientes
            models.Person(person_dni=30000001, person_first_name="Pedro", person_last_name="Cliente", person_gender=1, person_email="cliente1@viamatica.com"),
            models.Person(person_dni=30000002, person_first_name="Elena", person_last_name="Cliente", person_gender=2, person_email="cliente2@viamatica.com"),
            models.Person(person_dni=30000003, person_first_name="Roberto", person_last_name="Cliente", person_gender=1, person_email="cliente3@viamatica.com"),
            models.Person(person_dni=30000004, person_first_name="Sofia", person_last_name="Cliente", person_gender=2, person_email="cliente4@viamatica.com"),
            models.Person(person_dni=30000005, person_first_name="Diego", person_last_name="Cliente", person_gender=1, person_email="cliente5@viamatica.com"),
            
            # 4 Instructores
            models.Person(person_dni=40000001, person_first_name="Jorge", person_last_name="Instructor", person_gender=1, person_email="instructor1@viamatica.com"),
            models.Person(person_dni=40000002, person_first_name="Carmen", person_last_name="Instructor", person_gender=2, person_email="instructor2@viamatica.com"),
            models.Person(person_dni=40000003, person_first_name="Miguel", person_last_name="Instructor", person_gender=1, person_email="instructor3@viamatica.com"),
            models.Person(person_dni=40000004, person_first_name="Patricia", person_last_name="Instructor", person_gender=2, person_email="instructor4@viamatica.com")
        ]
        db.add_all(persons)
        db.commit()
        
        # Crear usuarios de prueba
        users = [
            # Admin
            models.User(user_username="admin", user_password=pwd_context.hash("admin123"), person_id=1, user_role=1),
            
            # 4 Supervisores
            models.User(user_username="supervisor1", user_password=pwd_context.hash("sup123"), person_id=2, user_role=2),
            models.User(user_username="supervisor2", user_password=pwd_context.hash("sup123"), person_id=3, user_role=2),
            models.User(user_username="supervisor3", user_password=pwd_context.hash("sup123"), person_id=4, user_role=2),
            models.User(user_username="supervisor4", user_password=pwd_context.hash("sup123"), person_id=5, user_role=2),
            
            # 5 Clientes
            models.User(user_username="cliente1", user_password=pwd_context.hash("cli123"), person_id=6, user_role=3),
            models.User(user_username="cliente2", user_password=pwd_context.hash("cli123"), person_id=7, user_role=3),
            models.User(user_username="cliente3", user_password=pwd_context.hash("cli123"), person_id=8, user_role=3),
            models.User(user_username="cliente4", user_password=pwd_context.hash("cli123"), person_id=9, user_role=3),
            models.User(user_username="cliente5", user_password=pwd_context.hash("cli123"), person_id=10, user_role=3),
            
            # 4 Instructores
            models.User(user_username="instructor1", user_password=pwd_context.hash("ins123"), person_id=11, user_role=4),
            models.User(user_username="instructor2", user_password=pwd_context.hash("ins123"), person_id=12, user_role=4),
            models.User(user_username="instructor3", user_password=pwd_context.hash("ins123"), person_id=13, user_role=4),
            models.User(user_username="instructor4", user_password=pwd_context.hash("ins123"), person_id=14, user_role=4)
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

@app.post("/api/v1/technologies", response_model=schemas.Technology, tags=["Technologies"])
def create_technology(technology: schemas.TechnologyCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva tecnología
    """
    # Verificar si ya existe una tecnología con el mismo nombre
    existing_technology = db.query(models.Technology).filter(
        models.Technology.technology_name == technology.technology_name
    ).first()
    
    if existing_technology:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una tecnología con el nombre '{technology.technology_name}'"
        )
    
    db_technology = models.Technology(
        technology_name=technology.technology_name
    )
    db.add(db_technology)
    db.commit()
    db.refresh(db_technology)
    return db_technology

@app.get("/api/v1/trainings", response_model=List[schemas.Training], tags=["Trainings"])
def get_trainings(db: Session = Depends(get_db)):
    """
    Obtener todas las capacitaciones con sus tecnologías
    """
    return db.query(models.Training).options(joinedload(models.Training.training_technologies).joinedload(models.TrainingTechnology.technology)).all()

@app.post("/api/v1/trainings", response_model=schemas.Training, tags=["Trainings"])
def create_training(training: schemas.TrainingCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva capacitación
    """
    # Verificar si ya existe una capacitación con el mismo nombre
    existing_training = db.query(models.Training).filter(
        models.Training.training_name == training.training_name
    ).first()
    
    if existing_training:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una capacitación con el nombre '{training.training_name}'"
        )
    
    db_training = models.Training(
        training_name=training.training_name,
        training_description=training.training_description
    )
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    return db_training

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
    try:
        # Verificar que el usuario existe
        user = db.query(models.User).filter(models.User.user_id == assignment.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que la capacitación existe
        training = db.query(models.Training).filter(models.Training.training_id == assignment.training_id).first()
        if not training:
            raise HTTPException(status_code=404, detail="Capacitación no encontrada")
        
        # Verificar si ya existe una asignación
        existing_assignment = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.user_id == assignment.user_id,
            models.UserTrainingAssignment.training_id == assignment.training_id
        ).first()
        
        if existing_assignment:
            raise HTTPException(status_code=400, detail="El usuario ya tiene asignada esta capacitación")
        
        # Crear la asignación
        db_assignment = models.UserTrainingAssignment(
            user_id=assignment.user_id,
            training_id=assignment.training_id,
            instructor_id=assignment.instructor_id,
            assignment_status='not_started'
        )
        
        db.add(db_assignment)
        db.commit()
        db.refresh(db_assignment)
        
        # Cargar relaciones para la respuesta
        db_assignment = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.assignment_id == db_assignment.assignment_id
        ).options(
            joinedload(models.UserTrainingAssignment.user).joinedload(models.User.person).joinedload(models.Person.gender),
            joinedload(models.UserTrainingAssignment.user).joinedload(models.User.role),
            joinedload(models.UserTrainingAssignment.training),
            joinedload(models.UserTrainingAssignment.instructor).joinedload(models.User.person).joinedload(models.Person.gender),
            joinedload(models.UserTrainingAssignment.instructor).joinedload(models.User.role)
        ).first()
        
        return db_assignment
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear asignación: {str(e)}")

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

@app.get("/api/v1/user-training-assignments/user/{user_id}", response_model=List[schemas.UserTrainingAssignment], tags=["Training Assignments"])
def get_user_training_assignments_by_user(user_id: int, db: Session = Depends(get_db)):
    """
    Obtener todas las asignaciones de capacitación de un usuario específico
    """
    # Verificar que el usuario existe
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Obtener asignaciones del usuario con todas las relaciones necesarias
    assignments = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.user_id == user_id
    ).options(
        joinedload(models.UserTrainingAssignment.user).joinedload(models.User.person).joinedload(models.Person.gender),
        joinedload(models.UserTrainingAssignment.user).joinedload(models.User.role),
        joinedload(models.UserTrainingAssignment.training).joinedload(models.Training.training_technologies).joinedload(models.TrainingTechnology.technology),
        joinedload(models.UserTrainingAssignment.instructor).joinedload(models.User.person).joinedload(models.Person.gender),
        joinedload(models.UserTrainingAssignment.instructor).joinedload(models.User.role)
    ).all()
    
    return assignments

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

# ENDPOINTS PARA GESTIÓN DE EQUIPOS

@app.post("/api/v1/teams", response_model=schemas.Team, tags=["Teams"])
def create_team(team_data: schemas.TeamCreateWithMembers, db: Session = Depends(get_db)):
    """
    Crear un nuevo equipo con supervisor, instructores y clientes
    """
    # Verificar que el supervisor existe y tiene el rol correcto (role_id = 2)
    supervisor = db.query(models.User).filter(
        models.User.user_id == team_data.supervisor_id,
        models.User.user_role == 2  # Rol supervisor
    ).first()
    
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado o no tiene el rol correcto")
    
    # Crear el equipo
    team = models.Team(
        team_name=team_data.team_name,
        team_description=team_data.team_description,
        supervisor_id=team_data.supervisor_id
    )
    db.add(team)
    db.flush()  # Para obtener el team_id
    
    # Agregar instructores al equipo
    for instructor_id in team_data.instructors:
        instructor = db.query(models.User).filter(
            models.User.user_id == instructor_id,
            models.User.user_role == 4  # Rol instructor
        ).first()
        
        if instructor:
            team_member = models.TeamMember(
                team_id=team.team_id,
                user_id=instructor_id,
                member_role='instructor'
            )
            db.add(team_member)
    
    # Agregar clientes al equipo
    for client_id in team_data.clients:
        client = db.query(models.User).filter(
            models.User.user_id == client_id,
            models.User.user_role == 3  # Rol cliente
        ).first()
        
        if client:
            team_member = models.TeamMember(
                team_id=team.team_id,
                user_id=client_id,
                member_role='client'
            )
            db.add(team_member)
    
    db.commit()
    db.refresh(team)
    
    return team

@app.get("/api/v1/teams", response_model=List[schemas.Team], tags=["Teams"])
def get_teams(db: Session = Depends(get_db)):
    """
    Obtener todos los equipos
    """
    return db.query(models.Team).filter(models.Team.team_status == 'A').all()

@app.get("/api/v1/teams/{team_id}", response_model=schemas.Team, tags=["Teams"])
def get_team(team_id: int, db: Session = Depends(get_db)):
    """
    Obtener un equipo específico por ID
    """
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    return team

@app.get("/api/v1/teams/supervisor/{supervisor_id}", response_model=List[schemas.Team], tags=["Teams"])
def get_teams_by_supervisor(supervisor_id: int, db: Session = Depends(get_db)):
    """
    Obtener equipos asignados a un supervisor específico
    """
    teams = db.query(models.Team).filter(
        models.Team.supervisor_id == supervisor_id,
        models.Team.team_status == 'A'
    ).all()
    
    return teams

@app.put("/api/v1/teams/{team_id}", response_model=schemas.Team, tags=["Teams"])
def update_team(team_id: int, team_data: schemas.TeamUpdate, db: Session = Depends(get_db)):
    """
    Actualizar información de un equipo
    """
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    if team_data.team_name:
        team.team_name = team_data.team_name
    if team_data.team_description:
        team.team_description = team_data.team_description
    if team_data.supervisor_id:
        # Verificar que el nuevo supervisor existe y tiene el rol correcto
        supervisor = db.query(models.User).filter(
            models.User.user_id == team_data.supervisor_id,
            models.User.user_role == 2
        ).first()
        
        if not supervisor:
            raise HTTPException(status_code=404, detail="Supervisor no encontrado o no tiene el rol correcto")
        
        team.supervisor_id = team_data.supervisor_id
    
    db.commit()
    db.refresh(team)
    
    return team

@app.delete("/api/v1/teams/{team_id}", tags=["Teams"])
def delete_team(team_id: int, db: Session = Depends(get_db)):
    """
    Eliminar (inactivar) un equipo
    """
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    # Inactivar el equipo y sus miembros
    team.team_status = 'I'
    
    # Inactivar todos los miembros del equipo
    team_members = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.member_status == 'A'
    ).all()
    
    for member in team_members:
        member.member_status = 'I'
    
    db.commit()
    
    return {"message": "Equipo eliminado exitosamente"}

@app.post("/api/v1/teams/{team_id}/members", response_model=schemas.TeamMember, tags=["Teams"])
def add_team_member(team_id: int, member_data: schemas.TeamMemberBase, db: Session = Depends(get_db)):
    """
    Agregar un miembro a un equipo existente
    """
    # Verificar que el equipo existe
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    # Verificar que el usuario existe y tiene el rol apropiado
    if member_data.member_role == 'instructor':
        role_id = 4
    elif member_data.member_role == 'client':
        role_id = 3
    else:
        raise HTTPException(status_code=400, detail="Rol de miembro inválido. Debe ser 'instructor' o 'client'")
    
    user = db.query(models.User).filter(
        models.User.user_id == member_data.user_id,
        models.User.user_role == role_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o no tiene el rol correcto")
    
    # Verificar que el usuario no esté ya en el equipo
    existing_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == member_data.user_id,
        models.TeamMember.member_status == 'A'
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="El usuario ya es miembro de este equipo")
    
    # Crear el miembro del equipo
    team_member = models.TeamMember(
        team_id=team_id,
        user_id=member_data.user_id,
        member_role=member_data.member_role
    )
    
    db.add(team_member)
    db.commit()
    db.refresh(team_member)
    
    return team_member

@app.delete("/api/v1/teams/{team_id}/members/{member_id}", tags=["Teams"])
def remove_team_member(team_id: int, member_id: int, db: Session = Depends(get_db)):
    """
    Remover un miembro de un equipo
    """
    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_member_id == member_id,
        models.TeamMember.team_id == team_id,
        models.TeamMember.member_status == 'A'
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Miembro del equipo no encontrado")
    
    member.member_status = 'I'
    db.commit()
    
    return {"message": "Miembro removido del equipo exitosamente"}

@app.post("/api/v1/teams/{team_id}/assign-training", tags=["Teams"])
def assign_training_to_team(team_id: int, training_data: dict, db: Session = Depends(get_db)):
    """
    Asignar una capacitación a todos los miembros de un equipo
    """
    training_id = training_data.get("training_id")
    instructor_id = training_data.get("instructor_id")  # Opcional
    
    if not training_id:
        raise HTTPException(status_code=400, detail="training_id es requerido")
    
    # Verificar que el equipo existe y está activo
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    # Verificar que la capacitación existe
    training = db.query(models.Training).filter(
        models.Training.training_id == training_id,
        models.Training.training_status == 'A'
    ).first()
    
    if not training:
        raise HTTPException(status_code=404, detail="Capacitación no encontrada")
    
    # Verificar instructor si se proporciona
    if instructor_id:
        instructor = db.query(models.User).filter(
            models.User.user_id == instructor_id,
            models.User.user_role == 4  # Rol instructor
        ).first()
        
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor no encontrado o no tiene el rol correcto")
    
    # Obtener todos los miembros activos del equipo (solo clientes)
    team_clients = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.member_role == 'client',
        models.TeamMember.member_status == 'A'
    ).all()
    
    if not team_clients:
        raise HTTPException(status_code=400, detail="No hay clientes en este equipo para asignar capacitaciones")
    
    assignments_created = []
    assignments_skipped = []
    
    for team_member in team_clients:
        # Verificar si el usuario ya tiene esta capacitación asignada
        existing_assignment = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.user_id == team_member.user_id,
            models.UserTrainingAssignment.training_id == training_id
        ).first()
        
        if existing_assignment:
            assignments_skipped.append({
                "user_id": team_member.user_id,
                "reason": "Usuario ya tiene esta capacitación asignada"
            })
            continue
        
        # Crear la asignación
        assignment = models.UserTrainingAssignment(
            user_id=team_member.user_id,
            training_id=training_id,
            instructor_id=instructor_id,
            assignment_status='assigned'
        )
        
        db.add(assignment)
        assignments_created.append({
            "user_id": team_member.user_id,
            "assignment_id": None  # Se actualizará después del commit
        })
    
    try:
        db.commit()
        
        # Actualizar los IDs de las asignaciones creadas
        for i, assignment_data in enumerate(assignments_created):
            assignment_data["assignment_id"] = assignments_created[i]["user_id"]  # Placeholder
        
        return {
            "message": f"Capacitación '{training.training_name}' asignada al equipo '{team.team_name}'",
            "team_id": team_id,
            "training_id": training_id,
            "instructor_id": instructor_id,
            "summary": {
                "assignments_created": len(assignments_created),
                "assignments_skipped": len(assignments_skipped),
                "total_clients": len(team_clients)
            },
            "details": {
                "created": assignments_created,
                "skipped": assignments_skipped
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al asignar capacitación al equipo: {str(e)}")

# ENDPOINTS PARA MATERIALES DE APOYO

@app.get("/api/v1/training-materials", response_model=List[schemas.TrainingMaterial], tags=["Training Materials"])
def get_training_materials(instructor_id: int = None, training_id: int = None, db: Session = Depends(get_db)):
    """
    Obtener materiales de apoyo con filtros opcionales
    """
    query = db.query(models.TrainingMaterial).filter(models.TrainingMaterial.material_status == 'A')
    
    if instructor_id:
        query = query.filter(models.TrainingMaterial.instructor_id == instructor_id)
    
    if training_id:
        query = query.filter(models.TrainingMaterial.training_id == training_id)
    
    return query.all()

@app.get("/api/v1/training-materials/{material_id}", response_model=schemas.TrainingMaterial, tags=["Training Materials"])
def get_training_material(material_id: int, db: Session = Depends(get_db)):
    """
    Obtener un material específico por ID
    """
    material = db.query(models.TrainingMaterial).filter(
        models.TrainingMaterial.material_id == material_id,
        models.TrainingMaterial.material_status == 'A'
    ).first()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    return material

@app.post("/api/v1/training-materials", response_model=schemas.TrainingMaterial, tags=["Training Materials"])
def create_training_material(material_data: schemas.TrainingMaterialCreate, instructor_id: int, db: Session = Depends(get_db)):
    """
    Crear un nuevo material de apoyo
    """
    # Verificar que el instructor existe y tiene el rol correcto
    instructor = db.query(models.User).filter(
        models.User.user_id == instructor_id,
        models.User.user_role == 4  # Rol instructor
    ).first()
    
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado o no tiene el rol correcto")
    
    # Verificar que la capacitación existe
    training = db.query(models.Training).filter(
        models.Training.training_id == material_data.training_id,
        models.Training.training_status == 'A'
    ).first()
    
    if not training:
        raise HTTPException(status_code=404, detail="Capacitación no encontrada")
    
    # Verificar que el instructor tiene asignaciones en esta capacitación
    has_assignment = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.training_id == material_data.training_id,
        models.UserTrainingAssignment.instructor_id == instructor_id
    ).first()
    
    if not has_assignment:
        raise HTTPException(status_code=403, detail="El instructor no tiene asignaciones en esta capacitación")
    
    # Crear el material
    material = models.TrainingMaterial(
        training_id=material_data.training_id,
        instructor_id=instructor_id,
        material_title=material_data.material_title,
        material_description=material_data.material_description,
        material_url=material_data.material_url,
        material_type=material_data.material_type
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    
    return material

@app.put("/api/v1/training-materials/{material_id}", response_model=schemas.TrainingMaterial, tags=["Training Materials"])
def update_training_material(material_id: int, material_data: schemas.TrainingMaterialUpdate, instructor_id: int, db: Session = Depends(get_db)):
    """
    Actualizar un material de apoyo
    """
    # Obtener el material
    material = db.query(models.TrainingMaterial).filter(
        models.TrainingMaterial.material_id == material_id,
        models.TrainingMaterial.material_status == 'A'
    ).first()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    # Verificar que el instructor es el propietario del material
    if material.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este material")
    
    # Actualizar campos
    if material_data.material_title:
        material.material_title = material_data.material_title
    if material_data.material_description is not None:
        material.material_description = material_data.material_description
    if material_data.material_url:
        material.material_url = material_data.material_url
    if material_data.material_type:
        material.material_type = material_data.material_type
    
    db.commit()
    db.refresh(material)
    
    return material

@app.delete("/api/v1/training-materials/{material_id}", tags=["Training Materials"])
def delete_training_material(material_id: int, instructor_id: int, db: Session = Depends(get_db)):
    """
    Eliminar (inactivar) un material de apoyo
    """
    # Obtener el material
    material = db.query(models.TrainingMaterial).filter(
        models.TrainingMaterial.material_id == material_id,
        models.TrainingMaterial.material_status == 'A'
    ).first()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    # Verificar que el instructor es el propietario del material
    if material.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este material")
    
    # Inactivar el material
    material.material_status = 'I'
    db.commit()
    
    return {"message": "Material eliminado exitosamente"}

@app.get("/api/v1/instructors/{instructor_id}/assigned-trainings", tags=["Training Materials"])
def get_instructor_assigned_trainings(instructor_id: int, db: Session = Depends(get_db)):
    """
    Obtener capacitaciones asignadas a un instructor específico
    """
    # Verificar que el instructor existe
    instructor = db.query(models.User).filter(
        models.User.user_id == instructor_id,
        models.User.user_role == 4
    ).first()
    
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")
    
    # Obtener capacitaciones donde este instructor está asignado
    assigned_trainings = db.query(models.Training).join(
        models.UserTrainingAssignment,
        models.Training.training_id == models.UserTrainingAssignment.training_id
    ).filter(
        models.UserTrainingAssignment.instructor_id == instructor_id,
        models.Training.training_status == 'A'
    ).distinct().all()
    
    return assigned_trainings

@app.post("/api/v1/teams/{team_id}/assign-training-to-clients", tags=["Teams"])
def assign_training_to_specific_clients(team_id: int, assignment_data: dict, db: Session = Depends(get_db)):
    """
    Asignar una capacitación a clientes específicos de un equipo
    """
    training_id = assignment_data.get("training_id")
    instructor_id = assignment_data.get("instructor_id")  # Opcional
    client_ids = assignment_data.get("client_ids", [])  # Lista de IDs de clientes
    
    if not training_id:
        raise HTTPException(status_code=400, detail="training_id es requerido")
    
    if not client_ids:
        raise HTTPException(status_code=400, detail="Debe seleccionar al menos un cliente")
    
    # Verificar que el equipo existe y está activo
    team = db.query(models.Team).filter(
        models.Team.team_id == team_id,
        models.Team.team_status == 'A'
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    
    # Verificar que la capacitación existe
    training = db.query(models.Training).filter(
        models.Training.training_id == training_id,
        models.Training.training_status == 'A'
    ).first()
    
    if not training:
        raise HTTPException(status_code=404, detail="Capacitación no encontrada")
    
    # Verificar instructor si se proporciona
    if instructor_id:
        instructor = db.query(models.User).filter(
            models.User.user_id == instructor_id,
            models.User.user_role == 4  # Rol instructor
        ).first()
        
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor no encontrado o no tiene el rol correcto")
    
    # Verificar que todos los clientes pertenecen al equipo
    team_client_ids = db.query(models.TeamMember.user_id).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.member_role == 'client',
        models.TeamMember.member_status == 'A',
        models.TeamMember.user_id.in_(client_ids)
    ).all()
    
    valid_client_ids = [row[0] for row in team_client_ids]
    invalid_clients = set(client_ids) - set(valid_client_ids)
    
    if invalid_clients:
        raise HTTPException(
            status_code=400, 
            detail=f"Los siguientes clientes no pertenecen al equipo o no están activos: {list(invalid_clients)}"
        )
    
    assignments_created = []
    assignments_skipped = []
    
    for client_id in valid_client_ids:
        # Verificar si el usuario ya tiene esta capacitación asignada
        existing_assignment = db.query(models.UserTrainingAssignment).filter(
            models.UserTrainingAssignment.user_id == client_id,
            models.UserTrainingAssignment.training_id == training_id,
            models.UserTrainingAssignment.assignment_status.in_(['assigned', 'in_progress'])
        ).first()
        
        if existing_assignment:
            assignments_skipped.append({
                "user_id": client_id,
                "reason": "Ya tiene esta capacitación asignada"
            })
            continue
        
        # Crear nueva asignación
        assignment = models.UserTrainingAssignment(
            user_id=client_id,
            training_id=training_id,
            instructor_id=instructor_id,
            assignment_status='assigned'
        )
        
        db.add(assignment)
        assignments_created.append({
            "user_id": client_id,
            "assignment_id": None  # Se actualizará después del commit
        })
    
    try:
        db.commit()
        
        return {
            "message": f"Capacitación '{training.training_name}' asignada a {len(assignments_created)} clientes del equipo '{team.team_name}'",
            "team_id": team_id,
            "training_id": training_id,
            "instructor_id": instructor_id,
            "summary": {
                "assignments_created": len(assignments_created),
                "assignments_skipped": len(assignments_skipped),
                "total_clients_selected": len(client_ids)
            },
            "details": {
                "created": assignments_created,
                "skipped": assignments_skipped
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear las asignaciones: {str(e)}")

# ================================
# ENDPOINTS PARA PROGRESO DE TECNOLOGÍAS
# ================================

@app.get("/api/v1/user-technology-progress/assignment/{assignment_id}", response_model=List[schemas.UserTechnologyProgress], tags=["Progress"])
def get_technology_progress_by_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """
    Obtener progreso de tecnologías para una asignación específica
    """
    # Verificar que la asignación existe
    assignment = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.assignment_id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    # Obtener progreso existente
    progress = db.query(models.UserTechnologyProgress).filter(
        models.UserTechnologyProgress.assignment_id == assignment_id
    ).all()
    
    return progress

@app.post("/api/v1/user-technology-progress", response_model=schemas.UserTechnologyProgress, tags=["Progress"])
def create_technology_progress(progress_data: schemas.UserTechnologyProgressCreate, db: Session = Depends(get_db)):
    """
    Crear o actualizar progreso de tecnología
    """
    # Verificar si ya existe progreso para esta tecnología y asignación
    existing_progress = db.query(models.UserTechnologyProgress).filter(
        models.UserTechnologyProgress.assignment_id == progress_data.assignment_id,
        models.UserTechnologyProgress.technology_id == progress_data.technology_id
    ).first()
    
    if existing_progress:
        # Actualizar progreso existente
        existing_progress.is_completed = progress_data.is_completed
        if progress_data.is_completed == 'Y':
            existing_progress.completed_at = datetime.utcnow()
        else:
            existing_progress.completed_at = None
        
        db.commit()
        db.refresh(existing_progress)
        return existing_progress
    else:
        # Crear nuevo progreso
        progress = models.UserTechnologyProgress(
            assignment_id=progress_data.assignment_id,
            technology_id=progress_data.technology_id,
            is_completed=progress_data.is_completed,
            completed_at=datetime.utcnow() if progress_data.is_completed == 'Y' else None
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

@app.put("/api/v1/user-technology-progress/{progress_id}", response_model=schemas.UserTechnologyProgress, tags=["Progress"])
def update_technology_progress(progress_id: int, progress_data: schemas.UserTechnologyProgressUpdate, db: Session = Depends(get_db)):
    """
    Actualizar progreso de tecnología por ID
    """
    progress = db.query(models.UserTechnologyProgress).filter(
        models.UserTechnologyProgress.progress_id == progress_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progreso no encontrado")
    
    progress.is_completed = progress_data.is_completed
    if progress_data.is_completed == 'Y':
        progress.completed_at = datetime.utcnow()
    else:
        progress.completed_at = None
    
    db.commit()
    db.refresh(progress)
    return progress

# ================================
# ENDPOINTS PARA PROGRESO DE MATERIALES
# ================================

@app.get("/api/v1/user-material-progress/assignment/{assignment_id}", response_model=List[schemas.UserMaterialProgress], tags=["Progress"])
def get_material_progress_by_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """
    Obtener progreso de materiales para una asignación específica
    """
    # Verificar que la asignación existe
    assignment = db.query(models.UserTrainingAssignment).filter(
        models.UserTrainingAssignment.assignment_id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    # Obtener progreso existente
    progress = db.query(models.UserMaterialProgress).filter(
        models.UserMaterialProgress.assignment_id == assignment_id
    ).all()
    
    return progress

@app.post("/api/v1/user-material-progress", response_model=schemas.UserMaterialProgress, tags=["Progress"])
def create_material_progress(progress_data: schemas.UserMaterialProgressCreate, db: Session = Depends(get_db)):
    """
    Crear o actualizar progreso de material
    """
    # Verificar si ya existe progreso para este material y usuario
    existing_progress = db.query(models.UserMaterialProgress).filter(
        models.UserMaterialProgress.user_id == progress_data.user_id,
        models.UserMaterialProgress.material_id == progress_data.material_id,
        models.UserMaterialProgress.assignment_id == progress_data.assignment_id
    ).first()
    
    if existing_progress:
        # Actualizar progreso existente
        existing_progress.is_completed = progress_data.is_completed
        if progress_data.is_completed == 'Y':
            existing_progress.completed_at = datetime.utcnow()
        else:
            existing_progress.completed_at = None
        
        db.commit()
        db.refresh(existing_progress)
        return existing_progress
    else:
        # Crear nuevo progreso
        progress = models.UserMaterialProgress(
            user_id=progress_data.user_id,
            material_id=progress_data.material_id,
            assignment_id=progress_data.assignment_id,
            is_completed=progress_data.is_completed,
            completed_at=datetime.utcnow() if progress_data.is_completed == 'Y' else None
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

@app.put("/api/v1/user-material-progress/{progress_id}", response_model=schemas.UserMaterialProgress, tags=["Progress"])
def update_material_progress(progress_id: int, progress_data: schemas.UserMaterialProgressUpdate, db: Session = Depends(get_db)):
    """
    Actualizar progreso de material por ID
    """
    progress = db.query(models.UserMaterialProgress).filter(
        models.UserMaterialProgress.progress_id == progress_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progreso no encontrado")
    
    progress.is_completed = progress_data.is_completed
    if progress_data.is_completed == 'Y':
        progress.completed_at = datetime.utcnow()
    else:
        progress.completed_at = None
    
    db.commit()
    db.refresh(progress)
    return progress
#dashboard powerbi
# Agregar estos imports al inicio
from fastapi.responses import JSONResponse
import json

# Agregar estos endpoints al final de tu main.py

# ================================
# ENDPOINTS ESPECÍFICOS PARA POWER BI
# ================================

@app.get("/api/v1/powerbi/users-summary", tags=["Power BI"])
def get_users_summary_for_powerbi(db: Session = Depends(get_db)):
    """
    Endpoint optimizado para Power BI - Resumen de usuarios
    """
    try:
        users_data = db.query(
            models.User.user_id,
            models.User.user_username,
            models.Person.person_first_name,
            models.Person.person_last_name,
            models.Person.person_email,
            models.Person.person_dni,
            models.Gender.gender_name,
            models.Role.role_name,
            models.User.created_at
        ).join(
            models.Person, models.User.person_id == models.Person.person_id
        ).join(
            models.Gender, models.Person.person_gender == models.Gender.gender_id
        ).join(
            models.Role, models.User.user_role == models.Role.role_id
        ).all()

        result = []
        for row in users_data:
            result.append({
                "user_id": row.user_id,
                "username": row.user_username,
                "full_name": f"{row.person_first_name} {row.person_last_name}",
                "first_name": row.person_first_name,
                "last_name": row.person_last_name,
                "email": row.person_email,
                "dni": row.person_dni,
                "gender": row.gender_name,
                "role": row.role_name,
                "created_at": row.created_at.isoformat() if row.created_at else None
            })
        
        return {"data": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/v1/powerbi/trainings-summary", tags=["Power BI"])
def get_trainings_summary_for_powerbi(db: Session = Depends(get_db)):
    """
    Endpoint optimizado para Power BI - Resumen de capacitaciones
    """
    try:
        # Obtener capacitaciones con conteo de asignaciones
        trainings_query = db.query(
            models.Training.training_id,
            models.Training.training_name,
            models.Training.training_description,
            models.Training.created_at
        ).filter(models.Training.training_status == 'A')
        
        result = []
        for training in trainings_query.all():
            # Contar asignaciones por estado
            assignments = db.query(models.UserTrainingAssignment).filter(
                models.UserTrainingAssignment.training_id == training.training_id
            ).all()
            
            # Obtener tecnologías asociadas
            technologies = db.query(models.Technology.technology_name).join(
                models.TrainingTechnology,
                models.Technology.technology_id == models.TrainingTechnology.technology_id
            ).filter(
                models.TrainingTechnology.training_id == training.training_id
            ).all()
            
            tech_names = [tech.technology_name for tech in technologies]
            
            assignment_stats = {
                'not_started': len([a for a in assignments if a.assignment_status == 'not_started']),
                'assigned': len([a for a in assignments if a.assignment_status == 'assigned']),
                'in_progress': len([a for a in assignments if a.assignment_status == 'in_progress']),
                'completed': len([a for a in assignments if a.assignment_status == 'completed']),
                'total': len(assignments)
            }
            
            result.append({
                "training_id": training.training_id,
                "training_name": training.training_name,
                "training_description": training.training_description,
                "technologies": ", ".join(tech_names),
                "technology_count": len(tech_names),
                "created_at": training.created_at.isoformat() if training.created_at else None,
                **assignment_stats
            })
        
        return {"data": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/v1/powerbi/assignments-detail", tags=["Power BI"])
def get_assignments_detail_for_powerbi(db: Session = Depends(get_db)):
    """
    Endpoint optimizado para Power BI - Detalle de asignaciones
    """
    try:
        assignments_data = db.query(
            models.UserTrainingAssignment.assignment_id,
            models.UserTrainingAssignment.assignment_status,
            models.UserTrainingAssignment.created_at,
            models.UserTrainingAssignment.updated_at,
            # Usuario (cliente)
            models.User.user_id.label('client_id'),
            models.User.user_username.label('client_username'),
            models.Person.person_first_name.label('client_first_name'),
            models.Person.person_last_name.label('client_last_name'),
            models.Person.person_email.label('client_email'),
            models.Gender.gender_name.label('client_gender'),
            # Capacitación
            models.Training.training_id,
            models.Training.training_name,
            models.Training.training_description,
        ).join(
            models.User, models.UserTrainingAssignment.user_id == models.User.user_id
        ).join(
            models.Person, models.User.person_id == models.Person.person_id
        ).join(
            models.Gender, models.Person.person_gender == models.Gender.gender_id
        ).join(
            models.Training, models.UserTrainingAssignment.training_id == models.Training.training_id
        ).all()

        result = []
        for row in assignments_data:
            # Obtener instructor si existe
            instructor_info = None
            if hasattr(row, 'instructor_id') and row.instructor_id:
                instructor = db.query(
                    models.User.user_username,
                    models.Person.person_first_name,
                    models.Person.person_last_name
                ).join(
                    models.Person, models.User.person_id == models.Person.person_id
                ).filter(models.User.user_id == row.instructor_id).first()
                
                if instructor:
                    instructor_info = f"{instructor.person_first_name} {instructor.person_last_name}"
            
            result.append({
                "assignment_id": row.assignment_id,
                "assignment_status": row.assignment_status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "client_id": row.client_id,
                "client_username": row.client_username,
                "client_name": f"{row.client_first_name} {row.client_last_name}",
                "client_first_name": row.client_first_name,
                "client_last_name": row.client_last_name,
                "client_email": row.client_email,
                "client_gender": row.client_gender,
                "training_id": row.training_id,
                "training_name": row.training_name,
                "training_description": row.training_description,
                "instructor_name": instructor_info
            })
        
        return {"data": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/v1/powerbi/teams-summary", tags=["Power BI"])
def get_teams_summary_for_powerbi(db: Session = Depends(get_db)):
    """
    Endpoint optimizado para Power BI - Resumen de equipos
    """
    try:
        teams_data = db.query(
            models.Team.team_id,
            models.Team.team_name,
            models.Team.team_description,
            models.Team.created_at,
            # Supervisor
            models.User.user_username.label('supervisor_username'),
            models.Person.person_first_name.label('supervisor_first_name'),
            models.Person.person_last_name.label('supervisor_last_name')
        ).join(
            models.User, models.Team.supervisor_id == models.User.user_id
        ).join(
            models.Person, models.User.person_id == models.Person.person_id
        ).filter(models.Team.team_status == 'A').all()

        result = []
        for team in teams_data:
            # Contar miembros por tipo
            members = db.query(models.TeamMember).filter(
                models.TeamMember.team_id == team.team_id,
                models.TeamMember.member_status == 'A'
            ).all()
            
            member_stats = {
                'instructors': len([m for m in members if m.member_role == 'instructor']),
                'clients': len([m for m in members if m.member_role == 'client']),
                'total_members': len(members)
            }
            
            result.append({
                "team_id": team.team_id,
                "team_name": team.team_name,
                "team_description": team.team_description,
                "created_at": team.created_at.isoformat() if team.created_at else None,
                "supervisor_name": f"{team.supervisor_first_name} {team.supervisor_last_name}",
                "supervisor_username": team.supervisor_username,
                **member_stats
            })
        
        return {"data": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/v1/powerbi/progress-summary", tags=["Power BI"])
def get_progress_summary_for_powerbi(db: Session = Depends(get_db)):
    """
    Endpoint para mostrar progreso general en Power BI
    """
    try:
        # Progreso de tecnologías por usuario y capacitación
        tech_progress = db.query(
            models.UserTechnologyProgress.assignment_id,
            models.UserTechnologyProgress.is_completed,
            models.UserTechnologyProgress.completed_at,
            models.Technology.technology_name,
            models.User.user_username,
            models.Person.person_first_name,
            models.Person.person_last_name,
            models.Training.training_name
        ).join(
            models.Technology, models.UserTechnologyProgress.technology_id == models.Technology.technology_id
        ).join(
            models.UserTrainingAssignment, models.UserTechnologyProgress.assignment_id == models.UserTrainingAssignment.assignment_id
        ).join(
            models.User, models.UserTrainingAssignment.user_id == models.User.user_id
        ).join(
            models.Person, models.User.person_id == models.Person.person_id
        ).join(
            models.Training, models.UserTrainingAssignment.training_id == models.Training.training_id
        ).all()

        result = []
        for progress in tech_progress:
            result.append({
                "assignment_id": progress.assignment_id,
                "technology_name": progress.technology_name,
                "is_completed": progress.is_completed == 'Y',
                "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
                "user_name": f"{progress.person_first_name} {progress.person_last_name}",
                "username": progress.user_username,
                "training_name": progress.training_name
            })
        
        return {"data": result, "count": len(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Endpoint general para obtener todas las tablas disponibles
@app.get("/api/v1/powerbi/tables", tags=["Power BI"])
def get_available_tables_for_powerbi():
    """
    Listar todos los endpoints disponibles para Power BI
    """
    return {
        "available_endpoints": [
            {
                "name": "users_summary",
                "url": "/api/v1/powerbi/users-summary",
                "description": "Resumen completo de usuarios con roles y datos personales"
            },
            {
                "name": "trainings_summary", 
                "url": "/api/v1/powerbi/trainings-summary",
                "description": "Resumen de capacitaciones con estadísticas de asignaciones"
            },
            {
                "name": "assignments_detail",
                "url": "/api/v1/powerbi/assignments-detail", 
                "description": "Detalle completo de asignaciones de capacitaciones"
            },
            {
                "name": "teams_summary",
                "url": "/api/v1/powerbi/teams-summary",
                "description": "Resumen de equipos con contadores de miembros"
            },
            {
                "name": "progress_summary",
                "url": "/api/v1/powerbi/progress-summary",
                "description": "Progreso de tecnologías por usuario y capacitación"
            }
        ]
    }
