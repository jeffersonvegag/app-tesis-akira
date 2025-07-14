from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL, Text, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Gender(Base):
    __tablename__ = "per_c_gender"
    
    gender_id = Column(Integer, primary_key=True, index=True)
    gender_name = Column(String(20), nullable=False)
    gender_status = Column(String(1), nullable=False, default='A')
    gender_created_at = Column(DateTime, default=datetime.utcnow)
    
    persons = relationship("Person", back_populates="gender")

class Role(Base):
    __tablename__ = "per_c_role"
    
    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(30), nullable=False)
    role_description = Column(String(100), nullable=False)
    role_status = Column(String(1), nullable=False, default='A')
    role_created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="role")

class Person(Base):
    __tablename__ = "per_m_person"
    
    person_id = Column(Integer, primary_key=True, index=True)
    person_dni = Column(Integer, nullable=False, unique=True)
    person_first_name = Column(String(20), nullable=False)
    person_last_name = Column(String(20), nullable=False)
    person_gender = Column(Integer, ForeignKey("per_c_gender.gender_id"), nullable=False)
    person_email = Column(String(30), nullable=False, unique=True)
    person_status = Column(String(1), nullable=False, default='A')
    person_created_at = Column(DateTime, default=datetime.utcnow)
    
    gender = relationship("Gender", back_populates="persons")
    user = relationship("User", back_populates="person", uselist=False)

class UserPosition(Base):
    __tablename__ = "acd_m_user_position"
    
    user_position_id = Column(Integer, primary_key=True, index=True)
    position_name = Column(String(50), nullable=False)
    position_status = Column(String(1), nullable=False, default='A')
    user_position_created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="position")

class User(Base):
    __tablename__ = "per_m_user"
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_username = Column(String(50), nullable=False, unique=True)
    user_password = Column(String(255), nullable=False)
    person_id = Column(Integer, ForeignKey("per_m_person.person_id"), nullable=False)
    user_role = Column(Integer, ForeignKey("per_c_role.role_id"), nullable=False)
    user_position_id = Column(Integer, ForeignKey("acd_m_user_position.user_position_id"), nullable=False)
    user_status = Column(String(1), nullable=False, default='A')
    user_created_at = Column(DateTime, default=datetime.utcnow)
    
    person = relationship("Person", back_populates="user")
    role = relationship("Role", back_populates="users")
    position = relationship("UserPosition", back_populates="users")
    career_plans = relationship("UserCareerPlan", back_populates="user")

class Technology(Base):
    __tablename__ = "acd_m_technology"
    
    technology_id = Column(Integer, primary_key=True, index=True)
    technology_name = Column(String(50), nullable=False)
    technology_created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="technology")

class CourseModality(Base):
    __tablename__ = "acd_c_course_modality"
    
    course_modality_id = Column(Integer, primary_key=True, index=True)
    course_modality_name = Column(String(30), nullable=False)
    course_modality_created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="modality")

class CourseType(Base):
    __tablename__ = "acd_c_course_type"
    
    course_type_id = Column(Integer, primary_key=True, index=True)
    course_type_name = Column(String(20), nullable=False)
    course_type_created_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "acd_m_course"
    
    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String(500), nullable=False)
    course_link = Column(String(500), nullable=False)
    course_duration = Column(Time, nullable=False)
    technology_id = Column(Integer, ForeignKey("acd_m_technology.technology_id"), nullable=True)
    course_modality_id = Column(Integer, ForeignKey("acd_c_course_modality.course_modality_id"), nullable=True)
    course_credentials = Column(String(200), default="")
    course_created_at = Column(DateTime, default=datetime.utcnow)
    
    technology = relationship("Technology", back_populates="courses")
    modality = relationship("CourseModality", back_populates="courses")
    career_plans = relationship("CareerPlan", back_populates="course")

class CareerPlan(Base):
    __tablename__ = "acd_m_career_plan"
    
    career_plan_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("acd_m_course.course_id"), nullable=False)
    
    course = relationship("Course", back_populates="career_plans")
    user_career_plans = relationship("UserCareerPlan", back_populates="career_plan")

class UserCareerPlan(Base):
    __tablename__ = "acd_t_user_career_plan"
    
    user_career_plan_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    career_plan_id = Column(Integer, ForeignKey("acd_m_career_plan.career_plan_id"), nullable=False)
    career_plan_status = Column(String(1), nullable=False, default='P')
    user_career_plan_created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="career_plans")
    career_plan = relationship("CareerPlan", back_populates="user_career_plans")
class CourseAssignment(Base):
    __tablename__ = "acd_t_course_assignment"
    
    course_assignment_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("acd_m_course.course_id"), nullable=False)
    client_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=True)
    assignment_status = Column(String(1), nullable=False, default='P')  # P=Pendiente, E=En Progreso, C=Completado, X=Cancelado
    assignment_created_at = Column(DateTime, default=datetime.utcnow)
    assignment_start_date = Column(DateTime, nullable=True)
    assignment_end_date = Column(DateTime, nullable=True)
    
    course = relationship("Course")
    client = relationship("User", foreign_keys=[client_id])
    instructor = relationship("User", foreign_keys=[instructor_id])

class Training(Base):
    __tablename__ = "acd_m_training"
    
    training_id = Column(Integer, primary_key=True, index=True)
    training_name = Column(String(100), nullable=False)
    training_description = Column(Text, nullable=True)
    training_status = Column(String(1), nullable=False, default='A')
    training_created_at = Column(DateTime, default=datetime.utcnow)
    
    training_technologies = relationship("TrainingTechnology", back_populates="training")

class TrainingTechnology(Base):
    __tablename__ = "acd_t_training_technology"
    
    training_technology_id = Column(Integer, primary_key=True, index=True)
    training_id = Column(Integer, ForeignKey("acd_m_training.training_id"), nullable=False)
    technology_id = Column(Integer, ForeignKey("acd_m_technology.technology_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    training = relationship("Training", back_populates="training_technologies")
    technology = relationship("Technology")

class UserTrainingAssignment(Base):
    __tablename__ = "acd_t_user_training_assignment"
    
    assignment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    training_id = Column(Integer, ForeignKey("acd_m_training.training_id"), nullable=False)
    assignment_status = Column(String(20), nullable=False, default='assigned')  # assigned, in_progress, completed
    assignment_created_at = Column(DateTime, default=datetime.utcnow)
    completion_percentage = Column(DECIMAL(5,2), nullable=False, default=0.00)
    instructor_meeting_link = Column(String(500), nullable=True)
    
    user = relationship("User")
    training = relationship("Training")
    technology_progress = relationship("UserTechnologyProgress", back_populates="assignment")

class UserTechnologyProgress(Base):
    __tablename__ = "acd_t_user_technology_progress"
    
    progress_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("acd_t_user_training_assignment.assignment_id"), nullable=False)
    technology_id = Column(Integer, ForeignKey("acd_m_technology.technology_id"), nullable=False)
    is_completed = Column(String(1), nullable=False, default='N')  # Y/N
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assignment = relationship("UserTrainingAssignment", back_populates="technology_progress")
    technology = relationship("Technology")