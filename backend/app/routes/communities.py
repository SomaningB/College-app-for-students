from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.models.chat import CommunityCreate, CommunityResponse
from app.middleware.auth import get_current_user, get_admin_user

router = APIRouter()

@router.post("/")
async def create_community(
    data: CommunityCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    existing = await db.communities.find_one({
        "name": data.name,
        "created_by": str(current_user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a community with this name")

    user_community_count = await db.communities.count_documents({"created_by": str(current_user["_id"])})
    if user_community_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 communities per user")

    members = [str(current_user["_id"])]

    if data.member_ids:
        for uid in data.member_ids:
            if uid == current_user["unique_id"]:
                continue
            user = await db.users.find_one({"unique_id": uid})
            if user and str(user["_id"]) not in members:
                members.append(str(user["_id"]))

    community = {
        "name": data.name,
        "description": data.description or "",
        "created_by": str(current_user["_id"]),
        "created_by_name": current_user["name"],
        "members": members,
        "created_at": datetime.utcnow()
    }

    result = await db.communities.insert_one(community)

    return {
        "id": str(result.inserted_id),
        "name": community["name"],
        "description": community["description"],
        "created_by": community["created_by"],
        "created_by_name": community["created_by_name"],
        "member_count": len(members),
        "members": community["members"],
        "created_at": community["created_at"]
    }

@router.get("/")
async def get_communities(current_user: dict = Depends(get_current_user)):
    db = get_db()
    current_id = str(current_user["_id"])

    communities = await db.communities.find({
        "members": current_id
    }).sort("created_at", -1).to_list(50)

    return [{
        "id": str(c["_id"]),
        "name": c["name"],
        "description": c.get("description", ""),
        "created_by": c["created_by"],
        "created_by_name": c["created_by_name"],
        "member_count": len(c["members"]),
        "members": c["members"],
        "created_at": c["created_at"]
    } for c in communities]

@router.get("/explore")
async def explore_communities(current_user: dict = Depends(get_current_user)):
    db = get_db()
    current_id = str(current_user["_id"])

    communities = await db.communities.find({
        "members": {"$ne": current_id}
    }).sort("created_at", -1).to_list(50)

    return [{
        "id": str(c["_id"]),
        "name": c["name"],
        "description": c.get("description", ""),
        "created_by_name": c["created_by_name"],
        "member_count": len(c["members"]),
        "created_at": c["created_at"]
    } for c in communities]

@router.post("/{community_id}/join")
async def join_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    current_id = str(current_user["_id"])

    community = await db.communities.find_one({"_id": ObjectId(community_id)})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if current_id in community["members"]:
        raise HTTPException(status_code=400, detail="Already a member")

    await db.communities.update_one(
        {"_id": ObjectId(community_id)},
        {"$push": {"members": current_id}}
    )

    return {"message": "Joined community"}

@router.get("/{community_id}/members")
async def get_community_members(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    community = await db.communities.find_one({"_id": ObjectId(community_id)})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    member_ids = [ObjectId(uid) for uid in community["members"]]
    members = []
    if member_ids:
        cursor = db.users.find({"_id": {"$in": member_ids}})
        async for user in cursor:
            members.append({
                "id": str(user["_id"]),
                "name": user["name"],
                "unique_id": user["unique_id"]
            })

    return members

@router.delete("/{community_id}")
async def delete_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    community = await db.communities.find_one({"_id": ObjectId(community_id)})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    current_id = str(current_user["_id"])
    is_creator = community["created_by"] == current_id
    is_admin = current_user.get("role") == "admin"

    if not is_creator and not is_admin:
        raise HTTPException(status_code=403, detail="Only the creator or admin can delete this community")

    await db.messages.delete_many({"chat_type": "community", "chat_id": community_id})
    await db.communities.delete_one({"_id": ObjectId(community_id)})

    return {"message": "Community and all messages deleted"}
