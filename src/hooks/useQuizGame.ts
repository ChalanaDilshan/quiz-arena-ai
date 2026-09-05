import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, Question, Player, QuizSession } from '../types';

// ─── Constants ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#e879f9',
];

/** Five hardcoded questions for standalone mock testing */
const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Which planet is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
    timeLimit: 20,
    explanation: 'Mars appears reddish because of widespread iron oxide (rust) on its surface.',
  },
  {
    id: 'q2',
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    correctIndex: 2,
    timeLimit: 20,
    explanation: 'The Pacific Ocean covers over 63 million square miles, exceeding all Earth land combined.',
  },
  {
    id: 'q3',
    text: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
    correctIndex: 2,
    timeLimit: 20,
    explanation: 'Leonardo da Vinci began painting the Mona Lisa in Florence in the early 16th century.',
  },
  {
    id: 'q4',
    text: 'What is the chemical symbol for gold?',
    options: ['Ag', 'Fe', 'Au', 'Cu'],
    correctIndex: 2,
    timeLimit: 20,
    explanation: 'Au comes from "Aurum", the Latin word for gold meaning "shining dawn".',
  },
  {
    id: 'q5',
    text: 'Which programming language was created by Brendan Eich in 1995?',
    options: ['Python', 'Java', 'C++', 'JavaScript'],
    correctIndex: 3,
    timeLimit: 20,
    explanation: 'Brendan Eich developed Mocha (later renamed JavaScript) in just 10 days at Netscape.',
  },
];

const MOCK_NAMES = ['StarGazer', 'PixelNinja', 'CodeWizard', 'ByteHunter', 'QuantumFox'];

// ─── Utilities ──────────────────────────────────────────────────────────────

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ─── Host Session Persistence ───────────────────────────────────────────────

const HOST_SESSION_KEY = 'quizarena_host_session';

interface StoredHostSession {
  pin: string;
  hostToken: string;
  hostId: string;
  isMock?: boolean;
  mockSession?: QuizSession;
}

// ─── Return type ────────────────────────────────────────────────────────────

export interface UseQuizGameReturn {
  isMockMode: boolean;
  gameState: GameState;
  session: QuizSession | null;
  currentQuestion: Question | null;
  players: Player[];
  timeRemaining: number;
  selectedAnswer: number | null;
  isHost: boolean;
  isAnswerRevealed: boolean;
  uploadProgress: number;
  playerId: string;
  error: string | null;

  // Hint Master
  hint: string | null;
  hintLoading: boolean;
  hintUsed: boolean;

  // Actions
  joinGame: (pin: string, nickname: string) => void;
  hostGame: (file: File, numQuestions: number, difficulty: string) => void;
  hostSavedQuiz: (quiz: { topic: string; questions: Question[] }) => void;
  startGame: () => void;
  submitAnswer: (answerIndex: number) => void;
  nextQuestion: () => void;
  resetGame: () => void;
  requestHint: () => void;
  kickPlayer: (playerId: string) => void;
  editNickname: (newNickname: string) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useQuizGame(useMockMode = true): UseQuizGameReturn {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playerId] = useState(() => generateId());
  const [error, setError] = useState<string | null>(null);

  // Hint Master state
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const hostTokenRef = useRef<string | null>(null);

  const saveHostSession = useCallback((data: StoredHostSession) => {
    try {
      sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota / private browsing errors
    }
  }, []);

  const clearHostSession = useCallback(() => {
    try {
      sessionStorage.removeItem(HOST_SESSION_KEY);
    } catch {}
    hostTokenRef.current = null;
  }, []);

  // Derived state
  const currentQuestion = session
    ? session.questions[session.currentQuestionIndex] ?? null
    : null;
  const players = session?.players ?? [];

  // ── Timer helpers ──────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((duration: number) => {
    clearTimer();
    setTimeRemaining(duration);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          setIsAnswerRevealed(true);       // Auto-reveal when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  // ── Score calculation ──────────────────────────────────────────────────
  // Base 1000 pts + time bonus (remaining seconds × 50) + streak multiplier

  const calculateScore = useCallback(
    (correct: boolean, timeLeft: number, currentStreak: number): number => {
      if (!correct) return 0;
      const base = 1000;
      const timeBonus = timeLeft * 50;
      const streakMult = Math.min(1 + currentStreak * 0.1, 2.0); // Cap at 2×
      return Math.round((base + timeBonus) * streakMult);
    },
    [],
  );

  // ── Mock helpers ───────────────────────────────────────────────────────

  /** Create simulated opponent players */
  const buildMockPlayers = useCallback((): Player[] => {
    return MOCK_NAMES.map((name, i) => ({
      id: `mock-${i}`,
      nickname: name,
      score: 0,
      streak: 0,
      avatarColor: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
      isHost: false,
      correctCount: 0,
      answersGiven: 0,
    }));
  }, []);

