# Demo Video Recording Script — Quiz Arena AI
## Agents for Humans Hackathon (Target: 2.5 – 3.0 Minutes)

> [!IMPORTANT]
> **Criterion 5 (Presentation) is 20% of your total hackathon score.** A crisp, 3-minute video showing the real problem, all 5 agents in action, and the AWS architecture will maximize your points. Use **Loom** or **OBS Studio** for smooth screen recording with mic audio.

---

### Pre-Recording Setup Checklist (Open these tabs beforehand)
1. **Tab 1 — Landing Page / Interactive Demo**: `http://localhost/` or `http://localhost:5173/` (showing the hero section and WCAG AAA pads).
2. **Tab 2 — Admin Dashboard**: `http://localhost/admin` or `http://localhost:5173/admin` (showing quiz list, search, and `pending_approval` status).
3. **Tab 3 — Host Game & Player Window**: A host window and a side-by-side player window (showing live gameplay, hints, and commentator).
4. **Tab 4 — Post-Game Tutor Chat**: Showing Professor Q unpacking a missed question.
5. **Tab 5 / VS Code**: Showing `server/strands_agents/main.py` and `agentcore.yaml`.

---

## The 3-Minute Timestamped Script

---

### 0:00 – 0:35 | The Problem & "Agents for Humans" (35 seconds)
**Screen**: Landing Page (`http://localhost:5173/`) showcasing the sleek dark mode UI and the tagline.

**Narration**:
> *"Hi everyone, I'm Chalana, and this is Quiz Arena AI — built for the Agents for Humans Hackathon.*
> 
> *A typical educator spends 3 to 5 hours every single week manually writing multiple-choice questions, calibrating distractors, and updating quizzes. At the same time, students experience the 'silent misconception gap' — getting questions wrong during tests without ever understanding why.*
> 
> *Quiz Arena AI solves both sides of this problem using five specialized agents powered by the AWS Strands Agents SDK and orchestrated on Amazon Bedrock AgentCore. Instead of replacing human judgment, our agents act as tireless cognitive scaffolds that empower teachers and coach learners."*

---

### 0:35 – 1:15 | Autonomous Syllabus Agent & Human-in-the-Loop (40 seconds)
**Screen**: Switch to Admin Dashboard. Trigger the Syllabus Agent or show the syllabi folder (`aws_cloud_fundamentals.txt`), then show the newly generated quiz draft appearing with the badge `pending_approval`.

**Narration**:
> *"Here in the Admin Dashboard, our autonomous Syllabus Agent is running in the background. It uses four native Strands tools to scan course documents, identify upcoming curriculum topics, check existing question banks to eliminate duplicate questions, and generate a balanced quiz draft.*
> 
> *Notice our human-in-the-loop philosophy: the agent never exposes unreviewed AI content directly to students. It surfaces to the educator marked 'pending approval'. The teacher can review the questions, edit rationales, and approve it with one click."*

---

### 1:15 – 2:00 | Live Game, WCAG AAA Pads, AI Commentator & Hint Master (45 seconds)
**Screen**: Split-screen showing Host window on the left, Player window on the right. Host starts a question. Click a hint. Answer correctly.

**Narration**:
> *"Now let's jump into a live multiplayer game. Notice our bespoke visual identity — we moved away from generic red-and-blue squares to WCAG AAA dual-coded answer pads pairing geometric shapes with high-contrast colorways and dual keyboard shortcuts.*
> 
> *During the countdown, if a player is unsure, they can call our Hint Master Agent. Using tool calling, Hint Master analyzes the question distractors and provides a subtle, Socratic clue without giving away the answer.*
> 
> *As players answer and build streaks, our AI Commentator agent reacts in real-time over WebSockets, bringing dynamic game-show excitement to the classroom."*

---

### 2:00 – 2:30 | Post-Game Professor Q (Socratic AI Tutor) (30 seconds)
**Screen**: Game Over screen -> Click "Chat with Professor Q" -> Ask a follow-up question.

**Narration**:
> *"When the game concludes, learning doesn't stop. Players meet Professor Q, our multi-turn Socratic AI Tutor.*
> 
> *Professor Q reviews the questions the player missed. Backed by persistent session memory, he doesn't just hand out answers — he initiates a patient, conversational dialogue, guiding the student to discover the underlying concept themselves."*

---

### 2:30 – 3:00 | AWS Architecture & Strands Agents SDK (30 seconds)
**Screen**: Show `docs/BEDROCK_AGENTCORE_ARCHITECTURE.md` architecture diagram or `server/strands_agents/main.py` in VS Code and `agentcore.yaml`.

**Narration**:
> *"Under the hood, Quiz Arena is powered by Amazon Bedrock using Claude 3.5 Sonnet and Amazon Nova Pro models. Each agent is a native instance of the AWS Strands Agents SDK with specialized prompt personas and custom `@tool` functions.*
> 
> *For production deployment, our entire agent microservice is configured for Amazon Bedrock AgentCore with automated health probes, managed memory, and CloudFormation infrastructure.*
> 
> *With 30 automated tests and a complete CI/CD pipeline, Quiz Arena AI demonstrates the true power of AI agents built for humans. Thank you!"*

---

## 🎬 Recording Tips
- **Voice**: Speak with energy, confidence, and steady pacing.
- **Mouse Clicks**: Keep mouse movements intentional and steady; pause 1 second after clicking buttons so viewers can see the UI transition.
- **Audio Quality**: Use headphones with a mic if possible to minimize room echo.
- **Video Host**: Upload to YouTube (Unlisted or Public) or Loom and paste the link into your Devpost submission form.
