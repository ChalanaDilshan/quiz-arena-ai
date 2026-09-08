import type { QuizRecord } from './quizHistory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginData {
  streak: number;
  longestStreak: number;
  totalLogins: number;
  lastLogin: string; // YYYY-MM-DD
  loginDates: string[]; // List of YYYY-MM-DD
}

export interface UserBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  requirement: string;
  unlocked: boolean;
  progressText?: string;
  gradient: [string, string];
  category: 'streak' | 'host' | 'achievement';
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
      title: 'Daily Logger',
      icon: '🌅',
      description: 'Logged in to Quiz Arena',
      requirement: 'Log in at least once',
      unlocked: loginData.totalLogins >= 1,
      progressText: loginData.totalLogins >= 1 ? 'Unlocked' : '0/1 Logins',
      gradient: ['#F59E0B', '#F97316'],
      category: 'streak',
    },
    {
      id: 'streak_3',
      title: '3-Day Streak',
      icon: '🔥',
      description: '3 consecutive login days',
      requirement: 'Maintain a 3-day login streak',
      unlocked: currentOrLongestStreak >= 3,
      progressText: currentOrLongestStreak >= 3 ? 'Unlocked' : `${currentOrLongestStreak}/3 Days`,
      gradient: ['#EF4444', '#F97316'],
      category: 'streak',
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      icon: '⚔️',
      description: '7 consecutive login days',
      requirement: 'Maintain a 7-day login streak',
      unlocked: currentOrLongestStreak >= 7,
      progressText: currentOrLongestStreak >= 7 ? 'Unlocked' : `${currentOrLongestStreak}/7 Days`,
      gradient: ['#8B5CF6', '#EC4899'],
      category: 'streak',
    },
    {
      id: 'first_quiz',
      title: 'First Quiz',
      icon: '🎯',
      description: 'Hosted your first quiz session',
      requirement: 'Host 1 quiz',
      unlocked: totalGames >= 1,
      progressText: totalGames >= 1 ? 'Unlocked' : `${totalGames}/1 Quizzes`,
      gradient: ['#10B981', '#3B82F6'],
      category: 'host',
    },
    {
      id: 'quiz_master',
      title: 'Quiz Master',
      icon: '🏆',
      description: 'Hosted 10+ quiz sessions',
      requirement: 'Host 10 quizzes',
      unlocked: totalGames >= 10,
      progressText: totalGames >= 10 ? 'Unlocked' : `${totalGames}/10 Quizzes`,
      gradient: ['#F59E0B', '#EAB308'],
      category: 'host',
    },
    {
      id: 'accuracy_ace',
      title: 'Accuracy Ace',
      icon: '🎓',
      description: 'Achieved 90%+ room accuracy',
      requirement: 'Any quiz with 90%+ accuracy',
      unlocked: bestAcc >= 90,
      progressText: bestAcc >= 90 ? 'Unlocked' : `${bestAcc}% / 90% Best`,
      gradient: ['#06B6D4', '#3B82F6'],
      category: 'achievement',
    },
    {
      id: 'crowd_pleaser',
      title: 'Crowd Pleaser',
      icon: '👥',
      description: 'Hosted a session with 5+ players',
      requirement: '5+ players in a single game',
      unlocked: maxPlayersInGame >= 5,
      progressText: maxPlayersInGame >= 5 ? 'Unlocked' : `${maxPlayersInGame}/5 Players`,
      gradient: ['#6366F1', '#A855F7'],
      category: 'achievement',
    },
    {
      id: 'legend_host',
      title: 'Legend Host',
      icon: '👑',
      description: 'Hosted 50+ quiz sessions',
      requirement: 'Host 50 quizzes',
      unlocked: totalGames >= 50,
      progressText: totalGames >= 50 ? 'Unlocked' : `${totalGames}/50 Quizzes`,
      gradient: ['#EC4899', '#F43F5E'],
      category: 'host',
    },
  ];
}
