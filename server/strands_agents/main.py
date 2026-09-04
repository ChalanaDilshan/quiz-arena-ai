"""
Quiz Arena — Strands Agents Microservice
=========================================
Four real Strands agents exposed over FastAPI, called internally
by the Node.js Express gateway.

Agents:
  1. CommentatorAgent  — reacts to live game events
  2. TutorAgent        — multi-turn post-game tutoring (session-aware)
  3. SyllabusAgent     — autonomous background agent with real tools:
                          list_syllabus_files, read_syllabus_file,
                          list_existing_quizzes, save_quiz_draft
  4. HintMasterAgent   — gives a subtle, non-spoiler hint for a live question
"""

import json
import os
import re
import uuid
from pathlib import Path
from typing import Any

import boto3
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from strands import Agent
from strands.models.gemini import GeminiModel
from strands.tools import tool

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in server/.env")

AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME")
s3_client = boto3.client("s3") if AWS_S3_BUCKET_NAME else None

SYLLABI_DIR  = Path(__file__).parent.parent / "syllabi"
QUIZZES_DIR  = Path(__file__).parent.parent / "quizzes"
if not AWS_S3_BUCKET_NAME:
    SYLLABI_DIR.mkdir(exist_ok=True)
    QUIZZES_DIR.mkdir(exist_ok=True)

def make_gemini_model(temperature: float = 0.7) -> GeminiModel:
    """Return a Strands GeminiModel backed by Gemini 2.5 Flash."""
    return GeminiModel(
        model_id="gemini-2.5-flash",
        client_args={"api_key": GEMINI_API_KEY},
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
        messages=history or [],
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
    if AWS_S3_BUCKET_NAME:
        response = s3_client.list_objects_v2(Bucket=AWS_S3_BUCKET_NAME, Prefix="syllabi/")
        files = [obj["Key"].split("/")[-1] for obj in response.get("Contents", []) if obj["Key"].endswith(".txt")]
    else:
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
    if AWS_S3_BUCKET_NAME:
        if not safe_name.endswith(".txt"):
            return f"Error: file '{safe_name}' not found in syllabi directory."
        try:
            response = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=f"syllabi/{safe_name}")
            raw = response["Body"].read().decode("utf-8")
        except Exception:
            return f"Error: file '{safe_name}' not found in S3 syllabi directory or could not be read."
    else:
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
    if AWS_S3_BUCKET_NAME:
        response = s3_client.list_objects_v2(Bucket=AWS_S3_BUCKET_NAME, Prefix="quizzes/")
        for obj in response.get("Contents", []):
            if not obj["Key"].endswith(".json"):
                continue
            try:
                file_obj = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=obj["Key"])
                data = json.loads(file_obj["Body"].read().decode("utf-8"))
                quizzes.append({"filename": obj["Key"].split("/")[-1], "topic": data.get("topic", "unknown")})
            except Exception:
                quizzes.append({"filename": obj["Key"].split("/")[-1], "topic": "unreadable"})
    else:
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

    safe_topic = re.sub(r'[^a-zA-Z0-9_\-]', '_', topic[:30])
    filename = f"quiz_{uuid.uuid4().hex[:8]}_{safe_topic}.json"
    payload = {"topic": topic, "questions": questions, "status": "pending_approval"}
    payload_str = json.dumps(payload, indent=2, ensure_ascii=False)
    
    if AWS_S3_BUCKET_NAME:
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=f"quizzes/{filename}",
            Body=payload_str.encode("utf-8"),
            ContentType="application/json"
        )
    else:
        (QUIZZES_DIR / filename).write_text(payload_str, encoding="utf-8")
        
    return f"Quiz saved as '{filename}'. Awaiting human approval in the Admin Dashboard."


def build_syllabus_agent() -> Agent:
    return Agent(
        model=make_gemini_model(temperature=0.2),
        system_prompt=SYLLABUS_PROMPT,
        tools=[list_syllabus_files, read_syllabus_file, list_existing_quizzes, save_quiz_draft],
    )


# ===========================================================================
# Agent 4 — Hint Master (live in-game subtle clue provider)
# ===========================================================================

HINT_MASTER_PROMPT = """
You are the "Hint Master", a cryptic but helpful assistant embedded inside
a live quiz competition called Quiz Arena.

A player is stuck on a multiple-choice question and has asked for a hint.
Your ONLY job is to call the analyze_question tool first, then craft ONE
subtle, Socratic hint that nudges the player toward the correct answer
without EVER revealing it directly.

Strict rules:
- DO NOT mention the correct answer or its label (A, B, C, D).
- DO NOT say things like "think about the second option" or "it starts with M".
- Use an analogy, a real-world fact, or a leading question as your clue.
- Keep it to 1-2 punchy sentences. Be clever, not boring.
- Your tone should feel like a wise game-show host, not a teacher.
""".strip()


