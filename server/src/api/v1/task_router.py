# src/api/v1/task_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.core.security import get_current_user
from src.schemas import task as task_schemas
from src.schemas import user as user_schemas
# Giả định Service đã được tạo
from src.services.task_service import TaskService 

router = APIRouter()

@router.post("/", response_model=task_schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: task_schemas.TaskCreate,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo Task mới trong Project."""
    service = TaskService(db)
    # Logic kiểm tra người dùng có phải là thành viên của project_id không nên nằm trong Service
    task = service.create_task(task_data, author_id=current_user.id)
    return task

@router.get("/{project_id}", response_model=List[task_schemas.TaskOut])
def read_tasks_by_project(
    project_id: str,
    status_filter: str = None, # Cho phép filter theo status
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tất cả Tasks thuộc về một Project."""
    service = TaskService(db)
    tasks = service.get_tasks_by_project(project_id, current_user.id, status_filter)
    return tasks

@router.patch("/{task_id}/status", response_model=task_schemas.TaskOut)
def update_task_status(
    task_id: str,
    new_status: str, # Chỉ nhận new_status
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật trạng thái Task (dùng cho kéo thả Kanban)."""
    service = TaskService(db)
    task = service.update_task_status(task_id, new_status, current_user.id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or access denied.")
    return task