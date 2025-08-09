from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# Base schemas
class GenderBase(BaseModel):
    gender_name: str

class GenderCreate(GenderBase):
    pass

class Gender(GenderBase):
    gender_id: int
    gender_status: str
    gender_created_at: datetime
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    role_name: str
    role_description: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    role_id: int
    role_status: str
    role_created_at: datetime
    
    class Config:
        from_attributes = True

class PersonBase(BaseModel):
    person_dni: int
    person_first_name: str
    person_last_name: str
    person_gender: int
    person_email: str

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    person_id: int
    person_status: str
    person_created_at: datetime
    gender: Gender
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    user_username: str
    person_id: int
    user_role: int

class UserCreate(UserBase):
    user_password: str

class User(UserBase):
    user_id: int
    user_status: str
    user_created_at: datetime
    person: Person
    role: Role
    
    class Config:
        from_attributes = True

class TechnologyBase(BaseModel):
    technology_name: str

class TechnologyCreate(TechnologyBase):
    pass

class Technology(TechnologyBase):
    technology_id: int
    technology_created_at: datetime
    
    class Config:
        from_attributes = True

class Login(BaseModel):
    username: str
    password: str

class TrainingBase(BaseModel):
    training_name: str
    training_description: Optional[str] = None

class TrainingCreate(TrainingBase):
    pass

class Training(TrainingBase):
    training_id: int
    training_status: str
    training_created_at: datetime
    training_technologies: List['TrainingTechnology'] = []
    
    class Config:
        from_attributes = True

class TrainingTechnologyBase(BaseModel):
    training_id: int
    technology_id: int

class TrainingTechnologyCreate(TrainingTechnologyBase):
    pass

class TrainingTechnology(TrainingTechnologyBase):
    training_technology_id: int
    created_at: datetime
    technology: Technology
    
    class Config:
        from_attributes = True

class BulkDataRequest(BaseModel):
    technologies: List[str]
    trainings: List[dict]

# Esquemas para asignaciones de capacitaciones a usuarios
class UserTrainingAssignmentBase(BaseModel):
    user_id: int
    training_id: int
    instructor_id: Optional[int] = None
    instructor_meeting_link: Optional[str] = None

class UserTrainingAssignmentCreate(UserTrainingAssignmentBase):
    pass

class UserTrainingAssignment(UserTrainingAssignmentBase):
    assignment_id: int
    assignment_status: str
    assignment_created_at: datetime
    completion_percentage: float
    user: User
    training: Training
    instructor: Optional[User] = None
    
    class Config:
        from_attributes = True

class UserTrainingAssignmentUpdate(BaseModel):
    assignment_status: Optional[str] = None
    instructor_id: Optional[int] = None
    instructor_meeting_link: Optional[str] = None

# Esquemas para progreso de tecnologías por usuario
class UserTechnologyProgressBase(BaseModel):
    assignment_id: int
    technology_id: int
    is_completed: bool = False

class UserTechnologyProgressCreate(UserTechnologyProgressBase):
    pass

class UserTechnologyProgress(UserTechnologyProgressBase):
    progress_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    technology: Technology
    
    class Config:
        from_attributes = True

class UserTechnologyProgressUpdate(BaseModel):
    is_completed: bool

# Esquemas para estado de capacitaciones por usuario
class UserTrainingStatusBase(BaseModel):
    user_id: int
    total_trainings_assigned: int = 0
    trainings_completed: int = 0
    trainings_in_progress: int = 0
    overall_status: str = 'no_training'

class UserTrainingStatusCreate(UserTrainingStatusBase):
    pass

class UserTrainingStatus(UserTrainingStatusBase):
    status_id: int
    last_updated: datetime
    created_at: datetime
    user: User
    
    class Config:
        from_attributes = True

class UserTrainingStatusUpdate(BaseModel):
    total_trainings_assigned: Optional[int] = None
    trainings_completed: Optional[int] = None
    trainings_in_progress: Optional[int] = None
    overall_status: Optional[str] = None

# Esquemas para gestión de equipos
class TeamBase(BaseModel):
    team_name: str
    team_description: Optional[str] = None
    supervisor_id: int

class TeamCreate(TeamBase):
    pass

class TeamMemberBase(BaseModel):
    user_id: int
    member_role: str  # 'instructor' or 'client'

class TeamMemberCreate(TeamMemberBase):
    team_id: int

class TeamMember(TeamMemberBase):
    team_member_id: int
    team_id: int
    member_status: str
    joined_at: datetime
    user: User
    
    class Config:
        from_attributes = True

class Team(TeamBase):
    team_id: int
    team_status: str
    team_created_at: datetime
    supervisor: User
    team_members: List[TeamMember] = []
    
    class Config:
        from_attributes = True

class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    team_description: Optional[str] = None
    supervisor_id: Optional[int] = None

class TeamCreateWithMembers(BaseModel):
    team_name: str
    team_description: Optional[str] = None
    supervisor_id: int
    instructors: List[int] = []
    clients: List[int] = []

class TeamMemberCreateForm(BaseModel):
    user_id: int
    member_role: str  # 'instructor' or 'client'

# Esquemas para materiales de apoyo
class TrainingMaterialBase(BaseModel):
    training_id: int
    material_title: str
    material_description: Optional[str] = None
    material_url: str
    material_type: str = 'link'

class TrainingMaterialCreate(TrainingMaterialBase):
    pass

class TrainingMaterial(TrainingMaterialBase):
    material_id: int
    instructor_id: int
    material_status: str
    material_created_at: datetime
    training: Training
    instructor: User
    
    class Config:
        from_attributes = True

class TrainingMaterialUpdate(BaseModel):
    material_title: Optional[str] = None
    material_description: Optional[str] = None
    material_url: Optional[str] = None
    material_type: Optional[str] = None

# Esquemas para progreso de tecnologías
class UserTechnologyProgressBase(BaseModel):
    assignment_id: int
    technology_id: int
    is_completed: str = 'N'

class UserTechnologyProgressCreate(UserTechnologyProgressBase):
    pass

class UserTechnologyProgressUpdate(BaseModel):
    is_completed: str

class UserTechnologyProgress(UserTechnologyProgressBase):
    progress_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    assignment: Optional['UserTrainingAssignment'] = None
    technology: Technology
    
    class Config:
        from_attributes = True

# Esquemas para progreso de materiales
class UserMaterialProgressBase(BaseModel):
    user_id: int
    material_id: int
    assignment_id: int
    is_completed: str = 'N'

class UserMaterialProgressCreate(UserMaterialProgressBase):
    pass

class UserMaterialProgressUpdate(BaseModel):
    is_completed: str

class UserMaterialProgress(UserMaterialProgressBase):
    progress_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    user: User
    material: TrainingMaterial
    assignment: Optional['UserTrainingAssignment'] = None
    
    class Config:
        from_attributes = True