@tool
def analyze_question(question_text: str, options: str) -> str:
    """
    Receive the full quiz question and its four answer options so the
    Hint Master can study the content before crafting a subtle clue.

    Args:
        question_text: The full text of the quiz question.
        options: A JSON array string of the four answer options.

    Returns:
        A structured summary of the question context for the agent.
    """
    return (
        f"QUESTION: {question_text}\n"
        f"OPTIONS: {options}\n"
        f"Now craft a subtle, non-spoiler hint for the player."
    )


def build_hint_master_agent() -> Agent:
    return Agent(
        model=make_gemini_model(temperature=0.75),
        system_prompt=HINT_MASTER_PROMPT,
        tools=[analyze_question],
    )


# ===========================================================================
# FastAPI app
# ===========================================================================

app = FastAPI(title="Quiz Arena — Strands Agents Service", version="1.1.0")

# Configure allowed origins from environment variable (supporting Docker, local, and production origins)
raw_origins = os.environ.get(
    "STRANDS_ALLOWED_ORIGINS",
    os.environ.get("ALLOWED_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001,http://gateway:3001")
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip() and o.strip() != "*"]
if not allowed_origins:
    # Fallback if only '*' was provided, as '*' is invalid with allow_credentials=True
    allowed_origins = ["http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
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


class HintRequest(BaseModel):
    question_text: str
    options: list[str]  # exactly 4 option strings


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
    _tutor_sessions[session_id] = agent.messages

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
    if AWS_S3_BUCKET_NAME:
        response = s3_client.list_objects_v2(Bucket=AWS_S3_BUCKET_NAME, Prefix="quizzes/")
        if "Contents" in response:
            files = sorted([obj for obj in response["Contents"] if obj["Key"].endswith(".json")], key=lambda x: x["LastModified"], reverse=True)
            if files:
                try:
                    obj_resp = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=files[0]["Key"])
                    latest_quiz = json.loads(obj_resp["Body"].read().decode("utf-8"))
                    latest_quiz["_filename"] = files[0]["Key"].split("/")[-1]
                except Exception:
                    pass
    else:
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
    if AWS_S3_BUCKET_NAME:
        response = s3_client.list_objects_v2(Bucket=AWS_S3_BUCKET_NAME, Prefix="quizzes/")
        if "Contents" not in response:
            return {"pending_quiz": None}
        files = sorted([obj for obj in response["Contents"] if obj["Key"].endswith(".json")], key=lambda x: x["LastModified"], reverse=True)
        for f in files:
            try:
                obj_resp = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=f["Key"])
                data = json.loads(obj_resp["Body"].read().decode("utf-8"))
                if data.get("status") == "pending_approval":
                    return {"pending_quiz": data.get("questions"), "filename": f["Key"].split("/")[-1]}
            except Exception:
                continue
    else:
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
    safe_name = Path(filename).name
    
    if AWS_S3_BUCKET_NAME:
        try:
            obj_resp = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=f"quizzes/{safe_name}")
            data = json.loads(obj_resp["Body"].read().decode("utf-8"))
            data["status"] = "approved"
            s3_client.put_object(
                Bucket=AWS_S3_BUCKET_NAME,
                Key=f"quizzes/{safe_name}",
                Body=json.dumps(data, indent=2).encode("utf-8"),
                ContentType="application/json"
            )
        except Exception:
            raise HTTPException(status_code=404, detail="Quiz file not found in S3")
    else:
        target = QUIZZES_DIR / safe_name
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
        safe_name = Path(filename).name
        if AWS_S3_BUCKET_NAME:
            try:
                s3_client.delete_object(Bucket=AWS_S3_BUCKET_NAME, Key=f"quizzes/{safe_name}")
            except Exception:
                pass
        else:
            target = QUIZZES_DIR / safe_name
            if target.exists():
                target.unlink()
    return {"success": True}


# --- Hint Master ---

@app.post("/hint")
async def hint(req: HintRequest):
    safe_question = sanitize(req.question_text, 500)
    safe_options  = [sanitize(opt, 120) for opt in req.options[:4]]

    agent  = build_hint_master_agent()
    import json as _json
    prompt = (
        f"A player is stuck. Call analyze_question with "
        f"question_text='{safe_question}' and "
        f"options='{_json.dumps(safe_options)}'. "
        f"Then deliver your single cryptic hint."
    )
    result = agent(prompt)
    return {"hint": str(result)}


@app.get("/health")
async def health():
    return {"status": "ok", "agents": ["commentator", "tutor", "syllabus", "hint_master"]}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
