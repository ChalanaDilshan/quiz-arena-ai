import { getQuizHistory } from './quizHistory';

/**
 * ARCHITECTURAL NOTE — Client-Side Local Storage Model:
 *
 * XP tier calculations derive from localStorage quiz history (`qa_history_${uid}`).
 * Designed for instantaneous, zero-latency client presentation. In competitive environments,
 * tier thresholds can be backed and verified by server-side game records.
 */

// ─── XP Tier Definitions ─────────────────────────────────────────────────────

export interface XpLevel {
  /** Internal numeric rank (0 = lowest) */
  rank: number;
  /** Display label */
  title: string;
  /** Emoji icon for quick visual identity */
  icon: string;
  /** Minimum games hosted to reach this tier */
  minGames: number;
  /** Tailwind-compatible gradient stops used for the badge */
  gradient: [string, string];
  /** Hex border accent colour */
  accent: string;
  /** Short flavour description shown on hover */
  description: string;
}

export const XP_LEVELS: XpLevel[] = [
  {
    rank: 0,
    title: 'Rookie',
    icon: '🌱',
    minGames: 0,
    gradient: ['#6B7280', '#9CA3AF'],
    accent: '#6B7280',
    description: 'Just getting started',
  },
  {
    rank: 1,
    title: 'Apprentice',
    icon: '📚',
    minGames: 3,
    gradient: ['#3B82F6', '#60A5FA'],
    accent: '#3B82F6',
    description: '3+ quizzes hosted',
  },
  {
    rank: 2,
    title: 'Scholar',
    icon: '🎓',
    minGames: 8,
    gradient: ['#8B5CF6', '#A78BFA'],
    accent: '#8B5CF6',
    description: '8+ quizzes hosted',
  },
  {
    rank: 3,
    title: 'Expert',
    icon: '⚡',
    minGames: 15,
    gradient: ['#F59E0B', '#FCD34D'],
    accent: '#F59E0B',
    description: '15+ quizzes hosted',
  },
  {
    rank: 4,
    title: 'Master',
    icon: '🔥',
    minGames: 30,
    gradient: ['#EF4444', '#F97316'],
    accent: '#EF4444',
    description: '30+ quizzes hosted',
  },
  {
    rank: 5,
    title: 'Champion',
    icon: '🏆',
    minGames: 50,
    gradient: ['#EC4899', '#F43F5E'],
    accent: '#EC4899',
    description: '50+ quizzes hosted',
  },
  {
    rank: 6,
    title: 'Legend',
    icon: '👑',
    minGames: 100,
    gradient: ['#F59E0B', '#EC4899'],
    accent: '#F59E0B',
    description: '100+ quizzes hosted',
  },
];

// ─── Derived XP Stats ─────────────────────────────────────────────────────────

export interface XpStats {
  level: XpLevel;
  totalGames: number;
  /** Games until next tier, or null if at max */
  gamesUntilNext: number | null;
  /** Progress 0–1 within the current tier window */
  progress: number;
}

/** Derive XP stats for a logged-in user from localStorage quiz history */
export function getUserXpStats(uid: string): XpStats {
  const history = getQuizHistory(uid);
  const totalGames = history.length;

  // Find the highest tier the user qualifies for
  const level = [...XP_LEVELS]
    .reverse()
    .find((l) => totalGames >= l.minGames) ?? XP_LEVELS[0];

  const nextLevel = XP_LEVELS.find((l) => l.rank === level.rank + 1) ?? null;
  const gamesUntilNext = nextLevel ? nextLevel.minGames - totalGames : null;

  // Progress within current tier window (0–1)
  const progress = nextLevel
    ? Math.min(1, (totalGames - level.minGames) / (nextLevel.minGames - level.minGames))
    : 1;

  return { level, totalGames, gamesUntilNext, progress };
}
