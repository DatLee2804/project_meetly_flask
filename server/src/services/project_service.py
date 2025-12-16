# src/services/project_service.py

from sqlalchemy.orm import Session
from src.schemas import project as project_schemas
from src.models.project import Project
from src.repositories.project_repository import ProjectRepository # Giả định Repository
from src.repositories.user_repository import UserRepository
from uuid import uuid4
from typing import List, Optional

class ProjectService:
    def __init__(self, db: Session):
        self.repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)

    def create_project(self, project_data: project_schemas.ProjectCreate, owner_id: str) -> Project:
        """Tạo dự án mới và thêm owner_id vào danh sách thành viên."""
        
        # 1. Tạo ID và dữ liệu cơ bản
        db_project_data = project_data.model_dump(exclude={'member_ids'})
        db_project_data['id'] = str(uuid4())
        
        # 2. Thêm owner vào danh sách thành viên được yêu cầu
        member_ids = list(set(project_data.member_ids + [owner_id])) # Đảm bảo owner có mặt và không trùng lặp
        
        # 3. Lưu Project cơ bản
        project = self.repo.create(db_project_data)
        
        # 4. Thêm thành viên vào Project (Logic nghiệp vụ)
        if project:
            # Lấy các đối tượng User và thêm vào mối quan hệ M:N
            members = self.user_repo.get_users_by_ids(member_ids)
            self.repo.add_members_to_project(project, members)
            self.repo.db.refresh(project) # Refresh để tải lại quan hệ members
        
        return project

    def get_projects_by_user(self, user_id: str) -> List[Project]:
        """Lấy danh sách các dự án mà người dùng là thành viên."""
        return self.repo.get_all_projects_where_user_is_member(user_id)

    def get_project_by_id(self, project_id: str) -> Optional[Project]:
        """Lấy chi tiết dự án."""
        return self.repo.get_by_id(project_id)
        
    # Các hàm nghiệp vụ khác (add_member, remove_member, update_project, ...)
    # ... (các hàm cũ giữ nguyên)

    def add_member_by_email(self, project_id: str, email: str, current_user_id: str):
        """Thêm thành viên vào dự án thông qua email."""
        # 1. Kiểm tra quyền (chỉ thành viên hiện tại mới được mời người mới) - Tạm bỏ qua hoặc làm đơn giản
        project = self.repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # 2. Tìm user muốn mời
        user_to_add = self.user_repo.get_user_by_email(email)
        if not user_to_add:
            raise HTTPException(status_code=404, detail="User with this email does not exist in the system.")
            
        # 3. Kiểm tra xem đã là thành viên chưa
        if user_to_add.id in [m.id for m in project.members]:
             raise HTTPException(status_code=400, detail="User is already a member of this project.")

        # 4. Thêm vào
        project.members.append(user_to_add)
        self.repo.db.commit()
        self.repo.db.refresh(project)
        
        return user_to_add # Trả về thông tin người vừa add