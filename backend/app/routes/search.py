from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.middleware.auth import get_current_user
import re

router = APIRouter()

@router.get("/")
async def global_search(
    q: str = Query("", description="Search query"),
    subject: str = Query("", description="Filter by subject"),
    puc: str = Query("", description="Filter by PUC year"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_stream = current_user.get("stream", "")
    result_materials = []
    result_my_notes = []
    query_parts = [part.strip() for part in q.split() if part.strip()]

    must = [{"status": "approved"}]
    if user_stream:
        must.append({
            "$or": [
                {"stream": user_stream},
                {"stream": {"$exists": False}},
                {"stream": ""}
            ]
        })
    if query_parts:
        regex_pattern = "".join(f"(?=.*{re.escape(part)})" for part in query_parts)
        must.append({
            "$or": [
                {"title": {"$regex": regex_pattern, "$options": "i"}},
                {"subject": {"$regex": regex_pattern, "$options": "i"}},
                {"description": {"$regex": regex_pattern, "$options": "i"}},
                {"tags": {"$regex": regex_pattern, "$options": "i"}}
            ]
        })
    if subject:
        must.append({"subject": subject})
    if puc:
        must.append({"puc": puc})

    material_query = {"$and": must} if len(must) > 1 else must[0]

    try:
        materials = await db.materials.find(material_query).sort("uploaded_at", -1).to_list(50)
    except Exception:
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")

    for m in materials:
        result_materials.append({
            "id": str(m["_id"]), "type": "material", "subject": m["subject"],
            "stream": m.get("stream", ""), "puc": m.get("puc", ""),
            "title": m["title"], "description": m.get("description", ""),
            "file_url": m["file_url"], "file_type": m["file_type"],
            "file_size": m.get("file_size", 0),
            "contributed_by": m.get("contributed_by"),
            "contributor_name": m.get("contributor_name"),
            "download_count": m.get("download_count", 0),
            "uploaded_at": m.get("uploaded_at")
        })

    my_notes_query = {"user_id": str(current_user["_id"])}
    if query_parts:
        regex_pattern = "".join(f"(?=.*{re.escape(part)})" for part in query_parts)
        my_notes_query["$or"] = [
            {"title": {"$regex": regex_pattern, "$options": "i"}},
            {"subject": {"$regex": regex_pattern, "$options": "i"}}
        ]
    if subject:
        my_notes_query["subject"] = subject

    my_notes = await db.user_notes.find(my_notes_query).sort("uploaded_at", -1).to_list(50)
    for n in my_notes:
        result_my_notes.append({
            "id": str(n["_id"]), "type": "my_note", "title": n["title"],
            "subject": n.get("subject", ""), "folder_id": n.get("folder_id", ""),
            "file_url": n["file_url"], "file_type": n["file_type"],
            "file_size": n.get("file_size", 0), "uploaded_at": n.get("uploaded_at")
        })

    return {"materials": result_materials, "my_notes": result_my_notes, "total": len(result_materials) + len(result_my_notes)}

@router.get("/subjects")
async def search_subjects(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_stream = current_user.get("stream", "")
    pipeline = [
        {"$match": {"status": "approved", "stream": user_stream}},
        {"$group": {"_id": "$subject"}},
        {"$sort": {"_id": 1}}
    ]
    subjects_cursor = db.materials.aggregate(pipeline)
    subjects = [doc["_id"] async for doc in subjects_cursor]
    return subjects
