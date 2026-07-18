from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.models.chat import FriendRequestCreate, FriendRequestResponse, FriendRequestStatus
from app.middleware.auth import get_current_user

router = APIRouter()

@router.post("/request")
async def send_friend_request(
    req: FriendRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    target = await db.users.find_one({"unique_id": req.to_unique_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target_id = str(target["_id"])
    current_id = str(current_user["_id"])

    if current_id == target_id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")

    existing = await db.friend_requests.find_one({
        "$or": [
            {"from_user_id": current_id, "to_user_id": target_id},
            {"from_user_id": target_id, "to_user_id": current_id}
        ],
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already sent")

    request = {
        "from_user_id": current_id,
        "from_user_name": current_user["name"],
        "from_unique_id": current_user["unique_id"],
        "to_user_id": target_id,
        "to_user_name": target["name"],
        "to_unique_id": target["unique_id"],
        "status": FriendRequestStatus.pending,
        "created_at": datetime.utcnow()
    }

    result = await db.friend_requests.insert_one(request)

    return {
        "id": str(result.inserted_id),
        "message": "Friend request sent"
    }

@router.get("/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    db = get_db()
    current_id = str(current_user["_id"])

    requests = await db.friend_requests.find({
        "to_user_id": current_id,
        "status": "pending"
    }).sort("created_at", -1).to_list(50)

    return [{
        "id": str(r["_id"]),
        "from_user_id": r["from_user_id"],
        "from_user_name": r["from_user_name"],
        "from_unique_id": r["from_unique_id"],
        "status": r["status"],
        "created_at": r["created_at"]
    } for r in requests]

@router.patch("/request/{request_id}/respond")
async def respond_friend_request(
    request_id: str,
    action: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    current_id = str(current_user["_id"])

    request = await db.friend_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request["to_user_id"] != current_id:
        raise HTTPException(status_code=403, detail="Not your request")

    if action == "accept":
        await db.friend_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "accepted"}}
        )

        friend_doc = {
            "user_id_1": min(request["from_user_id"], request["to_user_id"]),
            "user_id_2": max(request["from_user_id"], request["to_user_id"]),
            "created_at": datetime.utcnow()
        }
        await db.friends.insert_one(friend_doc)

        return {"message": "Friend request accepted"}
    elif action == "reject":
        await db.friend_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "rejected"}}
        )
        return {"message": "Friend request rejected"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'reject'")

@router.get("/list")
async def get_friends(current_user: dict = Depends(get_current_user)):
    db = get_db()
    current_id = str(current_user["_id"])

    friendships = await db.friends.find({
        "$or": [
            {"user_id_1": current_id},
            {"user_id_2": current_id}
        ]
    }).to_list(50)

    friend_ids = []
    for f in friendships:
        if f["user_id_1"] == current_id:
            friend_ids.append(ObjectId(f["user_id_2"]))
        else:
            friend_ids.append(ObjectId(f["user_id_1"]))

    friends = []
    if friend_ids:
        cursor = db.users.find({"_id": {"$in": friend_ids}})
        async for user in cursor:
            friends.append({
                "id": str(user["_id"]),
                "name": user["name"],
                "unique_id": user["unique_id"],
                "stream": user["stream"]
            })

    return friends

@router.get("/sent")
async def get_sent_requests(current_user: dict = Depends(get_current_user)):
    db = get_db()
    current_id = str(current_user["_id"])

    requests = await db.friend_requests.find({
        "from_user_id": current_id,
        "status": "pending"
    }).sort("created_at", -1).to_list(50)

    return [{
        "id": str(r["_id"]),
        "to_user_name": r["to_user_name"],
        "to_unique_id": r["to_unique_id"],
        "status": r["status"],
        "created_at": r["created_at"]
    } for r in requests]
