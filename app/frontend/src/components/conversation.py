#===========================================================
#  
#  conversation.py
#  Pydantic models for representing conversation data.
#  
#============================================================
from pydantic import BaseModel
from datetime import datetime

# ---------------------------------------------------------------------
#   Base schema for conversation input.
# -------------------------------------------------------------------
class ConversationBase(BaseModel):
    user_message: str
    ai_response: str

# ---------------------------------------------------------------------
#   Read schema for conversation details including IDs and timestamps.
# -------------------------------------------------------------------
class ConversationRead(ConversationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True