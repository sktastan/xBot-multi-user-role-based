#===========================================================
#  
#  users_models.py
#  Defines Pydantic models for user-related data structures
#  and request/response schemas.
#  
#============================================================
from pydantic import BaseModel, EmailStr

# ---------------------------------------------------------------------
#   Base schema for user email identification.
# -------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr

# ---------------------------------------------------------------------
#   Schema for registering a new user.
# -------------------------------------------------------------------
class UserCreate(UserBase):
    name: str
    password: str

# ---------------------------------------------------------------------
#   Schema for user login credentials.
# -------------------------------------------------------------------
class UserLogin(UserBase):
    password: str