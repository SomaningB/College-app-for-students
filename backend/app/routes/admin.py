from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
import os
import uuid
import aiofiles
from bson import ObjectId
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB
from app.database import get_db
from app.middleware.auth import get_admin_user
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".doc", ".docx"}

PUC_OPTIONS = ["1st", "2nd"]

async def generate_unique_id(db, prefix="TCH"):
    last = await db.users.find_one({"role": "teacher"}, sort=[("unique_id", -1)])
    if last and last.get("unique_id", "").startswith(prefix):
        num = int(last["unique_id"][len(prefix):]) + 1
    else:
        num = 1
    return f"{prefix}{num:03d}"

@router.post("/seed")
async def seed_admin():
    db = get_db()
    existing = await db.users.find_one({"role": "admin"})
    if existing:
        return {"message": "Admin already exists", "email": existing["email"]}

    admin = {
        "name": "Admin",
        "email": "admin@collegeapp.com",
        "hashed_password": pwd_context.hash("admin123"),
        "unique_id": "000000",
        "stream": "",
        "subjects": [],
        "role": "admin",
        "email_verified": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin)
    return {"message": "Admin created", "email": "admin@collegeapp.com", "password": "admin123"}

@router.post("/create-teacher")
async def create_teacher(
    name: str = Form(...),
    subjects: str = Form(...),
    stream: str = Form(...),
    admin: dict = Depends(get_admin_user)
):
    import random, string
    db = get_db()
    unique_id = await generate_unique_id(db)
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    subject_list = [s.strip() for s in subjects.split(",") if s.strip()]

    teacher = {
        "name": name,
        "email": f"{unique_id.lower()}@collegeapp.com",
        "hashed_password": pwd_context.hash(password),
        "unique_id": unique_id,
        "stream": stream,
        "subjects": subject_list,
        "role": "teacher",
        "email_verified": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(teacher)
    return {
        "message": "Teacher created",
        "name": name,
        "unique_id": unique_id,
        "password": password,
        "stream": stream,
        "subjects": subject_list
    }

@router.get("/teachers")
async def get_teachers(admin: dict = Depends(get_admin_user)):
    db = get_db()
    teachers = await db.users.find({"role": "teacher"}).sort("created_at", -1).to_list(100)
    return [{
        "id": str(t["_id"]),
        "name": t["name"],
        "unique_id": t["unique_id"],
        "stream": t.get("stream", ""),
        "subjects": t.get("subjects", []),
        "created_at": t["created_at"]
    } for t in teachers]

@router.put("/teachers/{teacher_id}")
async def update_teacher(
    teacher_id: str,
    name: str = Form(...),
    subjects: str = Form(...),
    stream: str = Form(...),
    admin: dict = Depends(get_admin_user)
):
    db = get_db()
    teacher = await db.users.find_one({"_id": ObjectId(teacher_id), "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    subject_list = [s.strip() for s in subjects.split(",") if s.strip()]

    await db.users.update_one(
        {"_id": ObjectId(teacher_id)},
        {"$set": {
            "name": name,
            "subjects": subject_list,
            "stream": stream
        }}
    )
    return {"message": "Teacher updated"}

@router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(teacher_id), "role": "teacher"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await db.materials.delete_many({"uploaded_by": teacher_id})
    return {"message": "Teacher deleted"}

@router.get("/stats")
async def get_stats(admin: dict = Depends(get_admin_user)):
    db = get_db()
    total_users = await db.users.count_documents({"role": "student"})
    total_teachers = await db.users.count_documents({"role": "teacher"})
    total_materials = await db.materials.count_documents({"status": "approved"})
    pending_materials = await db.materials.count_documents({"status": "pending"})
    total_communities = await db.communities.count_documents({})
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_materials": total_materials,
        "pending_materials": pending_materials,
        "total_communities": total_communities
    }

@router.get("/users")
async def get_users(admin: dict = Depends(get_admin_user)):
    db = get_db()
    users = await db.users.find({"role": "student"}).sort("created_at", -1).to_list(200)
    return [{
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "unique_id": u["unique_id"],
        "stream": u["stream"],
        "email_verified": u.get("email_verified", False),
        "contributor_badge": u.get("contributor_badge", False),
        "created_at": u["created_at"]
    } for u in users]

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id), "role": "student"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@router.post("/materials/upload")
async def admin_upload_material(
    title: str = Form(...),
    subject: str = Form(...),
    stream: str = Form(...),
    puc: str = Form(...),
    combination: str = Form(None),
    description: str = Form(None),
    file: UploadFile = File(...),
    admin: dict = Depends(get_admin_user)
):
    if puc not in PUC_OPTIONS:
        raise HTTPException(status_code=400, detail="PUC must be '1st' or '2nd'")

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
        "stream": stream,
        "puc": puc,
        "combination": combination,
        "description": description,
        "file_url": f"/uploads/{filename}",
        "file_type": ext,
        "file_size": len(content),
        "contributed_by": str(admin["_id"]),
        "contributor_name": admin["name"],
        "status": "approved",
        "tags": [],
        "download_count": 0,
        "uploaded_at": datetime.utcnow()
    }

    result = await db.materials.insert_one(material)
    return {"id": str(result.inserted_id), "message": "Material uploaded and approved"}

@router.get("/materials")
async def get_all_materials(admin: dict = Depends(get_admin_user)):
    db = get_db()
    materials = await db.materials.find().sort("uploaded_at", -1).to_list(200)
    return [{
        "id": str(m["_id"]),
        "title": m["title"],
        "subject": m["subject"],
        "stream": m["stream"],
        "puc": m.get("puc"),
        "combination": m.get("combination"),
        "file_type": m["file_type"],
        "file_size": m.get("file_size", 0),
        "status": m["status"],
        "contributor_name": m.get("contributor_name"),
        "download_count": m.get("download_count", 0),
        "uploaded_at": m["uploaded_at"]
    } for m in materials]

@router.delete("/materials/{material_id}")
async def delete_material(material_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    material = await db.materials.find_one({"_id": ObjectId(material_id)})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    filepath = os.path.join(UPLOAD_DIR, os.path.basename(material["file_url"]))
    if os.path.exists(filepath):
        os.remove(filepath)

    await db.materials.delete_one({"_id": ObjectId(material_id)})
    return {"message": "Material deleted"}
