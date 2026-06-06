from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: UUID
    role: str
    status: str
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
