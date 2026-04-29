#===========================================================
#  
#  admin_signin.py
#  Logic for registering new administrative users.
#  
#============================================================
from fastapi import APIRouter, HTTPException
import bcrypt
from app.backend.database import get_db
from app.backend.admin.admin_models import AdminCreate

router = APIRouter()

# ---------------------------------------------------------------------
#   Registers a new admin user with a hashed password.
# -------------------------------------------------------------------
@router.post("/admin/signin")
def signin_admin(admin: AdminCreate):
    hashed_password = bcrypt.hashpw(admin.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            from datetime import datetime, timezone
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "INSERT INTO admins (name, email, password, created_at) VALUES (?, ?, ?, ?)",
                (admin.name, admin.email, hashed_password, now_iso)
            )
            conn.commit()
        except Exception:
            raise HTTPException(status_code=400, detail="Admin already exists")
    
    return {"message": "Admin registered successfully"}