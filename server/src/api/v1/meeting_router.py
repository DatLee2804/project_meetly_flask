# src/api/v1/meeting_router.py
import shutil
import os
from fastapi import File, UploadFile, HTTPException
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.core.security import get_current_user
from src.schemas import meeting as meeting_schemas
from src.schemas import user as user_schemas
from src.services.meeting_service import MeetingService 
from src.models.meeting import Meeting

# --- ĐÃ XÓA CÁC IMPORT VÀ CODE LIÊN QUAN ĐẾN AI ---

router = APIRouter()

@router.get("/{project_id}", response_model=List[meeting_schemas.MeetingOut])
def read_meetings_by_project(
    project_id: str,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các cuộc họp thuộc một dự án."""
    service = MeetingService(db)
    meetings = service.get_meetings_by_project(project_id, current_user.id)
    return meetings

@router.post("/", response_model=meeting_schemas.MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_data: meeting_schemas.MeetingCreate,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo một cuộc họp mới."""
    service = MeetingService(db)
    meeting = service.create_meeting(meeting_data, current_user.id)
    return meeting

@router.post("/{meeting_id}/recording")
def upload_meeting_recording(meeting_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """API nhận file video từ Meeting App và lưu vào server"""
    
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()  
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Tạo thư mục nếu chưa có
    os.makedirs("static/recordings", exist_ok=True)

    file_location = f"static/recordings/{meeting_id}.webm"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Could not save file")

    # Cập nhật URL vào DB
    full_url = f"http://localhost:8000/{file_location}"
    meeting.recording_url = full_url
    
    db.commit()
    db.refresh(meeting)
    
    return {"message": "Upload successful", "url": full_url}