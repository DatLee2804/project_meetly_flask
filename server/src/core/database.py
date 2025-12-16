import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine
from typing import Generator
from sqlalchemy.orm import sessionmaker
# Import các Models để SQLAlchemy biết về chúng
from src.models.base import Base
# Dù không import trực tiếp, khi Base.metadata.create_all() chạy,
# nó sẽ tìm thấy tất cả Models kế thừa từ Base.

# 1. Load Environment Variables
# Đảm bảo đọc file .env để lấy DATABASE_URL
load_dotenv()

# Lấy URL kết nối DB từ biến môi trường
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set.")


# 3. Khởi tạo Engine (Kết nối vật lý)
# Engine là đối tượng chịu trách nhiệm kết nối với database
# 'pool_pre_ping=True' giúp kiểm tra kết nối DB có còn hoạt động không
engine: Engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

# 4. Thiết lập Session Maker (Phiên làm việc)
# SessionLocal là một lớp dùng để tạo ra các "phiên" (session) tương tác với DB.
# Mỗi request API sẽ có một Session riêng.
SessionLocal = sessionmaker(
    autocommit=False, # Không tự động commit thay đổi
    autoflush=False,  # Không tự động flush (đồng bộ)
    bind=engine
)

# 5. Dependency cho FastAPI (get_db)
def get_db() -> Generator[SessionLocal, None, None]:
    """
    Dependency Injection function.
    Mở một session DB mới cho mỗi request API, và đảm bảo đóng nó sau khi request kết thúc.
    """
    db = SessionLocal()
    try:
        # FastAPI cung cấp session này cho Router/Service
        yield db 
    finally:
        # Đóng session sau khi request hoàn thành (dù thành công hay thất bại)
        db.close()

# 6. Function Utility
def create_db_tables():
    """Tạo tất cả các bảng (tables) trong database dựa trên Base Model."""
    # Chỉ nên chạy function này một lần khi database chưa được thiết lập,
    # hoặc dùng các công cụ Migration (Alembic)
    from src.models import user, project, task, meeting # Đảm bảo tất cả Models được load
    Base.metadata.create_all(bind=engine)