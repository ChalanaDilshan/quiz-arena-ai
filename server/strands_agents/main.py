"""
Quiz Arena — Strands Agents Microservice
=========================================
Three real Strands agents exposed over FastAPI, called internally
by the Node.js Express gateway.

Agents:
  1. CommentatorAgent  — reacts to live game events
  2. TutorAgent        — multi-turn post-game tutoring (session-aware)
  3. SyllabusAgent     — autonomous background agent with real tools:
                          list_syllabus_files, read_syllabus_file,
                          list_existing_quizzes, save_quiz_draft
"""

import json
import os
import re
import uuid
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from strands import Agent
from strands.models.google import GoogleModel
from strands.tools import tool

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in server/.env")

SYLLABI_DIR  = Path(__file__).parent.parent / "syllabi"
QUIZZES_DIR  = Path(__file__).parent.parent / "quizzes"
SYLLABI_DIR.mkdir(exist_ok=True)
QUIZZES_DIR.mkdir(exist_ok=True)

def make_gemini_model(temperature: float = 0.7) -> GoogleModel:
    """Return a Strands GoogleModel backed by Gemini 2.5 Flash."""
    return GoogleModel(
        model_id="gemini-2.5-flash",
        api_key=GEMINI_API_KEY,
        params={"temperature": temperature},
    )

# ---------------------------------------------------------------------------
# Structural input sanitizer (strips control chars + common injection chars)
# ---------------------------------------------------------------------------

def sanitize(text: str, max_len: int = 500) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r"[\x00-\x1F\x7F]", "", text)   # control chars
    text = re.sub(r"[<>\"'`]", "", text)            # injection chars
    return text[:max_len]


# ===========================================================================
# Agent 1 — Commentator
# ===========================================================================

COMMENTATOR_PROMPT = """
You are an energetic, slightly sarcastic, and highly entertaining game show
host for an AI Quiz Competition called "Quiz Arena".
You receive live events from the game via the receive_game_event tool.
Call that tool first, then produce SHORT (1-2 sentence) punchy commentary.
Keep it high-energy! React to streaks, scores, and accuracy dynamically.
NEVER sound like a boring robot. You are a lively host!
""".strip()


@tool
def receive_game_event(event_type: str, player_name: str, context: str) -> str:
    """
    Receive a live game event and return structured context for the host to react to.

    Args:
        event_type: Type of event (e.g. HOT_STREAK, COLD_STREAK, QUESTION_REVEALED)
        player_name: The player's display name
        context: Additional context about the event (score, streak count, etc.)

    Returns:
        A formatted event summary for the host to react to.
    """
    return (
        f"LIVE EVENT — Type: {event_type} | Player: {player_name} | "
        f"Details: {context}"
    )


def build_commentator_agent() -> Agent:
    return Agent(
        model=make_gemini_model(temperature=0.85),
        system_prompt=COMMENTATOR_PROMPT,
        tools=[receive_game_event],
    )


# ===========================================================================
# Agent 2 — Tutor (multi-turn, session-aware via Strands conversation history)
# ===========================================================================

TUTOR_PROMPT = """
You are "Professor Q", a warm, patient, and encouraging AI tutor embedded
in Quiz Arena. A student just finished a quiz and got a question wrong.
Your job is to explain WHY they were wrong and teach the correct concept.

Guidelines:
- Be warm and supportive — never condescending.
- Start by acknowledging their attempt, then gently correct the misconception.
- Keep the initial explanation to 3-5 sentences.
- Use simple analogies or real-world examples where helpful.
- For follow-up questions, build on what you have already explained.
- End your first message with an invitation to ask follow-up questions.
""".strip()


# In-memory session store: session_id → list of Strands message dicts
# (For a production app, store this in Redis or a DB)
_tutor_sessions: dict[str, list[dict]] = {}


