from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
import os
import uuid
import aiofiles
from bson import ObjectId
from app.config import UPLOAD_DIR
from app.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter()

NOTES_DIR = os.path.join(UPLOAD_DIR, "user_notes")
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}

@router.get("/folders")
async def list_folders(current_user: dict = Depends(get_current_user)):
    db = get_db()
    folders = await db.user_folders.find({"user_id": str(current_user["_id"])}).sort("created_at", -1).to_list(50)
    return [{
        "id": str(f["_id"]),
        "name": f["name"],
        "subject": f.get("subject", ""),
        "note_count": f.get("note_count", 0),
        "created_at": f["created_at"]
    } for f in folders]

@router.post("/folders")
async def create_folder(
    name: str = Form(...),
    subject: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    folder = {
        "user_id": str(current_user["_id"]),
        "name": name,
        "subject": subject,
        "note_count": 0,
        "created_at": datetime.utcnow()
    }
    result = await db.user_folders.insert_one(folder)
    return {"id": str(result.inserted_id), "name": name, "subject": subject}

@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    folder = await db.user_folders.find_one({"_id": ObjectId(folder_id), "user_id": str(current_user["_id"])})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    notes = await db.user_notes.find({"folder_id": folder_id, "user_id": str(current_user["_id"])}).to_list(100)
    for note in notes:
        filepath = os.path.join(NOTES_DIR, note["file_name"])
        if os.path.exists(filepath):
            os.remove(filepath)
    await db.user_notes.delete_many({"folder_id": folder_id, "user_id": str(current_user["_id"])})
    await db.user_folders.delete_one({"_id": ObjectId(folder_id)})
    return {"message": "Folder deleted"}

@router.get("/")
async def list_notes(
    folder_id: str = "",
    subject: str = "",
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": str(current_user["_id"])}
    if folder_id:
        query["folder_id"] = folder_id
    if subject:
        query["subject"] = subject
    notes = await db.user_notes.find(query).sort("uploaded_at", -1).to_list(100)
    return [{
        "id": str(n["_id"]),
        "title": n["title"],
        "subject": n.get("subject", ""),
        "folder_id": n.get("folder_id", ""),
        "file_url": n["file_url"],
        "file_type": n["file_type"],
        "file_size": n.get("file_size", 0),
        "uploaded_at": n["uploaded_at"]
    } for n in notes]

@router.post("/upload")
async def upload_note(
    title: str = Form(...),
    subject: str = Form(""),
    folder_id: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    os.makedirs(NOTES_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB")

    file_name = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(NOTES_DIR, file_name)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    note = {
        "user_id": str(current_user["_id"]),
        "folder_id": folder_id,
        "title": title,
        "subject": subject,
        "file_url": f"/uploads/user_notes/{file_name}",
        "file_name": file_name,
        "file_type": ext,
        "file_size": len(content),
        "uploaded_at": datetime.utcnow()
    }
    result = await db.user_notes.insert_one(note)

    if folder_id:
        await db.user_folders.update_one(
            {"_id": ObjectId(folder_id)},
            {"$inc": {"note_count": 1}}
        )

    return {"id": str(result.inserted_id), "title": title, "message": "Note uploaded"}

@router.post("/save-from-material")
async def save_material_to_notes(
    material_id: str = Form(...),
    folder_id: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    material = await db.materials.find_one({"_id": ObjectId(material_id), "status": "approved"})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    import shutil
    src_filename = os.path.basename(material["file_url"])
    src_path = os.path.join(UPLOAD_DIR, src_filename)
    if not os.path.exists(src_path):
        raise HTTPException(status_code=404, detail="Source file not found")

    os.makedirs(NOTES_DIR, exist_ok=True)
    new_file_name = f"{uuid.uuid4()}{material['file_type']}"
    dst_path = os.path.join(NOTES_DIR, new_file_name)
    shutil.copy2(src_path, dst_path)

    note = {
        "user_id": str(current_user["_id"]),
        "folder_id": folder_id,
        "title": f"[From Materials] {material['title']}",
        "subject": material.get("subject", ""),
        "file_url": f"/uploads/user_notes/{new_file_name}",
        "file_name": new_file_name,
        "file_type": material["file_type"],
        "file_size": material.get("file_size", 0),
        "uploaded_at": datetime.utcnow()
    }
    result = await db.user_notes.insert_one(note)

    if folder_id:
        await db.user_folders.update_one(
            {"_id": ObjectId(folder_id)},
            {"$inc": {"note_count": 1}}
        )

    return {"id": str(result.inserted_id), "title": note["title"], "message": "Saved to My Notes"}

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    note = await db.user_notes.find_one({"_id": ObjectId(note_id), "user_id": str(current_user["_id"])})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    filepath = os.path.join(NOTES_DIR, note["file_name"])
    if os.path.exists(filepath):
        os.remove(filepath)
    if note.get("folder_id"):
        await db.user_folders.update_one(
            {"_id": ObjectId(note["folder_id"])},
            {"$inc": {"note_count": -1}}
        )
    await db.user_notes.delete_one({"_id": ObjectId(note_id)})
    return {"message": "Note deleted"}

@router.get("/{note_id}/content")
async def get_note_content(note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    note = await db.user_notes.find_one({"_id": ObjectId(note_id), "user_id": str(current_user["_id"])})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    filepath = os.path.join(NOTES_DIR, note["file_name"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")
    ext = note["file_type"]
    if ext == ".pdf":
        try:
            import io, PyPDF2
            with open(filepath, "rb") as f:
                pdf_reader = PyPDF2.PdfReader(f)
                text = "\n".join(page.extract_text() for page in pdf_reader.pages)
        except:
            text = "[Could not extract PDF content]"
    else:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    return {"id": note_id, "title": note["title"], "content": text[:15000]}
