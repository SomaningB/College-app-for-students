from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from app.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter()

@router.post("/")
async def submit_feedback(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    message = (data.get("message") or "").strip()
    if not message or len(message) < 10:
        raise HTTPException(status_code=400, detail="Feedback must be at least 10 characters")
    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="Feedback too long (max 2000 characters)")

    db = get_db()

    feedback = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "user_unique_id": current_user["unique_id"],
        "message": message,
        "created_at": datetime.utcnow()
    }

    result = await db.feedback.insert_one(feedback)

    return {
        "id": str(result.inserted_id),
        "message": "Feedback submitted. Thank you!"
    }

@router.get("/mine")
async def get_my_feedback(current_user: dict = Depends(get_current_user)):
    db = get_db()
    feedbacks = await db.feedback.find({
        "user_id": str(current_user["_id"])
    }).sort("created_at", -1).to_list(50)

    return [{
        "id": str(f["_id"]),
        "message": f["message"],
        "created_at": f["created_at"]
    } for f in feedbacks]
