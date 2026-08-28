import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateCommentary, generateSyllabusQuiz } from './agent.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fake database for the Hackathon Demo
let pendingQuiz = null;

// API route for generating commentary
app.post('/api/commentary', async (req, res) => {
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
app.post('/api/agent/trigger', async (req, res) => {
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
app.get('/api/agent/pending', (req, res) => {
  res.json({ pendingQuiz });
});

// 3. Admin approves/dismisses the decision
app.post('/api/agent/clear', (req, res) => {
  pendingQuiz = null;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`AI Commentator Server running on http://localhost:${PORT}`);
});
