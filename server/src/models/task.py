# src/models/task.py

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, ARRAY, Integer
from sqlalchemy.orm import relationship
from src.models.base import Base # Kế thừa Base
from datetime import datetime

class Task(Base):
    __tablename__ = 'tasks'

    id = Column(String, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Khóa ngoại liên kết với User và Project
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    assignee_id = Column(String, ForeignKey('users.id'), nullable=True) # Có thể không được gán
    author_id = Column(String, ForeignKey('users.id'), nullable=True)
    
    # Các trường dữ liệu khác
    status = Column(String(50), default='To Do')
    priority = Column(String(50), default='Medium')
    tags = Column(ARRAY(String), default=[])
    due_date = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Mối quan hệ (Relationships)
    # 1. Project mà Task thuộc về (Many-to-One)
    project = relationship("Project", back_populates="tasks")
    
    # 2. Người được giao việc (Many-to-One)
    assignee = relationship(
        "User", 
        back_populates="assigned_tasks", 
        foreign_keys=[assignee_id]
    )
    
    # 3. Người tạo Task (Many-to-One)
    author = relationship(
        "User", 
        back_populates="authored_tasks", 
        foreign_keys=[author_id]
    )
    
    # Bạn có thể thêm mối quan hệ cho Comments ở đây nếu cần

    def __repr__(self):
        return f"<Task(id='{self.id}', title='{self.title}', status='{self.status}')>"