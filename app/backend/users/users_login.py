#===========================================================
#  
#  users_login.py
#  Authentication logic for standard users.
#  
#============================================================
from fastapi import APIRouter, HTTPException
import bcrypt
from app.backend.database import get_db
from app.backend.users.users_models import UserLogin

router = APIRouter()

# ---------------------------------------------------------------------
#   Verifies user login and marks the account as active.
# -------------------------------------------------------------------
@router.post("/login")
def login_user(user: UserLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        # Secure: Find user by email first
        cursor.execute("SELECT name, email, password, data FROM users WHERE email = ?", (user.email,))
        row = cursor.fetchone()
    
    # Secure: Verify the hashed password using bcrypt directly
    if row:
        stored_password_hash = row[2].encode('utf-8')
        user_password_bytes = user.password.encode('utf-8')
        if bcrypt.checkpw(user_password_bytes, stored_password_hash):
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET is_logged_in = 1 WHERE email = ?", (user.email,))
                conn.commit()
            return {"name": row[0], "email": row[1], "data": row[3]}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")