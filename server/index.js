import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { adminAuth } from './firebaseAdmin.js';

dotenv.config();

// ---------------------------------------------------------------------------
// App & Socket setup
// ---------------------------------------------------------------------------

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const STRANDS_URL = process.env.STRANDS_URL || 'http://127.0.0.1:8001';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(o => o.trim());

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  }
});

// 1. Security headers
app.use(helmet());
// 2. CORS
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }));
// 3. Payload size limit
app.use(express.json({ limit: '10kb' }));
// 4. Rate limiter
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// ---------------------------------------------------------------------------
// Room Registry & Socket Event Handlers
// ---------------------------------------------------------------------------

// pin -> { hostSocket, players: [{id, nickname, score, streak, ...}], questions, currentQuestionIndex, state }
const rooms = new Map();
// pin -> { questions } (for tutor fallback after game ends)
const recentRooms = new Map(); 

// Mock Questions for bypass testing
const MOCK_QUESTIONS = [
  { text: 'Which planet is known as the "Red Planet"?', correctAnswer: 'Mars' },
  { text: 'What is the largest ocean on Earth?', correctAnswer: 'Pacific Ocean' },
  { text: 'Who painted the Mona Lisa?', correctAnswer: 'Leonardo da Vinci' },
  { text: 'What is the chemical symbol for gold?', correctAnswer: 'Au' },
  { text: 'Which programming language was created by Brendan Eich in 1995?', correctAnswer: 'JavaScript' },
];

function broadcastState(pin) {
  const room = rooms.get(pin);
  if (!room) return;
  const safeState = {
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      streak: p.streak,
      wrongStreak: p.wrongStreak,
      isHost: p.isHost
    })),
    // Only send the current question to clients
    currentQuestion: room.state === 'QUESTION' ? room.questions[room.currentQuestionIndex] : null,
    totalQuestions: room.questions.length,
    timeRemaining: room.timeRemaining
  };
  io.to(pin).emit('gameStateUpdate', safeState);
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('hostGame', ({ quizData, pin }) => {
    rooms.set(pin, {
      hostSocket: socket.id,
      players: [{ id: socket.id, nickname: 'Host', isHost: true, score: 0, streak: 0, wrongStreak: 0 }],
      questions: quizData.questions,
      topic: quizData.topic,
      currentQuestionIndex: 0,
      state: 'LOBBY',
      timeRemaining: 20,
      timerInterval: null
    });
    socket.join(pin);
    broadcastState(pin);
  });

  socket.on('joinGame', ({ pin, nickname, playerId }) => {
    const room = rooms.get(pin);
    if (!room || room.state !== 'LOBBY') {
      socket.emit('error', 'Room not found or game already started');
      return;
    }
    const actualPlayerId = playerId || socket.id;
    if (!room.players.find(p => p.id === actualPlayerId)) {
      room.players.push({
        id: actualPlayerId,
        socketId: socket.id,
        nickname,
        isHost: false,
        score: 0,
        streak: 0,
        wrongStreak: 0,
        answeredCorrectly: false
      });
    }
    socket.join(pin);
    broadcastState(pin);
  });

  socket.on('startGame', ({ pin }) => {
    const room = rooms.get(pin);
    if (room && room.hostSocket === socket.id) {
      room.state = 'QUESTION';
      room.timeRemaining = room.questions[0]?.timeLimit || 20;
      room.players.forEach(p => p.answeredCorrectly = false);
      broadcastState(pin);
      
      // Simple timer
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = setInterval(() => {
        const r = rooms.get(pin);
        if (r && r.state === 'QUESTION') {
          r.timeRemaining -= 1;
          if (r.timeRemaining <= 0) {
            r.state = 'LEADERBOARD';
            broadcastState(pin);
          } else {
            broadcastState(pin);
          }
        }
      }, 1000);
    }
  });

  socket.on('submitAnswer', ({ pin, playerId, answerIndex }) => {
    const room = rooms.get(pin);
    if (room && room.state === 'QUESTION') {
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        const correctIndex = room.questions[room.currentQuestionIndex].correctIndex;
        if (answerIndex === correctIndex) {
          player.score += (room.timeRemaining * 10);
          player.streak += 1;
          player.wrongStreak = 0;
          player.answeredCorrectly = true;
        } else {
          player.streak = 0;
          player.wrongStreak += 1;
          player.answeredCorrectly = false;
        }
        broadcastState(pin);
      }
    }
  });

  socket.on('nextQuestion', ({ pin }) => {
    const room = rooms.get(pin);
    if (room && room.hostSocket === socket.id) {
      if (room.currentQuestionIndex < room.questions.length - 1) {
        room.currentQuestionIndex += 1;
        room.state = 'QUESTION';
        room.timeRemaining = room.questions[room.currentQuestionIndex].timeLimit || 20;
        room.players.forEach(p => p.answeredCorrectly = false);
        broadcastState(pin);
      } else {
        room.state = 'GAME_OVER';
        if (room.timerInterval) clearInterval(room.timerInterval);
        
        // Move to recentRooms for post-game Tutor
        recentRooms.set(pin, { questions: room.questions });
        setTimeout(() => recentRooms.delete(pin), 15 * 60 * 1000); // clear after 15m
        
        broadcastState(pin);
        rooms.delete(pin); // cleanup active room
      }
    }
  });

  socket.on('disconnect', () => {
    // Basic cleanup logic could go here, but for now we rely on explicit GAME_OVER
  });
});

