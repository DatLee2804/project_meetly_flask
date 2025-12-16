# src/models/meeting.py

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from src.models.base import Base
from datetime import datetime

class Meeting(Base):
    __tablename__ = 'meetings'

    id = Column(String, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Thời gian cuộc họp
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Khóa ngoại
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    
    # Thông tin AI/WebRTC
    recording_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True) # Tóm tắt của AI
    
    # Người tham dự (Lưu dưới dạng mảng IDs, hoặc tạo bảng M:N nếu cần phức tạp hơn)
    attendee_ids = Column(ARRAY(String), default=[]) 
    
    # Mối quan hệ
    project = relationship("Project", back_populates="meetings") 
    
    def __repr__(self):
        return f"<Meeting(id='{self.id}', title='{self.title}')>"