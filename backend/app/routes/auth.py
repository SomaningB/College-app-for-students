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

verify_attempts = {}
reset_attempts = {}
MAX_VERIFY_ATTEMPTS = 5

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

    now = datetime.utcnow()
    attempts_key = f"verify:{req.email}"
    attempt_data = verify_attempts.get(attempts_key)
    if attempt_data:
        if attempt_data["count"] >= MAX_VERIFY_ATTEMPTS:
            if now - attempt_data["locked_until"] < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many incorrect attempts. Try again in 15 minutes.")
            else:
                del verify_attempts[attempts_key]

    if user.get("verification_code_expires") and user["verification_code_expires"] < now:
        raise HTTPException(status_code=400, detail="Verification code has expired. Request a new one.")

    if user.get("verification_code") != req.code:
        if attempts_key not in verify_attempts:
            verify_attempts[attempts_key] = {"count": 0, "locked_until": now}
        verify_attempts[attempts_key]["count"] += 1
        if verify_attempts[attempts_key]["count"] >= MAX_VERIFY_ATTEMPTS:
            verify_attempts[attempts_key]["locked_until"] = now
            raise HTTPException(status_code=429, detail="Too many incorrect attempts. Try again in 15 minutes.")
        remaining = MAX_VERIFY_ATTEMPTS - verify_attempts[attempts_key]["count"]
        raise HTTPException(status_code=400, detail=f"Invalid verification code. {remaining} attempt(s) remaining.")

    verify_attempts.pop(attempts_key, None)

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
async def search_users(query: str = "", current_user: dict = Depends(get_current_user)):
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

@router.post("/forgot-password")
async def forgot_password(req: dict, background_tasks: BackgroundTasks):
    email = (req.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If this email is registered, a reset code will be sent."}

    reset_code = ''.join(random.choices(string.digits, k=6))
    code_expires = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_code": reset_code, "reset_code_expires": code_expires}}
    )

    from app.services.email import send_email
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>Use the code below to reset your password:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center;
            padding: 20px; background: #f0f0ff; border-radius: 12px; margin: 20px 0;">
            {reset_code}
        </div>
        <p style="color: #666;">This code expires in 24 hours.</p>
    </div>
    """
    background_tasks.add_task(send_email, user["email"], user["name"], "Password Reset Code", html)

    return {"message": "If this email is registered, a reset code will be sent."}

@router.post("/reset-password")
async def reset_password(req: dict):
    email = (req.get("email") or "").strip().lower()
    code = (req.get("code") or "").strip()
    new_password = req.get("password", "")

    if not email or not code or not new_password:
        raise HTTPException(status_code=400, detail="Email, code, and new password are required")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")

    now = datetime.utcnow()
    attempts_key = f"reset:{email}"
    attempt_data = reset_attempts.get(attempts_key)
    if attempt_data and attempt_data["count"] >= 5:
        if now - attempt_data["locked_until"] < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
        del reset_attempts[attempts_key]

    if user.get("reset_code_expires") and user["reset_code_expires"] < now:
        raise HTTPException(status_code=400, detail="Reset code has expired. Request a new one.")

    if user.get("reset_code") != code:
        if attempts_key not in reset_attempts:
            reset_attempts[attempts_key] = {"count": 0, "locked_until": now}
        reset_attempts[attempts_key]["count"] += 1
        if reset_attempts[attempts_key]["count"] >= 5:
            reset_attempts[attempts_key]["locked_until"] = now
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
        remaining = 5 - reset_attempts[attempts_key]["count"]
        raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")

    reset_attempts.pop(attempts_key, None)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hash_password(new_password)}, "$unset": {"reset_code": "", "reset_code_expires": ""}}
    )

    return {"message": "Password reset successfully. You can now log in."}

@router.get("/users/by-id/{unique_id}")
async def get_user_by_unique_id(unique_id: str, current_user: dict = Depends(get_current_user)):
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
