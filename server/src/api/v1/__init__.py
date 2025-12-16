# src/api/v1/__init__.py

from fastapi import APIRouter

# Tạo một APIRouter để tổng hợp tất cả các router con
api_router = APIRouter()

# 1. Import và Include các Router con
# Các import này là RELATIVE (tương đối) so với package v1
from .user_router import router as user_router
from .ai_router import router as ai_router
from .meeting_router import router as meeting_router
from .project_router import router as project_router
from .task_router import router as task_router

# 2. Include các Router con vào api_router tổng
# Bạn có thể thêm prefix cho từng nhóm nếu muốn (ví dụ: prefix="/users")
api_router.include_router(user_router, prefix="/users", tags=["Users"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Integration"])
api_router.include_router(meeting_router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(project_router, prefix="/projects", tags=["Projects"])
api_router.include_router(task_router, prefix="/tasks", tags=["Tasks"])