def build_tutor_agent(history: list[dict] | None = None) -> Agent:
    return Agent(
        model=make_gemini_model(temperature=0.7),
        system_prompt=TUTOR_PROMPT,
        # Pass prior conversation history so Strands maintains context
        conversation_history=history or [],
    )


# ===========================================================================
# Agent 3 — Syllabus Agent (autonomous, with 4 real tools)
# ===========================================================================

SYLLABUS_PROMPT = """
You are an autonomous teacher's assistant agent for Quiz Arena.
Your job is to scan the available syllabus files, identify the UPCOMING week's
topic, check whether a quiz for that topic already exists, and if not, generate
one and save it.

Always follow this exact sequence of steps:
1. Call list_syllabus_files to see what syllabi are available.
2. Call read_syllabus_file to read the most relevant one.
3. Call list_existing_quizzes to check for duplicates.
4. If a quiz for this topic already exists, return a message explaining that.
5. If no duplicate: generate a 5-question multiple-choice quiz as a JSON array
   and call save_quiz_draft to persist it.

Each question must have: id (string), text, options (array of 4 strings),
correctIndex (0-3), timeLimit (integer seconds), explanation (string).
""".strip()


@tool
def list_syllabus_files() -> str:
    """
    List all available syllabus text files in the syllabi directory.

    Returns:
        A JSON array of filenames, e.g. ["week1.txt", "week2.txt"]
    """
    files = [f.name for f in SYLLABI_DIR.glob("*.txt")]
    return json.dumps(files)


@tool
def read_syllabus_file(filename: str) -> str:
    """
    Safely read the contents of a syllabus file by name.

    Args:
        filename: The exact filename to read (e.g. "week3.txt")

    Returns:
        The text content of the syllabus (max 8000 chars).
    """
    # Path-traversal protection: only allow plain filenames, no slashes
    safe_name = Path(filename).name
    target = SYLLABI_DIR / safe_name
    if not target.exists() or not target.suffix == ".txt":
        return f"Error: file '{safe_name}' not found in syllabi directory."
    raw = target.read_text(encoding="utf-8")
    # Strip control chars and cap size
    clean = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", raw)[:8000]
    return clean


@tool
def list_existing_quizzes() -> str:
    """
    List all quiz drafts that have already been generated and saved.

    Returns:
        A JSON array of quiz metadata objects with 'filename' and 'topic' keys.
    """
    quizzes = []
    for f in QUIZZES_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            quizzes.append({"filename": f.name, "topic": data.get("topic", "unknown")})
        except Exception:
            quizzes.append({"filename": f.name, "topic": "unreadable"})
    return json.dumps(quizzes)


@tool
def save_quiz_draft(topic: str, questions_json: str) -> str:
    """
    Save an agent-generated quiz draft to the quizzes directory.

    Args:
        topic: The topic of the quiz (e.g. "React Hooks Fundamentals")
        questions_json: A JSON string containing the array of question objects

    Returns:
        A success message with the saved filename.
    """
    try:
        questions = json.loads(questions_json)
    except json.JSONDecodeError as exc:
        return f"Error: invalid JSON — {exc}"

    filename = f"quiz_{uuid.uuid4().hex[:8]}_{topic[:30].replace(' ', '_')}.json"
    payload = {"topic": topic, "questions": questions, "status": "pending_approval"}
    (QUIZZES_DIR / filename).write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return f"Quiz saved as '{filename}'. Awaiting human approval in the Admin Dashboard."


def build_syllabus_agent() -> Agent:
    return Agent(
        model=make_gemini_model(temperature=0.2),
        system_prompt=SYLLABUS_PROMPT,
        tools=[list_syllabus_files, read_syllabus_file, list_existing_quizzes, save_quiz_draft],
    )


# ===========================================================================
# FastAPI app
# ===========================================================================

app = FastAPI(title="Quiz Arena — Strands Agents Service", version="1.0.0")

# Only accept calls from the Node.js gateway (localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


# --- Pydantic request bodies ---

