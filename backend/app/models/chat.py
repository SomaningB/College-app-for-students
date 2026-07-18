from pydantic import BaseModel
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
