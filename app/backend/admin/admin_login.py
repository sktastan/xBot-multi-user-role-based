#===========================================================
#  
#  admin_login.py
#  Handles the authentication and session management for 
#  administrative users.
#  
#============================================================
from fastapi import APIRouter, HTTPException
import bcrypt
from app.backend.database import get_db
from app.backend.admin.admin_models import AdminLogin

router = APIRouter()

# ---------------------------------------------------------------------
#   Validates admin credentials and updates login status.
# -------------------------------------------------------------------
@router.post("/admin/login")
def login_admin(admin: AdminLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, email, password FROM admins WHERE email = ?", (admin.email,))
        row = cursor.fetchone()
    
    if row:
        stored_password_hash = row[2].encode('utf-8')
        admin_password_bytes = admin.password.encode('utf-8')
        if bcrypt.checkpw(admin_password_bytes, stored_password_hash):
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE admins SET is_logged_in = 1 WHERE email = ?", (admin.email,))
                conn.commit()
            return {"name": row[0], "email": row[1]}
    
    raise HTTPException(status_code=401, detail="Invalid admin credentials")