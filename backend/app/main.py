from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, materials, friends, communities, ai, admin, user_notes, search, teacher
from app.websocket.chat import router as chat_ws
from app.config import UPLOAD_DIR
from app.ratelimit import rate_limiter
import os
import time
import logging

logger = logging.getLogger(__name__)

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
    "https://college-app-backend-q8a9.onrender.com",
    "https://college-app.vercel.app",
    "capacitor://localhost",
]

# Allow any Vercel preview deployment
def is_allowed_origin(origin: str) -> bool:
    if origin in ALLOWED_ORIGINS:
        return True
    # Allow any Vercel preview deployment
    if origin.endswith(".vercel.app"):
        return True
    return False

CSP_HEADER = "default-src 'self'; " \
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " \
    "style-src 'self' 'unsafe-inline'; " \
    "img-src 'self' data: blob: https:; " \
    "font-src 'self' data:; " \
    "connect-src 'self' wss: https://openrouter.ai https://api.openai.com https://api.brevo.com https://college-app-backend-q8a9.onrender.com https://*.vercel.app; " \
    "frame-ancestors 'none'; " \
    "base-uri 'self'; " \
    "form-action 'self'"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    path = request.url.path

    if not path.startswith("/ws") and not path.startswith("/uploads"):
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            if origin and not is_allowed_origin(origin):
                logger.warning(f"Blocked request from unknown origin: {origin}")
                return JSONResponse(status_code=403, content={"detail": "Access denied"})

    sensitive_paths = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email", "/api/auth/resend-verification", "/api/admin/seed", "/api/communities", "/api/friends/request"]
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

    try:
        response = await call_next(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if not path.startswith("/ws"):
        response.headers["Content-Security-Policy"] = CSP_HEADER
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = []
    for e in errors:
        field = ".".join(str(x) for x in e.get("loc", []))
        msg = e.get("msg", "")
        if field and field != "body":
            messages.append(f"{field}: {msg}")
        else:
            messages.append(msg)
    return JSONResponse(
        status_code=422,
        content={"detail": messages[0] if len(messages) == 1 else messages}
    )

@app.get("/api/streams")
async def get_streams():
    from app.config import STREAMS, LANGUAGES
    return {**STREAMS, "_languages": LANGUAGES}

@app.get("/api/app-config")
async def app_config(request: Request):
    scheme = request.headers.get("x-forwarded-proto", "http")
    host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:8000"))
    from app.config import BACKEND_WS_HOST
    ws_host = BACKEND_WS_HOST or host
    ws_scheme = 'wss' if ws_host != host and 'onrender.com' in ws_host else ('wss' if scheme == 'https' else 'ws')
    return {
        "ws_url": f"{ws_scheme}://{ws_host}/ws/chat",
        "api_url": f"{scheme}://{host}/api",
        "app_name": "College App",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}
