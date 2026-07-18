# Technical Requirement Document (TRD) — College App for Students

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.21 |
| Routing | React Router DOM | 6.23.0 |
| HTTP Client | Axios | 1.7.0 |
| Animation | Framer Motion | 11.0.0 |
| 3D Graphics | Three.js / @react-three/fiber | 0.162.0 / 8.16.8 |
| Icons | react-icons | 5.2.0 |
| Toasts | react-hot-toast | 2.4.1 |
| PDF Viewer | react-pdf | 9.0.0 |
| **Backend Framework** | FastAPI | 0.111.0 |
| ASGI Server | Uvicorn | 0.29.0 |
| Database | MongoDB (via Motor) | 7.0 |
| ORM/ODM | Motor (async) + Pydantic | 3.4.0 |
| Auth | python-jose (JWT) + bcrypt | 3.3.0 |
| AI | OpenAI Python SDK | 1.30.0 |
| ML | scikit-learn | 1.5.0 |
| Email | Brevo (Sendinblue) API via httpx | 0.27.0 |
| File Handling | aiofiles, python-multipart | — |
| **Containerization** | Docker + Docker Compose | — |

## 2. Project Architecture

### 2.1 Directory Structure

```
college-app/
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx       # Main layout (sidebar + content)
│   │   │   ├── Sidebar.jsx      # Desktop navigation sidebar
│   │   │   ├── MobileNav.jsx    # Mobile bottom navigation
│   │   │   └── ThreeBackground.jsx  # 3D animated background
│   │   ├── pages/               # Route-level page components
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance + API service objects
│   │   │   └── websocket.js     # WebSocket manager singleton
│   │   ├── App.jsx              # Route definitions
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles + design tokens
│   └── vite.config.js           # Dev server proxy config
├── backend/                     # FastAPI async server
│   ├── app/
│   │   ├── main.py              # App factory, router registration
│   │   ├── config.py            # Environment config + STREAMS/LANGUAGES
│   │   ├── database.py          # MongoDB connection + indexes
│   │   ├── models/              # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── material.py
│   │   │   └── chat.py
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── materials.py
│   │   │   ├── friends.py
│   │   │   ├── communities.py
│   │   │   ├── ai.py
│   │   │   └── admin.py
│   │   ├── middleware/
│   │   │   └── auth.py          # JWT auth dependencies
│   │   ├── services/
│   │   │   └── email.py         # Brevo email service
│   │   ├── websocket/
│   │   │   └── chat.py          # Real-time chat WebSocket
│   │   └── ml/                  # ML placeholder
│   └── requirements.txt
├── docker-compose.yml           # Multi-service orchestration
└── docs/                        # Project documentation
```

### 2.2 Data Flow

```
Browser → Vite Dev Server (port 3000)
  ├── /api/*  → proxy → FastAPI (port 8000) → MongoDB
  ├── /ws/*   → proxy → FastAPI WebSocket → connected clients
  └── /uploads/* → proxy → StaticFiles (uploads directory)
```

## 3. API Endpoints

### 3.1 Authentication (`/api/auth`)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/register` | — | `{name, email, password, stream, combination, puc, subjects, languages}` | `{message, email}` |
| POST | `/verify-email` | — | `{email, code}` | `{message}` |
| POST | `/resend-verification` | — | `{email}` | `{message}` |
| POST | `/login` | — | `{email, password}` | `{token, user}` |
| GET | `/me` | Bearer | — | `{user}` |
| GET | `/users/search?query=` | — | query param | `[{id, name, unique_id, stream}]` |
| GET | `/users/by-id/{unique_id}` | — | path param | `{id, name, unique_id, stream}` |

### 3.2 Materials (`/api/materials`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Bearer | List materials (query: stream, subject, puc, status) |
| POST | `/contribute` | Bearer | Upload file (multipart: title, stream, puc, subject, description, file) |
| GET | `/pending` | Admin | List pending materials |
| PATCH | `/{id}/approve` | Admin | Approve material |
| PATCH | `/{id}/reject` | Admin | Reject material |
| GET | `/{id}/download` | Bearer | Get file URL + increment count |
| GET | `/contributors` | Bearer | List contributor-badge users |

