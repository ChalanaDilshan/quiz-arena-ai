import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Flame,
  Shield,
  Compass,
  Trophy,
  Target,
  Users,
  Crown,
  Check,
  Lock,
  Calendar,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserXpStats, XP_LEVELS } from '../utils/xpLevels';
import {
  getUserLoginStreak,
  getUserBadges,
  type UserBadge,
  type LoginData,
  type BadgeIconType,
} from '../utils/userProfile';
import type { QuizRecord } from '../utils/quizHistory';

interface UserProfileCardProps {
  records: QuizRecord[];
  loginData?: LoginData;
}

// ─── Vector Icon Resolver ─────────────────────────────────────────────────────

function BadgeIcon({
  name,
  className = 'w-5 h-5',
  style,
}: {
  name: BadgeIconType;
  className?: string;
  style?: React.CSSProperties;
}) {
  switch (name) {
    case 'Sun':
      return <Sun className={className} style={style} />;
    case 'Flame':
      return <Flame className={className} style={style} />;
    case 'Shield':
      return <Shield className={className} style={style} />;
    case 'Compass':
      return <Compass className={className} style={style} />;
    case 'Trophy':
      return <Trophy className={className} style={style} />;
    case 'Target':
      return <Target className={className} style={style} />;
    case 'Users':
      return <Users className={className} style={style} />;
    case 'Crown':
      return <Crown className={className} style={style} />;
    default:
      return <Award className={className} style={style} />;
  }
}

