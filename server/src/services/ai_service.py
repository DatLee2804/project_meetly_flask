# src/services/ai_service.py

import os
import json
from uuid import uuid4
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.schemas import task as task_schemas
from src.repositories.meeting_repository import MeetingRepository
from src.repositories.task_repository import TaskRepository

# Import SDK mới
from google import genai
from google.genai import types

class AIService:
    def __init__(self, db: Session):
        self.meeting_repo = MeetingRepository(db)
        self.task_repo = TaskRepository(db)
        
        # Khởi tạo Client thật
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("⚠️ Warning: GOOGLE_API_KEY not found in env.")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)
            
        self.ai_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    def process_transcript_and_create_tasks(self, meeting_id: str, transcript: str, current_user_id: str) -> List[task_schemas.TaskOut]:
        """Phân tích transcript thật bằng AI để tạo tasks."""
        meeting = self.meeting_repo.get_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        if not self.client:
            raise HTTPException(status_code=503, detail="AI Service unavailable (Missing API Key).")

        # Prompt xịn hơn
        prompt = f"""
        Bạn là trợ lý thư ký cuộc họp chuyên nghiệp. Hãy phân tích nội dung cuộc họp dưới đây:
        "{transcript}"

        Nhiệm vụ: Trích xuất các công việc (tasks) cụ thể cần thực hiện.
        Yêu cầu Output: Trả về ĐÚNG định dạng JSON như sau (không thêm markdown ```json):
        {{
            "tasks": [
                {{ "title": "Tên công việc ngắn gọn", "priority": "High/Medium/Low", "assignee_name": "Tên người được giao (hoặc Unassigned)" }}
            ]
        }}
        """

        try:
            # Gọi AI thật
            response = self.client.models.generate_content(
                model=self.ai_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json" # Ép kiểu JSON cứng
                )
            )
            
            # Parse JSON
            ai_data = json.loads(response.text)
            ai_tasks_raw = ai_data.get("tasks", [])
            
        except Exception as e:
            print(f"❌ Error calling AI: {e}")
            return []

        # Lưu vào DB
        created_tasks = []
        for task_raw in ai_tasks_raw:
            new_task_data = {
                "id": str(uuid4()),
                "project_id": meeting.project_id,
                "author_id": current_user_id,
                "title": task_raw.get("title", "Untitled Task"),
                "priority": task_raw.get("priority", "Medium"),
                # Ở đây bồ có thể thêm logic tìm assignee_id dựa trên tên nếu muốn
            }
            db_task = self.task_repo.create(new_task_data)
            created_tasks.append(task_schemas.TaskOut.model_validate(db_task))

        # Update meeting transcript
        self.meeting_repo.update_meeting_data(meeting_id, {"transcript": transcript}) 
        
        return created_tasks

    def get_chat_response(self, prompt: str, user_id: str) -> str:
        """Chat trực tiếp dùng AI thật"""
        if not self.client:
            return "Xin lỗi, hệ thống AI chưa được cấu hình API Key."

        try:
            response = self.client.models.generate_content(
                model=self.ai_model,
                contents=f"User: {prompt}\nAI Assistant:",
            )
            return response.text
        except Exception as e:
            return f"Đã xảy ra lỗi khi xử lý: {str(e)}"