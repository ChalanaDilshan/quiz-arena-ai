import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Sparkles,
  Lock,
  CheckCircle2,
  Calendar,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserXpStats, XP_LEVELS } from '../utils/xpLevels';
import {
  getUserLoginStreak,
  getUserBadges,
  type UserBadge,
  type LoginData,
} from '../utils/userProfile';
import type { QuizRecord } from '../utils/quizHistory';

interface UserProfileCardProps {
  records: QuizRecord[];
  loginData?: LoginData;
}

export function UserProfileCard({ records, loginData: initialLoginData }: UserProfileCardProps) {
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(true);

  if (!user) return null;

  const loginData = initialLoginData || getUserLoginStreak(user.uid);
  const xpStats = getUserXpStats(user.uid);
  const badges = getUserBadges(loginData, records);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const nextLevel =
    xpStats.level.rank < XP_LEVELS.length - 1
      ? XP_LEVELS[xpStats.level.rank + 1]
      : null;

  // Format member creation date
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="User Profile and Achievements"
      className="mb-8 rounded-2xl border border-rim/70 bg-elevated/60 backdrop-blur-xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Subtle ambient gradient aura based on XP tier */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${xpStats.level.accent} 0%, transparent 70%)`,
        }}
      />

      {/* ── Top Row: User Identity & Quick Stats ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-rim/50">
        <div className="flex items-center gap-3.5">
          {/* Avatar with dynamic XP level glowing rim */}
          <div className="relative flex-shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User profile'}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 shadow-md"
                style={{ borderColor: xpStats.level.accent }}
              />
            ) : (
              <div
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-sm text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
                }}
              >
                {initials}
              </div>
            )}
            {/* Rank badge overlay */}
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-canvas border border-rim flex items-center justify-center text-xs shadow-sm"
              title={`Rank: ${xpStats.level.title}`}
            >
              {xpStats.level.icon}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-alabaster tracking-tight">
                {user.displayName || 'Quiz Host'}
              </h2>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-sm"
                style={{
                  borderColor: `${xpStats.level.accent}66`,
                  backgroundColor: `${xpStats.level.accent}1A`,
                  color: xpStats.level.accent,
                }}
              >
                <span>{xpStats.level.icon}</span>
                <span>{xpStats.level.title}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-smoke mt-0.5 flex-wrap">
              <span className="truncate max-w-[200px] sm:max-w-xs">{user.email}</span>
              {memberSince && (
                <>
                  <span className="text-rim">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-smoke/80">
                    <Calendar className="w-3 h-3 text-smoke/60" />
                    Joined {memberSince}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {/* Login Streak Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold shadow-[0_0_15px_rgba(245,158,11,0.1)]"
            title={`Longest streak: ${loginData.longestStreak} days • Total visits: ${loginData.totalLogins}`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>
              {loginData.streak} {loginData.streak === 1 ? 'Day' : 'Days'} Streak
            </span>
          </div>

          {/* Total Quizzes Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rim/70 bg-canvas/60 text-alabaster text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-sienna" />
            <span>{records.length} Hosted</span>
          </div>

          {/* Badges Count Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rim/70 bg-canvas/60 text-alabaster text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {unlockedCount}/{badges.length} Badges
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle: XP Level & Progress Bar ──────────────────────────────────── */}
      <div className="py-4 border-b border-rim/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-alabaster flex items-center gap-1.5">
              <span>{xpStats.level.icon}</span>
              <span>Level {xpStats.level.rank}: {xpStats.level.title}</span>
            </span>
            <span className="text-xs text-smoke hidden sm:inline">
              — {xpStats.level.description}
            </span>
          </div>

          <div className="text-right">
            {nextLevel ? (
              <span className="text-xs font-medium text-smoke">
                Next:{' '}
                <span className="text-alabaster font-semibold">
                  {nextLevel.title} {nextLevel.icon}
                </span>
                {xpStats.gamesUntilNext !== null && (
                  <span className="text-smoke/70 text-[11px] ml-1">
                    ({xpStats.gamesUntilNext} more {xpStats.gamesUntilNext === 1 ? 'quiz' : 'quizzes'})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Max Rank Achieved!
              </span>
            )}
          </div>
        </div>

        {/* Animated Gradient Progress Bar */}
        <div className="relative w-full h-3 rounded-full bg-canvas/80 border border-rim/80 overflow-hidden shadow-inner p-[1px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(xpStats.progress * 100, 3), 100)}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full relative overflow-hidden shadow-md"
            style={{
              background: `linear-gradient(90deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
            }}
          >
            {/* Shimmer light reflection sweep */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Progress labels below bar */}
        <div className="flex justify-between items-center text-[11px] text-smoke mt-1.5 font-medium">
          <span>{xpStats.totalGames} quizzes hosted</span>
          <span className="font-semibold text-alabaster">
            {Math.round(xpStats.progress * 100)}% progress
          </span>
          <span>{nextLevel ? `${nextLevel.minGames} total required` : 'Legend Tier'}</span>
        </div>
      </div>

      {/* ── Bottom: Achievement Badges Grid ─────────────────────────────────── */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-alabaster">
              Host Badges & Milestones
            </h3>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-rim/40 text-smoke">
              {unlockedCount} of {badges.length} Unlocked
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAllBadges(!showAllBadges)}
            className="text-xs text-smoke hover:text-alabaster transition-colors flex items-center gap-1 font-medium"
          >
            <span>{showAllBadges ? 'Collapse' : 'View All'}</span>
            {showAllBadges ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showAllBadges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
            >
              {badges.map((badge, idx) => {
                const isUnlocked = badge.unlocked;

                return (
                  <motion.button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadge(badge)}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      delay: idx * 0.04,
                      ease: [0.2, 0.9, 0.3, 1],
                    }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative text-left p-3 rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[92px] group ${
                      isUnlocked
                        ? 'bg-canvas/80 border-rim hover:border-alabaster/40 shadow-sm cursor-pointer'
                        : 'bg-canvas/30 border-rim/40 opacity-55 hover:opacity-75 cursor-pointer'
                    }`}
                    style={{
                      boxShadow: isUnlocked
                        ? `0 0 16px ${badge.gradient[0]}15`
                        : 'none',
                    }}
                  >
                    {/* Glowing highlight ribbon on unlocked cards */}
                    {isUnlocked && (
                      <div
                        className="absolute top-0 inset-x-0 h-[2px]"
                        style={{
                          background: `linear-gradient(90deg, ${badge.gradient[0]}, ${badge.gradient[1]})`,
                        }}
                      />
                    )}

                    <div className="flex items-start justify-between gap-1.5 w-full">
                      {/* Icon */}
                      <span
                        className={`text-2xl select-none transition-transform duration-200 group-hover:scale-110 ${
                          !isUnlocked ? 'filter grayscale contrast-50' : ''
                        }`}
                      >
                        {badge.icon}
                      </span>

                      {/* Status indicator */}
                      {isUnlocked ? (
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${badge.gradient[0]}25`,
                            color: badge.gradient[0],
                          }}
                          title="Unlocked!"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      ) : (
                        <span
                          className="w-4 h-4 rounded-full bg-rim/50 flex items-center justify-center flex-shrink-0 text-smoke/70"
                          title="Locked"
                        >
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="mt-2 w-full">
                      <p
                        className={`text-xs font-bold leading-tight truncate ${
                          isUnlocked ? 'text-alabaster' : 'text-smoke'
                        }`}
                      >
                        {badge.title}
                      </p>
                      <p className="text-[10px] text-smoke/80 truncate mt-0.5">
                        {isUnlocked ? badge.description : badge.progressText || 'Locked'}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal / Popover Detail for Selected Badge */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-elevated border border-rim rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                {/* Glow backdrop */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-30"
                  style={{
                    background: `radial-gradient(circle, ${selectedBadge.gradient[0]} 0%, transparent 70%)`,
                  }}
                />

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shadow-lg ${
                      !selectedBadge.unlocked ? 'filter grayscale contrast-50' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${selectedBadge.gradient[0]}20, ${selectedBadge.gradient[1]}20)`,
                      borderColor: `${selectedBadge.gradient[0]}50`,
                    }}
                  >
                    {selectedBadge.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-alabaster">
                      {selectedBadge.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        selectedBadge.unlocked
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rim/50 text-smoke border border-rim'
                      }`}
                    >
                      {selectedBadge.unlocked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Locked
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-alabaster/90 mb-3">
                  {selectedBadge.description}
                </p>

                <div className="rounded-xl bg-canvas/70 border border-rim/60 p-3 text-xs text-smoke mb-4">
                  <div className="flex items-center gap-1.5 font-semibold text-alabaster mb-1">
                    <Info className="w-3.5 h-3.5 text-sienna" />
                    <span>How to Unlock:</span>
                  </div>
                  <p className="text-smoke/90">{selectedBadge.requirement}</p>
                  {selectedBadge.progressText && (
                    <p className="mt-1 text-[11px] text-sienna font-medium">
                      Status: {selectedBadge.progressText}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-2 rounded-xl bg-rim/60 hover:bg-rim text-alabaster font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
