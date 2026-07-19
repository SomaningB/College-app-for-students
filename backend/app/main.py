from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, materials, friends, communities, ai, admin, user_notes, search, teacher
from app.websocket.chat import router as chat_ws
from app.config import UPLOAD_DIR
from app.ratelimit import rate_limiter
import os
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield
    await close_db()

app = FastAPI(title="College Student App", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://college-app.vercel.app",
    "capacitor://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    sensitive_paths = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email", "/api/auth/resend-verification", "/api/admin/seed", "/api/communities", "/api/friends/request"]
    path = request.url.path
    if any(path.startswith(p) for p in sensitive_paths):
        client_ip = request.client.host if request.client else "unknown"
        if path.startswith("/api/auth/login"):
            key = f"login:{client_ip}"
            limit, window = 10, 60
        elif path.startswith("/api/auth/register"):
            key = f"register:{client_ip}"
            limit, window = 3, 300
        elif path.startswith("/api/auth/verify-email"):
            key = f"verify:{client_ip}"
            limit, window = 10, 300
        elif path.startswith("/api/auth/resend-verification"):
            key = f"resend:{client_ip}"
            limit, window = 3, 300
        elif path.startswith("/api/admin/seed"):
            key = f"seed:{client_ip}"
            limit, window = 1, 3600
        elif path.startswith("/api/communities"):
            key = f"community:{client_ip}"
            limit, window = 5, 300
        elif path.startswith("/api/friends/request"):
            key = f"friendreq:{client_ip}"
            limit, window = 10, 300
        else:
            key = f"auth:{client_ip}"
            limit, window = 30, 60
        if not rate_limiter.check(key, limit, window):
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

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