class CommentaryRequest(BaseModel):
    event_type: str
    player_name: str
    context: str = ""


class TutorRequest(BaseModel):
    session_id: str = ""
    question_text: str
    player_answer: str = ""
    correct_answer: str
    follow_up: str = ""   # empty on first call, populated on follow-ups


class SyllabusRequest(BaseModel):
    pass  # fully autonomous — no input needed


# --- Endpoints ---

@app.post("/commentary")
async def commentary(req: CommentaryRequest):
    safe_event   = sanitize(req.event_type, 50)
    safe_player  = sanitize(req.player_name, 80)
    safe_context = sanitize(req.context, 300)

    agent = build_commentator_agent()
    prompt = (
        f"A live game event just happened. Use the receive_game_event tool with "
        f"event_type='{safe_event}', player_name='{safe_player}', "
        f"context='{safe_context}'. Then deliver your host commentary."
    )
    result = agent(prompt)
    return {"comment": str(result)}


@app.post("/tutor")
async def tutor(req: TutorRequest):
    safe_q  = sanitize(req.question_text, 500)
    safe_pa = sanitize(req.player_answer, 200)
    safe_ca = sanitize(req.correct_answer, 200)
    safe_fu = sanitize(req.follow_up, 400)

    # Retrieve or create session history
    session_id = req.session_id or uuid.uuid4().hex
    history    = _tutor_sessions.get(session_id, [])

    agent = build_tutor_agent(history=history)

    if safe_fu:
        # Follow-up turn
        prompt = safe_fu
    else:
        # First turn — introduce the wrong answer
        prompt = (
            f'I just answered a quiz question wrong.\n'
            f'Question: "{safe_q}"\n'
            f'My answer: "{safe_pa}"\n'
            f'Correct answer: "{safe_ca}"\n\n'
            f'Please explain why my answer was wrong and help me understand.'
        )

    result = agent(prompt)

    # Persist updated conversation history for this session
    _tutor_sessions[session_id] = agent.conversation_history

    return {"explanation": str(result), "session_id": session_id}


@app.post("/syllabus/trigger")
async def syllabus_trigger(_: SyllabusRequest = SyllabusRequest()):
    agent = build_syllabus_agent()
    result = agent(
        "Please start your autonomous task: scan available syllabus files, "
        "check for existing quizzes, and generate + save a new quiz if needed."
    )
    # Look for the most recently saved quiz for the dashboard
    latest_quiz = None
    if QUIZZES_DIR.exists():
        files = sorted(QUIZZES_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)
        if files:
            try:
                latest_quiz = json.loads(files[0].read_text(encoding="utf-8"))
                latest_quiz["_filename"] = files[0].name
            except Exception:
                pass

    return {"agent_summary": str(result), "pending_quiz": latest_quiz}


@app.get("/syllabus/pending")
async def syllabus_pending():
    """Return the most recently saved quiz draft (for Admin Dashboard polling)."""
    if not QUIZZES_DIR.exists():
        return {"pending_quiz": None}
    files = sorted(QUIZZES_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            if data.get("status") == "pending_approval":
                return {"pending_quiz": data.get("questions"), "filename": f.name}
        except Exception:
            continue
    return {"pending_quiz": None}


@app.post("/syllabus/approve")
async def syllabus_approve(body: dict):
    filename = body.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="filename required")
    target = QUIZZES_DIR / Path(filename).name
    if not target.exists():
        raise HTTPException(status_code=404, detail="Quiz file not found")
    data = json.loads(target.read_text(encoding="utf-8"))
    data["status"] = "approved"
    target.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"success": True}


@app.post("/syllabus/clear")
async def syllabus_clear(body: dict = {}):
    filename = body.get("filename")
    if filename:
        target = QUIZZES_DIR / Path(filename).name
        if target.exists():
            target.unlink()
    return {"success": True}


@app.get("/health")
async def health():
    return {"status": "ok", "agents": ["commentator", "tutor", "syllabus"]}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
