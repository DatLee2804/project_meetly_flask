# src/api/v1/ai_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.core.security import get_current_user
from src.schemas import meeting as meeting_schemas
from src.schemas import task as task_schemas
from src.schemas import user as user_schemas
# Giả định Service đã được tạo
from src.services.ai_service import AIService 

router = APIRouter()

@router.post("/meeting/{meeting_id}/process-transcript", response_model=List[task_schemas.TaskOut])
def process_transcript_and_get_tasks(
    meeting_id: str,
    transcript_data: meeting_schemas.MeetingTranscript, # Dữ liệu chứa transcript text
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sử dụng AI (Gemini) để phân tích bản ghi chép cuộc họp (transcript),
    tạo và lưu lại các Tasks được phát hiện.
    """
    service = AIService(db)
    # Logic kiểm tra quyền truy cập Meeting
    
    # 1. Gọi AI Service để phân tích và tạo Task.
    tasks = service.process_transcript_and_create_tasks(
        meeting_id=meeting_id,
        transcript=transcript_data.transcript,
        current_user_id=current_user.id
    )
    
    if not tasks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="AI failed to generate tasks or transcript is empty.")
    
    return tasks

@router.post("/chat", response_model=meeting_schemas.MeetingTranscript) # Dùng lại schema cho Response Text
def chat_with_gemini_assistant(
    prompt: meeting_schemas.MeetingTranscript, # Dùng lại schema cho User prompt
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint cho Chatbot (Gemini Assistant) giao tiếp với người dùng."""
    service = AIService(db)
    response_text = service.get_chat_response(prompt.transcript, current_user.id)
    return meeting_schemas.MeetingTranscript(transcript=response_text)