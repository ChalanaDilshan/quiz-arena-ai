# builder.aws Bonus Blog Posts (+0.6 Points)
## Agents for Humans Hackathon

> [!TIP]
> Publishing up to **3 posts on builder.aws** grants **+0.2 points each** (+0.6 maximum bonus), raising your score potential from 5.0 to 5.6!
> All posts must be published on [builder.aws](https://builder.aws) and include the hashtag **#AgentsForHumans** in the title.
> Below are three complete, publication-ready technical blog posts you can publish right away.

---

# Blog Post 1 (+0.2 Bonus Points)

**Title**: 
```text
Building an Autonomous Human-in-the-Loop Syllabus Agent with AWS Strands SDK #AgentsForHumans
```

**Tags**: `#AgentsForHumans`, `#AWS`, `#Bedrock`, `#AI`, `#StrandsAgents`, `#GenerativeAI`

**Post Body**:

```markdown
Educators often spend 3 to 5 hours every week manually transforming lecture notes, syllabi, and slides into quiz questions for their classrooms. While generative AI models can generate multiple-choice questions quickly, unchecked autonomous generation risks hallucinated questions or misaligned curriculum topics entering the classroom.

For the **Agents for Humans Hackathon**, we built **Quiz Arena AI**, featuring an autonomous **Syllabus Agent** designed around a core ethical principle: *AI agents should run autonomously in the background to lift repetitive cognitive burdens, but must surface only when human pedagogical judgment is required.*

### The Agentic Architecture: 4 Native Tools in Strands SDK

Using the new **AWS Strands Agents SDK** (`strands-agents`) bound to **Amazon Bedrock**, we created a multi-step autonomous agent equipped with four native `@tool` functions:

1. `list_syllabus_files`: Inspects course document repositories for available lecture transcripts and syllabus modules.
2. `read_syllabus_file`: Extracts week-by-week topic sequences, learning outcomes, and upcoming milestones.
3. `list_existing_quizzes`: Scans already-generated quizzes to avoid duplicate questions on identical subtopics.
4. `save_quiz_draft`: Writes structured JSON quiz drafts directly to persistent storage.

```python
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool

bedrock_model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    region_name="us-east-1",
    temperature=0.3
)

syllabus_agent = Agent(
    model=bedrock_model,
    tools=[list_syllabus_files, read_syllabus_file, list_existing_quizzes, save_quiz_draft],
    system_prompt="""You are the Syllabus Intelligence Agent for Quiz Arena AI.
    Your objective is to examine course materials, discover the next unassessed module,
    and draft a 5-question curriculum-aligned assessment."""
)
```

### The "Agents for Humans" Human-in-the-Loop Safeguard

Rather than immediately publishing newly generated quizzes to student lobbies, the agent assigns each generated draft a status of `pending_approval`. 

In our Admin Dashboard, teachers see newly prepared assessments waiting for review. The educator can:
- Inspect question stems and verify correct answer keys.
- Edit distractor explanations or fine-tune difficulty settings.
- Approve the quiz with a single click or discard it.

By leveraging the Strands Agents SDK to automate curriculum extraction while preserving human authority, Quiz Arena AI demonstrates how AI agents can genuinely augment human educators without removing them from the learning equation.
```

---

# Blog Post 2 (+0.2 Bonus Points)

**Title**:
```text
Sub-Second AI Commentary & Socratic Tutoring: Multi-Agent Orchestration with Amazon Bedrock #AgentsForHumans
```

**Tags**: `#AgentsForHumans`, `#AmazonBedrock`, `#Claude35Sonnet`, `#WebSockets`, `#EdTech`

**Post Body**:

