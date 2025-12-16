# src/services/ai_service.py

import os
from sqlalchemy.orm import Session
from src.schemas import task as task_schemas
from src.schemas import meeting as meeting_schemas
from src.repositories.meeting_repository import MeetingRepository
from src.repositories.task_repository import TaskRepository
from typing import List, Dict, Any
import json
from uuid import uuid4

# Import thư viện Gemini/Google GenAI
# from google import genai
# from google.genai import types 
# Giả định: Sử dụng thư viện đã được cấu hình (ví dụ: client = genai.Client())

# Tạm thời Mock Gemini Client để giữ cho code chạy được mà không cần API Key ngay lập tức
class MockGeminiClient:
    def generate_content(self, model: str, contents: str, config: Dict[str, Any]) -> Any:
        # Giả lập response JSON từ Gemini API
        MOCK_AI_TASKS = [
            {"title": "Finalize design system color palette", "priority": "High", "assignee_name": "Sarah Chen"},
            {"title": "Fix user authentication service issue", "priority": "Medium", "assignee_name": "Mike Ross"},
            {"title": "Schedule marketing launch strategy meeting", "priority": "Medium", "assignee_name": "Sarah Chen"},
            {"title": "Review backend database PR", "priority": "High", "assignee_name": "Alex Johnson"},
        ]
        
        return type('MockResponse', (object,), {
            'text': json.dumps({"tasks": MOCK_AI_TASKS})
        })

class AIService:
    def __init__(self, db: Session):
        self.meeting_repo = MeetingRepository(db)
        self.task_repo = TaskRepository(db)
        # Thay thế bằng client thực tế khi triển khai
        self.ai_client = MockGeminiClient() 
        self.ai_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") 
        self.user_repo = None # Cần truy cập User Repo để tìm assignee_id

    def process_transcript_and_create_tasks(self, meeting_id: str, transcript: str, current_user_id: str) -> List[task_schemas.TaskOut]:
        """Phân tích transcript, tạo tasks và lưu vào DB."""
        meeting = self.meeting_repo.get_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        # --- Logic Gọi Gemini API ---
        prompt = f"""
        Analyze the following meeting transcript and extract all actionable tasks, along with their priority (Low, Medium, High) and the name of the person assigned to the task. 
        Format the output STRICTLY as a JSON object: {{"tasks": [{{ "title": "...", "priority": "...", "assignee_name": "..." }}]}}.
        Transcript: "{transcript}"
        """

        # 1. Gọi API (Sử dụng Mock client)
        response = self.ai_client.generate_content(
            model=self.ai_model,
            contents=prompt,
            config={"response_mime_type": "application/json"} # Yêu cầu Gemini trả về JSON
        )
        
        # 2. Xử lý và Parse JSON Response
        try:
            ai_data = json.loads(response.text)
            ai_tasks_raw = ai_data.get("tasks", [])
        except (json.JSONDecodeError, AttributeError):
            print("Error parsing AI response or response is empty.")
            return []

        # 3. Chuyển đổi và Lưu Tasks vào DB
        created_tasks = []
        for task_raw in ai_tasks_raw:
            # *TÌM ASSIGNEE ID (Logic nghiệp vụ phức tạp)*
            # Cần logic để ánh xạ 'assignee_name' sang 'assignee_id' trong DB.
            # Ví dụ: user = self.user_repo.get_user_by_name(task_raw['assignee_name']) 
            
            new_task_data = {
                "id": str(uuid4()),
                "project_id": meeting.project_id,
                "author_id": current_user_id,
                "title": task_raw.get("title"),
                "priority": task_raw.get("priority", "Medium"),
                # "assignee_id": user.id if user else None, # Gán ID thực tế
            }
            db_task = self.task_repo.create(new_task_data)
            created_tasks.append(task_schemas.TaskOut.model_validate(db_task))

        # Cập nhật Meeting với transcript và summary (nếu có)
        self.meeting_repo.update_meeting_data(meeting_id, {"transcript": transcript}) 
        
        return created_tasks

    def get_chat_response(self, prompt: str, user_id: str) -> str:
        """Xử lý yêu cầu chat trực tiếp từ người dùng thông qua Gemini Assistant."""
        
        # 1. Xây dựng Prompt (có thể thêm bối cảnh lịch sử chat hoặc Project đang hoạt động)
        system_prompt = "You are a helpful project management assistant named JiraMeet AI. Your responses should be concise, professional, and actionable."
        
        full_prompt = f"{system_prompt}\n\nUser: {prompt}"

        # 2. Gọi API (Sử dụng Mock client)
        # response = self.ai_client.generate_content(model=self.ai_model, contents=full_prompt)
        # return response.text
        
        # Giả lập phản hồi
        return f"Tôi đã nhận được yêu cầu của bạn: '{prompt}'. Tôi có thể giúp bạn tạo Task, tìm kiếm Project, hoặc tóm tắt cuộc họp."