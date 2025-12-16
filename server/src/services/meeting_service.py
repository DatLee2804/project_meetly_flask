# src/services/meeting_service.py

from sqlalchemy.orm import Session
from src.schemas import meeting as meeting_schemas
from src.models.meeting import Meeting # Giả định Model Meeting đã được tạo
from src.repositories.meeting_repository import MeetingRepository # Giả định Repository
from src.repositories.project_repository import ProjectRepository
from uuid import uuid4
from typing import List, Optional
from fastapi import HTTPException, status

class MeetingService:
    def __init__(self, db: Session):
        self.repo = MeetingRepository(db)
        self.project_repo = ProjectRepository(db)

    def create_meeting(self, meeting_data: meeting_schemas.MeetingCreate, creator_id: str) -> Meeting:
        """Tạo cuộc họp mới và kiểm tra quyền."""
        
        project = self.project_repo.get_by_id(meeting_data.project_id)
        if not project or creator_id not in [m.id for m in project.members]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Cannot create meeting for this project.")

        # Thêm logic kiểm tra ngày giờ (start_date < end_date)
        
        db_meeting_data = meeting_data.model_dump(exclude_unset=True)
        db_meeting_data['id'] = str(uuid4())
        
        return self.repo.create(db_meeting_data)
        
    def get_meetings_by_project(self, project_id: str, user_id: str) -> List[Meeting]:
        """Lấy danh sách cuộc họp của một dự án."""
        
        # Logic nghiệp vụ: Kiểm tra quyền xem Meeting
        project = self.project_repo.get_by_id(project_id)
        if not project or user_id not in [m.id for m in project.members]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project's meetings.")

        return self.repo.get_meetings_by_project(project_id)

    # Các hàm nghiệp vụ khác...