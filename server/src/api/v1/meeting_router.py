import shutil
import os
from urllib.parse import urlparse # Cần cái này để parse URL
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.orm import joinedload  # <--- Thêm cái này
# --- Core Imports ---
from src.core.database import get_db
from src.core.security import get_current_user
from src.schemas import meeting as meeting_schemas
from src.schemas import user as user_schemas
from src.services.meeting_service import MeetingService 
from src.models.meeting import Meeting
from src.models.user import User

# --- AI AGENT IMPORT ---
# Lưu ý: Đảm bảo folder AI nằm trong server và có __init__.py
try:
    from AI.src.agents.meeting_to_task.agent import MeetingToTaskAgent
    print("✅ AI Agent imported successfully")
    AI_AVAILABLE = True
    # Khởi tạo Agent 1 lần để dùng chung
    meeting_agent = MeetingToTaskAgent()
except ImportError as e:
    print(f"⚠️ Warning: Could not import AI Agent. AI features will be disabled. Error: {e}")
    AI_AVAILABLE = False
    meeting_agent = None

router = APIRouter()

# --- Background Task Function ---
def _run_ai_analysis_task(meeting_id: str, db: Session):
    """Chạy AI Agent ngầm để không chặn API"""
    if not AI_AVAILABLE or not meeting_agent:
        print("❌ AI Agent not available.")
        return

    print(f"\n🚀 [AI TASK] Starting analysis for Meeting ID: {meeting_id}")
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting or not meeting.recording_url:
            print("❌ Error: No recording URL found.")
            return

        # Convert URL http://localhost:8000/static/... -> static/...
        parsed_url = urlparse(meeting.recording_url)
        audio_path = parsed_url.path.lstrip('/')
        
        # Kiểm tra file tồn tại
        if not os.path.exists(audio_path):
            print(f"❌ Error: File not found at {audio_path}")
            return

        # Lấy thông tin người tham gia
        participants_info = []
        if meeting.attendees:
            # Giả sử attendees là list ID hoặc JSON string
            # Logic lấy user từ DB...
            pass 

        metadata = {
            "title": meeting.title,
            "id": meeting.id,
            "project_id": meeting.project_id,
            "date": str(meeting.start_date)
        }

        # --- GỌI AI AGENT ---
        print("🤖 AI is processing audio...")
        # Giả định hàm run trả về dict kết quả
        result, _ = meeting_agent.run(
            audio_file_path=audio_path,
            meeting_metadata=metadata,
            thread_id=meeting_id
        )
        
        # --- LƯU KẾT QUẢ ---
        if result:
            meeting.transcript = result.get("transcript", "")
            meeting.ai_summary = result.get("mom", "") # Minutes of Meeting
            # meeting.tasks = result.get("tasks", []) # Nếu có
            
            db.commit()
            print(f"✅ [AI TASK] Analysis complete for {meeting_id}")
        else:
            print("⚠️ [AI TASK] AI returned no results.")

    except Exception as e:
        print(f"❌ [AI TASK] Exception: {e}")
    finally:
        db.close()

# --- Endpoints ---

@router.post("/{meeting_id}/analyze")
async def analyze_meeting(
    meeting_id: str, 
    background_tasks: BackgroundTasks, # <-- Đã thêm import này
    db: Session = Depends(get_db)
):
    """API Trigger AI phân tích"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Đẩy vào background chạy
    background_tasks.add_task(_run_ai_analysis_task, meeting_id, next(get_db()))
    
    return {"message": "AI analysis started in background", "status": "processing"}

# ... (Các API create, get, upload giữ nguyên như cũ) ...
@router.post("/{meeting_id}/recording")
def upload_meeting_recording(meeting_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()  
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    os.makedirs("static/recordings", exist_ok=True)
    file_location = f"static/recordings/{meeting_id}.webm"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Could not save file")

    full_url = f"http://localhost:8000/{file_location}"
    meeting.recording_url = full_url
    db.commit()
    db.refresh(meeting)
    return {"message": "Upload successful", "url": full_url}

# ... (Giữ nguyên các API create, get list) ...
@router.get("/{project_id}", response_model=List[meeting_schemas.MeetingOut])
def read_meetings_by_project(project_id: str, current_user: user_schemas.UserOut = Depends(get_current_user), db: Session = Depends(get_db)):
    service = MeetingService(db)
    return service.get_meetings_by_project(project_id, current_user.id)

@router.post("/", response_model=meeting_schemas.MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(meeting_data: meeting_schemas.MeetingCreate, current_user: user_schemas.UserOut = Depends(get_current_user), db: Session = Depends(get_db)):
    service = MeetingService(db)
    return service.create_meeting(meeting_data, current_user.id)