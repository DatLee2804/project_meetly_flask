# src/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.schemas.user import UserOut
from src.repositories.user_repository import UserRepository
from dotenv import load_dotenv
import os

load_dotenv()

# --- 1. Cấu hình Bảo mật ---
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_change_me_in_env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 ngày

# Cấu hình Hashing Mật khẩu (dùng Bcrypt)
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cấu hình OAuth2 để trích xuất Token từ Header
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/v1/users/login", # Đường dẫn mà client gửi request login
    scopes={"me": "Read current user information"},
)


# --- 2. Hashing Mật khẩu ---
# src/core/security.py
import bcrypt # Import trực tiếp, bỏ passlib đi

# Bỏ dòng này: pwd_context = CryptContext(...)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Chuyển sang bytes trước khi check
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    # Hash và trả về string
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


# --- 3. Xử lý JWT Token ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Tạo Access Token mới."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "sub": data.get("sub")})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Giải mã Access Token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise JWTError("Invalid token payload")
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- 4. Dependency: Lấy User Hiện tại ---
def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> UserOut:
    """
    Dependency để lấy thông tin người dùng từ Token. 
    Router sẽ sử dụng hàm này để bảo vệ các endpoints.
    """
    user_id = decode_access_token(token)
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or credentials invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Sử dụng UserOut schema để xác thực và trả về dữ liệu
    return UserOut.model_validate(user)