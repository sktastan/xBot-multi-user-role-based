#===========================================================
#  
#  admin_setup.py
#  Handles the first-run configuration and initial super-admin
#  account creation for the system.
#  
#============================================================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
from app.backend.database import get_db, init_db

router = APIRouter(prefix="/admin-setup", tags=["Admin Setup"])

# ---------------------------------------------------------------------
#   Schema for the initial system setup payload.
# -------------------------------------------------------------------
class SetupRequest(BaseModel):
    system_name: str
    admin_name: str
    admin_email: str
    admin_password: str

# ---------------------------------------------------------------------
#   Checks if the system has already been initialized.
# -------------------------------------------------------------------
@router.get("/status")
def check_setup_status():
    """Checks if the initial admin setup has been performed."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Check if the admins table exists at all
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'")
            if not cursor.fetchone():
                return {"is_setup": False}
                
            cursor.execute("SELECT COUNT(*) FROM admins")
            count = cursor.fetchone()[0]
        return {"is_setup": count > 0}
    except Exception:
        # If there's any database error, assume setup is required
        return {"is_setup": False}

# ---------------------------------------------------------------------
#   Executes the initial database and admin user setup.
# -------------------------------------------------------------------
@router.post("/run")
def perform_setup(setup_data: SetupRequest):
    """Initializes the database with system settings and the first admin user."""
    init_db()  # Ensure tables exist even if the DB file was deleted during runtime
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify if an admin already exists to prevent re-running setup
        cursor.execute("SELECT COUNT(*) FROM admins")
        if cursor.fetchone()[0] > 0:
            raise HTTPException(status_code=400, detail="Setup has already been completed.")

        # Initialize a generic settings table for system configuration
        cursor.execute("CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT)")
        cursor.execute("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)", ("system_name", setup_data.system_name))

        # Create the initial Super Admin account
        hashed_password = bcrypt.hashpw(setup_data.admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        try:
            from datetime import datetime, timezone
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "INSERT INTO admins (name, email, password, created_at) VALUES (?, ?, ?, ?)",
                (setup_data.admin_name, setup_data.admin_email, hashed_password, now_iso)
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Setup failed during admin creation: {str(e)}")

    return {"message": "System initialized successfully", "admin": setup_data.admin_email}