#===========================================================
#  
#  admin_management.py
#  Provides administrative endpoints for user and admin 
#  account lifecycle management.
#  
#============================================================
from fastapi import APIRouter, HTTPException
from typing import List
from app.backend.database import get_db
from app.backend.admin.admin_models import AdminBase
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin Management"])

# ---------------------------------------------------------------------
#   Model representing an administrator with their current status.
# -------------------------------------------------------------------
class AdminWithStatus(AdminBase):
    is_logged_in: bool

# ---------------------------------------------------------------------
#   Retrieves a list of all standard users from the system.
# -------------------------------------------------------------------
@router.get("/users", response_model=List[AdminWithStatus])
def get_all_users():
    """Fetches all registered users from the database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, email, is_logged_in, created_at FROM users")
        rows = cursor.fetchall()
    return [{"name": row[0], "email": row[1], "is_logged_in": bool(row[2]), "created_at": row[3]} for row in rows] if rows else []

# ---------------------------------------------------------------------
#   Retrieves a list of all administrators from the system.
# -------------------------------------------------------------------
@router.get("/admins", response_model=List[AdminWithStatus])
def get_all_admins():
    """Fetches all registered administrators from the database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, email, is_logged_in, created_at FROM admins")
        rows = cursor.fetchall()
    return [{"name": row[0], "email": row[1], "is_logged_in": bool(row[2]), "created_at": row[3]} for row in rows] if rows else []

# ---------------------------------------------------------------------
#   Permanently removes a user account based on email.
# -------------------------------------------------------------------
@router.delete("/users/{email}")
def remove_user(email: str):
    """Deletes a user account by their email address."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = ?", (email,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {email} removed successfully"}

# ---------------------------------------------------------------------
#   Permanently removes an admin account based on email.
# -------------------------------------------------------------------
@router.delete("/admins/{email}")
def remove_admin(email: str):
    """Deletes an admin account by their email address."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM admins WHERE email = ?", (email,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": f"Admin {email} removed successfully"}

# ---------------------------------------------------------------------
#   Terminates an active admin session.
# -------------------------------------------------------------------
@router.post("/logout/{email}")
def logout_admin(email: str):
    """Sets the admin's logged-in status to false."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE admins SET is_logged_in = 0 WHERE email = ?", (email,))
        conn.commit()
    return {"message": "Logged out successfully"}

# ---------------------------------------------------------------------
#   Terminates an active user session.
# -------------------------------------------------------------------
@router.post("/logout-user/{email}")
def logout_user(email: str):
    """Sets the user's logged-in status to false."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_logged_in = 0 WHERE email = ?", (email,))
        conn.commit()
    return {"message": "User logged out successfully"}