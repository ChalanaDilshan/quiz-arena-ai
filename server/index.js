import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateCommentary, generateSyllabusQuiz, generateTutorResponse } from './agent.js';

dotenv.config();

import helmet from 'helmet';

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Strict CORS (Localhost for now, update for production!)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST']
}));

// 3. Payload Size Limits
app.use(express.json({ limit: '10kb' }));

// 4. Rate Limiting (20 requests per 1 minute)
// Trust one level of proxy (e.g., Render, Vercel reverse proxies)
// Without this, all clients appear to have the same IP and share one rate-limit bucket
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

import { adminAuth } from './firebaseAdmin.js';

// 3. Firebase JWT Auth Middleware
const requireAgentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Fake database for the Hackathon Demo
let pendingQuiz = null;

// API route for generating commentary
app.post('/api/commentary', apiLimiter, async (req, res) => {
  const { eventType, data } = req.body;
  
  if (!eventType || typeof eventType !== 'string' || eventType.length > 50) {
    return res.status(400).json({ error: 'Invalid or oversized eventType' });
  }

  // Basic validation to prevent massive prompt injection strings
  if (data && JSON.stringify(data).length > 2000) {
    return res.status(400).json({ error: 'Data payload is too large' });
  }

  try {
    const comment = await generateCommentary(eventType, data);
    res.json({ comment });
  } catch (error) {
    console.error('[Agent] Error generating commentary:', error);
    res.status(500).json({ error: 'Failed to generate commentary' });
  }
});

// --- AUTONOMOUS AGENT ENDPOINTS ---

// 1. Simulate the Cron Job running in the background (e.g. Friday 5 PM)
app.post('/api/agent/trigger', requireAgentAuth, apiLimiter, async (req, res) => {
  try {
    console.log('[Agent] Background scan triggered...');
    pendingQuiz = await generateSyllabusQuiz();
    console.log('[Agent] Quiz generated successfully and waiting for human approval.');
    res.json({ success: true, message: 'Agent generated a quiz in the background.' });
  } catch (error) {
    console.error('[Agent] Task failed:', error);
    res.status(500).json({ error: 'Agent task failed.' });
  }
});

// 2. Dashboard polls this to see if the agent surfaced a decision
app.get('/api/agent/pending', requireAgentAuth, (req, res) => {
  res.json({ pendingQuiz });
});

// 3. Admin approves/dismisses the decision
app.post('/api/agent/clear', requireAgentAuth, (req, res) => {
  pendingQuiz = null;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;

// --- POST-GAME TUTOR ENDPOINT ---
// Accepts a question + wrong answer and returns a multi-turn AI explanation
app.post('/api/tutor/explain', apiLimiter, async (req, res) => {
  const { questionText, playerAnswer, correctAnswer, history } = req.body;

  if (!questionText || typeof questionText !== 'string' || questionText.length > 500 || !correctAnswer) {
    return res.status(400).json({ error: 'Invalid or oversized question payload' });
  }

  if (history && JSON.stringify(history).length > 5000) {
    return res.status(400).json({ error: 'Chat history is too large' });
  }

  try {
    const explanation = await generateTutorResponse(questionText, playerAnswer, correctAnswer, history);
    res.json({ explanation });
  } catch (error) {
    console.error('[Tutor] Error:', error);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    res.status(500).json({ error: 'Tutor agent failed to respond.' });
  }
});

app.listen(PORT, () => {
  console.log(`AI Commentator Server running on http://localhost:${PORT}`);
});
