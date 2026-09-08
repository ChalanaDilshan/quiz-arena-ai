import type { QuizRecord } from './quizHistory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginData {
  streak: number;
  longestStreak: number;
  totalLogins: number;
  lastLogin: string; // YYYY-MM-DD
  loginDates: string[]; // List of YYYY-MM-DD
}

export type BadgeType =
  | 'daily_presence'
  | 'quiz_master'
  | 'precision_host'
  | 'week_warrior'
  | 'first_flight'
  | 'grandmaster'
  | 'streak_3'
  | 'packed_arena';

export interface UserBadge {
  id: string;
  title: string;
  badgeType: BadgeType;
  description: string;
  requirement: string;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number; // 0–100
  progressText: string;
  gradient: [string, string];
  accent: string;
  category: 'streak' | 'host' | 'mastery';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const loginStorageKey = (uid: string) => `qa_login_${uid}`;

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

// ─── Read Login Data ──────────────────────────────────────────────────────────

export function getUserLoginStreak(uid: string): LoginData {
  const defaultData: LoginData = {
    streak: 0,
    longestStreak: 0,
    totalLogins: 0,
    lastLogin: '',
    loginDates: [],
  };

  try {
    const raw = localStorage.getItem(loginStorageKey(uid));
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<LoginData>;
    return {
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      longestStreak: typeof parsed.longestStreak === 'number' ? parsed.longestStreak : 0,
      totalLogins: typeof parsed.totalLogins === 'number' ? parsed.totalLogins : 0,
      lastLogin: parsed.lastLogin || '',
      loginDates: Array.isArray(parsed.loginDates) ? parsed.loginDates : [],
    };
  } catch {
    return defaultData;
  }
}

// ─── Track Daily Login ────────────────────────────────────────────────────────

export function trackDailyLogin(uid: string): LoginData {
  if (!uid) return getUserLoginStreak(uid);

  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();
  const current = getUserLoginStreak(uid);

  if (current.lastLogin === todayStr) {
    return current;
  }

  let newStreak = 1;
  if (current.lastLogin === yesterdayStr) {
    newStreak = current.streak + 1;
  } else if (!current.lastLogin) {
    newStreak = 1;
  } else {
    newStreak = 1;
  }

  const updatedLoginDates = current.loginDates.includes(todayStr)
    ? current.loginDates
    : [...current.loginDates, todayStr];

  const updated: LoginData = {
    streak: newStreak,
    longestStreak: Math.max(current.longestStreak, newStreak),
    totalLogins: current.totalLogins + 1,
    lastLogin: todayStr,
    loginDates: updatedLoginDates,
  };

  try {
    localStorage.setItem(loginStorageKey(uid), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save daily login streak:', err);
  }

  return updated;
}

// ─── Compute Badges ───────────────────────────────────────────────────────────

export function getUserBadges(
  loginData: LoginData,
  records: QuizRecord[],
): UserBadge[] {
  const totalGames = records.length;
  const bestAcc = records.length > 0 ? Math.max(...records.map((r) => r.accuracy)) : 0;
  const maxPlayersInGame = records.length > 0 ? Math.max(...records.map((r) => r.totalPlayers)) : 0;
  const currentOrLongestStreak = Math.max(loginData.streak, loginData.longestStreak);

  return [
    {
      id: 'daily_presence',
      title: 'Daily Presence',
      badgeType: 'daily_presence',
      description: 'Logged in to Quiz Arena today',
      requirement: 'Sign in to your account',
      unlocked: loginData.totalLogins >= 1,
      currentValue: Math.min(loginData.totalLogins, 1),
      targetValue: 1,
      progressPercent: loginData.totalLogins >= 1 ? 100 : 0,
      progressText: loginData.totalLogins >= 1 ? '100% Progress' : '0% Progress',
      gradient: ['#F59E0B', '#D97706'],
      accent: '#F59E0B',
      category: 'streak',
    },
    {
      id: 'quiz_master',
      title: totalGames >= 10 ? 'Quiz Master' : `${totalGames} Quizzes Hosted`,
      badgeType: 'quiz_master',
      description: 'Hosted 10 quiz sessions',
      requirement: 'Host 10 quiz sessions',
      unlocked: totalGames >= 10,
      currentValue: Math.min(totalGames, 10),
      targetValue: 10,
      progressPercent: Math.round(Math.min((totalGames / 10) * 100, 100)),
      progressText: totalGames >= 10 ? 'Earned' : `${Math.round(Math.min((totalGames / 10) * 100, 100))}% Progress`,
      gradient: ['#F97316', '#EA580C'],
      accent: '#F97316',
      category: 'host',
    },
    {
      id: 'precision_host',
      title: 'Precision Host',
      badgeType: 'precision_host',
      description: 'Room accuracy reached 90%+',
      requirement: 'Any quiz session with 90%+ accuracy',
      unlocked: bestAcc >= 90,
      currentValue: bestAcc,
      targetValue: 90,
      progressPercent: Math.round(Math.min((bestAcc / 90) * 100, 100)),
      progressText: bestAcc >= 90 ? 'Earned' : `${Math.round((bestAcc / 90) * 100)}% Progress`,
      gradient: ['#06B6D4', '#0284C7'],
      accent: '#06B6D4',
      category: 'mastery',
    },
    {
      id: 'week_warrior',
      title: 'Week Warrior',
      badgeType: 'week_warrior',
      description: 'Active 7 consecutive days',
      requirement: '7-day consecutive login streak',
      unlocked: currentOrLongestStreak >= 7,
      currentValue: Math.min(currentOrLongestStreak, 7),
      targetValue: 7,
      progressPercent: Math.round(Math.min((currentOrLongestStreak / 7) * 100, 100)),
      progressText: currentOrLongestStreak >= 7 ? 'Earned' : `${Math.round((currentOrLongestStreak / 7) * 100)}% Progress`,
      gradient: ['#94A3B8', '#64748B'],
      accent: '#94A3B8',
      category: 'streak',
    },
    {
      id: 'first_flight',
      title: 'First Flight',
      badgeType: 'first_flight',
      description: 'Hosted your first quiz match',
      requirement: 'Host 1 quiz session',
      unlocked: totalGames >= 1,
      currentValue: Math.min(totalGames, 1),
      targetValue: 1,
      progressPercent: totalGames >= 1 ? 100 : 0,
      progressText: totalGames >= 1 ? 'Earned' : '0% Progress',
      gradient: ['#10B981', '#059669'],
      accent: '#10B981',
      category: 'host',
    },
    {
      id: 'grandmaster',
      title: 'Grandmaster',
      badgeType: 'grandmaster',
      description: 'Hosted 50 quiz sessions',
      requirement: 'Host 50 quiz sessions',
      unlocked: totalGames >= 50,
      currentValue: Math.min(totalGames, 50),
      targetValue: 50,
      progressPercent: Math.round(Math.min((totalGames / 50) * 100, 100)),
      progressText: totalGames >= 50 ? 'Earned' : `${totalGames} of 50 quizzes`,
      gradient: ['#EAB308', '#CA8A04'],
      accent: '#EAB308',
      category: 'host',
    },
    {
      id: 'streak_3',
      title: '3-Day Streak',
      badgeType: 'streak_3',
      description: 'Active 3 consecutive days',
      requirement: '3-day consecutive login streak',
      unlocked: currentOrLongestStreak >= 3,
      currentValue: Math.min(currentOrLongestStreak, 3),
      targetValue: 3,
      progressPercent: Math.round(Math.min((currentOrLongestStreak / 3) * 100, 100)),
      progressText: currentOrLongestStreak >= 3 ? 'Earned' : `${Math.round((currentOrLongestStreak / 3) * 100)}% Progress`,
      gradient: ['#EF4444', '#DC2626'],
      accent: '#EF4444',
      category: 'streak',
    },
    {
      id: 'packed_arena',
      title: 'Packed Arena',
      badgeType: 'packed_arena',
      description: 'Hosted room with 5+ players',
      requirement: '5+ players in a single match',
      unlocked: maxPlayersInGame >= 5,
      currentValue: Math.min(maxPlayersInGame, 5),
      targetValue: 5,
      progressPercent: Math.round(Math.min((maxPlayersInGame / 5) * 100, 100)),
      progressText: maxPlayersInGame >= 5 ? 'Earned' : `${maxPlayersInGame} of 5 players`,
      gradient: ['#6366F1', '#4F46E5'],
      accent: '#6366F1',
      category: 'mastery',
    },
  ];
}