function TierIcon({ rank, className = 'w-4 h-4' }: { rank: number; className?: string }) {
  switch (rank) {
    case 0:
      return <Compass className={className} />;
    case 1:
      return <BookOpen className={className} />;
    case 2:
      return <GraduationCap className={className} />;
    case 3:
      return <Zap className={className} />;
    case 4:
      return <Flame className={className} />;
    case 5:
      return <Trophy className={className} />;
    case 6:
      return <Crown className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserProfileCard({
  records,
  loginData: initialLoginData,
}: UserProfileCardProps) {
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!user) return null;

  const loginData = initialLoginData || getUserLoginStreak(user.uid);
  const xpStats = getUserXpStats(user.uid);
  const badges = getUserBadges(loginData, records);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const nextLevel =
    xpStats.level.rank < XP_LEVELS.length - 1
      ? XP_LEVELS[xpStats.level.rank + 1]
      : null;

  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const initials = (user.displayName || user.email || 'Host')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'unlocked') return badges.filter((b) => b.unlocked);
    if (badgeFilter === 'locked') return badges.filter((b) => !b.unlocked);
    return badges;
  }, [badges, badgeFilter]);

  return (
    <section
      aria-label="Host Profile & Progression"
      className="mb-8 rounded-3xl border border-rim/70 bg-elevated/70 backdrop-blur-xl shadow-xl p-5 sm:p-7 relative overflow-hidden space-y-6"
    >
      {/* Subtle top-right ambient warmth tailored to current tier */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${xpStats.level.accent} 0%, transparent 70%)`,
        }}
      />

      {/* ── 1. Profile Header (Identity & Executive Stats) ─────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-rim/60">
        {/* Left: User Identity */}
        <div className="flex items-center gap-4">
          {/* Avatar with subtle tier accent squircle */}
          <div className="relative flex-shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Host avatar'}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 shadow-md transition-transform"
                style={{ borderColor: xpStats.level.accent }}
              />
            ) : (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
                }}
              >
                {initials}
              </div>
            )}
            {/* Tier Rank Icon Badge */}
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-canvas border border-rim flex items-center justify-center text-xs shadow-sm"
              title={`Rank ${xpStats.level.rank}: ${xpStats.level.title}`}
              style={{ color: xpStats.level.accent }}
            >
              <TierIcon rank={xpStats.level.rank} className="w-3.5 h-3.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-alabaster tracking-tight">
                {user.displayName || 'Quiz Host'}
              </h2>

              {/* Refined Tier Tag */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm"
                style={{
                  borderColor: `${xpStats.level.accent}40`,
                  backgroundColor: `${xpStats.level.accent}15`,
                  color: xpStats.level.accent,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: xpStats.level.accent }}
                />
                Level {xpStats.level.rank} • {xpStats.level.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-smoke mt-1 flex-wrap">
              <span className="truncate max-w-[220px] sm:max-w-xs">{user.email}</span>
              {memberSince && (
                <>
                  <span className="text-rim">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-smoke/90">
                    <Calendar className="w-3 h-3 text-smoke/70" />
                    Joined {memberSince}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Executive Stats Counter */}
        <div className="flex items-center gap-3 sm:gap-4 bg-canvas/60 border border-rim/60 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 self-start lg:self-auto">
          {/* Day Streak */}
          <div className="flex flex-col min-w-[72px]">
            <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Streak
            </span>
            <span className="text-base sm:text-lg font-black text-alabaster mt-0.5 tabular-nums">
              {loginData.streak}{' '}
              <span className="text-xs font-normal text-smoke">
                {loginData.streak === 1 ? 'day' : 'days'}
              </span>
            </span>
          </div>

          <div className="w-px h-7 bg-rim/70" />

          {/* Quizzes Hosted */}
          <div className="flex flex-col min-w-[72px]">
            <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-sienna" />
              Hosted
            </span>
            <span className="text-base sm:text-lg font-black text-alabaster mt-0.5 tabular-nums">
              {records.length}{' '}
              <span className="text-xs font-normal text-smoke">quizzes</span>
            </span>
          </div>

          <div className="w-px h-7 bg-rim/70" />

          {/* Badges Earned */}
          <div className="flex flex-col min-w-[72px]">
            <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Badges
            </span>
            <span className="text-base sm:text-lg font-black text-alabaster mt-0.5 tabular-nums">
              {unlockedCount}
              <span className="text-xs font-normal text-smoke">/{badges.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Mastery & Progression (XP Level Track) ────────────────────── */}
      <div className="rounded-2xl border border-rim/60 bg-canvas/40 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm"
              style={{
                borderColor: `${xpStats.level.accent}40`,
                backgroundColor: `${xpStats.level.accent}15`,
                color: xpStats.level.accent,
              }}
            >
              <TierIcon rank={xpStats.level.rank} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-alabaster leading-none">
                Level {xpStats.level.rank}: {xpStats.level.title}
              </p>
              <p className="text-[11px] text-smoke mt-0.5">
                {xpStats.level.description}
              </p>
            </div>
          </div>

          <div className="text-right">
            {nextLevel ? (
              <span className="text-xs font-medium text-smoke">
                Next tier:{' '}
                <strong className="text-alabaster font-semibold">
                  {nextLevel.title}
                </strong>{' '}
                {xpStats.gamesUntilNext !== null && (
                  <span className="text-sienna font-semibold ml-1">
                    ({xpStats.gamesUntilNext} more{' '}
                    {xpStats.gamesUntilNext === 1 ? 'quiz' : 'quizzes'})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Max Tier Achieved
              </span>
            )}
          </div>
        </div>

        {/* High-Precision Progress Bar */}
        <div className="relative w-full h-2.5 rounded-full bg-canvas border border-rim/80 overflow-hidden shadow-inner p-[1px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(Math.max(xpStats.progress * 100, 4), 100)}%`,
            }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full relative overflow-hidden shadow-sm"
            style={{
              background: `linear-gradient(90deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
            }}
          >
            {/* Subtle soft shimmer reflection sweep */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Progress Metrics Below Bar */}
        <div className="flex justify-between items-center text-[11px] text-smoke font-medium">
          <span>{xpStats.totalGames} total quizzes hosted</span>
          <span className="font-semibold text-alabaster tabular-nums">
            {Math.round(xpStats.progress * 100)}% progress
          </span>
          <span>
            {nextLevel
              ? `${nextLevel.minGames} required for ${nextLevel.title}`
              : 'Grandmaster'}
          </span>
        </div>
      </div>

      {/* ── 3. Achievements & Badges Showcase ─────────────────────────────── */}
      <div className="space-y-4 pt-1">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-alabaster tracking-tight flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Achievements & Milestones
            </h3>
            <p className="text-xs text-smoke mt-0.5">
              Unlock host milestones by running sessions and maintaining activity.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-canvas/80 border border-rim/70 p-1 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'all', label: `All (${badges.length})` },
                { id: 'unlocked', label: `Earned (${unlockedCount})` },
                {
                  id: 'locked',
                  label: `Locked (${badges.length - unlockedCount})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBadgeFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  badgeFilter === tab.id
                    ? 'bg-elevated text-alabaster shadow-sm border border-rim'
                    : 'text-smoke hover:text-alabaster'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid (Clean layout, NO text truncation!) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.unlocked;

            return (
              <motion.button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group min-h-[148px] ${
                  isUnlocked
                    ? 'bg-canvas/60 border-rim/90 hover:border-alabaster/30 shadow-sm cursor-pointer'
                    : 'bg-canvas/30 border-rim/40 opacity-60 hover:opacity-85 cursor-pointer'
                }`}
                style={{
                  boxShadow: isUnlocked
                    ? `0 0 20px ${badge.accent}12`
                    : 'none',
                }}
              >
                {/* Top: Custom Vector Medallion + Status Pill */}
                <div className="flex items-start justify-between gap-2 w-full">
                  {/* Crafted Vector Medallion */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${
                      isUnlocked
                        ? 'shadow-sm'
                        : 'bg-rim/30 border-rim/50 text-smoke/50'
                    }`}
                    style={
                      isUnlocked
                        ? {
                            background: `linear-gradient(135deg, ${badge.gradient[0]}20, ${badge.gradient[1]}10)`,
                            borderColor: `${badge.accent}45`,
                            color: badge.accent,
                          }
                        : undefined
                    }
                  >
                    <BadgeIcon name={badge.iconName} className="w-5 h-5" />
                  </div>

                  {/* Status Indicator Chip */}
                  {isUnlocked ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: `${badge.accent}18`,
                        borderColor: `${badge.accent}35`,
                        color: badge.accent,
                      }}
                    >
                      <Check className="w-3 h-3" />
                      <span>Earned</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rim/40 text-smoke border border-rim/60">
                      <Lock className="w-2.5 h-2.5 text-smoke/70" />
                      <span>{badge.progressLabel}</span>
                    </span>
                  )}
                </div>

                {/* Middle: Title & Clear Human Description */}
                <div className="mt-3 w-full">
                  <p
                    className={`text-xs sm:text-sm font-bold leading-snug ${
                      isUnlocked ? 'text-alabaster' : 'text-smoke/90'
                    }`}
                  >
                    {badge.title}
                  </p>
                  <p className="text-[11px] text-smoke leading-normal mt-1">
                    {badge.description}
                  </p>
                </div>

                {/* Bottom: Mini Progress Bar on locked badges */}
                {!isUnlocked && (
                  <div className="w-full mt-3 pt-2 border-t border-rim/40">
                    <div className="w-full h-1.5 rounded-full bg-rim/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            Math.max(badge.progressRatio * 100, 6),
                            100
                          )}%`,
                          backgroundColor: badge.accent,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Empty state when filter yields 0 */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-8 text-smoke text-xs border border-dashed border-rim rounded-2xl">
            No badges in this view.
          </div>
        )}
      </div>

      {/* ── 4. Interactive Badge Detail Modal ──────────────────────────────── */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-elevated border border-rim/80 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative overflow-hidden space-y-5"
            >
              {/* Luminous ambient glow behind icon */}
              <div
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25"
                style={{
                  background: `radial-gradient(circle, ${selectedBadge.accent} 0%, transparent 70%)`,
                }}
              />

              {/* Icon & Title Header */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${selectedBadge.gradient[0]}25, ${selectedBadge.gradient[1]}15)`,
                    borderColor: `${selectedBadge.accent}50`,
                    color: selectedBadge.accent,
                  }}
                >
                  <BadgeIcon name={selectedBadge.iconName} className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-alabaster tracking-tight">
                    {selectedBadge.title}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 border ${
                      selectedBadge.unlocked
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rim/50 text-smoke border-rim'
                    }`}
                  >
                    {selectedBadge.unlocked ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Milestone Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> In Progress
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-alabaster/90 leading-relaxed">
                {selectedBadge.description}
              </p>

              {/* How to unlock card */}
              <div className="rounded-2xl bg-canvas/80 border border-rim/70 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-alabaster uppercase tracking-wider text-[11px]">
                  <Info className="w-3.5 h-3.5 text-sienna" />
                  <span>Unlock Requirement</span>
                </div>
                <p className="text-smoke leading-normal">
                  {selectedBadge.requirement}
                </p>

                {/* Progress bar inside modal */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-medium text-smoke mb-1.5">
                    <span>Progress</span>
                    <span className="text-alabaster font-semibold">
                      {selectedBadge.progressLabel}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-rim/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.max(selectedBadge.progressRatio * 100, 4),
                          100
                        )}%`,
                        backgroundColor: selectedBadge.accent,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl bg-rim/70 hover:bg-rim text-alabaster font-bold text-xs transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
