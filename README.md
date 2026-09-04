# 🏟️ Quiz Arena AI

<div align="center">

![Quiz Arena AI](https://img.shields.io/badge/AWS%20Strands%20SDK-Powered-orange?style=for-the-badge&logo=amazon-aws)
![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini%202.5%20Flash-Model-blue?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React%2018-Frontend-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Gateway-339933?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Python%203.11-Agents-3776AB?style=for-the-badge&logo=python)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**A real-time, AI-powered competitive quiz platform driven by four autonomous Strands SDK agents.**

*Built for the "Agents for Humans" Hackathon — where AI handles the repetitive so humans can focus on what matters.*

[Features](#-features) · [Architecture](#-architecture) · [The Agents](#-the-four-strands-agents) · [Quick Start](#-quick-start) · [Docker](#-docker-deployment) · [Security](#-security) · [API Reference](#-api-reference)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **4 Strands SDK Agents** | Commentator, Tutor, Syllabus Generator, and Hint Master — all powered by Gemini 2.5 Flash |
| 🎮 **Real-time Multiplayer** | WebSocket-driven live game rooms via Socket.IO — scores update instantly for all players |
| 💡 **Live Hint System** | AI Hint Master gives players a cryptic, non-spoiler clue mid-question on demand |
| 🎓 **AI Tutor (Post-Game)** | Multi-turn "Professor Q" tutoring session for every wrong answer with full conversation history |
| 🎙️ **AI Game Commentator** | Live event-driven agent that reacts to streaks, scores, and dramatic moments with energetic commentary |
| 📋 **Autonomous Quiz Generator** | Syllabus Agent scans uploaded files, generates a 5-question quiz, and awaits teacher approval |
| 👩‍💼 **Admin Dashboard** | Full analytics, quiz history, export to CSV/PDF, and approve/reject AI-generated quizzes |
| 🔐 **Firebase Authentication** | Secure JWT-protected admin and agent endpoints |
| 🐳 **One-Command Docker Deployment** | `docker compose up` starts all three services |
| 📱 **QR Code Lobby Join** | Players scan a QR code on mobile to join instantly — no typing required |
| 🏆 **Live Leaderboard** | Animated podium and per-player stats after every question |

---

## 🏗️ Architecture

Quiz Arena uses a **three-tier, two-process** architecture that cleanly separates AI reasoning from public web routing:

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                        │
│              React 18 + Vite + Framer Motion + Socket.IO        │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP REST + WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│              NODE.JS API GATEWAY  (port 3001)                   │
│   Express · Socket.IO · Helmet · Rate Limiter · Firebase Auth   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SOCKET.IO ROOM REGISTRY                     │   │
│  │  Manages live game rooms, real-time scoring, timers      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Internal HTTP (localhost only)
┌───────────────────────────▼─────────────────────────────────────┐
│          PYTHON STRANDS MICROSERVICE  (port 8001)               │
│         FastAPI · AWS Strands SDK · Gemini 2.5 Flash            │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  Commentator   │  │  Tutor Agent   │  │  Syllabus Agent  │   │
│  │    Agent       │  │ (session-aware)│  │  (autonomous)    │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
│  ┌────────────────┐                                             │
│  │  Hint Master   │                                             │
│  │    Agent       │                                             │
│  └────────────────┘                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┴──────────────────┐
        │                                      │
┌───────▼────────┐                   ┌─────────▼────────┐
│  Local Storage │                   │    AWS S3 Bucket  │
│  (dev fallback)│                   │   (production)    │
│  /syllabi      │                   │  syllabi/ prefix  │
│  /quizzes      │                   │  quizzes/ prefix  │
└────────────────┘                   └──────────────────┘
```

### Key Design Decisions

- **Python ↔ Node.js separation**: The Strands SDK runs in Python. The Node.js gateway handles all public internet traffic (CORS, auth, rate limiting) and only proxies agent calls to the internal Python service — it is never exposed directly.
- **AWS S3 dual-mode storage**: The Syllabus Agent stores syllabi and generated quizzes in **AWS S3** when `AWS_S3_BUCKET_NAME` is set, falling back to the local filesystem for development.
- **Firebase JWT for admin routes**: The `/api/agent/*` admin routes require a valid Firebase ID token, protecting the autonomous agent trigger from public access.
- **In-memory hint rate limiting**: A `Set` tracks `roomPin:playerId:questionIndex` keys to enforce one hint per player per question without any database dependency.

---

## 🤖 The Four Strands Agents

All agents are implemented in [`server/strands_agents/main.py`](./server/strands_agents/main.py) using the `strands-agents[gemini]` SDK with `GeminiModel(model_id="gemini-2.5-flash")`.

---

### 1. 🎙️ Commentator Agent — *Event-Driven Live Host*

Reacts to live game events and delivers punchy 1-2 sentence commentary to keep energy high.

**Strands Pattern:** Tool-calling agent — must call `receive_game_event` tool before generating commentary.

**Tool:**
```python
@tool
def receive_game_event(event_type: str, player_name: str, context: str) -> str:
    """Receive a live game event and return structured context for the host."""
```

**Triggered by:** `POST /api/commentary` — fired automatically on hot streaks, cold streaks, and question reveals.

**Events handled:** `HOT_STREAK`, `COLD_STREAK`, `QUESTION_REVEALED`, and more.

---

### 2. 🎓 Tutor Agent (Professor Q) — *Session-Aware Multi-turn Tutor*

A warm, patient post-game tutor that explains wrong answers and handles follow-up questions across multiple conversation turns.

**Strands Pattern:** Stateful multi-turn agent — conversation history is persisted server-side using Strands' `messages=` parameter.

```python
# Strands manages conversation context automatically
agent = Agent(
    model=make_gemini_model(temperature=0.7),
    system_prompt=TUTOR_PROMPT,
    messages=history or [],   # ← Prior turns injected here
)
_tutor_sessions[session_id] = agent.messages  # ← Saved after each turn
```

**Triggered by:** `POST /api/tutor/explain` — when a player clicks "Ask Professor Q" on the Game Over screen.

---

### 3. 📚 Syllabus Agent — *Fully Autonomous with 4 Real Tools*

An autonomous agent that runs a complete multi-step workflow without human intervention until approval is needed.

**Strands Pattern:** Autonomous agentic loop with real tool use and human-in-the-loop checkpoint.

**4 Real Tools:**

| Tool | Description |
|---|---|
| `list_syllabus_files()` | Lists `.txt` files from S3 or local `/syllabi` dir |
| `read_syllabus_file(filename)` | Safely reads a syllabus file (path-traversal protected) |
| `list_existing_quizzes()` | Checks for duplicate quiz topics before generating |
| `save_quiz_draft(topic, questions_json)` | Persists the generated quiz as `pending_approval` |

**Autonomous Workflow:**
```
1. list_syllabus_files()        → Discover available content
2. read_syllabus_file(...)      → Understand the topic
3. list_existing_quizzes()      → Prevent duplicates
4. Generate 5-question quiz     → Pure LLM reasoning
5. save_quiz_draft(...)         → Save as "pending_approval"
          ↓
   HUMAN CHECKPOINT: Teacher reviews & approves on Admin Dashboard
          ↓
6. POST /api/agent/approve      → Status updated to "approved"
```

**Triggered by:** `POST /api/agent/trigger` (Firebase-protected admin route).

---

### 4. 💡 Hint Master Agent — *Live In-Game Subtle Clue Provider*

Gives players one Socratic, non-spoiler hint per question when they're stuck. Never reveals the answer — only nudges.

**Strands Pattern:** Tool-calling agent — must call `analyze_question` tool before crafting the hint.

**Tool:**
```python
@tool
def analyze_question(question_text: str, options: str) -> str:
    """Study the question and options before crafting a hint."""
```

**System Prompt Excerpt:**
> *"DO NOT mention the correct answer or its label (A, B, C, D). Use an analogy, a real-world fact, or a leading question as your clue."*

**Rate limiting:** One hint per player per question, enforced at the Node.js gateway layer using an in-memory `Set`.

**Triggered by:** `POST /api/hint` — when a player clicks "Need a Hint? 💡" during a live question.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ 
- **Python** 3.10+
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey)
- **Firebase Project** — [Create one](https://console.firebase.google.com/) for auth features (optional for mock mode)

### 1. Clone & Configure

```bash
git clone https://github.com/ChalanaDilshan/quiz-arena-ai.git
cd quiz-arena-ai
```

**`server/.env`** (create this file):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
STRANDS_URL=http://127.0.0.1:8001

# Optional: AWS S3 for syllabus/quiz storage (falls back to local disk)
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
```

**`.env`** (root directory, create this file):
```env
VITE_API_URL=http://localhost:3001
```

**Firebase** (for admin features):
- Download your Firebase Admin SDK JSON from the Firebase console
- Save it as `server/serviceAccountKey.json`

### 2. Start All Services

#### 🪟 Windows — One-Command Start
```powershell
.\start.ps1
```
This automatically creates a Python virtual environment, installs all Strands dependencies, and launches both backend processes.

Then in a **separate terminal**:
```powershell
npm install
npm run dev
```

#### 🍎 Mac / Linux — One-Command Start
```bash
chmod +x start.sh
./start.sh
```

Then in a **separate terminal**:
```bash
npm install
npm run dev
```

### 3. Open the App

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Node.js Gateway | `http://localhost:3001` |
| Strands Agents | `http://127.0.0.1:8001` |
| Agent Health Check | `http://127.0.0.1:8001/health` |

> 💡 **Mock Mode**: The app works fully without a backend in Mock Mode — start a quiz from the home screen and all AI features are simulated so you can explore the UI instantly.

---

## 🐳 Docker Deployment

Spin up all three services with a single command:

```bash
docker compose up --build
```

| Container | Port | Description |
|---|---|---|
| `strands-service` | `8001` | Python Strands AI agents microservice |
| `gateway` | `3001` | Node.js Express API + WebSocket gateway |
| `frontend` | `80` | React app served via Nginx |

To rebuild after code changes:
```bash
docker compose up --build
```

To stop all services:
```bash
docker compose down
```

---

## 📁 Project Structure

```
quiz-arena-ai/
├── src/                          # React Frontend (Vite + TypeScript)
│   ├── components/
│   │   ├── AdminDashboard.tsx    # Teacher dashboard with full analytics
│   │   ├── CommentatorWidget.tsx # Live AI commentary display
│   │   ├── GameOverView.tsx      # Podium, stats & Professor Q tutor
│   │   ├── HintBubble.tsx        # 💡 Hint Master UI (animated)
│   │   ├── HomeView.tsx          # Home / join / host screens
│   │   ├── LeaderboardView.tsx   # Between-question live leaderboard
│   │   ├── LobbyView.tsx         # Pre-game room with QR code
│   │   ├── QuestionView.tsx      # Live question + hint + answer pads
│   │   └── TutorChat.tsx         # Post-game tutor chat interface
│   ├── hooks/
│   │   ├── useCommentator.ts     # Commentary polling hook
│   │   └── useQuizGame.ts        # Core game state + hint logic
│   ├── context/
│   │   └── AuthContext.tsx       # Firebase auth context
│   └── utils/
│       ├── quizHistory.ts        # LocalStorage quiz record management
│       └── sounds.ts             # Web Audio API sound synthesis
│
├── server/                       # Backend
│   ├── strands_agents/
│   │   ├── main.py               # ⭐ All 4 Strands agents + FastAPI app
│   │   ├── requirements.txt      # strands-agents[gemini], fastapi, boto3...
│   │   └── Dockerfile.strands    # Python microservice container
│   ├── index.js                  # Node.js Express gateway + Socket.IO
│   ├── firebaseAdmin.js          # Firebase Admin SDK init
│   ├── syllabi/                  # Uploaded syllabus files (local dev)
│   └── quizzes/                  # Generated quiz drafts (local dev)
│
├── Dockerfile.frontend           # Nginx-served React production build
├── docker-compose.yml            # Orchestrates all 3 containers
├── start.ps1                     # Windows one-command startup script
└── start.sh                      # Mac/Linux one-command startup script
```

---

## 🔒 Security

| Mechanism | Implementation |
|---|---|
| **Firebase JWT Auth** | Admin and agent trigger routes validate `Authorization: Bearer <token>` headers |
| **Rate Limiting** | 20 requests/minute per IP using `express-rate-limit` on all AI endpoints |
| **Prompt Injection Defense** | Structural sanitizer strips control characters (`\x00-\x1F`) and injection chars (`<>"'\``) before passing data to agents |
| **Payload Size Limits** | Express restricts all JSON bodies to `10kb` to prevent Denial-of-Wallet attacks on the LLM API |
| **Security Headers** | Full `Helmet.js` header suite (CSP, HSTS, X-Frame-Options, etc.) |
| **Room Validation** | `requireValidRoom` middleware verifies every API call references a real, active game room |
| **Hint Rate Limiting** | In-memory `Set` enforces one hint per `roomPin:playerId:questionIndex` key |
| **Path Traversal Protection** | Syllabus and quiz file reads use `Path(filename).name` to strip any directory components |

---

## 📡 API Reference

### Game Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `hostGame` | Client → Server | `{ quizData, pin }` |
| `joinGame` | Client → Server | `{ pin, nickname, playerId }` |
| `startGame` | Client → Server | `{ pin }` |
| `submitAnswer` | Client → Server | `{ pin, playerId, answerIndex }` |
| `nextQuestion` | Client → Server | `{ pin }` |
| `gameStateUpdate` | Server → All | Full game state snapshot |

### REST Endpoints

#### Public (rate-limited, room-validated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/commentary` | Trigger AI commentator for a game event |
| `POST` | `/api/tutor/explain` | Ask Professor Q to explain a wrong answer |
| `POST` | `/api/hint` | Request a live hint from the Hint Master |

#### Admin (Firebase JWT required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent/trigger` | Trigger the autonomous Syllabus Agent |
| `GET` | `/api/agent/pending` | Poll for a pending AI-generated quiz |
| `POST` | `/api/agent/approve` | Approve a pending quiz draft |
| `POST` | `/api/agent/clear` | Delete a pending quiz draft |

#### Strands Microservice (internal only — never exposed publicly)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/commentary` | Commentator Agent |
| `POST` | `/tutor` | Tutor Agent |
| `POST` | `/syllabus/trigger` | Syllabus Agent autonomous run |
| `GET` | `/syllabus/pending` | Fetch latest pending quiz |
| `POST` | `/syllabus/approve` | Update quiz status to approved |
| `POST` | `/syllabus/clear` | Delete a quiz file |
| `POST` | `/hint` | Hint Master Agent |
| `GET` | `/health` | Health check — lists all 4 active agents |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI Agents** | [AWS Strands Agents SDK](https://github.com/strands-agents/sdk-python) (`strands-agents[gemini]`) |
| **LLM** | Google Gemini 2.5 Flash via `strands.models.gemini.GeminiModel` |
| **Agent Server** | Python 3.11 · FastAPI · Uvicorn |
| **API Gateway** | Node.js v24 · Express 5 · Socket.IO 4 |
| **Auth** | Firebase Admin SDK · Firebase Authentication |
| **Storage** | AWS S3 (production) · Local filesystem (development) |
| **Frontend** | React 18 · TypeScript · Vite 8 · Framer Motion |
| **Styling** | Tailwind CSS 3 · Custom CSS design tokens |
| **Containerisation** | Docker · Docker Compose · Nginx |
| **Security** | Helmet.js · express-rate-limit · Firebase JWT |

---

## 📄 License

[MIT License](./LICENSE) — © 2026 Chalana Dilshan

---

<div align="center">

Built with ❤️ using the **AWS Strands Agents SDK** · Powered by **Gemini 2.5 Flash**

</div>
