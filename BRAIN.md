# BRAIN.md — College App for Students

## Stack
- **Frontend:** React 18 + Vite 5, React Router 6, Axios, Framer Motion, Three.js
- **Backend:** FastAPI (Python), MongoDB via Motor, JWT auth (jose + bcrypt)
- **AI:** OpenRouter API (openai/gpt-3.5-turbo), scikit-learn TF-IDF recommendations
- **Real-time:** WebSocket (chat)
- **Container:** Docker Compose (MongoDB 7 + backend + frontend)

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/config.py` | Env vars + STREAMS/LANGUAGES config |
| `backend/app/routes/auth.py` | Register, login, verify email, user search |
| `backend/app/routes/materials.py` | CRUD study materials, contribute/approve/reject |
| `backend/app/routes/ai.py` | AI generate notes/questions, chat-with-notes (file upload), recommend |
| `backend/app/websocket/chat.py` | WebSocket DM + community chat |
| `frontend/src/services/api.js` | All API service objects (auth, materials, ai, friends, communities, admin) |
| `frontend/src/context/AuthContext.jsx` | Auth state, sessionStorage token/user, login/logout |
| `frontend/src/App.jsx` | All route definitions with ProtectedRoute/PublicRoute |
| `frontend/src/pages/Contribute.jsx` | Material upload form (students see only their subjects+languages) |
| `frontend/src/pages/Dashboard.jsx` | Main landing, materials filtered by stream/subjects/puc |
| `frontend/src/pages/Register.jsx` | Multi-step: Account → Stream+PUC → Subjects → Languages |

## Auth Flow
- Register → email verification (6-digit code via Brevo) → Login → JWT token in sessionStorage
- `get_current_user` middleware: decodes Bearer JWT, returns user dict
- `get_admin_user`: checks role === 'admin'
- 401 interceptor in axios: clears session, redirects to /login

## Data Model
- **users:** name, email, hashed_password, unique_id (6-digit), stream, combination, puc, subjects[], languages[], role (student|admin), contributor_badge, pending_uploads
- **materials:** title, subject, stream, puc, combination, language, file_url, contributor, status (pending|approved|rejected), download_count
- **friend_requests:** from_user, to_user, status (pending|accepted|rejected)
- **communities:** name, description, created_by, members[], member_count
- **messages:** sender, chat_type (dm|community), chat_id, content, timestamp

## Stream Configuration (hardcoded in config.py)
- **Science:** PCMB/PCMC/PCME (4 subjects each)
- **Commerce:** CEBA/SEBA (4 subjects each)
- **Arts:** DEFAULT (7 subjects)
- **Languages:** IT(NSQF), Automobile(NSQF), English, Kannada, Hindi, Urdu, Sanskrit

## Key Business Rules
- Students can only view materials for their stream + puc + registered subjects
- Students can only contribute to their registered subjects + selected languages
- Admin sees all subjects in contribution dropdown
- Max 5 pending uploads per student
- Contributor badge after 5 approved contributions
- Email verification required before first login

## API Base URLs
- Dev: Frontend on :3000, proxies /api/* /ws/* /uploads/* to :8000
- Production: Docker Compose, same proxy setup

## AI Integration
- All AI calls go through OpenRouter (not direct OpenAI)
- `POST /api/ai/chat-with-notes` accepts file (PDF/TXT/MD) + message, extracts text with PyPDF2, sends to AI
- Other endpoints: generate-notes, generate-questions, chat-assistant, recommend-subjects

## Build & Run
- **Dev:** `uvicorn app.main:app --reload` (backend) + `npm run dev` (frontend)
- **Docker:** `docker compose up -d` from project root
- **Backend deps:** installed via venv, requirements.txt in backend/
- **No DB seeding needed** — admin seeded via POST /api/admin/seed
