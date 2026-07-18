from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, materials, friends, communities, ai, admin, user_notes, search, teacher
from app.websocket.chat import router as chat_ws
from app.config import UPLOAD_DIR
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield
    await close_db()

app = FastAPI(title="College Student App", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"])
app.include_router(communities.router, prefix="/api/communities", tags=["Communities"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(user_notes.router, prefix="/api/user-notes", tags=["User Notes"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher"])
app.include_router(chat_ws)

@app.get("/api/streams")
async def get_streams():
    from app.config import STREAMS, LANGUAGES
    return {**STREAMS, "_languages": LANGUAGES}

@app.get("/api/health")
async def health():
    return {"status": "ok"}
