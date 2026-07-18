# App Flow — College App for Students

## 1. Authentication Flow

```
                    ┌──────────────┐
                    │  Landing at  │
                    │  /login or   │
                    │  /register   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐          ┌──────────────┐
       │  Login Page │          │  Register     │
       │  /login     │          │  Page /register│
       └──────┬──────┘          └──────┬───────┘
              │                        │
              │ Step 1: Account        │ Step 1: Account
              │  - Email               │  - Name, Email, Password
              │  - Password            │
              │                        │ Step 2: Stream + PUC Year
              ▼                        │  - Select Science/Commerce/Arts
       ┌──────────────┐               │  - Select 1st/2nd PUC
       │  Dashboard   │               │
       │  /dashboard  │               │ Step 3: Subjects
       │  (if authed) │               │  - Select combination
              ▲                       │  - Subjects auto-populated
              │                        │
              │                        │ Step 4: Languages
              │                        │  - Select up to 2 languages
              │                        │
              │                        ▼
              │                 ┌──────────────────┐
              │                 │  Email Verification │
              │                 │  /verify-code     │
              │                 │  6-digit code     │
              │                 └───────┬──────────┘
              │                         │
              │                         ▼
              │                 ┌──────────────────┐
              └─────────────────┤  Login & Redirect│
                                │  → /dashboard    │
                                └──────────────────┘
```

## 2. Student Main Flow

```
  ┌─────────────────────────────────────────────────────────────┐
  │                     SIDEBAR NAVIGATION                      │
  │  Dashboard │ Contribute │ Chat │ Friends │ Communities      │
  │  AI Assistant │ Profile │ Logout                            │
  └─────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │  DASHBOARD   │ ← Landing page after login
  │  /dashboard  │
  │              │
  │  • Welcome banner with name
  │  • Shows: "Science — PCMB — 1st PUC — 4 core subjects"
  │  • Search bar to filter materials
  │  • Stats: Total Notes count, Core Subjects count
  │  • Materials grouped by subject (horizontal scroll cards)
  │  • Each card: title, description, downloads, contributor
  │  • Click card → opens file in new tab
  │  • "Contribute Notes" button → /contribute
  │  • "View all" link → /subjects/:subject
  │  • AI Recommendations section (bottom)
  └──────────────┘

  ┌──────────────┐
  │ CONTRIBUTE   │
  │ /contribute  │
  │              │
  │  • Form fields:
  │    - Title (required)
  │    - Stream (pre-selected from profile)
  │    - PUC Year (pre-selected from profile)
  │    - Subject (from registered subjects)
  │    - Description (optional)
  │    - File upload (PDF/TXT/MD only)
  │  • Submit → toast "Material submitted for review!"
  │  • History section shows past uploads with status
  │    (pending / approved / rejected)
  └──────────────┘

  ┌──────────────┐
  │ SUBJECT      │
  │ DETAIL       │
  │ /subjects/   │
  │ :subject     │
  │              │
  │  • All materials for this subject (filtered by stream+PUC)
  │  • Inline upload form to contribute
  │  • Search within subject
  │  • Download cards with title, description, stats
  └──────────────┘

  ┌──────────────┐
  │ CHAT         │
  │ /chat        │
  │              │
  │  • Friend list sidebar (left panel)
  │  • Search friends by name
  │  • Add friend by unique ID
  │  • Click friend → opens DM panel (right)
  │  • Real-time messaging via WebSocket
  │  • Typing indicators
  │  • Message history (load more on scroll up)
  └──────────────┘

  ┌──────────────┐
  │ COMMUNITIES  │
  │ /communities │
  │              │
  │  • Tab: "My Communities" — communities I've joined
  │  • Tab: "Explore" — communities I can join
  │  • Create: name + description form
  │  • Each community card: name, description, member count
  │  • Join button on explore items
  │  • Click community → /communities/:id (group chat)
  │
  │ COMMUNITY CHAT
  │ /communities/:id
  │  • Group chat interface
  │  • Member panel (slide-in sidebar)
  │  • Real-time messaging with typing indicators
  └──────────────┘

  ┌──────────────┐
  │ FRIENDS      │
  │ /friends     │
  │              │
  │  • Tab: "Friends" — accepted friends list
  │  • Tab: "Requests" — incoming with accept/reject
  │  • Tab: "Sent" — pending sent requests
  │  • Tab: "Add Friend" — input by unique ID
  │  • Search within friends
  └──────────────┘

  ┌──────────────┐
  │ AI ASSISTANT │
  │ /ai-assistant│
  │              │
  │  • Mode 1: Generate Notes
  │    - Select subject, enter topic
  │    - AI generates structured notes
  │  • Mode 2: Generate Questions
  │    - Select subject, enter topic
  │    - AI generates practice questions
  │  • Mode 3: Study Assistant Chat
  │    - Free-form Q&A with AI
  │  • Copy to clipboard on results
  └──────────────┘

  ┌──────────────┐
  │ PROFILE      │
  │ /profile     │
  │              │
  │  • Avatar (first letter), name, unique ID, email
  │  • Contributor badge (if earned)
  │  • Stats: total notes, contributions, subjects count
  │  • Core Subjects tags
  │  • Languages tags
  │  • Top Contributors leaderboard
  └──────────────┘
```

