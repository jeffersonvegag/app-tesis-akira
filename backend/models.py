from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL, Text
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

class User(Base):
    __tablename__ = "per_m_user"
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_username = Column(String(50), nullable=False, unique=True)
    user_password = Column(String(255), nullable=False)
    person_id = Column(Integer, ForeignKey("per_m_person.person_id"), nullable=False)
    user_role = Column(Integer, ForeignKey("per_c_role.role_id"), nullable=False)
    user_status = Column(String(1), nullable=False, default='A')
    user_created_at = Column(DateTime, default=datetime.utcnow)
    
    person = relationship("Person", back_populates="user")
    role = relationship("Role", back_populates="users")

class Technology(Base):
    __tablename__ = "acd_m_technology"
    
    technology_id = Column(Integer, primary_key=True, index=True)
    technology_name = Column(String(50), nullable=False)
    technology_created_at = Column(DateTime, default=datetime.utcnow)

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
    instructor_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=True)
    assignment_status = Column(String(20), nullable=False, default='assigned')  # assigned, in_progress, completed
    assignment_created_at = Column(DateTime, default=datetime.utcnow)
    completion_percentage = Column(DECIMAL(5,2), nullable=False, default=0.00)
    instructor_meeting_link = Column(String(500), nullable=True)
    
    user = relationship("User", foreign_keys=[user_id])
    training = relationship("Training")
    instructor = relationship("User", foreign_keys=[instructor_id])
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

class UserTrainingStatus(Base):
    __tablename__ = "acd_t_user_training_status"
    
    status_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False, unique=True)
    total_trainings_assigned = Column(Integer, nullable=False, default=0)
    trainings_completed = Column(Integer, nullable=False, default=0)
    trainings_in_progress = Column(Integer, nullable=False, default=0)
    overall_status = Column(String(20), nullable=False, default='no_training')  # no_training, in_progress, completed
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class Team(Base):
    __tablename__ = "per_m_team"
    
    team_id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(100), nullable=False)
    team_description = Column(Text, nullable=True)
    supervisor_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    team_status = Column(String(1), nullable=False, default='A')
    team_created_at = Column(DateTime, default=datetime.utcnow)
    
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    team_members = relationship("TeamMember", back_populates="team")

class TeamMember(Base):
    __tablename__ = "per_t_team_member"
    
    team_member_id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("per_m_team.team_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    member_role = Column(String(20), nullable=False)  # 'instructor' or 'client'
    member_status = Column(String(1), nullable=False, default='A')
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    team = relationship("Team", back_populates="team_members")
    user = relationship("User")

class TrainingMaterial(Base):
    __tablename__ = "acd_m_training_material"
    
    material_id = Column(Integer, primary_key=True, index=True)
    training_id = Column(Integer, ForeignKey("acd_m_training.training_id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    material_title = Column(String(200), nullable=False)
    material_description = Column(Text, nullable=True)
    material_url = Column(String(500), nullable=False)
    material_type = Column(String(50), nullable=False, default='link')  # 'link', 'document', 'video'
    material_status = Column(String(1), nullable=False, default='A')
    material_created_at = Column(DateTime, default=datetime.utcnow)
    
    training = relationship("Training")
    instructor = relationship("User")

class UserMaterialProgress(Base):
    __tablename__ = "acd_t_user_material_progress"
    
    progress_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("per_m_user.user_id"), nullable=False)
    material_id = Column(Integer, ForeignKey("acd_m_training_material.material_id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("acd_t_user_training_assignment.assignment_id"), nullable=False)
    is_completed = Column(String(1), nullable=False, default='N')  # Y/N
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    material = relationship("TrainingMaterial")
    assignment = relationship("UserTrainingAssignment")