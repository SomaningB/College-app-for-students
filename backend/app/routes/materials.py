from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
import os
import aiofiles
import uuid
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB
from app.database import get_db
from app.models.material import MaterialCreate, MaterialResponse, MaterialStatus
from app.middleware.auth import get_current_user, get_admin_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}

@router.get("/")
async def get_materials(
    stream: str = "",
    subject: str = "",
    puc: str = "",
    status: str = "approved",
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"status": status}
    if stream:
        query["stream"] = stream
    if subject:
        query["subject"] = subject
    if puc:
        query["puc"] = puc

    materials = await db.materials.find(query).sort("uploaded_at", -1).to_list(100)

    return [{
        "id": str(m["_id"]),
        "subject": m["subject"],
        "stream": m["stream"],
        "puc": m.get("puc"),
        "combination": m.get("combination"),
        "title": m["title"],
        "description": m.get("description"),
        "language": m.get("language"),
        "file_url": m["file_url"],
        "file_type": m["file_type"],
        "file_size": m.get("file_size", 0),
        "contributed_by": m.get("contributed_by"),
        "contributor_name": m.get("contributor_name"),
        "status": m["status"],
        "tags": m.get("tags", []),
        "download_count": m.get("download_count", 0),
        "uploaded_at": m["uploaded_at"]
    } for m in materials]

@router.post("/contribute")
async def contribute_material(
    title: str = Form(...),
    subject: str = Form(...),
    stream: str = Form(...),
    puc: str = Form(None),
    combination: str = Form(None),
    description: str = Form(None),
    language: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    if current_user.get("pending_uploads", 0) >= 5:
        raise HTTPException(status_code=400, detail="Max 5 pending uploads at a time")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_SIZE_MB}MB")

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    file_url = f"/uploads/{filename}"

    material = {
        "subject": subject,
        "stream": stream,
        "puc": puc,
        "combination": combination,
        "title": title,
        "description": description,
        "language": language,
        "file_url": file_url,
        "file_type": ext,
        "file_size": len(content),
        "contributed_by": str(current_user["_id"]),
        "contributor_name": current_user["name"],
        "status": MaterialStatus.approved if current_user.get("role") == "teacher" else MaterialStatus.pending,
        "tags": [],
        "download_count": 0,
        "uploaded_at": datetime.utcnow()
    }

    result = await db.materials.insert_one(material)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"pending_uploads": 1}}
    )

    return {"id": str(result.inserted_id), "message": "Material submitted for approval"}

@router.get("/pending")
async def get_pending_materials(admin: dict = Depends(get_admin_user)):
    db = get_db()
    materials = await db.materials.find({"status": "pending"}).sort("uploaded_at", -1).to_list(50)
    return [{
        "id": str(m["_id"]),
        "title": m["title"],
        "subject": m["subject"],
        "stream": m["stream"],
        "contributor_name": m.get("contributor_name"),
        "file_url": m["file_url"],
        "uploaded_at": m["uploaded_at"]
    } for m in materials]

@router.patch("/{material_id}/approve")
async def approve_material(material_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    from bson import ObjectId
    material = await db.materials.find_one({"_id": ObjectId(material_id)})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    await db.materials.update_one(
        {"_id": ObjectId(material_id)},
        {"$set": {"status": "approved", "approved_by": str(admin["_id"])}}
    )

    if material.get("contributed_by"):
        await db.users.update_one(
            {"_id": ObjectId(material["contributed_by"])},
            {"$inc": {"pending_uploads": -1}}
        )

        count = await db.materials.count_documents({
            "contributed_by": material["contributed_by"],
            "status": "approved"
        })
        if count >= 5:
            await db.users.update_one(
                {"_id": ObjectId(material["contributed_by"])},
                {"$set": {"contributor_badge": True}}
            )

    return {"message": "Material approved"}

@router.patch("/{material_id}/reject")
async def reject_material(material_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    from bson import ObjectId
    material = await db.materials.find_one({"_id": ObjectId(material_id)})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    await db.materials.update_one(
        {"_id": ObjectId(material_id)},
        {"$set": {"status": "rejected"}}
    )

    if material.get("contributed_by"):
        await db.users.update_one(
            {"_id": ObjectId(material["contributed_by"])},
            {"$inc": {"pending_uploads": -1}}
        )

    return {"message": "Material rejected"}

@router.get("/{material_id}/download")
async def download_material(material_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    material = await db.materials.find_one({"_id": ObjectId(material_id)})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    await db.materials.update_one(
        {"_id": ObjectId(material_id)},
        {"$inc": {"download_count": 1}}
    )

    return {"file_url": material["file_url"], "title": material["title"]}

@router.get("/contributors")
async def get_contributors(current_user: dict = Depends(get_current_user)):
    db = get_db()
    users = await db.users.find({"contributor_badge": True}).to_list(50)
    return [{
        "id": str(u["_id"]),
        "name": u["name"],
        "unique_id": u["unique_id"]
    } for u in users]