## 3. Admin Flow

```
  ┌─────────────────────────────────────────────────────────────┐
  │              ADMIN SIDEBAR (additional items)               │
  │  ...Student items... │ Admin Dashboard │ Materials │ Users  │
  └─────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ ADMIN        │
  │ DASHBOARD    │
  │ /admin       │
  │              │
  │  • Stats cards:
  │    - Total Students
  │    - Approved Materials
  │    - Pending Reviews
  │    - Communities
  │  • Welcome message
  └──────────────┘

  ┌──────────────┐
  │ ADMIN        │
  │ MATERIALS    │
  │ /admin/      │
  │ materials    │
  │              │
  │  • Tab: "Upload New"
  │    - Admin upload form (PDF/TXT/MD/DOC/DOCX)
  │    - Auto-approved
  │  • Tab: "Pending Reviews"
  │    - List student-contributed materials
  │    - Each item: title, subject, contributor
  │    - Approve / Reject buttons
  │  • Tab: "All Materials"
  │    - Full list with delete option
  └──────────────┘

  ┌──────────────┐
  │ ADMIN USERS  │
  │ /admin/users │
  │              │
  │  • List all student users
  │  • Search by name, email, or unique ID
  │  • Verified/unverified badge
  │  • Delete user with confirmation
  └──────────────┘
```

## 4. Data Flow Diagram

```
  ┌─────────┐    HTTP/API     ┌──────────┐    MongoDB    ┌──────────┐
  │         │ ──────────────> │          │ ────────────> │          │
  │ Browser │    WebSocket    │  FastAPI │    Motor      │ MongoDB  │
  │  React  │ <────────────── │  Server  │ <──────────── │   (7)    │
  │         │                 │          │               │          │
  └─────────┘                 └──────────┘               └──────────┘
       │                            │
       │                            │
  ┌────┴────┐                 ┌─────┴──────┐
  │ Vite   │                 │   OpenAI   │
  │ Proxy  │                 │    API     │
  └─────────┘                 └────────────┘
```

## 5. Key User Journeys

### Journey 1: First-time Student
```
Register → Verify Email → Login → Dashboard (see materials) 
→ Contribute notes → Wait for admin approval 
→ Chat with friends → Join community → Use AI assistant
```

### Journey 2: Content Contribution
```
Dashboard → Click "Contribute Notes" → Fill form (title, subject, PUC, file) 
→ Submit → "Pending" status → Admin reviews 
→ Approved → Material visible to stream+PUC mates → Contributor badge at 5 approvals
```

### Journey 3: Social Connection
```
Friends page → "Add Friend" → Enter friend's unique ID → Request sent 
→ Friend accepts → Appear in friends list → Start DM chat 
→ Join/create community → Group chat
```

### Journey 4: Study Preparation
```
Dashboard → Browse materials by subject → Download notes 
→ AI Assistant → Generate notes/questions for topic 
→ Chat with AI for doubts → Study with downloaded materials
```

## 6. Error Flows

- **Login fails**: Toast "Invalid email or password"
- **Email not verified**: 403 error → banner with link to verify
- **Upload fails**: Toast with error detail from backend
- **WebSocket disconnect**: Auto-reconnect (5 attempts, exponential backoff)
- **Token expired (401)**: Auto-redirect to /login
- **Network error**: Toast notification
