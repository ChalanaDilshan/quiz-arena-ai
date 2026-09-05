# Quiz Arena AI

<div align="center">

![AWS Strands Agents SDK](https://img.shields.io/badge/Strands%20Agents%20SDK-AWS%20Native-orange?style=for-the-badge&logo=amazon-aws)
![Amazon Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Claude%203.5%20%2F%20Nova-232F3E?style=for-the-badge&logo=amazonaws)
![Bedrock AgentCore](https://img.shields.io/badge/Bedrock%20AgentCore-Serverless%20Runtime-blueviolet?style=for-the-badge&logo=amazon-aws)
![React](https://img.shields.io/badge/React%2018-Frontend-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Gateway-339933?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Python%203.11-Agents-3776AB?style=for-the-badge&logo=python)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**A real-time, competitive quiz arena powered by five Strands Agents SDK agents orchestrated on Amazon Bedrock AgentCore.**

*Built for the AWS & AI Agents Hackathon — where intelligent multi-agent systems handle live commentary, tutoring, clue generation, and automated syllabus compilation.*

[Features](#features) · [Architecture](#architecture) · [The Agents](#the-five-strands-agents) · [Bedrock AgentCore Deployment](#bedrock-agentcore-deployment) · [Quick Start](#quick-start) · [Security](#security--adversarial-hardening) · [API Reference](#api-reference)

</div>

---

## Features

| Feature | Description |
|---|---|
| **5 Strands SDK Agents** | Commentator, Tutor, Syllabus Scanner, Hint Master, and Live Quiz Generator powered by **Amazon Bedrock** (`BedrockModel` with Claude 3.5 Sonnet & Nova Pro) |
| **Amazon Bedrock AgentCore** | Deployment-ready on AWS Bedrock AgentCore with `agentcore.yaml`, managed memory, and container runtime specs |
| **Real-time Multiplayer** | Low-latency WebSocket room registry via Socket.IO with state reconciliation and live leaderboard synchronization |
| **Live Hint System** | AI Hint Master leverages tool-calling to evaluate options and deliver subtle, Socratic hints without spoiling answers |
| **AI Tutor (Professor Q)** | Multi-turn post-match tutor with conversational memory explaining mistakes and exploring underlying concepts |
| **AI Game Commentator** | Low-latency host reacting dynamically to player streaks, comebacks, and podium shifts |
| **Autonomous Syllabus Agent** | Autonomous multi-tool loop that scans course documents, checks for duplicate topics, and generates quizzes |
| **Live AI Quiz Generation** | Real-time curriculum generation from uploaded PDFs or custom course outlines via Strands agents |
| **Host Session Resumption** | Cryptographic host-reconnection protocol preventing host lockouts upon page refresh |
| **Enterprise Security** | Defense-in-depth architecture: internal shared secret (`X-Internal-Token`), regex path-traversal protection, and anti-cheat answer masking |

---

## Architecture

Quiz Arena utilizes a decoupled, secure three-tier architecture that isolates the AI reasoning microservice behind a hardened API Gateway:

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
│  │  Manages live rooms, anti-cheat masking, host tokens     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │  Internal HTTP (X-Internal-Token)
┌───────────────────────────▼─────────────────────────────────────┐
│         AMAZON BEDROCK AGENTCORE RUNTIME  (port 8001)           │
│         FastAPI · Strands Agents SDK · Amazon Bedrock           │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  Commentator   │  │  Tutor Agent   │  │  Syllabus Agent  │   │
│  │     Agent      │  │ (AgentCore Mem)│  │   (Autonomous)   │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │  Hint Master   │  │ Quiz Generator │                         │
│  │     Agent      │  │     Agent      │                         │
│  └────────────────┘  └────────────────┘                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │  boto3 / ConverseStream
        ┌───────────────────┴──────────────────┐
        │                                      │
┌───────▼────────────────────────┐   ┌─────────▼────────┐
│     Amazon Bedrock Models      │   │    AWS S3 Bucket │
│ Claude 3.5 Sonnet / Nova Pro   │   │  syllabi/ quizzes│
└────────────────────────────────┘   └──────────────────┘
```

---

## The Five Strands Agents

All agents are implemented in [`server/strands_agents/main.py`](./server/strands_agents/main.py) using the native **Strands Agents SDK** (`strands-agents`) bound to **Amazon Bedrock**:

```python
from strands import Agent
from strands.models import BedrockModel

# Native Amazon Bedrock model instantiation
model = BedrockModel(
    model_id=os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0"),
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    temperature=0.7
)
```

---

### 1. Commentator Agent — *Event-Driven Live Host*
Reacts to real-time gameplay events with punchy, high-energy game-show commentary.
- **Strands Pattern**: Tool-calling agent invoking the `receive_game_event` tool before generating commentary.
- **Endpoint**: `POST /api/commentary`

### 2. Tutor Agent (Professor Q) — *Multi-Turn Socratic Tutor*
Guides students through misconceptions after a match, maintaining conversation history across multiple turns.
- **Strands Pattern**: Stateful multi-turn agent with AgentCore Memory retention.
- **Endpoint**: `POST /api/tutor/explain`

### 3. Syllabus Agent — *Autonomous Agent with 4 Real Tools*
Autonomously scans course syllabi, detects upcoming topics, avoids duplicates, and compiles quiz drafts.
- **Strands Pattern**: Autonomous multi-step agentic loop with tools (`list_syllabus_files`, `read_syllabus_file`, `list_existing_quizzes`, `save_quiz_draft`).
- **Human-in-the-Loop**: Generated drafts are marked `pending_approval` until approved via Admin Dashboard.
- **Endpoint**: `POST /api/agent/trigger`

### 4. Hint Master Agent — *Subtle In-Game Clue Provider*
Provides Socratic, non-spoiler hints during live questions.
- **Strands Pattern**: Tool-calling agent that calls `analyze_question` to evaluate distractors before formulating a clue.
- **Endpoint**: `POST /api/hint`

### 5. Quiz Generator Agent — *Curriculum Compiler*
Compiles balanced, challenging quizzes from lecture notes or syllabus topics in real time.
- **Strands Pattern**: Structured curriculum synthesis returning verified JSON question arrays.
- **Endpoint**: `POST /api/generate-quiz`

---

## Bedrock AgentCore Deployment

Quiz Arena is configured for serverless production deployment on **Amazon Bedrock AgentCore**:

- **AgentCore Manifest**: [`server/strands_agents/agentcore.yaml`](./server/strands_agents/agentcore.yaml)
- **AgentCore CLI Config**: [`server/strands_agents/agentcore.json`](./server/strands_agents/agentcore.json)
- **MicroVM Container**: [`server/strands_agents/Dockerfile.agentcore`](./server/strands_agents/Dockerfile.agentcore)
- **CloudFormation Infrastructure**: [`infrastructure/agentcore-stack.yaml`](./infrastructure/agentcore-stack.yaml)
- **Architecture Guide**: [`docs/BEDROCK_AGENTCORE_ARCHITECTURE.md`](./docs/BEDROCK_AGENTCORE_ARCHITECTURE.md)

### Deploy via AgentCore CLI
```bash
npm install -g @aws/agentcore
cd server/strands_agents
agentcore deploy --config agentcore.yaml --region us-east-1
```

Or deploy using the included automation scripts:
- Linux / macOS: `./server/strands_agents/deploy_agentcore.sh`
- Windows PowerShell: `.\server\strands_agents\deploy_agentcore.ps1`

---

## Quick Start

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- **AWS Account** with Amazon Bedrock model access (Anthropic Claude 3.5 Sonnet / Amazon Nova Pro)
- **Docker & Docker Compose** (optional, for containerized run)

### 1. Clone & Configure

```bash
git clone https://github.com/ChalanaDilshan/quiz-arena-ai.git
cd quiz-arena-ai
```

**`server/.env`** (copy from `server/.env.example`):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
PORT=3001
STRANDS_URL=http://127.0.0.1:8001
INTERNAL_SECRET=your_32_char_random_hex_secret
```

**`.env`** (root directory, copy from `.env.example`):
```env
VITE_API_URL=http://localhost:3001
INTERNAL_SECRET=your_32_char_random_hex_secret
ADMIN_EMAILS=your_admin_email@example.com
```

**Firebase** (for admin features):
- Download your Firebase Admin SDK JSON from the Firebase console
- Save it as `server/serviceAccountKey.json` (ensure it is never committed to source control)

### 2. Start All Services

#### Windows — One-Command Start
```powershell
.\start.ps1
```
This automatically creates a Python virtual environment, installs all Strands dependencies, and launches both backend processes.

Then in a **separate terminal**:
```powershell
npm install
npm run dev
```

#### Mac / Linux — One-Command Start
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

> **Mock Mode**: The app works fully without a backend in Mock Mode — start a quiz from the home screen and all AI features are simulated so you can explore the UI instantly.

---

## Docker Deployment

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

## Project Structure

```
quiz-arena-ai/
├── src/                          # React Frontend (Vite + TypeScript)
│   ├── components/
│   │   ├── AdminDashboard.tsx    # Teacher dashboard with full analytics
│   │   ├── CommentatorWidget.tsx # Live AI commentary display
│   │   ├── GameOverView.tsx      # Podium, stats & Professor Q tutor
│   │   ├── HintBubble.tsx        # Hint Master UI (animated)
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
│   │   ├── main.py               # All 5 Strands agents + FastAPI app
│   │   ├── requirements.txt      # strands-agents, boto3, fastapi, uvicorn...
│   │   ├── agentcore.yaml        # Amazon Bedrock AgentCore deployment manifest
│   │   ├── agentcore.json        # AWS AgentCore CLI config
│   │   ├── Dockerfile.agentcore  # AgentCore microVM container
│   │   ├── Dockerfile.strands    # Python microservice container
│   │   ├── deploy_agentcore.sh   # Bash AgentCore deployment automation
│   │   └── deploy_agentcore.ps1  # PowerShell AgentCore deployment automation
│   ├── index.js                  # Node.js Express gateway + Socket.IO
│   ├── firebaseAdmin.js          # Firebase Admin SDK init
│   ├── syllabi/                  # Uploaded syllabus files (local dev)
│   └── quizzes/                  # Generated quiz drafts (local dev)
│
├── infrastructure/               # Infrastructure-as-Code
│   └── agentcore-stack.yaml      # CloudFormation template for Bedrock AgentCore
├── docs/
│   └── BEDROCK_AGENTCORE_ARCHITECTURE.md # Full architectural specification
├── Dockerfile.frontend           # Nginx-served React production build
├── docker-compose.yml            # Orchestrates all 3 containers
├── start.ps1                     # Windows one-command startup script
└── start.sh                      # Mac/Linux one-command startup script
```

---

## Security & Adversarial Hardening

| Mechanism | Implementation |
|---|---|
| **Internal Service Isolation** | Strands microservice does not expose any host ports in Docker; only accessible by gateway via internal Docker network DNS |
| **Shared Secret Token Auth** | Outbound gateway requests include `X-Internal-Token` validated by FastAPI dependency before invoking any agent |
| **Admin Route Access Control** | `/api/agent/*` protected with Firebase JWT authentication + verified against `ADMIN_EMAILS` allowlist |
| **Defense-in-Depth Middleware** | Authentication checked prior to consuming rate-limiting quotas on sensitive routes |
| **Rate Limiting** | 20 requests/minute per IP using `express-rate-limit` on all AI endpoints |
| **Path Traversal Hardening** | Quiz file operations enforce strict regex `^quiz_[a-f0-9]{8}_[a-zA-Z0-9_\-]{1,35}\.json$` in addition to `Path(name).name` |
| **CORS Lockdown** | Strands service restricts CORS to explicitly configured frontend origins with no cookie credentials |
| **Prompt Injection Defense** | Structural sanitizer strips control characters (`\x00-\x1F`) and injection chars (`<>"'\``) before passing data to agents |
| **Payload Size Limits** | Express restricts all JSON bodies to `10kb` to prevent Denial-of-Wallet attacks on the LLM API |
| **Security Headers** | Full `Helmet.js` header suite (CSP, HSTS, X-Frame-Options, etc.) |
| **Room Validation** | `requireValidRoom` middleware verifies every API call references a real, active game room |
| **Hint Rate Limiting** | In-memory `Set` enforces one hint per `roomPin:playerId:questionIndex` key |

---

## API Reference

### Game Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `hostGame` | Client → Server | `{ quizData, pin }` |
| `reconnectHost` | Client → Server | `{ pin, hostToken, hostId }` |
| `joinGame` | Client → Server | `{ pin, nickname, playerId }` |
| `startGame` | Client → Server | `{ pin, hostToken }` |
| `submitAnswer` | Client → Server | `{ pin, playerId, answerIndex }` |
| `nextQuestion` | Client → Server | `{ pin, hostToken }` |
| `kickPlayer` | Client → Server | `{ pin, targetPlayerId, hostToken }` |
| `gameStateUpdate` | Server → All | Full game state snapshot (anti-cheat masked) |

### REST Endpoints

#### Public (rate-limited, room-validated)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-quiz` | Compile live quiz questions via Strands QuizGeneratorAgent |
| `POST` | `/api/commentary` | Trigger AI commentator for a game event |
| `POST` | `/api/tutor/explain` | Ask Professor Q to explain a wrong answer |
| `POST` | `/api/hint` | Request a live hint from the Hint Master |
| `GET` | `/health` | Gateway health check (reports Bedrock & Strands metadata) |

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
| `POST` | `/generate-quiz` | Quiz Generator Agent (curriculum compilation) |
| `POST` | `/commentary` | Commentator Agent |
| `POST` | `/tutor` | Tutor Agent |
| `POST` | `/syllabus/trigger` | Syllabus Agent autonomous run |
| `GET` | `/syllabus/pending` | Fetch latest pending quiz |
| `POST` | `/syllabus/approve` | Update quiz status to approved |
| `POST` | `/syllabus/clear` | Delete a quiz file |
| `POST` | `/hint` | Hint Master Agent |
| `GET` | `/health` | Health check — lists all 5 active agents + Bedrock provider |

---

## Tech Stack

| Layer | Technology | Role & Details |
|---|---|---|
| **AI Agent Framework** | **[Strands Agents SDK](https://github.com/strands-agents/sdk-python)** (`strands-agents`) | Multi-agent orchestration, tool-calling loops, and prompt workflows |
| **Primary LLM Provider** | **Amazon Bedrock** (`BedrockModel` via `boto3`) | Anthropic Claude 3.5 Sonnet / Claude 3.7 Sonnet / Amazon Nova Pro |
| **Fallback LLM Provider** | **Google Gemini** (`GeminiModel` via `GEMINI_API_KEY`) | Seamless local/offline fallback if AWS credentials are not configured |
| **Agent Serverless Platform** | **Amazon Bedrock AgentCore** | Managed microVM runtime (`agentcore.yaml`), AgentCore Memory, and Gateway |
| **Agent Microservice** | Python 3.11 · FastAPI · Uvicorn | Internal high-concurrency microservice on port 8001 |
| **API Gateway** | Node.js 20 · Express 5 · Socket.IO 4 | Real-time state synchronization, anti-cheat masking, rate limiting |
| **Knowledge & Storage** | Amazon S3 & Local Fallback | Syllabi documents and quiz draft persistence (`AWS_S3_BUCKET_NAME`) |
| **Frontend UI** | React 18 · TypeScript · Vite 8 · Framer Motion | Real-time podium, sound synthesis, QR join, dark/light themes |
| **Authentication** | Firebase Admin SDK & Internal Token Guard | JWT admin authentication & `X-Internal-Token` microservice isolation |
| **Infrastructure & CI/CD** | AWS CloudFormation · Docker Compose · GitHub Actions | Automated 4-job CI pipeline, containerized orchestrations |

---

## License

[MIT License](./LICENSE) — © 2026 Chalana Dilshan

---

<div align="center">

Built with **Strands Agents SDK** on **Amazon Bedrock AgentCore** · Powered by **Amazon Bedrock (Claude 3.5 Sonnet & Nova Pro)**

</div>
