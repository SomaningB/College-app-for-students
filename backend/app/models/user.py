import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    subjects: List[str] = []
    languages: List[str] = []

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Name cannot be empty")
        if len(v) > 100:
            raise ValueError("Name must be at most 100 characters")
        v = re.sub(r'<[^>]+>', '', v)
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

class ResendVerificationRequest(BaseModel):
    email: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    unique_id: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    subjects: List[str] = []
    languages: List[str] = []
    contributor_badge: bool = False
    email_verified: bool = False
    created_at: datetime

class UserInDB(BaseModel):
    id: str
    name: str
    email: str
    hashed_password: str
    unique_id: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    subjects: List[str] = []
    languages: List[str] = []
    contributor_badge: bool = False
    pending_uploads: int = 0
    email_verified: bool = False
    verification_code: Optional[str] = None
    verification_code_expires: Optional[datetime] = None
    created_at: datetime
