import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { XpStats } from '../utils/xpLevels';
import { XP_LEVELS } from '../utils/xpLevels';

interface XpBadgeProps {
  stats: XpStats;
  /** Compact pill mode (used inline). Full mode shows progress bar. */
  compact?: boolean;
}

export function XpBadge({ stats, compact = false }: XpBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { level, totalGames, gamesUntilNext, progress } = stats;
  const [g1, g2] = level.gradient;

  // ── Compact pill ─────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold select-none cursor-default"
          style={{
            background: `linear-gradient(135deg, ${g1}, ${g2})`,
            color: '#fff',
            boxShadow: `0 2px 8px -2px ${level.accent}60`,
          }}
          aria-label={`XP Level: ${level.title}`}
        >
          <span className="leading-none">{level.icon}</span>
          <span className="leading-none tracking-wide">{level.title}</span>
        </motion.span>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              role="tooltip"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            >
              <XpTooltipCard stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Full badge (used in the sign-in banner) ───────────────────────────────
  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="flex items-center gap-2.5 cursor-default select-none"
        aria-label={`XP Level: ${level.title} — ${totalGames} quiz${totalGames !== 1 ? 'zes' : ''} hosted`}
      >
        {/* Icon bubble */}
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 5, duration: 0.6, ease: 'easeInOut' }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${g1}, ${g2})`,
            boxShadow: `0 0 10px ${level.accent}50`,
          }}
        >
          {level.icon}
        </motion.div>

        {/* Text + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className="text-[11px] font-extrabold tracking-wide"
              style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {level.title}
            </span>
            <span className="text-[9px] font-semibold text-smoke tabular-nums">
              {totalGames} game{totalGames !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--color-rim)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }}
            />
          </div>

          {gamesUntilNext != null && (
            <p className="text-[9px] text-smoke mt-0.5 leading-none">
              {gamesUntilNext} more to{' '}
              <span className="font-semibold" style={{ color: XP_LEVELS[level.rank + 1]?.accent }}>
                {XP_LEVELS[level.rank + 1]?.title}
              </span>
            </p>
          )}
          {gamesUntilNext === null && (
            <p className="text-[9px] font-semibold mt-0.5" style={{ color: level.accent }}>
              Max level reached! 🎉
            </p>
          )}
        </div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className="absolute bottom-full left-0 mb-2 z-50 pointer-events-none"
          >
            <XpTooltipCard stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Internal tooltip card ─────────────────────────────────────────────────────

function XpTooltipCard({ stats }: { stats: XpStats }) {
  const { level, totalGames } = stats;
  const [g1, g2] = level.gradient;

  return (
    <div
      className="rounded-xl border p-3 min-w-[160px] shadow-xl"
      style={{
        background: 'var(--color-elevated)',
        borderColor: `${level.accent}40`,
        boxShadow: `0 8px 32px -8px ${level.accent}40`,
      }}
    >
      {/* All tiers mini-list */}
      <p className="text-[9px] uppercase tracking-widest font-bold text-smoke mb-2">XP Levels</p>
      <div className="space-y-1">
        {XP_LEVELS.map((l) => {
          const isActive = l.rank === level.rank;
          const isUnlocked = totalGames >= l.minGames;
          const [lg1, lg2] = l.gradient;
          return (
            <div
              key={l.rank}
              className="flex items-center gap-1.5"
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className="text-[10px] w-4 text-center"
                style={{ opacity: isUnlocked ? 1 : 0.3 }}
              >
                {l.icon}
              </span>
              <span
                className="text-[10px] font-semibold flex-1"
                style={{
                  background: isUnlocked ? `linear-gradient(90deg, ${lg1}, ${lg2})` : undefined,
                  WebkitBackgroundClip: isUnlocked ? 'text' : undefined,
                  WebkitTextFillColor: isUnlocked ? 'transparent' : undefined,
                  color: isUnlocked ? undefined : 'var(--color-rim)',
                }}
              >
                {l.title}
              </span>
              <span className="text-[9px] text-smoke">{l.minGames}+</span>
              {isActive && (
                <span
                  className="text-[8px] font-bold px-1 rounded-full text-white"
                  style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }}
                >
                  YOU
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-smoke mt-2 border-t pt-1.5" style={{ borderColor: 'var(--color-rim)' }}>
        {level.description}
      </p>
    </div>
  );
}
