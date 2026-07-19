from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("")
@router.get("/")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        students = await db.users.find({"role": "student"}).to_list(500)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    result = []

    for s in students:
        sid = str(s["_id"])
        try:
            material_count = await db.materials.count_documents({"contributed_by": sid, "status": "approved"})

            download_pipeline = await db.materials.aggregate([
                {"$match": {"contributed_by": sid}},
                {"$group": {"_id": None, "total": {"$sum": "$download_count"}}}
            ]).to_list(1)
            downloads = 0
            if download_pipeline and download_pipeline[0].get("total") is not None:
                downloads = download_pipeline[0]["total"]

            msg_count = await db.messages.count_documents({"sender_id": sid})
            community_count = await db.communities.count_documents({"members": sid})

            score = (material_count or 0) * 10 + (downloads or 0) * 2 + (msg_count or 0) + (community_count or 0) * 5

            result.append({
                "id": sid,
                "name": s.get("name", ""),
                "unique_id": s.get("unique_id", ""),
                "stream": s.get("stream", ""),
                "score": score,
                "materials_contributed": material_count or 0,
                "total_downloads": downloads or 0,
                "messages_sent": msg_count or 0,
                "communities_joined": community_count or 0
            })
        except Exception:
            continue

    result.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(result):
        r["rank"] = i + 1

    return result
