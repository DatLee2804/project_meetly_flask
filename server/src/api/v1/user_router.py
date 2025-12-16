# src/api/v1/user_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.schemas import user as user_schemas
# Giả định Service đã được tạo
from src.services.user_service import UserService 

# Khởi tạo APIRouter. Nó sẽ được include trong src/api/v1/__init__.py
router = APIRouter()

# --- Endpoint Xác thực ---

@router.post("/register", response_model=user_schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_data: user_schemas.UserCreate, db: Session = Depends(get_db)):
    """Đăng ký người dùng mới."""
    user_service = UserService(db)
    user = user_service.create_user(user_data)
    print("This is user: ", user)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username already registered.")
    return user

@router.post("/login", response_model=user_schemas.Token)
def login_for_access_token(form_data: user_schemas.UserLogin, db: Session = Depends(get_db)):
    """Đăng nhập và trả về Access Token."""
    user_service = UserService(db)
    user = user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Tạo JWT Token
    access_token = user_service.create_user_token(user.id)
    return {"access_token": access_token, "token_type": "bearer"}

# --- Endpoint Thông tin User ---

# Dependency để lấy User hiện tại đã được xác thực
from src.core.security import get_current_user # Giả định hàm này được tạo trong security.py

@router.get("/me", response_model=user_schemas.UserOut)
def read_users_me(current_user: user_schemas.UserOut = Depends(get_current_user)):
    """Lấy thông tin của người dùng hiện tại."""
    return current_user