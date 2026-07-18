from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
import os
import uuid
import aiofiles
from bson import ObjectId
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB
from app.database import get_db
from app.middleware.auth import get_teacher_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".doc", ".docx"}

@router.post("/upload")
async def teacher_upload(
    title: str = Form(...),
    subject: str = Form(...),
    puc: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_teacher_user)
):
    db = get_db()
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_SIZE_MB}MB")

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    material = {
        "title": title,
        "subject": subject,
        "stream": current_user.get("stream", ""),
        "puc": puc,
        "description": description,
        "file_url": f"/uploads/{filename}",
        "file_type": ext,
        "file_size": len(content),
        "uploaded_by": str(current_user["_id"]),
        "uploaded_by_type": "teacher",
        "contributor_name": f"{current_user['name']} (Teacher)",
        "status": "approved",
        "tags": [],
        "download_count": 0,
        "uploaded_at": datetime.utcnow()
    }

    result = await db.materials.insert_one(material)
    return {"id": str(result.inserted_id), "message": "Note uploaded and available for students"}

@router.get("/notes")
async def teacher_notes(current_user: dict = Depends(get_teacher_user)):
    db = get_db()
    notes = await db.materials.find({
        "uploaded_by": str(current_user["_id"]),
        "uploaded_by_type": "teacher"
    }).sort("uploaded_at", -1).to_list(100)

    return [{
        "id": str(n["_id"]),
        "title": n["title"],
        "subject": n["subject"],
        "puc": n.get("puc", ""),
        "description": n.get("description", ""),
        "file_url": n["file_url"],
        "file_type": n["file_type"],
        "file_size": n.get("file_size", 0),
        "download_count": n.get("download_count", 0),
        "uploaded_at": n["uploaded_at"]
    } for n in notes]

@router.delete("/notes/{note_id}")
async def teacher_delete_note(note_id: str, current_user: dict = Depends(get_teacher_user)):
    db = get_db()
    note = await db.materials.find_one({
        "_id": ObjectId(note_id),
        "uploaded_by": str(current_user["_id"]),
        "uploaded_by_type": "teacher"
    })
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or not yours")

    filepath = os.path.join(UPLOAD_DIR, os.path.basename(note["file_url"]))
    if os.path.exists(filepath):
        os.remove(filepath)

    await db.materials.delete_one({"_id": ObjectId(note_id)})
    return {"message": "Note deleted"}
