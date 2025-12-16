# src/api/v1/project_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.core.database import get_db
from src.core.security import get_current_user
from src.schemas import project as project_schemas
from src.schemas import user as user_schemas
from pydantic import BaseModel # Thêm dòng này nếu chưa có
# Giả định Service đã được tạo
from src.services.project_service import ProjectService 

router = APIRouter()

@router.post("/", response_model=project_schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: project_schemas.ProjectCreate,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo dự án mới. Người tạo là thành viên mặc định."""
    service = ProjectService(db)
    project = service.create_project(project_data, owner_id=current_user.id)
    return project

@router.get("/", response_model=List[project_schemas.ProjectOut])
def read_user_projects(
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các dự án mà người dùng hiện tại là thành viên."""
    service = ProjectService(db)
    projects = service.get_projects_by_user(user_id=current_user.id)
    return projects

@router.get("/{project_id}", response_model=project_schemas.ProjectOut)
def read_project(
    project_id: str,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin chi tiết về một dự án cụ thể."""
    service = ProjectService(db)
    project = service.get_project_by_id(project_id)
    if not project or current_user.id not in [m.id for m in project.members]:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied.")
    return project
# Tạo class Body tạm thời để nhận email
class AddMemberBody(BaseModel):
    email: str

@router.post("/{project_id}/members", status_code=status.HTTP_200_OK)
def add_project_member(
    project_id: str,
    body: AddMemberBody,
    current_user: user_schemas.UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thêm thành viên vào dự án."""
    service = ProjectService(db)
    # Gọi service xử lý
    new_member = service.add_member_by_email(project_id, body.email, current_user.id)
    return new_member