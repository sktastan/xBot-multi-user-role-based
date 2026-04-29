#===========================================================
#  
#  users_signin.py
#  User registration logic for the FastAPI application.
#  
#============================================================
from fastapi import APIRouter, HTTPException
import bcrypt
from app.backend.database import get_db
from app.backend.users.users_models import UserCreate

router = APIRouter()

# ---------------------------------------------------------------------
#   Creates a new user account with default role assignments.
# -------------------------------------------------------------------
@router.post("/signin")
def signin_user(user: UserCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            # Secure: Hash the password using bcrypt directly
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')
            from datetime import datetime, timezone
            now_iso = datetime.now(timezone.utc).isoformat()
            # Default new users to Role ID 6 (Employee Level)
            cursor.execute("INSERT INTO users (name, email, password, role_id, created_at) VALUES (?, ?, ?, ?, ?)", (user.name, user.email, hashed_password, 6, now_iso))
            conn.commit()
            return {"name": user.name, "email": user.email}
        except Exception:
            raise HTTPException(status_code=400, detail="Email already registered")