# Backend Schema — College App for Students

## 1. MongoDB Collections

### 1.1 `users`

Stores all registered users (students and admins).

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "hashed_password": "string (bcrypt)",
  "unique_id": "string (6-digit, unique)",
  "stream": "string (science|commerce|arts)",
  "combination": "string? (PCMB|PCMC|PCME|CEBA|SEBA|DEFAULT)",
  "puc": "string? (1st|2nd)",
  "subjects": "string[] (derived from combination)",
  "languages": "string[] (max 2)",
  "contributor_badge": "boolean (default: false)",
  "pending_uploads": "number (default: 0, max 5)",
  "role": "string (student|admin)",
  "email_verified": "boolean (default: false)",
  "verification_code": "string? (6-digit)",
  "verification_code_expires": "datetime?",
  "created_at": "datetime"
}
```

**Indexes:**
- `email` — unique index
- `unique_id` — unique index

### 1.2 `materials`

Stores all study materials (uploaded by students or admins).

```json
{
  "_id": "ObjectId",
  "title": "string",
  "subject": "string",
  "stream": "string",
  "puc": "string? (1st|2nd)",
  "combination": "string?",
  "description": "string?",
  "language": "string?",
  "file_url": "string (/uploads/{uuid}.ext)",
  "file_type": "string (.pdf|.txt|.md)",
  "file_size": "number (bytes)",
  "contributed_by": "ObjectId? (references users._id)",
  "contributor_name": "string?",
  "status": "string (pending|approved|rejected)",
  "approved_by": "ObjectId? (references users._id)",
  "tags": "string[]",
  "download_count": "number (default: 0)",
  "uploaded_at": "datetime"
}
```

**Indexes:**
- `(stream, subject)` — compound index for filtering
- `status` — index for pending/approved queries

### 1.3 `friend_requests`

Manages friend request lifecycle.

```json
{
  "_id": "ObjectId",
  "from_user_id": "ObjectId (references users._id)",
  "from_user_name": "string",
  "from_unique_id": "string",
  "to_user_id": "ObjectId (references users._id)",
  "status": "string (pending|accepted|rejected)",
  "created_at": "datetime"
}
```

**Indexes:**
- `(from_user_id, to_user_id)` — compound unique index

### 1.4 `communities`

Stores community/group information.

```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "created_by": "ObjectId (references users._id)",
  "created_by_name": "string",
  "members": "ObjectId[] (references users._id)",
  "member_count": "number",
  "created_at": "datetime"
}
```

### 1.5 `messages`

Stores all chat messages (DM and community).

```json
{
  "_id": "ObjectId",
  "sender_id": "ObjectId (references users._id)",
  "sender_name": "string",
  "chat_type": "string (dm|community)",
  "chat_id": "string",
  "content": "string",
  "timestamp": "datetime"
}
```

**Indexes:**
- `(chat_type, chat_id, timestamp)` — compound index for history queries

**Chat ID format:**
- DM: `dm_{sorted_user1_id}_{sorted_user2_id}`
- Community: `community_{community_id}`

## 2. Stream Configuration (Hardcoded in `config.py`)

### Science Stream
| Combination | Subjects |
|-------------|----------|
| PCMB | Physics, Chemistry, Mathematics, Biology |
| PCMC | Physics, Chemistry, Mathematics, Computer Science |
| PCME | Physics, Chemistry, Mathematics, Electronics |

### Commerce Stream
| Combination | Subjects |
|-------------|----------|
| CEBA | Computer Science, Economics, Business Studies, Accountancy |
| SEBA | Statistics, Economics, Business Studies, Accountancy |

### Arts (Humanities) Stream
| Combination | Subjects |
|-------------|----------|
| DEFAULT | History, Political Science, Economics, Sociology, Geography, Kannada, English |

### Languages (3rd Language Options)
- Information Technology (NSQF)
- Automobile (NSQF)
- Kannada
- Hindi
- Urdu
- Sanskrit (where available)

## 3. Entity Relationships

```
users ──1:N──> friend_requests (as requester)
users ──1:N──> friend_requests (as requestee)
users ──1:N──> materials (as contributor)
users ──1:N──> messages (as sender)
users ──N:M──> communities (via members array)
users ──N:M──> users (friends via accepted friend_requests)
```

## 4. JWT Payload Structure

```json
{
  "sub": "user._id (string)",
  "exp": "unix timestamp"
}
```

- Algorithm: HS256
- Secret: configurable via `JWT_SECRET`
- Expiry: configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 24h)

## 5. Material Status Flow

```
  Student Upload
       │
       ▼
    ┌─────────┐
    │ PENDING │ ── Admin approves ──> ┌──────────┐
    └─────────┘                        │ APPROVED │
       │                               └──────────┘
       │
       └── Admin rejects ──> ┌──────────┐
                              │ REJECTED │
                              └──────────┘
```

## 6. File Upload Constraints

- Allowed extensions: `.pdf`, `.txt`, `.md` (students); `.pdf`, `.txt`, `.md`, `.doc`, `.docx` (admin)
- Max file size: 10MB (configurable)
- Storage: local filesystem under `UPLOAD_DIR` (default: `./uploads`)
- Filename: `{uuid}.{ext}` to prevent collisions
- Served via FastAPI StaticFiles at `/uploads/`

## 7. API Response Format

### Success
```json
{
  // Direct data response (array or object)
}
```

### Error
```json
{
  "detail": "Error message string"
}
```

### Pagination (WebSocket history)
```json
{
  "type": "history",
  "messages": [...],
  "page": 1,
  "has_more": true
}
```

## 8. Security Measures

- **Passwords:** bcrypt hashed (never stored in plaintext)
- **JWT:** Signed with HS256, contains only user ID
- **Auth headers:** Bearer token via Authorization header
- **401 handler:** JWT decode failure → auto logout + redirect to /login
- **Admin routes:** Double-checked via `get_admin_user` dependency
- **File uploads:** Extension whitelist, size limit, UUID filenames
- **Message sanitization:** HTML stripped, URLs blocked, truncated to 2000 chars
- **CORS:** All origins allowed (dev setting)
