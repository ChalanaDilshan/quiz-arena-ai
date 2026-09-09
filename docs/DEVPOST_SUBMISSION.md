# Devpost Submission Package — Quiz Arena AI
## Agents for Humans Hackathon

This document contains everything you need to copy-paste directly into your **Devpost submission form**.

---

### 1. Project Title
```text
Quiz Arena AI: Real-Time Multi-Agent Competitive Learning on Amazon Bedrock
```

### 2. Elevator Pitch / Tagline (Under 200 characters)
```text
A real-time competitive quiz arena powered by 5 Strands SDK agents on Amazon Bedrock AgentCore — augmenting educators with autonomous syllabus drafting and coaching learners with Socratic AI.
```

### 3. Category / Track
- **Agents for Humans** (Human Augmentation & Education)
- **AWS Strands Agents SDK & Amazon Bedrock AgentCore**

---

### 4. About the Project (Main Devpost Markdown Body)

Copy and paste the following sections directly into the Devpost submission editor:

```markdown
## 💡 Inspiration: Agents for Humans, Not Agents Instead of Humans

Educators spend **3 to 5 hours every single week** manually sifting through lecture transcripts, drafting multiple-choice questions, calibrating distractor options, and formatting quizzes. Despite this effort, the traditional classroom quiz format leaves students stranded in what cognitive scientists call the **"silent misconception gap"**: a student gets an answer wrong, sees a red "X", and moves on without ever discovering *why* their mental model was flawed.

We asked: **What if intelligent AI agents didn't replace the teacher or spoon-feed answers to students, but worked as tireless, human-centered cognitive scaffolds?**

Built for the **Agents for Humans Hackathon**, **Quiz Arena AI** orchestrates five specialized agents using the **AWS Strands Agents SDK** and **Amazon Bedrock AgentCore**. It handles the repetitive cognitive labor for educators while keeping them firmly in the loop, transforms live assessments into engaging arenas with dynamic game commentary, and pairs every learner with a patient, Socratic post-match AI tutor.

---

## 🚀 What It Does

Quiz Arena AI is a complete, real-time multiplayer assessment ecosystem powered by 5 autonomous and assistive Strands agents:

### 1. 🤖 Autonomous Syllabus Agent (Human-in-the-Loop)
- **Operates autonomously in the background**: Uses 4 native Strands tools (`list_syllabus_files`, `read_syllabus_file`, `list_existing_quizzes`, `save_quiz_draft`) to scan course repositories, detect upcoming curriculum milestones, cross-reference existing quiz banks to prevent duplicate topics, and draft complete quizzes.
- **Surfaces only when human judgment is needed**: Under our ethical AI design, generated quizzes are placed into a `pending_approval` state in the Admin Dashboard. Teachers retain 100% pedagogical authority to edit, approve, or discard drafts before any student sees them.

### 2. 🎙️ AI Game Commentator (Real-Time Live Host)
- Reacts in real-time via WebSockets to player answer streaks, dramatic comeback rallies, speed bonuses, and podium position shifts using the `receive_game_event` tool.
- Turns solitary testing into an electric, high-energy live game-show experience.

### 3. 🎓 Professor Q — AI Tutor (Multi-Turn Post-Game Socratic Coaching)
- Activates after every match to unpack questions the player missed.
- Backed by persistent conversational memory, Professor Q never simply recites the answer; he guides the student through multi-turn Socratic questions until the student arrives at the correct concept themselves.

### 4. 🔍 Hint Master Agent (In-Game Cognitive Scaffolding)
- During timed questions, players who feel lost can call upon Hint Master.
- Using the `analyze_question` tool, the agent deconstructs the distractors and returns a nuanced, conceptual clue without spoiling the correct answer pad.

### 5. ⚡ Live Quiz Generator Agent (Curriculum Compiler)
- Converts uploaded lecture notes, syllabi, or custom topic outlines into balanced, verified question suites in under 15 seconds with structured JSON schemas and rationale explanations.

---

## 🎨 Bespoke Visual Identity & WCAG AAA Accessibility

Quiz Arena leaves behind the tired primary-color squares of legacy quiz tools with a bespoke, accessible design system:
- **Dual-Coded Signaling**: Answer choices pair distinct geometric symbols (`⬢` Amethyst Hexagon, `◆` Cerulean Diamond, `★` Terracotta Star, `■` Emerald Square) with tailored high-contrast colorways.
- **Colorblind & Keyboard Native**: Full WCAG AAA contrast ratio compliance (≥ 7.1:1 to 8.2:1) across all pads, with dual keyboard bindings (`1–4` and `A–D`).
- **Tactile Feedback & Screen Reader Announcements**: Scale-bounce glow animations on correct answers, tactile shakes on misses, and ARIA-assertive live regions for non-visual learners.

---

## 🛠️ How We Built It

We designed a hardened, decoupled three-tier architecture:

1. **AI Reasoning MicroVM Layer (Amazon Bedrock & Strands SDK)**:
   - Python 3.11 + FastAPI microservice powering the 5 agents.
   - Bound natively to **Amazon Bedrock** (`BedrockModel`) utilizing **Anthropic Claude 3.5 Sonnet** and **Amazon Nova Pro**.
   - Configured with `agentcore.yaml`, containerized for microVM isolation via `Dockerfile.agentcore`, and deploying with CloudFormation and AWS Bedrock AgentCore CLI.
   - Built-in session memory persistence and 6 custom `@tool` functions.

2. **Real-Time Orchestration Gateway (Node.js & Socket.IO)**:
   - Manages WebSocket game rooms, state reconciliation, and cryptographic host session resumption.
   - Implements **anti-cheat answer masking** (correct answer keys never leave the server until question timers elapse).
   - Internal token gating (`X-Internal-Token`) prevents unauthorized external invocation of Bedrock agent endpoints.

3. **Frontend Client (React 18 & Vite)**:
   - Fluid, responsive UI built with TailwindCSS and Framer Motion micro-animations.
   - Interactive hero demo, real-time podium ceremonies, administrative approval workflows, and Firebase Google Auth.

---

## 🧪 Testing & Reliability

- **30 Automated Tests**: 21 frontend/gateway tests + 9 Python Strands agent unit tests.
- **CI/CD Pipeline**: GitHub Actions running automated linting, test suites, and Docker verification on every push.
- **Graceful Fallbacks**: Comprehensive fallback generation routines ensuring 100% platform uptime even during model quota or regional network events.

---

## 🧗 Challenges We Overcame

1. **Sub-Second Streaming Commentary**: Connecting WebSocket game-state broadcasts to Bedrock LLM reasoning required tuning prompt templates and streaming tokens to deliver game-show reactions within milliseconds of player clicks.
2. **True Human-in-the-Loop Tool Calling**: Constructing the Syllabus Agent required a multi-step agentic loop where the agent autonomously queries local disk/S3 storage, compares existing quiz indices, and writes drafts without human intervention — while strictly enforcing that human teachers retain the final gatekeeper role before publication.
3. **Conversational Memory in Serverless Runtimes**: Wiring session-aware Socratic tutoring across stateless container restarts led us to design a hybrid approach combining local memory caching with Bedrock AgentCore persistent memory specs.

---

## 🏆 Accomplishments We're Proud Of

- **Genuine Agentic Depth**: 5 distinct agents with individual prompts, temperatures, and 6 custom tools — far beyond a single prompt wrapper.
- **True "Agents for Humans" Realization**: Autonomous background preparation that saves teachers hours, paired with a human-in-the-loop admin gate and empathetic Socratic tutoring for students.
- **Enterprise-Grade Accessibility**: Creating answer pads that meet rigorous WCAG AAA guidelines while maintaining a sleek, modern visual aesthetic.

---

## 📚 What We Learned

- How the **Strands Agents SDK** simplifies tool-calling architectures and allows seamless integration with Amazon Bedrock foundation models.
- The power of **Amazon Bedrock AgentCore** for defining declarative agent manifests (`agentcore.yaml`) with native memory and deployment specifications.
- Designing multi-agent systems where each agent has an intentional personality, boundary, and ethical role alongside human stakeholders.

---

## 🔮 What's Next for Quiz Arena AI

- **Multi-Modal Image & Diagram Quizzes**: Using Amazon Bedrock vision models to generate questions directly from complex textbook diagrams, chemical formulas, and architectural schematics.
- **Real-Time Audio Commentary**: Integrating Amazon Polly neural voices with the Commentator Agent for live audio voice-overs during multiplayer matches.
- **LMS Integrations**: Canvas and Blackboard LTI plugins to automatically sync course syllabi into Quiz Arena and push student mastery analytics back into gradebooks.
```

---

### 5. "Built With" Tags (Select/Enter on Devpost)
`aws`, `amazon-bedrock`, `strands-agents-sdk`, `bedrock-agentcore`, `claude-3-5-sonnet`, `amazon-nova`, `python`, `fastapi`, `nodejs`, `react`, `typescript`, `socket-io`, `docker`, `tailwind-css`, `framer-motion`, `wcag-aaa`

---

### 6. Repository Links & Demos
- **GitHub Repository**: [https://github.com/ChalanaDilshan/quiz-arena-ai](https://github.com/ChalanaDilshan/quiz-arena-ai)
- **Demo Video**: *(Insert your Loom or YouTube video link)*
- **Architecture Documentation**: [docs/BEDROCK_AGENTCORE_ARCHITECTURE.md](./BEDROCK_AGENTCORE_ARCHITECTURE.md)
