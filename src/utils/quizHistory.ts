import type { Player, Question } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizRecord {
  id: string;
  date: string;           // ISO timestamp
  roomPin: string;
  fileName: string;       // PDF filename used to generate questions
  numQuestions: number;
  difficulty: string;
  players: Player[];      // full roster with final scores
  questions: Question[];  // for hardest-question analysis
  avgScore: number;
  accuracy: number;       // 0–100 integer
  totalPlayers: number;
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const storageKey = (uid: string) => `qa_history_${uid}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read all quiz records for a host UID, newest first */
export function getQuizHistory(uid: string): QuizRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizRecord[];
    return parsed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch {
    return [];
  }
}

/** Append (or overwrite same id) a quiz record */
export function saveQuizRecord(uid: string, record: QuizRecord): void {
  try {
    const existing = getQuizHistory(uid).filter((r) => r.id !== record.id);
    localStorage.setItem(
      storageKey(uid),
      JSON.stringify([record, ...existing]),
    );
  } catch (err) {
    console.error('Failed to save quiz record:', err);
  }
}

/** Remove a single quiz record by id */
export function deleteQuizRecord(uid: string, id: string): void {
  try {
    const updated = getQuizHistory(uid).filter((r) => r.id !== id);
    localStorage.setItem(storageKey(uid), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete quiz record:', err);
  }
}

/** Build a QuizRecord from the data available at GAME_OVER */
export function buildQuizRecord(params: {
  roomPin: string;
  fileName: string;
  difficulty: string;
  players: Player[];
  questions: Question[];
}): QuizRecord {
  const { roomPin, fileName, difficulty, players, questions } = params;
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const numQ = questions.length;

  const totalAnswersGiven = nonHostPlayers.reduce(
    (s, p) => s + (p.answersGiven ?? numQ),
    0,
  );
  const totalCorrect = nonHostPlayers.reduce(
    (s, p) => s + (p.correctCount ?? Math.round(p.score / 1200)),
    0,
  );
  const avgScore =
    nonHostPlayers.length > 0
      ? Math.round(
          nonHostPlayers.reduce((s, p) => s + p.score, 0) / nonHostPlayers.length,
        )
      : 0;
  const accuracy =
    totalAnswersGiven > 0
      ? Math.round((totalCorrect / totalAnswersGiven) * 100)
      : 0;

  return {
    id: `${roomPin}_${Date.now()}`,
    date: new Date().toISOString(),
    roomPin,
    fileName,
    numQuestions: numQ,
    difficulty,
    players,
    questions,
    avgScore,
    accuracy,
    totalPlayers: nonHostPlayers.length,
  };
}
