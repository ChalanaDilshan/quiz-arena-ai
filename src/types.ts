// ─── Game State Machine ─────────────────────────────────────────────────────
export type GameState = 'HOME' | 'LOBBY' | 'QUESTION' | 'LEADERBOARD' | 'GAME_OVER';

// ─── Core Data Models ───────────────────────────────────────────────────────

/** A single multiple-choice question */
export interface Question {
  id: string;
  text: string;
  options: string[];       // Exactly 4 options
  correctIndex: number;    // 0-based index of the correct answer
  timeLimit: number;       // Seconds allowed to answer
  explanation?: string;    // Explanation for report and review
  attempts?: number;       // Total answers submitted for this question
  correctAnswersCount?: number; // Total correct answers submitted for this question
}

/** A player in the quiz session */
export interface Player {
  id: string;
  nickname: string;
  score: number;
  streak: number;          // Consecutive correct answers
  avatarColor: string;     // Hex color for avatar badge
  isHost: boolean;
  lastAnswerCorrect?: boolean;
  lastScoreDelta?: number; // Points earned on the most recent question
  correctCount?: number;   // Total correct answers for analytics report
  answersGiven?: number;   // Total questions answered
  wrongStreak?: number;    // Consecutive wrong answers
}

/** Full quiz session state */
export interface QuizSession {
  roomPin: string;
  questions: Question[];
  players: Player[];
  currentQuestionIndex: number;
  gameState: GameState;
  hostId: string;
}

// ─── WebSocket Communication ────────────────────────────────────────────────

export type WebSocketAction =
  | 'connect'
  | 'joinRoom'
  | 'playerJoined'
  | 'startGame'
  | 'newQuestion'
  | 'submitAnswer'
  | 'answerResult'
  | 'showLeaderboard'
  | 'nextQuestion'
  | 'gameOver'
  | 'error';

/** Message envelope sent/received over the WebSocket */
export interface WebSocketMessage {
  action: WebSocketAction;
  payload: Record<string, unknown>;
}
