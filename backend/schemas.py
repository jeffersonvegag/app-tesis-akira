from pydantic import BaseModel, EmailStr
from datetime import datetime, time
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

class UserPositionBase(BaseModel):
    position_name: str

class UserPositionCreate(UserPositionBase):
    pass

class UserPosition(UserPositionBase):
    user_position_id: int
    position_status: str
    user_position_created_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    user_username: str
    person_id: int
    user_role: int
    user_position_id: int

class UserCreate(UserBase):
    user_password: str

class User(UserBase):
    user_id: int
    user_status: str
    user_created_at: datetime
    person: Person
    role: Role
    position: UserPosition
    
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

class CourseModalityBase(BaseModel):
    course_modality_name: str

class CourseModalityCreate(CourseModalityBase):
    pass

class CourseModality(CourseModalityBase):
    course_modality_id: int
    course_modality_created_at: datetime
    
    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    course_name: str
    course_link: str
    course_duration: time
    technology_id: Optional[int] = None
    course_modality_id: Optional[int] = None
    course_credentials: Optional[str] = ""

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    course_id: int
    course_created_at: datetime
    technology: Optional[Technology] = None
    modality: Optional[CourseModality] = None
    
    class Config:
        from_attributes = True

class CareerPlanBase(BaseModel):
    course_id: int

class CareerPlanCreate(CareerPlanBase):
    pass

class CareerPlan(CareerPlanBase):
    career_plan_id: int
    course: Course
    
    class Config:
        from_attributes = True

class UserCareerPlanBase(BaseModel):
    user_id: int
    career_plan_id: int

class UserCareerPlanCreate(UserCareerPlanBase):
    pass

class UserCareerPlan(UserCareerPlanBase):
    user_career_plan_id: int
    career_plan_status: str
    user_career_plan_created_at: datetime
    user: User
    career_plan: CareerPlan
    
    class Config:
        from_attributes = True

class Login(BaseModel):
    username: str
    password: str

class CourseAssignmentBase(BaseModel):
    course_id: int
    client_id: int
    instructor_id: Optional[int] = None
    assignment_status: Optional[str] = 'P'
    assignment_start_date: Optional[datetime] = None
    assignment_end_date: Optional[datetime] = None

class CourseAssignmentCreate(CourseAssignmentBase):
    pass

class CourseAssignment(CourseAssignmentBase):
    course_assignment_id: int
    assignment_created_at: datetime
    course: Course
    client: User
    instructor: Optional[User] = None
    
    class Config:
        from_attributes = True

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