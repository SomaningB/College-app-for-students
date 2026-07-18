# Project Requirement Document (PRD) — College App for Students

## 1. Product Overview

A full-stack web application for pre-university (PUC) college students to access, share, and collaborate on study materials. The app provides AI-powered assistance, real-time chat, community features, and an admin review system.

## 2. User Personas

### Student
- Enrolled in 1st or 2nd year PUC
- Belongs to a stream (Science, Commerce, Arts) with a specific subject combination
- Needs study notes, past papers, and AI help for exam preparation
- Wants to connect with classmates and friends

### Admin
- Manages the platform (teachers, staff)
- Reviews and approves student-contributed materials
- Uploads official study materials
- Manages users and content

## 3. Core Features

### 3.1 Authentication & Onboarding
- Email/password registration with email verification (6-digit code)
- Multi-step registration: Account → Stream → PUC Year → Subjects → Languages
- JWT-based login with persistent session via sessionStorage
- Role-based access (student / admin)

### 3.2 Study Materials
- Browse approved materials grouped by subject
- Search materials by title or subject
- Download materials (PDF, TXT, MD)
- Students contribute materials for admin approval
- Admin uploads materials directly (auto-approved)
- Materials filtered by stream, subject, PUC year
- Max 5 pending uploads per student
- Contributor badge after 5 approved contributions

### 3.3 AI Assistant
- Generate study notes from subject/topic (OpenAI GPT-3.5)
- Generate practice questions
- Chat-based study assistant
- Subject recommendations based on TF-IDF similarity

### 3.4 Real-time Chat
- Direct messaging (DM) between friends
- Community (group) chat
- Typing indicators
- Message history with pagination
- WebSocket connection with auto-reconnect

### 3.5 Friend System
- Send/accept/reject friend requests by unique ID
- View friends list, incoming requests, sent requests
- Search users by name or unique ID

### 3.6 Communities
- Create communities with name + description
- Join/explore public communities
- Group chat within communities
- Member listing

### 3.7 Admin Panel
- Dashboard with stats (users, materials, reviews, communities)
- Approve/reject student-contributed materials
- Upload official materials
- Manage users (list, search, delete)
- Seed default admin account

### 3.8 User Profile
- View personal info, stream, subjects, languages
- Contribution stats and contributor badge
- Top contributors leaderboard

## 4. User Stories

| ID | Story |
|----|-------|
| US-01 | As a student, I want to register with my email and select my stream/subjects so I see relevant content |
| US-02 | As a student, I want to browse study materials filtered by my stream and PUC year |
| US-03 | As a student, I want to upload my notes for admin review so my classmates can use them |
| US-04 | As a student, I want to chat with my friends in real-time |
| US-05 | As a student, I want to join communities and discuss topics with peers |
| US-06 | As a student, I want AI-generated notes and questions for exam preparation |
| US-07 | As a student, I want to search and download materials by subject |
| US-08 | As an admin, I want to review and approve/reject contributed materials |
| US-09 | As an admin, I want to upload official materials directly |
| US-10 | As an admin, I want to manage users and view platform stats |

## 5. Non-Functional Requirements

- Real-time messaging latency < 500ms
- File uploads up to 10MB (PDF, TXT, MD)
- Responsive design for mobile and desktop
- Dark theme UI
- Session persistence via sessionStorage
- MongoDB indexes for query performance
- Auto-reconnect WebSocket (up to 5 retries)
- Email verification to prevent spam accounts

## 6. Future Scope

- Password reset flow
- Material bookmarking/favorites
- Rating and feedback on materials
- Push notifications
- OAuth login (Google)
- Material language filter
- Admin content categories/tags
