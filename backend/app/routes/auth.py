from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
import random
import string
from app.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, VERIFICATION_TOKEN_EXPIRE_MINUTES, STREAMS
from app.database import get_db
from app.models.user import UserCreate, UserLogin, VerifyEmailRequest, ResendVerificationRequest, UserResponse
from app.middleware.auth import get_current_user
from app.services.email import send_verification_email

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_unique_id():
    return ''.join(random.choices(string.digits, k=6))

def create_verification_code():
    return ''.join(random.choices(string.digits, k=6))

@router.post("/register")
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    db = get_db()

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        if existing.get("email_verified"):
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            await db.users.delete_one({"email": user_data.email})

    if user_data.stream not in STREAMS:
        raise HTTPException(status_code=400, detail="Invalid stream")

    stream_info = STREAMS[user_data.stream]
    if "combinations" in stream_info:
        if user_data.combination not in stream_info["combinations"]:
            raise HTTPException(status_code=400, detail="Invalid combination")
        subjects = stream_info["combinations"][user_data.combination]
    elif "subjects" in stream_info:
        subjects = stream_info["subjects"]
    elif "sectors" in stream_info:
        subjects = stream_info["sectors"]
    else:
        subjects = []

    unique_id = generate_unique_id()
    while await db.users.find_one({"unique_id": unique_id}):
        unique_id = generate_unique_id()

    hashed_password = hash_password(user_data.password)
    verification_code = create_verification_code()
    code_expires = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)

    user = {
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "unique_id": unique_id,
        "stream": user_data.stream,
        "combination": user_data.combination,
        "puc": user_data.puc,
        "subjects": subjects,
        "languages": user_data.languages,
        "contributor_badge": False,
        "pending_uploads": 0,
        "role": "student",
        "email_verified": False,
        "verification_code": verification_code,
        "verification_code_expires": code_expires,
        "created_at": datetime.utcnow()
    }

    result = await db.users.insert_one(user)

    background_tasks.add_task(
        send_verification_email,
        user_data.email,
        user_data.name,
        verification_code
    )

    return {
        "message": "Registration successful. Please check your email for the verification code.",
        "email": user_data.email
    }

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    db = get_db()
    user = await db.users.find_one({
        "email": req.email,
        "email_verified": False
    })

    if not user:
        raise HTTPException(status_code=400, detail="No unverified account found with this email")

    if user.get("verification_code") != req.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if user.get("verification_code_expires") and user["verification_code_expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new one.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_code": "", "verification_code_expires": ""}}
    )

    return {"message": "Email verified successfully. You can now log in."}

@router.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest, background_tasks: BackgroundTasks):
    db = get_db()
    user = await db.users.find_one({"email": req.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")

    new_code = create_verification_code()
    code_expires = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification_code": new_code, "verification_code_expires": code_expires}}
    )

    background_tasks.add_task(
        send_verification_email,
        user["email"],
        user["name"],
        new_code
    )

    return {"message": "Verification email resent. Please check your inbox."}

@router.post("/login")
async def login(login_data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        user = await db.users.find_one({"unique_id": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("email_verified") and user.get("role") not in ("teacher", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in. Check your inbox or request a new verification email."
        )

    token = create_access_token({"sub": str(user["_id"])})

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "unique_id": user["unique_id"],
            "stream": user["stream"],
            "combination": user.get("combination"),
            "puc": user.get("puc"),
            "subjects": user["subjects"],
            "languages": user.get("languages", []),
            "contributor_badge": user.get("contributor_badge", False),
            "email_verified": user.get("email_verified", False),
            "role": user.get("role", "student"),
            "created_at": user["created_at"]
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "unique_id": current_user["unique_id"],
        "stream": current_user["stream"],
        "combination": current_user.get("combination"),
        "puc": current_user.get("puc"),
        "subjects": current_user["subjects"],
        "languages": current_user.get("languages", []),
        "contributor_badge": current_user.get("contributor_badge", False),
        "email_verified": current_user.get("email_verified", False),
        "created_at": current_user["created_at"]
    }

@router.get("/users/search")
async def search_users(query: str = ""):
    db = get_db()
    users = await db.users.find(
        {"$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"unique_id": {"$regex": query, "$options": "i"}}
        ]}
    ).limit(20).to_list(20)

    return [{
        "id": str(u["_id"]),
        "name": u["name"],
        "unique_id": u["unique_id"],
        "stream": u["stream"]
    } for u in users]

@router.get("/users/by-id/{unique_id}")
async def get_user_by_unique_id(unique_id: str):
    db = get_db()
    user = await db.users.find_one({"unique_id": unique_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "unique_id": user["unique_id"],
        "stream": user["stream"]
    }
