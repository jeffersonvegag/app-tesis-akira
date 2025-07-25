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