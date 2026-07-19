from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from bson import ObjectId
from datetime import datetime, timedelta
from app.config import JWT_SECRET, JWT_ALGORITHM
from app.database import get_db
import json
import re
import time
import asyncio

router = APIRouter()

connected_clients = {}
ws_message_tracker = {}
ws_auth_tokens = {}

def check_ws_rate_limit(user_id: str) -> bool:
    now = time.time()
    if user_id not in ws_message_tracker:
        ws_message_tracker[user_id] = []
    ws_message_tracker[user_id] = [t for t in ws_message_tracker[user_id] if now - t < 10]
    if len(ws_message_tracker[user_id]) >= 15:
        return False
    ws_message_tracker[user_id].append(now)
    return True

def sanitize_text(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'https?://\S+', '[URL blocked]', text)
    text = text.strip()
    if len(text) > 2000:
        text = text[:2000]
    return text

def sanitize_name(name: str) -> str:
    name = re.sub(r'<[^>]+>', '', name)
    return name.strip()[:100]

async def get_user_from_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        db = get_db()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    user = None
    user_id = None

    try:
        auth_msg = await asyncio.wait_for(websocket.receive_text(), timeout=10)
        auth_data = json.loads(auth_msg)
        if auth_data.get("type") != "auth" or not auth_data.get("token"):
            await websocket.send_text(json.dumps({"type": "error", "message": "Authentication required"}))
            await websocket.close(code=4001)
            return
        user = await get_user_from_token(auth_data["token"])
        if not user:
            await websocket.send_text(json.dumps({"type": "error", "message": "Invalid token"}))
            await websocket.close(code=4001)
            return
        user_id = str(user["_id"])
        await websocket.send_text(json.dumps({"type": "auth_ok"}))

    except asyncio.TimeoutError:
        await websocket.close(code=4001)
        return
    except Exception:
        await websocket.close(code=4001)
        return

    connected_clients[user_id] = [ws for ws in connected_clients.get(user_id, []) if ws != websocket]
    connected_clients[user_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type in ("dm_send", "community_send"):
                if not check_ws_rate_limit(user_id):
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Too many messages. Please slow down."
                    }))
                    continue

            if msg_type == "dm_send":
                to_unique_id = message.get("to_unique_id")
                content = sanitize_text(message.get("content", ""))

                if not content:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Message cannot be empty"
                    }))
                    continue

                db = get_db()
                target = await db.users.find_one({"unique_id": to_unique_id})
                if not target:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "User not found"
                    }))
                    continue

                target_id = str(target["_id"])
                chat_id = "".join(sorted([user_id, target_id]))

                msg_doc = {
                    "sender_id": user_id,
                    "sender_name": sanitize_name(user["name"]),
                    "chat_type": "dm",
                    "chat_id": chat_id,
                    "content": content,
                    "timestamp": datetime.utcnow()
                }

                result = await db.messages.insert_one(msg_doc)

                response = {
                    "type": "new_message",
                    "data": {
                        "id": str(result.inserted_id),
                        "sender_id": user_id,
                        "sender_name": sanitize_name(user["name"]),
                        "chat_type": "dm",
                        "chat_id": chat_id,
                        "content": content,
                        "timestamp": msg_doc["timestamp"].isoformat()
                    }
                }

                response_str = json.dumps(response, default=str)

                async def send_to_user(uid, exclude=None):
                    if uid not in connected_clients:
                        return
                    alive = []
                    for ws in connected_clients[uid]:
                        try:
                            if ws is not exclude:
                                await ws.send_text(response_str)
                            alive.append(ws)
                        except:
                            pass
                    connected_clients[uid] = alive

                await send_to_user(target_id)
                await send_to_user(user_id, exclude=websocket)

            elif msg_type == "community_send":
                community_id = message.get("community_id")
                content = sanitize_text(message.get("content", ""))

                if not content:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Message cannot be empty"
                    }))
                    continue

                db = get_db()
                community = await db.communities.find_one({"_id": ObjectId(community_id)})
                if not community or user_id not in community["members"]:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Not a member of this community"
                    }))
                    continue

                msg_doc = {
                    "sender_id": user_id,
                    "sender_name": sanitize_name(user["name"]),
                    "chat_type": "community",
                    "chat_id": community_id,
                    "content": content,
                    "timestamp": datetime.utcnow()
                }

                result = await db.messages.insert_one(msg_doc)

                response = {
                    "type": "new_message",
                    "data": {
                        "id": str(result.inserted_id),
                        "sender_id": user_id,
                        "sender_name": sanitize_name(user["name"]),
                        "chat_type": "community",
                        "chat_id": community_id,
                        "content": content,
                        "timestamp": msg_doc["timestamp"].isoformat()
                    }
                }

                response_str = json.dumps(response, default=str)

                for member_id in community["members"]:
                    if member_id in connected_clients:
                        alive = []
                        for ws in connected_clients[member_id]:
                            try:
                                await ws.send_text(response_str)
                                alive.append(ws)
                            except:
                                pass
                        connected_clients[member_id] = alive

            elif msg_type == "typing":
                chat_type = message.get("chat_type")
                chat_id = message.get("chat_id")

                typing_response = {
                    "type": "typing",
                    "data": {
                        "user_id": user_id,
                        "user_name": sanitize_name(user["name"]),
                        "chat_type": chat_type,
                        "chat_id": chat_id
                    }
                }

                if chat_type == "dm":
                    db = get_db()
                    if chat_id.startswith(user_id):
                        target_id = chat_id[len(user_id):]
                    else:
                        target_id = chat_id[:len(user_id)]
                    if target_id in connected_clients:
                        alive = []
                        for ws in connected_clients[target_id]:
                            try:
                                await ws.send_text(json.dumps(typing_response))
                                alive.append(ws)
                            except:
                                pass
                        connected_clients[target_id] = alive
                elif chat_type == "community":
                    db = get_db()
                    community = await db.communities.find_one({"_id": ObjectId(chat_id)})
                    if community:
                        for member_id in community["members"]:
                            if member_id != user_id and member_id in connected_clients:
                                alive = []
                                for ws in connected_clients[member_id]:
                                    try:
                                        await ws.send_text(json.dumps(typing_response))
                                        alive.append(ws)
                                    except:
                                        pass
                                connected_clients[member_id] = alive

            elif msg_type == "history":
                chat_type = message.get("chat_type")
                chat_id = message.get("chat_id")
                page = message.get("page", 1)
                limit = 50

                db = get_db()

                if chat_type == "dm":
                    if user_id not in chat_id:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Access denied"
                        }))
                        continue
                elif chat_type == "community":
                    community = await db.communities.find_one({"_id": ObjectId(chat_id)})
                    if not community or user_id not in community.get("members", []):
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Access denied"
                        }))
                        continue

                skip = (page - 1) * limit

                cursor = db.messages.find({
                    "chat_type": chat_type,
                    "chat_id": chat_id
                }).sort("timestamp", -1).skip(skip).limit(limit)

                messages = []
                async for msg in cursor:
                    messages.append({
                        "id": str(msg["_id"]),
                        "sender_id": msg["sender_id"],
                        "sender_name": msg["sender_name"],
                        "chat_type": msg["chat_type"],
                        "chat_id": msg["chat_id"],
                        "content": msg["content"],
                        "timestamp": msg["timestamp"].isoformat()
                    })

                messages.reverse()

                await websocket.send_text(json.dumps({
                    "type": "history",
                    "data": messages,
                    "page": page,
                    "has_more": len(messages) == limit
                }))

    except WebSocketDisconnect:
        if user_id in connected_clients:
            connected_clients[user_id] = [ws for ws in connected_clients[user_id] if ws != websocket]
            if not connected_clients[user_id]:
                del connected_clients[user_id]
    except Exception as e:
        if user_id in connected_clients:
            connected_clients[user_id] = [ws for ws in connected_clients[user_id] if ws != websocket]
            if not connected_clients[user_id]:
                del connected_clients[user_id]