  /** Simulate mock opponents answering the current question */
  const simulateMockAnswers = useCallback(
    (sess: QuizSession): Player[] => {
      return sess.players.map(p => {
        if (p.id === playerId) return p; // Don't overwrite real player
        const correct = Math.random() > 0.4;         // 60 % accuracy
        const timeLeft = Math.floor(Math.random() * 15) + 1;
        const delta = calculateScore(correct, timeLeft, p.streak);
        return {
          ...p,
          score: p.score + delta,
          streak: correct ? p.streak + 1 : 0,
          lastAnswerCorrect: correct,
          lastScoreDelta: delta,
          correctCount: (p.correctCount ?? 0) + (correct ? 1 : 0),
          answersGiven: (p.answersGiven ?? 0) + 1,
          wrongStreak: correct ? 0 : (p.wrongStreak ?? 0) + 1,
        };
      });
    },
    [playerId, calculateScore],
  );

  const resetGame = useCallback(() => {
    clearTimer();
    clearHostSession();
    setGameState('HOME');
    setSession(null);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setIsHost(false);
    setUploadProgress(0);
    setError(null);
    setHint(null);
    setHintUsed(false);
    setHintLoading(false);
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [clearTimer, clearHostSession]);

  // ── WebSocket message handler (live mode) ──────────────────────────────

  const setupSocketListeners = useCallback((socket: Socket, pin: string) => {
    socket.on('gameStateUpdate', (state) => {
      setGameState(state.state);
      setSession(prev => {
        let questions = prev?.questions ? [...prev.questions] : [];
        if (state.questions && state.state === 'GAME_OVER') {
          questions = state.questions;
        } else if (state.currentQuestion) {
          questions[state.currentQuestionIndex] = {
            ...(questions[state.currentQuestionIndex] || {}),
            ...state.currentQuestion,
          };
        }
        return {
          roomPin: pin,
          hostId: prev?.hostId || '',
          currentQuestionIndex: state.currentQuestionIndex,
          players: state.players,
          questions,
          gameState: state.state
        };
      });
      setTimeRemaining(state.timeRemaining);
      
      if (state.state === 'QUESTION') {
        setIsAnswerRevealed(false);
      }
      if (state.state === 'LEADERBOARD' || state.state === 'GAME_OVER') {
        setIsAnswerRevealed(true);
      }
    });

    socket.on('hostCreated', ({ pin: createdPin, hostToken, hostId: createdHostId }) => {
      hostTokenRef.current = hostToken;
      saveHostSession({ pin: createdPin, hostToken, hostId: createdHostId });
      setIsHost(true);
    });

    socket.on('hostReconnected', (data) => {
      setIsHost(true);
      setGameState(data.state);
      setTimeRemaining(data.timeRemaining);
      setSession({
        roomPin: data.pin,
        hostId: playerId,
        currentQuestionIndex: data.currentQuestionIndex,
        players: data.players,
        questions: data.questions || [],
        gameState: data.state
      });
      if (data.state === 'QUESTION') {
        setIsAnswerRevealed(false);
      } else if (data.state === 'LEADERBOARD' || data.state === 'GAME_OVER') {
        setIsAnswerRevealed(true);
      }
    });

    socket.on('error', (msg) => setError(msg));
    
    socket.on('kicked', () => {
      setError('You have been kicked by the host.');
      resetGame();
    });
  }, [resetGame, saveHostSession, playerId]);

  // ── Actions ────────────────────────────────────────────────────────────

  const kickPlayer = useCallback((targetPlayerId: string) => {
    if (!session || !isHost) return;
    if (useMockMode) {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== targetPlayerId)
        };
      });
    } else {
      socketRef.current?.emit('kickPlayer', {
        pin: session.roomPin,
        targetPlayerId,
        hostToken: hostTokenRef.current
      });
    }
  }, [session, isHost, useMockMode]);

  const editNickname = useCallback((newNickname: string) => {
    if (!session) return;
    if (useMockMode) {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p => 
            p.id === playerId ? { ...p, nickname: newNickname } : p
          )
        };
      });
    } else {
      socketRef.current?.emit('editNickname', { pin: session.roomPin, newNickname });
    }
  }, [session, useMockMode, playerId]);

  const joinGame = useCallback(
    (pin: string, nickname: string) => {
      setError(null);

      if (useMockMode) {
        const me: Player = {
          id: playerId,
          nickname,
          score: 0,
          streak: 0,
          avatarColor: AVATAR_COLORS[0],
          isHost: false,
        };
        const newSession: QuizSession = {
          roomPin: pin,
          questions: MOCK_QUESTIONS,
          players: [me, ...buildMockPlayers()],
          currentQuestionIndex: 0,
          gameState: 'LOBBY',
          hostId: 'mock-host',
        };
        setSession(newSession);
        setIsHost(false);
        setGameState('LOBBY');
        return;
      }

      // ── Live WebSocket join ──
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const socket = io(url);
        socketRef.current = socket;
        
        socket.on('connect', () => {
          socket.emit('joinGame', { pin, nickname, playerId });
        });
        
        setupSocketListeners(socket, pin);
      } catch {
        setError('Could not connect to game server.');
      }
    },
    [useMockMode, playerId, buildMockPlayers, setupSocketListeners],
  );

  const hostGame = useCallback(
    (_file: File, numQuestions: number, difficulty: string) => {
      setError(null);

      if (useMockMode) {
        // Simulate AI processing of the PDF
        let progress = 0;
        setUploadProgress(0);
        // Slice mock questions to requested count (cycle if needed)
        const pool: typeof MOCK_QUESTIONS = [];
        while (pool.length < numQuestions) {
          pool.push(...MOCK_QUESTIONS.slice(0, numQuestions - pool.length));
        }
        const questions = pool.slice(0, numQuestions);
        console.info(`[Mock] Generating ${numQuestions} ${difficulty} questions from PDF`);

        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            const pin = generatePin();
            const host: Player = {
              id: playerId,
              nickname: 'Host',
              score: 0,
              streak: 0,
              avatarColor: AVATAR_COLORS[0],
              isHost: true,
            };
            const newSession: QuizSession = {
              roomPin: pin,
              questions,
              players: [host, ...buildMockPlayers()],
              currentQuestionIndex: 0,
              gameState: 'LOBBY',
              hostId: playerId,
            };
            saveHostSession({
              pin,
              hostToken: 'mock-token',
              hostId: playerId,
              isMock: true,
              mockSession: newSession,
            });
            setSession(newSession);
            setIsHost(true);
            setGameState('LOBBY');
          }
          setUploadProgress(Math.min(progress, 100));
        }, 200);
        return;
      }

      // Live mode: POST file + config to backend
      console.info(`[Live] Requesting ${numQuestions} ${difficulty} questions`);
    },
    [useMockMode, playerId, buildMockPlayers, saveHostSession],
  );

  const hostSavedQuiz = useCallback(
    (quiz: { topic: string; questions: Question[] }) => {
      setError(null);
      const pin = generatePin();
      
      if (useMockMode) {
        const host: Player = {
          id: playerId,
          nickname: 'Host',
          score: 0,
          streak: 0,
          avatarColor: AVATAR_COLORS[0],
          isHost: true,
        };
        const newSession: QuizSession = {
          roomPin: pin,
          questions: quiz.questions,
          players: [host, ...buildMockPlayers()],
          currentQuestionIndex: 0,
          gameState: 'LOBBY',
          hostId: playerId,
        };
        saveHostSession({
          pin,
          hostToken: 'mock-token',
          hostId: playerId,
          isMock: true,
          mockSession: newSession,
        });
        setSession(newSession);
        setIsHost(true);
        setGameState('LOBBY');
        return;
      }

      // Live mode
      try {
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const socket = io(url);
        socketRef.current = socket;
        
        setupSocketListeners(socket, pin);

        socket.on('connect', () => {
          socket.emit('hostGame', { pin, quizData: quiz, hostId: playerId });
        });
        
        setIsHost(true);
      } catch {
        setError('Could not connect to game server.');
      }
    },
    [playerId, buildMockPlayers, useMockMode, setupSocketListeners, saveHostSession],
  );

  const startGame = useCallback(() => {
    if (!session) return;
    
    if (useMockMode) {
      setSession(prev => (prev ? { ...prev, gameState: 'QUESTION', currentQuestionIndex: 0 } : null));
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameState('QUESTION');
      startTimer(session.questions[0]?.timeLimit ?? 20);
    } else {
      socketRef.current?.emit('startGame', {
        pin: session.roomPin,
        hostToken: hostTokenRef.current
      });
    }
  }, [session, startTimer, useMockMode]);

  const submitAnswer = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null || isAnswerRevealed) return;
      setSelectedAnswer(answerIndex);

      if (useMockMode) {
        if (!currentQuestion) return;
        const correct = answerIndex === currentQuestion.correctIndex;
        // Update the real player's score
        setSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id !== playerId) return p;
              const delta = calculateScore(correct, timeRemaining, p.streak);
              return {
                ...p,
                score: p.score + delta,
                streak: correct ? p.streak + 1 : 0,
                lastAnswerCorrect: correct,
                lastScoreDelta: delta,
                correctCount: (p.correctCount ?? 0) + (correct ? 1 : 0),
                answersGiven: (p.answersGiven ?? 0) + 1,
                wrongStreak: correct ? 0 : (p.wrongStreak ?? 0) + 1,
              };
            }),
          };
        });

        // Brief pause then reveal the correct answer
        setTimeout(() => {
          setIsAnswerRevealed(true);
          clearTimer();
        }, 500);
      } else {
        socketRef.current?.emit('submitAnswer', { pin: session?.roomPin, playerId, answerIndex });
      }
    },
    [selectedAnswer, currentQuestion, isAnswerRevealed, timeRemaining, playerId, calculateScore, clearTimer, useMockMode, session],
  );

  const nextQuestion = useCallback(() => {
    if (!session || gameState !== 'LEADERBOARD') return;

    if (useMockMode) {
      const nextIdx = session.currentQuestionIndex + 1;
      if (nextIdx >= session.questions.length) {
        setGameState('GAME_OVER');
      } else {
        setSession(prev => (prev ? { ...prev, currentQuestionIndex: nextIdx } : null));
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);
        setGameState('QUESTION');
        startTimer(session.questions[nextIdx]?.timeLimit ?? 20);
      }
    } else {
      socketRef.current?.emit('nextQuestion', {
        pin: session.roomPin,
        hostToken: hostTokenRef.current
      });
      setSelectedAnswer(null); // Reset selection
    }
  }, [session, gameState, startTimer, useMockMode]);


  // ── Hint Master ────────────────────────────────────────────────────────

  const requestHint = useCallback(async () => {
    if (!currentQuestion || hintUsed || hintLoading || selectedAnswer !== null || isAnswerRevealed) return;

    setHintUsed(true);
    setHintLoading(true);
    setHint(null);

    const roomPin = session?.roomPin ?? 'MOCK_TEST_ROOM';
    const questionIndex = session?.currentQuestionIndex ?? 0;
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${url}/api/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomPin,
          playerId,
          questionIndex,
          questionText: currentQuestion.text,
          options: currentQuestion.options,
        }),
      });
      const data = await res.json();
      setHint(data.hint ?? 'The Hint Master is speechless… trust your instincts!');
    } catch {
      setHint('Hint unavailable right now. Trust your gut!');
    } finally {
      setHintLoading(false);
    }
  }, [currentQuestion, hintUsed, hintLoading, selectedAnswer, isAnswerRevealed, session, playerId]);

  // ── Effects ────────────────────────────────────────────────────────────

  // Auto-advance: after answer reveal, wait 2 s then transition to leaderboard
  useEffect(() => {
    if (gameState !== 'QUESTION' || !isAnswerRevealed) return;

    const timeout = setTimeout(() => {
      // Simulate mock opponents' answers before showing leaderboard
      if (useMockMode) {
        setSession(prev => (prev ? { ...prev, players: simulateMockAnswers(prev) } : null));
      }
      setGameState('LEADERBOARD');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [gameState, isAnswerRevealed, useMockMode, simulateMockAnswers]);

  // Reset hint state and answer selection when the question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHint(null);
    setHintUsed(false);
    setHintLoading(false);
  }, [session?.currentQuestionIndex]);

  // ── Auto Reconnect Host on Refresh ─────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HOST_SESSION_KEY);
      if (!raw) return;
      const stored: StoredHostSession = JSON.parse(raw);
      if (!stored?.pin) return;

      if (stored.isMock && stored.mockSession) {
        setSession(stored.mockSession);
        setGameState(stored.mockSession.gameState);
        setIsHost(true);
        return;
      }

      if (stored.hostToken) {
        hostTokenRef.current = stored.hostToken;
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const socket = io(url);
        socketRef.current = socket;

        setupSocketListeners(socket, stored.pin);

        socket.on('connect', () => {
          socket.emit('reconnectHost', {
            pin: stored.pin,
            hostToken: stored.hostToken,
            hostId: stored.hostId || playerId
          });
        });

        socket.on('error', (err) => {
          if (typeof err === 'string' && (err.includes('not found') || err.includes('expired') || err.includes('Unauthorized'))) {
            clearHostSession();
          }
        });
      }
    } catch (e) {
      console.warn('Failed to restore host session from sessionStorage:', e);
    }
  }, [playerId, setupSocketListeners, clearHostSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      socketRef.current?.disconnect();
    };
  }, [clearTimer]);

  // ── Public interface ───────────────────────────────────────────────────

  return {
    isMockMode: useMockMode,
    gameState,
    session,
    currentQuestion,
    players,
    timeRemaining,
    selectedAnswer,
    isHost,
    isAnswerRevealed,
    uploadProgress,
    playerId,
    error,
    hint,
    hintLoading,
    hintUsed,
    joinGame,
    hostGame,
    hostSavedQuiz,
    startGame,
    submitAnswer,
    nextQuestion,
    resetGame,
    requestHint,
    kickPlayer,
    editNickname,
  };
}
