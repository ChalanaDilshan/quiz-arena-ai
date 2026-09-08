import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Calendar,
  Sparkles,
  Zap,
  Flame,
  Trophy,
  Target,
  Users,
  Compass,
  BookOpen,
  GraduationCap,
  Crown,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserXpStats, XP_LEVELS } from '../utils/xpLevels';
import {
  getUserLoginStreak,
  getUserBadges,
  type UserBadge,
  type LoginData,
  type BadgeType,
} from '../utils/userProfile';
import type { QuizRecord } from '../utils/quizHistory';

interface UserProfileCardProps {
  records: QuizRecord[];
  loginData?: LoginData;
}

// ─── Custom Animated Medallion Artwork (Matching User's Reference) ─────────────

function MedallionSVG({
  type,
  accent,
  unlocked,
}: {
  type: BadgeType;
  accent: string;
  unlocked: boolean;
}) {
  const strokeColor = unlocked ? accent : '#64748B';
  const glowColor = unlocked ? `${accent}4D` : 'transparent';
  const fillColor = unlocked ? `${accent}1A` : '#1E293B33';

  return (
    <motion.div
      className="relative w-20 h-20 sm:w-[84px] sm:h-[84px] flex items-center justify-center flex-shrink-0 select-none"
      animate={
        unlocked
          ? {
              filter: [
                `drop-shadow(0 0 12px ${accent}40)`,
                `drop-shadow(0 0 24px ${accent}80)`,
                `drop-shadow(0 0 12px ${accent}40)`,
              ],
            }
          : undefined
      }
      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer subtle orbital rotating dashed ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray="6 5"
          strokeOpacity={unlocked ? '0.45' : '0.18'}
          animate={unlocked ? { rotate: 360 } : undefined}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Primary Medallion Ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* Inner Ring */}
        <circle
          cx="50"
          cy="50"
          r="37"
          stroke={strokeColor}
          strokeWidth="1"
          strokeOpacity={unlocked ? '0.6' : '0.3'}
          fill="#0B1015"
        />

        {/* Inner Disc tint */}
        <circle cx="50" cy="50" r="36" fill={fillColor} />

        {/* ── Badge-Specific Animated Vector Artwork ── */}

        {type === 'daily_presence' && (
          /* Animated Sun with 8 rays */
          <g stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round">
            {/* Pulsing Sun Core */}
            <motion.circle
              cx="50"
              cy="50"
              r="12"
              fill={unlocked ? accent : '#64748B'}
              fillOpacity={unlocked ? '0.35' : '0.2'}
              animate={unlocked ? { scale: [1, 1.08, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* Slowly rotating sun rays */}
            <motion.g
              animate={unlocked ? { rotate: 360 } : undefined}
              transition={{ repeat: Infinity, duration: 32, ease: 'linear' }}
              style={{ transformOrigin: '50px 50px' }}
            >
              <line x1="50" y1="26" x2="50" y2="31" />
              <line x1="50" y1="69" x2="50" y2="74" />
              <line x1="26" y1="50" x2="31" y2="50" />
              <line x1="69" y1="50" x2="74" y2="50" />
              <line x1="33" y1="33" x2="37" y2="37" />
              <line x1="63" y1="63" x2="67" y2="67" />
              <line x1="33" y1="67" x2="37" y2="63" />
              <line x1="63" y1="37" x2="67" y2="33" />
            </motion.g>
          </g>
        )}

        {type === 'quiz_master' && (
          /* Megaphone with radiating sound energy waves */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <motion.g
              animate={unlocked ? { rotate: [0, -3, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{ transformOrigin: '40px 50px' }}
            >
              <path
                d="M40 40 L58 31 L58 63 L40 54 Z"
                fill={unlocked ? `${accent}33` : '#64748B22'}
                strokeWidth="2.5"
              />
              <rect
                x="34"
                y="42"
                width="6"
                height="10"
                rx="1"
                strokeWidth="2"
                fill={strokeColor}
              />
              <path d="M43 55 L43 65 L48 65 L48 53" strokeWidth="2" />
            </motion.g>

            {/* Pulsing Sound Energy Waves */}
            <motion.path
              d="M64 41 C67 44 67 50 64 53"
              strokeWidth="2.5"
              animate={
                unlocked
                  ? { opacity: [0.2, 1, 0.2], scale: [0.95, 1.08, 0.95] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ transformOrigin: '64px 47px' }}
            />
            <motion.path
              d="M69 36 C74 41 74 53 69 58"
              strokeWidth="2.5"
              animate={
                unlocked
                  ? { opacity: [0.2, 1, 0.2], scale: [0.95, 1.08, 0.95] }
                  : undefined
              }
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: 'easeInOut',
                delay: 0.35,
              }}
              style={{ transformOrigin: '69px 47px' }}
            />
          </g>
        )}

        {type === 'precision_host' && (
          /* Archery Bullseye Target with Arrow & Ping Ripple */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="50" r="22" strokeWidth="2" />
            <circle cx="50" cy="50" r="14" strokeWidth="2" />
            {/* Center bullseye pulsing */}
            <motion.circle
              cx="50"
              cy="50"
              r="6"
              fill={strokeColor}
              animate={unlocked ? { scale: [1, 1.3, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* Arrow piercing center */}
            <motion.g
              animate={unlocked ? { x: [0, -1.5, 0], y: [0, 1.5, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <line x1="65" y1="35" x2="52" y2="48" strokeWidth="2.5" />
              <polyline points="61,33 67,33 67,39" strokeWidth="2" />
            </motion.g>
          </g>
        )}

        {type === 'week_warrior' && (
          /* Metallic Shield with Laurel Wreath */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M50 30 C58 30 63 34 63 43 C63 56 50 65 50 65 C50 65 37 56 37 43 C37 34 42 30 50 30 Z"
              strokeWidth="2.5"
              fill={unlocked ? `${accent}30` : '#64748B20'}
              animate={unlocked ? { scale: [1, 1.04, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 48px' }}
            />
            <line x1="50" y1="33" x2="50" y2="60" strokeWidth="2" />
            {/* Laurel leaves with breathing glow */}
            <motion.path
              d="M33 42 C30 46 31 52 35 56"
              strokeWidth="2"
              animate={unlocked ? { opacity: [0.6, 1, 0.6] } : undefined}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
            <motion.path
              d="M67 42 C70 46 69 52 65 56"
              strokeWidth="2"
              animate={unlocked ? { opacity: [0.6, 1, 0.6] } : undefined}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
          </g>
        )}

        {type === 'first_flight' && (
          /* Concentric Radar / Compass Rings with Rotating Sweep */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <motion.circle
              cx="50"
              cy="50"
              r="20"
              strokeWidth="2"
              strokeDasharray="4 2"
              animate={unlocked ? { rotate: 360 } : undefined}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
              style={{ transformOrigin: '50px 50px' }}
            />
            <circle cx="50" cy="50" r="12" strokeWidth="2" />
            <motion.circle
              cx="50"
              cy="50"
              r="4"
              fill={strokeColor}
              animate={unlocked ? { scale: [1, 1.4, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* 4-point crosshair ticks */}
            <line x1="50" y1="24" x2="50" y2="28" strokeWidth="2" />
            <line x1="50" y1="72" x2="50" y2="76" strokeWidth="2" />
            <line x1="24" y1="50" x2="28" y2="50" strokeWidth="2" />
            <line x1="72" y1="50" x2="76" y2="50" strokeWidth="2" />
          </g>
        )}

        {type === 'grandmaster' && (
          /* Imperial 5-Point Crown with Twinkling Jewels */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <motion.g
              animate={unlocked ? { y: [0, -2, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <path
                d="M32 58 L30 40 L40 48 L50 34 L60 48 L70 40 L68 58 Z"
                strokeWidth="2.5"
                fill={unlocked ? `${accent}40` : '#64748B20'}
              />
              <line x1="32" y1="62" x2="68" y2="62" strokeWidth="2.5" />
              <polygon points="50,47 54,52 50,57 46,52" fill={strokeColor} />
            </motion.g>

            {/* Twinkling Crown Peak Jewels */}
            <motion.circle
              cx="30"
              cy="39"
              r="2.5"
              fill={strokeColor}
              animate={
                unlocked
                  ? { scale: [0.8, 1.35, 0.8], opacity: [0.6, 1, 0.6] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{ transformOrigin: '30px 39px' }}
            />
            <motion.circle
              cx="50"
              cy="33"
              r="3"
              fill={strokeColor}
              animate={
                unlocked
                  ? { scale: [0.8, 1.4, 0.8], opacity: [0.6, 1, 0.6] }
                  : undefined
              }
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut',
                delay: 0.4,
              }}
              style={{ transformOrigin: '50px 33px' }}
            />
            <motion.circle
              cx="70"
              cy="39"
              r="2.5"
              fill={strokeColor}
              animate={
                unlocked
                  ? { scale: [0.8, 1.35, 0.8], opacity: [0.6, 1, 0.6] }
                  : undefined
              }
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut',
                delay: 0.8,
              }}
              style={{ transformOrigin: '70px 39px' }}
            />
          </g>
        )}

        {type === 'streak_3' && (
          /* Triple Radiant Flame with Flickering Animation */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            <motion.path
              d="M50 28 C45 38 41 43 41 50 C41 58 46 64 53 64 C60 64 64 58 64 51 C64 42 58 36 54 33 C54 39 52 42 49 44 C49 38 52 32 50 28 Z"
              strokeWidth="2.5"
              fill={unlocked ? `${accent}40` : '#64748B20'}
              animate={
                unlocked
                  ? { scaleY: [1, 1.06, 0.96, 1], y: [0, -1.5, 0.5, 0] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 64px' }}
            />
            <motion.path
              d="M49 53 C47 56 47 59 50 60 C53 60 55 58 54 55 C54 51 51 49 49 53 Z"
              fill={strokeColor}
              animate={
                unlocked
                  ? { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 56px' }}
            />
          </g>
        )}

        {type === 'packed_arena' && (
          /* 3-person team silhouette with arena broadcast pulse waves */
          <g stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round">
            {/* Outer expanding energy pulse */}
            <motion.circle
              cx="50"
              cy="48"
              r="22"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              animate={
                unlocked
                  ? { scale: [0.95, 1.12, 0.95], opacity: [0.3, 0.85, 0.3] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 48px' }}
            />
            {/* Center leader */}
            <circle cx="50" cy="40" r="5" strokeWidth="2" fill={strokeColor} />
            <path d="M42 56 C42 49 45 47 50 47 C55 47 58 49 58 56" strokeWidth="2" />
            {/* Left person */}
            <circle cx="36" cy="44" r="4" strokeWidth="2" />
            <path d="M29 58 C29 53 32 51 36 51 C38 51 40 52 41 54" strokeWidth="2" />
            {/* Right person */}
            <circle cx="64" cy="44" r="4" strokeWidth="2" />
            <path d="M71 58 C71 53 68 51 64 51 C62 51 60 52 59 54" strokeWidth="2" />
          </g>
        )}
      </svg>
    </motion.div>
  );
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

// ─── Main User Profile & Full Badges Section ───────────────────────────────────

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
    <div className="space-y-10 mb-12">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: HOST PROFILE & MASTERY HERO
          Expansive top command center with user identity and level progress
      ═══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Host Profile Overview"
        className="rounded-3xl border border-rim/70 bg-elevated/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6"
      >
        {/* Ambient glow matching current tier */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{
            background: `radial-gradient(circle, ${xpStats.level.accent} 0%, transparent 70%)`,
          }}
        />

        {/* Top: Identity + 4 Executive Stats */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-rim/60">
          {/* User Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex-shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Host avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 shadow-md"
                  style={{ borderColor: xpStats.level.accent }}
                />
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
                  }}
                >
                  {initials}
                </div>
              )}
              {/* Tier rank icon overlay */}
              <span
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-canvas border border-rim flex items-center justify-center text-xs shadow-sm"
                title={`Rank ${xpStats.level.rank}: ${xpStats.level.title}`}
                style={{ color: xpStats.level.accent }}
              >
                <TierIcon rank={xpStats.level.rank} className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-alabaster tracking-tight">
                  {user.displayName || 'Quiz Host'}
                </h2>

                <span
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border shadow-sm"
                  style={{
                    borderColor: `${xpStats.level.accent}45`,
                    backgroundColor: `${xpStats.level.accent}15`,
                    color: xpStats.level.accent,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: xpStats.level.accent }}
                  />
                  Level {xpStats.level.rank} • {xpStats.level.title}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-smoke mt-1.5 flex-wrap">
                <span className="truncate max-w-[240px] sm:max-w-xs font-medium">
                  {user.email}
                </span>
                {memberSince && (
                  <>
                    <span className="text-rim">•</span>
                    <span className="inline-flex items-center gap-1.5 text-smoke/90">
                      <Calendar className="w-3.5 h-3.5 text-smoke/70" />
                      Joined {memberSince}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4 Executive Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-canvas/70 border border-rim/60 rounded-2xl p-3 sm:p-4">
            {/* Streak */}
            <div className="flex flex-col px-2">
              <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Streak
              </span>
              <span className="text-lg font-black text-alabaster mt-0.5 tabular-nums">
                {loginData.streak}{' '}
                <span className="text-xs font-normal text-smoke">
                  {loginData.streak === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>

            {/* Quizzes Hosted */}
            <div className="flex flex-col px-2 border-l border-rim/60">
              <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-sienna" />
                Hosted
              </span>
              <span className="text-lg font-black text-alabaster mt-0.5 tabular-nums">
                {records.length}{' '}
                <span className="text-xs font-normal text-smoke">quizzes</span>
              </span>
            </div>

            {/* Best Accuracy */}
            <div className="flex flex-col px-2 border-l border-rim/60">
              <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Accuracy
              </span>
              <span className="text-lg font-black text-alabaster mt-0.5 tabular-nums">
                {records.length > 0
                  ? `${Math.max(...records.map((r) => r.accuracy))}%`
                  : '—'}
              </span>
            </div>

            {/* Badges Unlocked */}
            <div className="flex flex-col px-2 border-l border-rim/60">
              <span className="text-[10px] font-bold text-smoke uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Badges
              </span>
              <span className="text-lg font-black text-alabaster mt-0.5 tabular-nums">
                {unlockedCount}
                <span className="text-xs font-normal text-smoke">
                  /{badges.length}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Wide Mastery Level Progress Bar */}
        <div className="rounded-2xl border border-rim/60 bg-canvas/40 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
                style={{
                  borderColor: `${xpStats.level.accent}45`,
                  backgroundColor: `${xpStats.level.accent}15`,
                  color: xpStats.level.accent,
                }}
              >
                <TierIcon rank={xpStats.level.rank} className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-alabaster leading-none">
                  Level {xpStats.level.rank}: {xpStats.level.title}
                </p>
                <p className="text-xs text-smoke mt-0.5">
                  {xpStats.level.description}
                </p>
              </div>
            </div>

            <div className="text-right">
              {nextLevel ? (
                <span className="text-xs font-medium text-smoke">
                  Next tier:{' '}
                  <strong className="text-alabaster font-bold">
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
          <div className="relative w-full h-3 rounded-full bg-canvas border border-rim/80 overflow-hidden shadow-inner p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(Math.max(xpStats.progress * 100, 4), 100)}%`,
              }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full relative overflow-hidden shadow-sm"
              style={{
                background: `linear-gradient(90deg, ${xpStats.level.gradient[0]}, ${xpStats.level.gradient[1]})`,
              }}
            >
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
              />
            </motion.div>
          </div>

          <div className="flex justify-between items-center text-xs text-smoke font-medium">
            <span>{xpStats.totalGames} total quizzes hosted</span>
            <span className="font-bold text-alabaster tabular-nums">
              {Math.round(xpStats.progress * 100)}% progress
            </span>
            <span>
              {nextLevel
                ? `${nextLevel.minGames} required for ${nextLevel.title}`
                : 'Grandmaster'}
            </span>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: ACHIEVEMENTS & MILESTONES (FULL DEDICATED SITE SECTION)
          Modern animations:
          - Staggered spring entrance
          - 3D interactive lift on hover
          - Continuous ambient medallion pulse & rotating orbital dash
          - Specular holographic sheen across cards
          - Pulsing checkmark pill and animated mini progress bars
      ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Achievements and Milestones" className="space-y-5">
        {/* Section Header with Title & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-rim/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-alabaster tracking-tight flex items-center gap-2.5">
              <span>Achievements & Milestones</span>
            </h2>
            <p className="text-xs sm:text-sm text-smoke mt-0.5">
              Complete hosting challenges and daily activities to unlock prestige badges.
            </p>
          </div>

          {/* Filter Pill Tabs (Matches reference design) */}
          <div className="flex items-center gap-1.5 bg-canvas/80 border border-rim/80 p-1.5 rounded-2xl self-start sm:self-auto shadow-sm">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
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

        {/* The Badge Grid (Expansive, Spacious, Fluid Animations) */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <AnimatePresence>
            {filteredBadges.map((badge, idx) => {
              const isUnlocked = badge.unlocked;

              return (
                <motion.button
                  layout
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -6,
                    scale: 1.025,
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`text-left p-5 rounded-2xl border transition-colors duration-300 flex flex-col justify-between group min-h-[280px] relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-[#131920]/95 border-slate-700/70 hover:border-slate-500/90 shadow-lg cursor-pointer'
                      : 'bg-[#0E1318]/80 border-slate-800/60 opacity-65 hover:opacity-90 cursor-pointer'
                  }`}
                  style={{
                    boxShadow: isUnlocked
                      ? `0 0 28px ${badge.accent}1A`
                      : 'none',
                  }}
                >
                  {/* Holographic specular light sweep on earned cards */}
                  {isUnlocked && (
                    <motion.div
                      className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{
                        repeat: Infinity,
                        repeatDelay: 5 + idx * 0.7,
                        duration: 2.2,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* 1. Top Row: Status Pill with subtle heartbeat pulse */}
                  <div className="flex items-center justify-end w-full z-10">
                    {isUnlocked ? (
                      <motion.span
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: 'easeInOut',
                          delay: idx * 0.3,
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                        style={{
                          backgroundColor: `${badge.accent}18`,
                          border: `1px solid ${badge.accent}40`,
                          color: badge.accent,
                          boxShadow: `0 0 12px ${badge.accent}25`,
                        }}
                      >
                        <span>Earned</span>
                        <span
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-black leading-none text-black"
                          style={{ backgroundColor: badge.accent }}
                        >
                          ✓
                        </span>
                      </motion.span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50">
                        <span>Locked</span>
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      </span>
                    )}
                  </div>

                  {/* 2. Center: Large Circular Multi-Layer Medallion with Modern FX */}
                  <div className="flex justify-center my-3 z-10">
                    <MedallionSVG
                      type={badge.badgeType}
                      accent={badge.accent}
                      unlocked={isUnlocked}
                    />
                  </div>

                  {/* 3. Text & Progress Details */}
                  <div className="w-full z-10">
                    <h3
                      className={`text-base font-bold tracking-tight text-left leading-snug transition-colors ${
                        isUnlocked
                          ? 'text-alabaster group-hover:text-white'
                          : 'text-slate-300'
                      }`}
                    >
                      {badge.title}
                    </h3>
                    <p className="text-xs text-smoke leading-relaxed text-left mt-1 min-h-[34px]">
                      {badge.description}
                    </p>

                    {/* Progress Label & Mini Progress Bar with Travelling Shimmer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                      <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-1.5">
                        <span>{badge.progressText}</span>
                        {isUnlocked && (
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: badge.accent }}
                          >
                            100%
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              Math.max(badge.progressPercent, isUnlocked ? 100 : 4),
                              100
                            )}%`,
                          }}
                          transition={{
                            duration: 1.1,
                            delay: 0.15 + idx * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full rounded-full relative overflow-hidden"
                          style={{
                            background: isUnlocked
                              ? `linear-gradient(90deg, ${badge.accent}, ${badge.gradient[1]})`
                              : badge.accent,
                            boxShadow: isUnlocked
                              ? `0 0 10px ${badge.accent}80`
                              : 'none',
                          }}
                        >
                          {/* Animated traveling light streak across progress bar */}
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{
                              repeat: Infinity,
                              duration: 2.4,
                              ease: 'easeInOut',
                              delay: idx * 0.25,
                            }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty filter notice */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-12 text-smoke text-sm border border-dashed border-rim/60 rounded-3xl">
            No badges found in this category.
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: INTERACTIVE BADGE DETAIL MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121820] border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden space-y-5"
            >
              {/* Luminous ambient glow behind medallion */}
              <div
                className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${selectedBadge.accent} 0%, transparent 70%)`,
                }}
              />

              {/* Medallion Display with Levitation Floating Animation */}
              <div className="flex flex-col items-center text-center space-y-3">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'easeInOut',
                  }}
                >
                  <MedallionSVG
                    type={selectedBadge.badgeType}
                    accent={selectedBadge.accent}
                    unlocked={selectedBadge.unlocked}
                  />
                </motion.div>

                <div>
                  <h4 className="text-lg font-black text-alabaster tracking-tight">
                    {selectedBadge.title}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-0.5 rounded-full mt-2 border ${
                      selectedBadge.unlocked
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    {selectedBadge.unlocked ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />{' '}
                        Milestone Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-400" /> In Progress
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Lore Description */}
              <p className="text-sm text-alabaster/90 text-center leading-relaxed">
                {selectedBadge.description}
              </p>

              {/* Requirement Box */}
              <div className="rounded-2xl bg-[#0B1015] border border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-alabaster uppercase tracking-wider text-[11px]">
                  <Info className="w-3.5 h-3.5 text-sienna" />
                  <span>How to Unlock</span>
                </div>
                <p className="text-smoke leading-normal">
                  {selectedBadge.requirement}
                </p>

                {/* Progress bar inside modal */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
                    <span>Current Progress</span>
                    <span className="text-alabaster font-bold">
                      {selectedBadge.progressText}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          Math.max(selectedBadge.progressPercent, 4),
                          100
                        )}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ backgroundColor: selectedBadge.accent }}
                    >
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.2,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Close Action */}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-alabaster font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
