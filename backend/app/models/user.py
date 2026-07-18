from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    subjects: List[str] = []
    languages: List[str] = []

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
