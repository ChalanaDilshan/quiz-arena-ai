import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateCommentary, generateSyllabusQuiz, generateTutorResponse } from './agent.js';

dotenv.config();

const app = express();

// 1. Strict CORS (Localhost for now, update for production!)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// 2. Rate Limiting (20 requests per 1 minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' }
});

// 3. API Key Middleware
const requireAgentAuth = (req, res, next) => {
  const key = req.headers['x-agent-api-key'];
  if (!key || key !== process.env.AGENT_API_KEY) {
     return res.status(403).json({ error: 'Unauthorized agent access' });
  }
  next();
};

// Fake database for the Hackathon Demo
let pendingQuiz = null;

// API route for generating commentary
app.post('/api/commentary', apiLimiter, async (req, res) => {
  const { eventType, data } = req.body;
  
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
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
app.post('/api/tutor/explain', requireAgentAuth, apiLimiter, async (req, res) => {
  const { questionText, playerAnswer, correctAnswer, history } = req.body;

  if (!questionText || !correctAnswer) {
    return res.status(400).json({ error: 'questionText and correctAnswer are required' });
  }

  try {
    const explanation = await generateTutorResponse(questionText, playerAnswer, correctAnswer, history);
    res.json({ explanation });
  } catch (error) {
    console.error('[Tutor] Error:', error);
    res.status(500).json({ error: 'Tutor agent failed to respond.' });
  }
});

app.listen(PORT, () => {
  console.log(`AI Commentator Server running on http://localhost:${PORT}`);
});
