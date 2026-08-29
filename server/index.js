import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

import { adminAuth } from './firebaseAdmin.js';

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app  = express();
const PORT = process.env.PORT || 3001;

// Internal URL of the Strands Python microservice (never exposed publicly)
const STRANDS_URL = process.env.STRANDS_URL || 'http://127.0.0.1:8001';

// 1. Security headers
app.use(helmet());

// 2. CORS — allow only the Vite dev server (update origin for production)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(o => o.trim());

app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }));

// 3. Payload size limit
app.use(express.json({ limit: '10kb' }));

// 4. Rate limiter
// trust proxy = 1 so reverse-proxy (Render/Vercel) passes real client IP
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// ---------------------------------------------------------------------------
// Auth middleware — verifies Firebase JWT for admin-only routes
// ---------------------------------------------------------------------------

const requireAgentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Firebase Auth Error:', err.message);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ---------------------------------------------------------------------------
// Helper — forward a request to the Strands Python service
// ---------------------------------------------------------------------------

async function callStrands(path, body = {}) {
  const res = await fetch(`${STRANDS_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown error');
    throw Object.assign(new Error(`Strands service error: ${err}`), { status: res.status });
  }
  return res.json();
}

async function getStrands(path) {
  const res = await fetch(`${STRANDS_URL}${path}`);
  if (!res.ok) throw new Error(`Strands GET error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// --- AI Commentator (public, rate-limited) ---
app.post('/api/commentary', apiLimiter, async (req, res) => {
  const { eventType, data } = req.body;

  if (!eventType || typeof eventType !== 'string' || eventType.length > 50) {
    return res.status(400).json({ error: 'Invalid or oversized eventType' });
  }
  if (data && JSON.stringify(data).length > 2000) {
    return res.status(400).json({ error: 'Data payload too large' });
  }

  try {
    const result = await callStrands('/commentary', {
      event_type:  eventType,
      player_name: data?.nickname ?? 'Unknown',
      context:     data ? JSON.stringify(data) : '',
    });
    res.json({ comment: result.comment });
  } catch (err) {
    console.error('[Commentary] Strands error:', err.message);
    res.status(500).json({ error: 'Failed to generate commentary' });
  }
});

// --- Autonomous Syllabus Agent (admin-only) ---

// Trigger the background agent to scan, reason, and generate a quiz
app.post('/api/agent/trigger', requireAgentAuth, apiLimiter, async (req, res) => {
  try {
    console.log('[SyllabusAgent] Autonomous task triggered...');
    const result = await callStrands('/syllabus/trigger', {});
    console.log('[SyllabusAgent] Task complete.');
    res.json({ success: true, message: 'Strands agent completed its autonomous task.', result });
  } catch (err) {
    console.error('[SyllabusAgent] Error:', err.message);
    res.status(500).json({ error: 'Agent task failed.' });
  }
});

// Dashboard polls for pending quiz decisions
app.get('/api/agent/pending', requireAgentAuth, async (req, res) => {
  try {
    const result = await getStrands('/syllabus/pending');
    res.json({ pendingQuiz: result.pending_quiz, filename: result.filename });
  } catch (err) {
    console.error('[SyllabusAgent] Pending poll error:', err.message);
    res.json({ pendingQuiz: null });
  }
});

// Admin approves the quiz (human-in-the-loop)
app.post('/api/agent/approve', requireAgentAuth, async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });
  try {
    await callStrands('/syllabus/approve', { filename });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
});

// Admin dismisses / clears the pending quiz
app.post('/api/agent/clear', requireAgentAuth, async (req, res) => {
  const { filename } = req.body ?? {};
  try {
    await callStrands('/syllabus/clear', { filename });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Clear failed' });
  }
});

// --- Post-game Tutor Agent (public, rate-limited, but authenticated via Firebase) ---
app.post('/api/tutor/explain', requireAgentAuth, apiLimiter, async (req, res) => {
  const { questionText, playerAnswer, correctAnswer, sessionId, followUp } = req.body;

  if (!questionText || typeof questionText !== 'string' || questionText.length > 500 || !correctAnswer) {
    return res.status(400).json({ error: 'Invalid or oversized question payload' });
  }

  try {
    const result = await callStrands('/tutor', {
      session_id:     sessionId ?? '',
      question_text:  questionText,
      player_answer:  playerAnswer ?? '',
      correct_answer: correctAnswer,
      follow_up:      followUp ?? '',
    });
    res.json({ explanation: result.explanation, sessionId: result.session_id });
  } catch (err) {
    console.error('[Tutor] Strands error:', err.message);
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    res.status(500).json({ error: 'Tutor agent failed to respond.' });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Quiz Arena API gateway running on http://localhost:${PORT}`);
  console.log(`Proxying agent requests to Strands service at ${STRANDS_URL}`);
});
