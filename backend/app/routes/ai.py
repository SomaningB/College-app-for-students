from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from openai import OpenAI
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, UPLOAD_DIR
from app.middleware.auth import get_current_user
from app.database import get_db
from bson import ObjectId
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

router = APIRouter()

async def save_ai_message(user_id: str, role: str, content: str, subject: str = "", source: str = ""):
    db = get_db()
    await db.ai_messages.insert_one({
        "user_id": user_id,
        "role": role,
        "content": content,
        "subject": subject,
        "source": source,
        "timestamp": datetime.utcnow()
    })

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL
) if OPENROUTER_API_KEY else None

class GenerateNotesRequest(BaseModel):
    topic: str
    subject: str

class GenerateQuestionsRequest(BaseModel):
    topic: str
    subject: str
    count: int = 5

class ChatAssistantRequest(BaseModel):
    message: str
    subject: Optional[str] = None
    file_content: Optional[str] = None
    file_name: Optional[str] = None

@router.post("/generate-notes")
async def generate_notes(
    req: GenerateNotesRequest,
    current_user: dict = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    prompt = f"""Create comprehensive study notes for {req.subject} on the topic: {req.topic}

Format the notes with:
1. Key Concepts (bullet points)
2. Important Definitions
3. Formulas/Diagrams (describe in text)
4. Examples
5. Summary

Make it easy to understand for a college student."""

    response = client.chat.completions.create(
        model="openai/gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful college tutor creating study notes."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2000
    )

    return {
        "notes": response.choices[0].message.content,
        "topic": req.topic,
        "subject": req.subject
    }

@router.post("/generate-questions")
async def generate_questions(
    req: GenerateQuestionsRequest,
    current_user: dict = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    prompt = f"""Generate {req.count} important exam questions for {req.subject} on the topic: {req.topic}

For each question provide:
1. The question
2. Expected answer/model answer
3. Difficulty level (Easy/Medium/Hard)

Make them relevant for college-level exams."""

    response = client.chat.completions.create(
        model="openai/gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are an exam preparation assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2500
    )

    return {
        "questions": response.choices[0].message.content,
        "topic": req.topic,
        "subject": req.subject,
        "count": req.count
    }

@router.post("/chat-assistant")
async def chat_assistant(
    req: ChatAssistantRequest,
    current_user: dict = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    messages = [
        {"role": "system", "content": "You are a helpful college study assistant. Help students understand their subjects and answer their questions clearly."}
    ]

    if req.subject:
        messages[0]["content"] += f" You specialize in {req.subject}."

    if req.file_content:
        messages.append({
            "role": "user",
            "content": f"I'm sharing my notes from the file '{req.file_name}'. Here is the content:\n\n{req.file_content[:15000]}"
        })

    messages.append({"role": "user", "content": req.message})

    response = client.chat.completions.create(
        model="openai/gpt-3.5-turbo",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )

    reply = response.choices[0].message.content
    uid = str(current_user["_id"])
    await save_ai_message(uid, "user", req.message, req.subject or "", "chat")
    await save_ai_message(uid, "assistant", reply, req.subject or "", "chat")

    return {"reply": reply}

@router.post("/chat-with-notes")
async def chat_with_notes(
    message: str = Form(...),
    subject: str = Form(None),
    file: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    file_content = None
    file_name = None

    if file:
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ("pdf", "txt", "md"):
            raise HTTPException(status_code=400, detail="Only PDF, TXT, MD files allowed")

        content_bytes = await file.read()
        if len(content_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB")

        if ext == "pdf":
            try:
                import io, PyPDF2
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
                file_content = "\n".join(page.extract_text() for page in pdf_reader.pages)
            except:
                raise HTTPException(status_code=400, detail="Could not read PDF file")
        else:
            file_content = content_bytes.decode("utf-8", errors="replace")

        file_name = file.filename

    system_prompt = "You are a helpful college study assistant. Help students understand their study materials and answer their questions clearly."
    if subject:
        system_prompt += f" You specialize in {subject}."

    messages = [{"role": "system", "content": system_prompt}]

    if file_content:
        messages.append({
            "role": "user",
            "content": f"I'm sharing my notes from the file '{file_name}'. Here is the content:\n\n{file_content[:15000]}"
        })

    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="openai/gpt-3.5-turbo",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )

    reply = response.choices[0].message.content
    uid = str(current_user["_id"])
    await save_ai_message(uid, "user", message, subject or "", "chat-with-notes")
    await save_ai_message(uid, "assistant", reply, subject or "", "chat-with-notes")

    return {"reply": reply}

@router.post("/chat-with-saved-note")
async def chat_with_saved_note(
    note_id: str = Form(...),
    message: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    db = get_db()
    note = await db.user_notes.find_one({"_id": ObjectId(note_id), "user_id": str(current_user["_id"])})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    notes_dir = os.path.join(UPLOAD_DIR, "user_notes")
    filepath = os.path.join(notes_dir, note["file_name"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    ext = note["file_type"]
    file_content = ""
    if ext == ".pdf":
        try:
            import io, PyPDF2
            with open(filepath, "rb") as f:
                pdf_reader = PyPDF2.PdfReader(f)
                file_content = "\n".join(page.extract_text() for page in pdf_reader.pages)
        except Exception as e:
            file_content = f"[Could not extract PDF content: {str(e)}]"
    else:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            file_content = f.read()

    messages = [
        {"role": "system", "content": "You are a helpful college study assistant. Help students understand their study materials and answer their questions clearly."},
        {"role": "user", "content": f"I'm sharing my notes '{note['title']}'. Here is the content:\n\n{file_content[:15000]}"},
        {"role": "user", "content": message}
    ]

    response = client.chat.completions.create(
        model="openai/gpt-3.5-turbo",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )

    reply = response.choices[0].message.content
    uid = str(current_user["_id"])
    await save_ai_message(uid, "user", message, note.get("subject", ""), "chat-with-saved-note")
    await save_ai_message(uid, "assistant", reply, note.get("subject", ""), "chat-with-saved-note")

    return {"reply": reply}

@router.get("/history")
async def get_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    messages = await db.ai_messages.find(
        {"user_id": str(current_user["_id"])}
    ).sort("timestamp", 1).to_list(500)
    return [{
        "id": str(m["_id"]),
        "role": m["role"],
        "content": m["content"],
        "subject": m.get("subject", ""),
        "source": m.get("source", ""),
        "timestamp": m["timestamp"]
    } for m in messages]

@router.delete("/history")
async def clear_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.ai_messages.delete_many({"user_id": str(current_user["_id"])})
    return {"message": "History cleared"}

@router.post("/recommend-subjects")
async def recommend_subjects(current_user: dict = Depends(get_current_user)):
    db = get_db()

    users = await db.users.find({}).to_list(200)
    if len(users) < 3:
        return {"recommendations": [], "message": "Need more users for recommendations"}

    profiles = []
    user_ids = []
    for u in users:
        profile = f"{u['stream']} {' '.join(u.get('subjects', []))}"
        profiles.append(profile)
        user_ids.append(str(u["_id"]))

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(profiles)

    current_idx = None
    for i, uid in enumerate(user_ids):
        if uid == str(current_user["_id"]):
            current_idx = i
            break

    if current_idx is None:
        return {"recommendations": []}

    similarities = cosine_similarity(tfidf_matrix[current_idx], tfidf_matrix).flatten()
    similar_indices = similarities.argsort()[::-1][1:6]

    recommendations = []
    for idx in similar_indices:
        if similarities[idx] > 0:
            user = users[idx]
            recommendations.append({
                "user_name": user["name"],
                "stream": user["stream"],
                "subjects": user.get("subjects", []),
                "similarity": float(round(similarities[idx], 2))
            })

    return {"recommendations": recommendations}
