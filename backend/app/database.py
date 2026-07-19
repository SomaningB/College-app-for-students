from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, DATABASE_NAME

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    await db.users.create_index("email", unique=True)
    await db.users.create_index("unique_id", unique=True)
    await db.materials.create_index([("stream", 1), ("subject", 1)])
    await db.friend_requests.create_index([("from_user_id", 1), ("to_user_id", 1)])
    await db.messages.create_index([("chat_type", 1), ("chat_id", 1), ("timestamp", -1)])
    await db.ai_messages.create_index([("user_id", 1), ("timestamp", 1)])
    await db.feedback.create_index([("user_id", 1)])
    await db.feedback.create_index([("created_at", -1)])

async def close_db():
    if client:
        client.close()

def get_db():
    return db
