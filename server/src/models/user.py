# src/models/user.py

from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from src.models.base import Base # Kế thừa Base

class User(Base):
    __tablename__ = 'users'

    # Trường chính
    id = Column(String, primary_key=True) # Sử dụng String/UUID thay vì Integer ID để đồng bộ với Frontend
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    
    # Trường bảo mật
    hashed_password = Column(String, nullable=False)
    
    # Các trường khác
    avatar = Column(String, nullable=True) # URL avatar
    is_active = Column(Boolean, default=True)

    # Mối quan hệ (Relationships)
    # 1. Tasks được giao cho User này
    assigned_tasks = relationship(
        "Task", 
        back_populates="assignee", 
        foreign_keys="[Task.assignee_id]"
    )
    # 2. Tasks do User này tạo
    authored_tasks = relationship(
        "Task", 
        back_populates="author", 
        foreign_keys="[Task.author_id]"
    )
    # 3. Mối quan hệ N-to-N (nhiều-nhiều) với Project sẽ được định nghĩa trong project.py
    projects = relationship(
        "Project", 
        secondary="project_members", 
        back_populates="members"
    )

    def __repr__(self):
        return f"<User(id='{self.id}', username='{self.username}')>"