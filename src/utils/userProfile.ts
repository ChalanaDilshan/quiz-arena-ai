import type { QuizRecord } from './quizHistory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginData {
  streak: number;
  longestStreak: number;
  totalLogins: number;
  lastLogin: string; // YYYY-MM-DD
  loginDates: string[]; // List of YYYY-MM-DD
}

export type BadgeIconType =
  | 'Sun'
  | 'Flame'
  | 'Shield'
  | 'Compass'
  | 'Trophy'
  | 'Target'
  | 'Users'
  | 'Crown';

export interface UserBadge {
  id: string;
  title: string;
  iconName: BadgeIconType;
  description: string;
  requirement: string;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressRatio: number; // 0 to 1
  progressLabel: string;
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

  // If already logged in today, return current state
  if (current.lastLogin === todayStr) {
    return current;
  }

  let newStreak = 1;
  if (current.lastLogin === yesterdayStr) {
    // Logged in yesterday - continue streak!
    newStreak = current.streak + 1;
  } else if (!current.lastLogin) {
    // Brand new user first login
    newStreak = 1;
  } else {
    // Missed a day or more, streak resets to 1
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
      id: 'daily_logger',
      title: 'Daily Presence',
      iconName: 'Sun',
      description: 'Logged in to Quiz Arena today',
      requirement: 'Sign in to your account',
      unlocked: loginData.totalLogins >= 1,
      currentValue: Math.min(loginData.totalLogins, 1),
      targetValue: 1,
      progressRatio: loginData.totalLogins >= 1 ? 1 : 0,
      progressLabel: loginData.totalLogins >= 1 ? 'Earned' : '0 of 1 visit',
      gradient: ['#F59E0B', '#D97706'],
      accent: '#F59E0B',
      category: 'streak',
    },
    {
      id: 'streak_3',
      title: '3-Day Streak',
      iconName: 'Flame',
      description: 'Active 3 consecutive days',
      requirement: '3-day consecutive login streak',
      unlocked: currentOrLongestStreak >= 3,
      currentValue: Math.min(currentOrLongestStreak, 3),
      targetValue: 3,
      progressRatio: Math.min(currentOrLongestStreak / 3, 1),
      progressLabel: currentOrLongestStreak >= 3 ? 'Earned' : `${currentOrLongestStreak} of 3 days`,
      gradient: ['#EF4444', '#EA580C'],
      accent: '#EF4444',
      category: 'streak',
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      iconName: 'Shield',
      description: 'Active 7 consecutive days',
      requirement: '7-day consecutive login streak',
      unlocked: currentOrLongestStreak >= 7,
      currentValue: Math.min(currentOrLongestStreak, 7),
      targetValue: 7,
      progressRatio: Math.min(currentOrLongestStreak / 7, 1),
      progressLabel: currentOrLongestStreak >= 7 ? 'Earned' : `${currentOrLongestStreak} of 7 days`,
      gradient: ['#8B5CF6', '#7C3AED'],
      accent: '#8B5CF6',
      category: 'streak',
    },
    {
      id: 'first_quiz',
      title: 'First Flight',
      iconName: 'Compass',
      description: 'Hosted your first quiz match',
      requirement: 'Host 1 quiz session',
      unlocked: totalGames >= 1,
      currentValue: Math.min(totalGames, 1),
      targetValue: 1,
      progressRatio: totalGames >= 1 ? 1 : 0,
      progressLabel: totalGames >= 1 ? 'Earned' : '0 of 1 quiz',
      gradient: ['#10B981', '#059669'],
      accent: '#10B981',
      category: 'host',
    },
    {
      id: 'quiz_master',
      title: 'Quiz Master',
      iconName: 'Trophy',
      description: 'Hosted 10 quiz sessions',
      requirement: 'Host 10 quiz sessions',
      unlocked: totalGames >= 10,
      currentValue: Math.min(totalGames, 10),
      targetValue: 10,
      progressRatio: Math.min(totalGames / 10, 1),
      progressLabel: totalGames >= 10 ? 'Earned' : `${totalGames} of 10 hosted`,
      gradient: ['#F59E0B', '#B45309'],
      accent: '#F59E0B',
      category: 'host',
    },
    {
      id: 'accuracy_ace',
      title: 'Precision Host',
      iconName: 'Target',
      description: 'Room accuracy reached 90%+',
      requirement: 'Any quiz session with 90%+ accuracy',
      unlocked: bestAcc >= 90,
      currentValue: bestAcc,
      targetValue: 90,
      progressRatio: Math.min(bestAcc / 90, 1),
      progressLabel: bestAcc >= 90 ? 'Earned' : `${bestAcc}% of 90%`,
      gradient: ['#06B6D4', '#0284C7'],
      accent: '#06B6D4',
      category: 'mastery',
    },
    {
      id: 'crowd_pleaser',
      title: 'Packed Arena',
      iconName: 'Users',
      description: 'Hosted room with 5+ players',
      requirement: '5+ players in a single match',
      unlocked: maxPlayersInGame >= 5,
      currentValue: Math.min(maxPlayersInGame, 5),
      targetValue: 5,
      progressRatio: Math.min(maxPlayersInGame / 5, 1),
      progressLabel: maxPlayersInGame >= 5 ? 'Earned' : `${maxPlayersInGame} of 5 players`,
      gradient: ['#6366F1', '#4F46E5'],
      accent: '#6366F1',
      category: 'mastery',
    },
    {
      id: 'legend_host',
      title: 'Grandmaster',
      iconName: 'Crown',
      description: 'Hosted 50 quiz sessions',
      requirement: 'Host 50 quiz sessions',
      unlocked: totalGames >= 50,
      currentValue: Math.min(totalGames, 50),
      targetValue: 50,
      progressRatio: Math.min(totalGames / 50, 1),
      progressLabel: totalGames >= 50 ? 'Earned' : `${totalGames} of 50 hosted`,
      gradient: ['#EC4899', '#BE185D'],
      accent: '#EC4899',
      category: 'host',
    },
  ];
}
