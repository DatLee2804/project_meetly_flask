# src/services/task_service.py

from sqlalchemy.orm import Session
from src.schemas import task as task_schemas
from src.models.task import Task
from src.repositories.task_repository import TaskRepository # Giả định Repository
from src.repositories.project_repository import ProjectRepository
from uuid import uuid4
from typing import List, Optional
from fastapi import HTTPException, status

class TaskService:
    def __init__(self, db: Session):
        self.repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)

    def create_task(self, task_data: task_schemas.TaskCreate, author_id: str) -> Task:
        """Tạo Task mới và kiểm tra quyền tác giả/người được giao."""
        
        # 1. Kiểm tra Project có tồn tại và User có quyền tạo không (Logic nghiệp vụ)
        project = self.project_repo.get_by_id(task_data.project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
            
        # Thêm các logic kiểm tra quyền (Ví dụ: author_id phải là member của project)
        # if author_id not in [m.id for m in project.members]:
        #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Author is not a member of this project.")
            
        # 2. Chuẩn bị dữ liệu
        db_task_data = task_data.model_dump(exclude_unset=True)
        db_task_data['id'] = str(uuid4())
        db_task_data['author_id'] = author_id # Gán người tạo
        
        # 3. Lưu vào DB
        return self.repo.create(db_task_data)

    def get_tasks_by_project(self, project_id: str, user_id: str, status_filter: Optional[str] = None) -> List[Task]:
        """Truy vấn các Tasks theo Project ID và có thể lọc theo trạng thái."""
        # Logic nghiệp vụ: Kiểm tra quyền xem Task của User
        project = self.project_repo.get_by_id(project_id)
        if not project or user_id not in [m.id for m in project.members]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project's tasks.")
            
        return self.repo.get_tasks_by_project(project_id, status_filter)

    def update_task_status(self, task_id: str, new_status: str, user_id: str) -> Optional[Task]:
        """Cập nhật trạng thái Task (cho Kanban kéo thả)."""
        task = self.repo.get_by_id(task_id)
        
        if not task:
             return None
        
        # Logic nghiệp vụ: Kiểm tra người dùng có được phép di chuyển Task này không
        # (Ví dụ: chỉ assignee hoặc project manager mới được phép)
        # if task.assignee_id != user_id and not self.is_manager(task.project_id, user_id):
        #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied to update task status.")

        # Cập nhật thông qua Repository
        return self.repo.update_task_field(task_id, {"status": new_status})