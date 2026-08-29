# Quiz Arena AI

Quiz Arena AI is a real-time, competitive quiz platform built for the "Agents for Humans" Hackathon. It leverages real autonomous AI agents running via the **AWS Strands Agents SDK** to handle repetitive tasks for educators, while maintaining human-in-the-loop oversight.

## Architecture

The project uses a secure, two-process architecture to cleanly separate intelligent agent reasoning from public web routing:

1. **Python Strands Microservice (`server/strands_agents`)**: Runs the AWS Strands SDK, connecting to Gemini 2.5 Flash via Strands' Google model provider. It exposes internal-only endpoints for the agents.
2. **Node.js API Gateway (`server/index.js`)**: An Express server that handles public web traffic, WebSockets, Firebase JWT authentication, rate limiting (20 req/min), and strict payload size limits (10kb), before securely proxying agent tasks to the internal Python service.
3. **React Frontend (`src/`)**: A dynamic Vite-powered React app with hardware-accelerated animations and custom Web Audio synthesis.

## The Agents

Quiz Arena implements the core philosophy of the Strands SDK across three distinct agents:

### 1. Syllabus Agent (Autonomous Background Agent)
- **Autonomy with Real Tools:** A Strands `Agent` runs in the background with access to 4 real tools (`list_syllabus_files`, `read_syllabus_file`, `list_existing_quizzes`, `save_quiz_draft`).
- **Human-in-the-Loop:** It autonomously checks if a quiz already exists for an upcoming topic. If not, it generates the quiz and saves a draft to disk, then securely pauses and surfaces a notification on the teacher's Admin Dashboard asking for review.
- **Action:** The teacher reviews the generated quiz and clicks "Approve", instantly publishing it without writing a single question.

### 2. Professor Q (Session-Aware Tutor Agent)
- **Multi-turn Context:** When a student gets a question wrong, they can chat with Professor Q. This uses a Strands `Agent` with built-in `messages=` history management and server-side session persistence.

### 3. AI Game Commentator (Event-Driven Agent)
- **Dynamic Output:** During a live match, a Strands `Agent` processes real-time events via a `receive_game_event` tool, acting as a virtual host to hype up players.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Google Gemini API Key

### 1. Configuration
1. In the `server/` directory, create a `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   STRANDS_URL=http://127.0.0.1:8001
   ```
2. In the root directory, create a `.env` file:
   ```
   VITE_API_URL=http://localhost:3001
   ```
3. Set up a Firebase project and save your admin SDK credentials to `server/serviceAccountKey.json`.

### 2. Running the Application (Local Development)

#### Windows
Run the startup script from the **project root**:
```powershell
.\start.ps1
```
This will automatically create a Python virtual environment, install the Strands dependencies, and launch both the Node.js gateway and the Python Strands microservice.

#### Mac / Linux
Run the startup script from the **project root**:
```bash
chmod +x start.sh
./start.sh
```

#### Frontend
In a separate terminal:
```bash
npm install
npm run dev
```

## Security Features
- **Firebase JWT Authentication:** Protected endpoints require a valid Firebase ID token.
- **Trust Proxy & Rate Limiting:** Configured to respect reverse proxies (Render/Vercel) to accurately rate-limit (20 requests/minute) per client IP.
- **Prompt Injection Defense:** A structural text sanitizer strips control characters and restricts payload length before passing data to the Strands agents.
- **Payload Limits:** Express restricts JSON request bodies to `10kb` to prevent Denial of Wallet attacks on the LLM API.
- **Security Headers:** Powered by Helmet.js.
