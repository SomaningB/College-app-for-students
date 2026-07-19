import re
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FriendRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class FriendRequestCreate(BaseModel):
    to_unique_id: str

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    from_user_name: str
    from_unique_id: str
    to_user_id: str
    status: FriendRequestStatus
    created_at: datetime

class CommunityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: Optional[List[str]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Community name must be at least 2 characters")
        if len(v) > 80:
            raise ValueError("Community name must be at most 80 characters")
        v = re.sub(r'<[^>]+>', '', v)
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v is None:
            return v
        if len(v) > 500:
            raise ValueError("Description must be at most 500 characters")
        v = re.sub(r'<[^>]+>', '', v)
        return v

class CommunityResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_by: str
    created_by_name: str
    member_count: int
    members: List[str] = []
    created_at: datetime

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    chat_type: str
    chat_id: str
    content: str
    timestamp: datetime
