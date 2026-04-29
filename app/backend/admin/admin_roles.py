#===========================================================
#  
#  admin_roles.py
#  Manages RBAC (Role Based Access Control) and role 
#  assignments for system users.
#  
#============================================================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.backend.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin Role Management"])

# ---------------------------------------------------------------------
#   Schema for updating a user's role assignment.
# -------------------------------------------------------------------
class RoleUpdate(BaseModel):
    email: str
    role_id: int

# ---------------------------------------------------------------------
#   Returns a list of all available system roles.
# -------------------------------------------------------------------
@router.get("/roles")
async def get_all_roles():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description FROM roles")
        roles = [{"id": r[0], "name": r[1], "description": r[2]} for r in cursor.fetchall()]
        return roles

# ---------------------------------------------------------------------
#   Fetches users along with their associated role details.
# -------------------------------------------------------------------
@router.get("/managed-users")
async def get_managed_users():
    with get_db() as conn:
        cursor = conn.cursor()
        # Join with roles to get the human-readable name
        cursor.execute("""
            SELECT u.name, u.email, u.role_id, r.name as role_name, u.created_at 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
        """)
        users = [
            {
                "name": u[0], 
                "email": u[1], 
                "role_id": u[2], 
                "role_name": u[3] or "No Role",
                "created_at": u[4]
            } for u in cursor.fetchall()
        ]
        return users

# ---------------------------------------------------------------------
#   Updates the role_id for a specific user in the database.
# -------------------------------------------------------------------
@router.post("/update-user-role")
async def update_user_role(data: RoleUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role_id = ? WHERE email = ?", (data.role_id, data.email))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": f"Successfully updated role for {data.email}"}