// ---------------------------------------------------------------------------
// Middleware
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

const requireValidRoom = (req, res, next) => {
  const { roomPin, questionText, correctAnswer } = req.body;
  if (!roomPin) return res.status(400).json({ error: 'roomPin required' });

  // Handle Mock Mode bypass strictly
  if (roomPin === 'MOCK_TEST_ROOM') {
    if (questionText && correctAnswer) {
      const isValidMock = MOCK_QUESTIONS.some(
        q => q.text === questionText && q.correctAnswer === correctAnswer
      );
      if (!isValidMock) return res.status(403).json({ error: 'Invalid mock question payload' });
    }
    return next();
  }

  const room = rooms.get(roomPin) || recentRooms.get(roomPin);
  if (!room) {
    return res.status(403).json({ error: 'Invalid or expired room' });
  }

  // Only validate question context if it's provided (e.g., Tutor API)
  if (questionText && correctAnswer) {
    const validQuestion = room.questions.some(q => 
      q.text === questionText && q.options[q.correctIndex] === correctAnswer
    );

    if (!validQuestion) {
      return res.status(403).json({ error: 'Question not found in specified room' });
    }
  }

  next();
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

// --- AI Commentator ---
app.post('/api/commentary', apiLimiter, requireValidRoom, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to generate commentary' });
  }
});

// --- Autonomous Syllabus Agent (admin-only) ---
app.post('/api/agent/trigger', requireAgentAuth, apiLimiter, async (req, res) => {
  try {
    const result = await callStrands('/syllabus/trigger', {});
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: 'Agent task failed.' });
  }
});

app.get('/api/agent/pending', requireAgentAuth, async (req, res) => {
  try {
    const result = await getStrands('/syllabus/pending');
    res.json({ pendingQuiz: result.pending_quiz, filename: result.filename });
  } catch (err) {
    res.json({ pendingQuiz: null });
  }
});

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

app.post('/api/agent/clear', requireAgentAuth, async (req, res) => {
  const { filename } = req.body ?? {};
  try {
    await callStrands('/syllabus/clear', { filename });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Clear failed' });
  }
});

// --- Post-game Tutor Agent ---
app.post('/api/tutor/explain', apiLimiter, requireValidRoom, async (req, res) => {
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
    if (err.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
    res.status(500).json({ error: 'Tutor agent failed to respond.' });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`Quiz Arena API gateway running on http://localhost:${PORT}`);
  console.log(`Proxying agent requests to Strands service at ${STRANDS_URL}`);
});