```markdown
In competitive learning games, two challenges persistently frustrate participants:
1. **Passive, repetitive game pacing**: Traditional platforms show silent timers between questions.
2. **The "Silent Misconception Gap"**: Students who answer incorrectly rarely understand why their mental model was flawed, causing misconceptions to compound.

In **Quiz Arena AI**, we tackled both problems by orchestrating specialized agents powered by **Amazon Bedrock** and the **AWS Strands Agents SDK**.

### 1. Real-Time Game-Show Commentary via Event-Driven Tool Calling

To make formative assessments feel electric, our **Commentator Agent** hooks into live Socket.IO WebSocket streams. When a player achieves a 3-question streak, overtakes 1st place on the podium, or executes a dramatic comeback, the gateway dispatches a game event to our microservice:

```python
@tool
def receive_game_event(event_type: str, player_name: str, score: int, streak: int) -> dict:
    """Ingests live game telemetry for commentary analysis."""
    return {"status": "received", "event": event_type, "player": player_name, "streak": streak}
```

Bound to Anthropic Claude 3.5 Sonnet on Amazon Bedrock with a tuned temperature of `0.85`, the Commentator delivers witty, stadium-announcer commentary within milliseconds, driving classroom engagement through the roof.

### 2. Socratic Post-Match Tutoring with Professor Q

When a match ends, traditional quiz tools offer little more than a final score. In Quiz Arena AI, learners click **"Chat with Professor Q"** to unpack their mistakes.

Powered by conversational memory, Professor Q never simply blurts out the correct answer. Instead, he guides the student through multi-turn Socratic questioning:
- *"I noticed you chose Option B on Question 3 regarding Amazon S3 storage classes. What led you to believe S3 Standard-IA was designed for immediate millisecond access without retrieval fees?"*
- As the student explains their reasoning, Professor Q gently isolates the misconception and guides them toward the correct concept.

By coupling high-energy live commentary with empathetic, one-on-one Socratic coaching, Quiz Arena AI shows how multi-agent systems can turn high-stakes testing into an encouraging, human-centered journey of discovery.
```

---

# Blog Post 3 (+0.2 Bonus Points)

**Title**:
```text
Production MicroVM Agent Deployments on Amazon Bedrock AgentCore #AgentsForHumans
```

**Tags**: `#AgentsForHumans`, `#BedrockAgentCore`, `#Serverless`, `#Docker`, `#CloudFormation`

**Post Body**:

```markdown
Deploying multi-agent AI systems to production introduces unique challenges: managing conversational state across turns, isolating long-running agent tools, and ensuring enterprise-grade API security.

For our submission to the **Agents for Humans Hackathon**, we deployed **Quiz Arena AI** using **Amazon Bedrock AgentCore** — AWS's managed runtime for autonomous AI agents.

### Declarative Architecture with `agentcore.yaml`

Rather than managing ad-hoc container configurations, we defined our entire agent ecosystem declaratively in `agentcore.yaml`:

```yaml
version: "2024-10-01"
runtime: python3.11
entrypoint: main:app

agents:
  - id: syllabus-scanner
    name: Syllabus Intelligence Agent
    model: anthropic.claude-3-5-sonnet-20241022-v2:0
    tools:
      - list_syllabus_files
      - read_syllabus_file
      - list_existing_quizzes
      - save_quiz_draft

  - id: socratic-tutor
    name: Professor Q AI Tutor
    model: anthropic.claude-3-5-sonnet-20241022-v2:0
    memory:
      provider: agentcore_memory
      retention_days: 7
```

### Defense-in-Depth Microservice Isolation

Security is non-negotiable when deploying generative AI in educational environments. We isolated our Bedrock agents behind a secure three-tier perimeter:
- **Zero Host Exposure**: In Docker Compose and AgentCore MicroVM configurations, the Python agent runtime binds internally on port `8001` and is never exposed to the public internet.
- **Internal Shared Token Gating**: Every call from the Node.js API Gateway to the Strands agents requires an `X-Internal-Token` header, preventing direct unauthenticated invocation.
- **Anti-Cheat Answer Masking**: Correct answer keys remain strictly on the backend until timers elapse, preventing client-side network inspection during live competitions.

### Automated Infrastructure & CI/CD

Using AWS CloudFormation (`agentcore-stack.yaml`) and GitHub Actions, our repository continuously validates:
- 21 frontend and gateway integration tests
- 9 Python Strands agent unit tests
- MicroVM container builds and health probe checks (`/health`)

Amazon Bedrock AgentCore provides the rock-solid, enterprise-ready infrastructure needed to transition experimental AI agents into resilient, human-centered production tools.
```
