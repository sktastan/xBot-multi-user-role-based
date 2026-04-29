#===========================================================
#  
#  admin_models.py
#  Defines Pydantic models for admin-related data structures
#  and request/response schemas.
#  
#============================================================
from pydantic import BaseModel, EmailStr

# ---------------------------------------------------------------------
#   Base schema for Admin data.
# -------------------------------------------------------------------
class AdminBase(BaseModel):
    name: str
    email: EmailStr
    is_logged_in: bool = False
    created_at: str | None = None

# ---------------------------------------------------------------------
#   Schema for creating a new Admin account.
# -------------------------------------------------------------------
class AdminCreate(AdminBase):
    password: str

# ---------------------------------------------------------------------
#   Schema for Admin login requests.
# -------------------------------------------------------------------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str