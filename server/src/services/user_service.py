# src/services/user_service.py

from sqlalchemy.orm import Session
from src.schemas import user as user_schemas
from src.models.user import User
from src.repositories.user_repository import UserRepository # Giả định Repository
from src.core import security
from uuid import uuid4
from typing import Optional

class UserService:
    def __init__(self, db: Session):
        # Service sẽ sử dụng Repository để tương tác với DB
        self.repo = UserRepository(db)

    def create_user(self, user_data: user_schemas.UserCreate) -> Optional[User]:
        """Đăng ký người dùng mới, hash mật khẩu và kiểm tra trùng lặp.
        
        Args:
            user_data: Dữ liệu đăng ký người dùng mới
            
        Returns:
            User object nếu tạo thành công, None nếu username/email đã tồn tại
        """
        # 1. Kiểm tra username/email đã tồn tại chưa (Logic nghiệp vụ)
        if (self.repo.get_user_by_username(user_data.username) or 
            self.repo.get_user_by_email(user_data.email)):
            return None
        
        # 2. Xử lý mật khẩu dài quá 72 bytes
        if len(user_data.password.encode('utf-8')) > 72:
            # Cắt bớt mật khẩu về 72 bytes, xử lý đúng UTF-8
            password_bytes = user_data.password.encode('utf-8')[:72]
            # Giữ lại các ký tự hợp lệ, bỏ qua các ký tự bị cắt ngang
            truncated_password = password_bytes.decode('utf-8', errors='ignore')
            user_data.password = truncated_password
        
        # 3. Hash mật khẩu
        hashed_password = security.get_password_hash(user_data.password)
        
        # 4. Tạo ID mới và chuẩn bị dữ liệu cho DB
        db_user_data = {
            "id": str(uuid4()),  # Tạo UUID cho ID
            **user_data.model_dump(exclude={'password'}),
            "hashed_password": hashed_password
        }
        
        # 4. Lưu vào DB thông qua Repository
        return self.repo.create(db_user_data)

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Xác thực người dùng dựa trên username và mật khẩu."""
        user = self.repo.get_user_by_username(username)
        
        # 1. Kiểm tra người dùng có tồn tại không
        if not user:
            return None
            
        # 2. Kiểm tra mật khẩu
        if not security.verify_password(password, user.hashed_password):
            return None
            
        return user

    def create_user_token(self, user_id: str) -> str:
        """Tạo Access Token cho người dùng."""
        # Logic tạo token gọi hàm từ Security Core
        return security.create_access_token(data={"sub": user_id})

    # Các hàm nghiệp vụ khác (get_user, update_user, change_password, ...)