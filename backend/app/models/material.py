from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MaterialStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class MaterialCreate(BaseModel):
    subject: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    title: str
    description: Optional[str] = None
    language: Optional[str] = None

class MaterialResponse(BaseModel):
    id: str
    subject: str
    stream: str
    combination: Optional[str] = None
    puc: Optional[str] = None
    title: str
    description: Optional[str] = None
    language: Optional[str] = None
    file_url: str
    file_type: str
    file_size: int
    contributed_by: Optional[str] = None
    contributor_name: Optional[str] = None
    status: MaterialStatus
    tags: List[str] = []
    download_count: int = 0
    uploaded_at: datetime