### 3.3 Friends (`/api/friends`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/request` | Bearer | Send friend request `{to_unique_id}` |
| GET | `/requests` | Bearer | List incoming requests |
| PATCH | `/request/{id}/respond?action=` | Bearer | Accept/reject |
| GET | `/list` | Bearer | List friends |
| GET | `/sent` | Bearer | List sent requests |

### 3.4 Communities (`/api/communities`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer | Create community |
| GET | `/` | Bearer | My communities |
| GET | `/explore` | Bearer | Communities I'm not in |
| POST | `/{id}/join` | Bearer | Join community |
| GET | `/{id}/members` | Bearer | List members |

### 3.5 AI (`/api/ai`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generate-notes` | Bearer | AI notes from subject+topic |
| POST | `/generate-questions` | Bearer | AI questions from subject+topic |
| POST | `/chat-assistant` | Bearer | AI study chat |
| POST | `/recommend-subjects` | Bearer | TF-IDF subject recommendations |

### 3.6 Admin (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/seed` | — | Create default admin |
| GET | `/stats` | Admin | Platform stats |
| GET | `/users` | Admin | List all students |
| DELETE | `/users/{id}` | Admin | Delete user |
| POST | `/materials/upload` | Admin | Direct upload (auto-approved) |
| GET | `/materials` | Admin | All materials |
| DELETE | `/materials/{id}` | Admin | Delete material |

### 3.7 Streams (`/api/streams`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/streams` | — | Returns STREAMS config + LANGUAGES |

## 4. WebSocket Protocol

**Endpoint:** `ws://host/ws/chat?token=<JWT>`

### Client → Server Messages
| Type | Payload | Description |
|------|---------|-------------|
| `dm_send` | `{to_unique_id, content}` | Send direct message |
| `community_send` | `{community_id, content}` | Send community message |
| `typing` | `{chat_type, chat_id}` | Typing indicator |
| `history` | `{chat_type, chat_id, page?}` | Load message history |

### Server → Client Messages
| Type | Payload | Description |
|------|---------|-------------|
| `dm` | `{sender_id, sender_name, content, timestamp}` | Incoming DM |
| `community` | `{sender_id, sender_name, content, timestamp}` | Incoming community msg |
| `typing` | `{chat_type, chat_id, user_id, user_name}` | Typing indicator |
| `history` | `{messages, page, has_more}` | Paginated history |

## 5. Frontend Routes

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/login` | Login | Public | Login page |
| `/register` | Register | Public | Multi-step registration |
| `/verify-code` | VerifyCode | Public | Email verification |
| `/dashboard` | Dashboard | Protected | Main landing |
| `/subjects/:subject` | SubjectDetail | Protected | Subject materials |
| `/chat` | Chat | Protected | DM chat list |
| `/chat/:uniqueId` | Chat | Protected | DM conversation |
| `/communities` | Communities | Protected | Community list |
| `/communities/:id` | CommunityChat | Protected | Community chat |
| `/friends` | Friends | Protected | Friends management |
| `/ai-assistant` | AIAssistant | Protected | AI tools |
| `/profile` | Profile | Protected | User profile |
| `/contribute` | Contribute | Protected | Upload materials |
| `/admin` | AdminDashboard | Protected | Admin dashboard |
| `/admin/materials` | AdminMaterials | Protected | Manage materials |
| `/admin/users` | AdminUsers | Protected | Manage users |

## 6. Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URL=
DATABASE_NAME=college_app
JWT_SECRET=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OPENAI_API_KEY=
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
BREVO_API_KEY=
VERIFICATION_TOKEN_EXPIRE_MINUTES=1440
APP_URL=http://localhost:3000
FROM_EMAIL=noreply@collegeapp.com
FROM_NAME=College App
```

### Frontend (via Vite proxy)
- Dev: All `/api`, `/ws`, `/uploads` requests proxied to localhost:8000
- Production: Set `VITE_API_URL` in Docker env
