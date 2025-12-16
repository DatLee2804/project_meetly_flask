# src/models/project.py

from sqlalchemy import Column, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.models.base import Base # Kế thừa Base

# Bảng trung gian (Association Table) cho mối quan hệ N:N giữa Project và User
# Dùng để lưu trữ: Project nào có những thành viên nào
project_members = Table(
    'project_members', 
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('project_id', String, ForeignKey('projects.id'), primary_key=True)
)

class Project(Base):
    __tablename__ = 'projects'

    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Mối quan hệ (Relationships)
    # 1. Tasks thuộc Project này (One-to-Many)
    tasks = relationship(
        "Task", 
        back_populates="project", 
        cascade="all, delete-orphan" # Xóa Tasks khi Project bị xóa
    )
    
    # 2. Thành viên của Project (Many-to-Many thông qua project_members)
    members = relationship(
        "User", 
        secondary=project_members, 
        back_populates="projects"
    )
    
    # 3. Meetings thuộc Project này (One-to-Many, sẽ định nghĩa sau)
    meetings = relationship("Meeting", back_populates="project", cascade="all, delete-orphan") 

    def __repr__(self):
        return f"<Project(id='{self.id}', name='{self.name}')>"