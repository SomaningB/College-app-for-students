from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    db = get_db()
    students = await db.users.find({"role": "student"}).to_list(500)
    result = []

    for s in students:
        sid = str(s["_id"])
        material_count = await db.materials.count_documents({"contributed_by": sid, "status": "approved"})
        download_pipeline = await db.materials.aggregate([
            {"$match": {"contributed_by": sid}},
            {"$group": {"_id": None, "total": {"$sum": "$download_count"}}}
        ]).to_list(1)
        downloads = download_pipeline[0]["total"] if download_pipeline else 0
        msg_count = await db.messages.count_documents({"sender_id": sid})
        community_count = await db.communities.count_documents({"members": sid})

        score = material_count * 10 + downloads * 2 + msg_count + community_count * 5

        result.append({
            "id": sid,
            "name": s["name"],
            "unique_id": s["unique_id"],
            "stream": s.get("stream", ""),
            "score": score,
            "materials_contributed": material_count,
            "total_downloads": downloads,
            "messages_sent": msg_count,
            "communities_joined": community_count
        })

    result.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(result):
        r["rank"] = i + 1

    return result
