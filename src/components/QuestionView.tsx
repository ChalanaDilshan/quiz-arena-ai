import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, Zap, Sparkles } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import type { Question } from '../types';
import { playCorrectSound, playWrongSound } from '../utils/sounds';
import { HintBubble } from './HintBubble';

interface QuestionViewProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  selectedAnswer: number | null;
  isAnswerRevealed: boolean;
  streak: number;
  onSubmitAnswer: (index: number) => void;
  // Hint Master
  hint: string | null;
  hintLoading: boolean;
  hintUsed: boolean;
  onRequestHint: () => void;
}

// Quiz Arena Bespoke Answer Pads — WCAG AAA-compliant fills (≥7.0:1 contrast)
// Unique visual signature: Hexagon (Amethyst), Diamond (Cerulean), Star (Terracotta), Square (Emerald).
// Breaks away from generic primary-color palettes while preserving intuitive dual-coding.
const PADS = [
  {
    bg: '#4A1570',
    gradient: 'linear-gradient(135deg, #581C87 0%, #3B0764 100%)',
    active: '#6B21A8',
    border: 'rgba(168, 85, 247, 0.45)',
    glow: 'rgba(168, 85, 247, 0.3)',
    accentColor: '#C084FC',
    label: 'A',
    key: '1',
    shape: '⬢',
    shapeName: 'Hexagon',
  },
  {
    bg: '#075985',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0C4A6E 100%)',
    active: '#0284C7',
    border: 'rgba(56, 189, 248, 0.45)',
    glow: 'rgba(56, 189, 248, 0.3)',
    accentColor: '#38BDF8',
    label: 'B',
    key: '2',
    shape: '◆',
    shapeName: 'Diamond',
  },
  {
    bg: '#9A3412',
    gradient: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)',
    active: '#EA580C',
    border: 'rgba(251, 146, 60, 0.45)',
    glow: 'rgba(251, 146, 60, 0.3)',
    accentColor: '#FB923C',
    label: 'C',
    key: '3',
    shape: '★',
    shapeName: 'Star',
  },
  {
    bg: '#065F46',
    gradient: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
    active: '#059669',
    border: 'rgba(52, 211, 153, 0.45)',
    glow: 'rgba(52, 211, 153, 0.3)',
    accentColor: '#34D399',
    label: 'D',
    key: '4',
    shape: '■',
    shapeName: 'Square',
  },
];

type PadState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

export function QuestionView({
  question, questionNumber, totalQuestions,
  timeRemaining, selectedAnswer, isAnswerRevealed, streak, onSubmitAnswer,
  hint, hintLoading, hintUsed, onRequestHint,
}: QuestionViewProps) {
  const progress = timeRemaining / question.timeLimit;
  const isUrgent = timeRemaining <= 5 && !isAnswerRevealed;
  const timerColor = isUrgent
    ? '#EF4444'
    : progress > 0.5
      ? 'var(--color-sienna)'
      : progress > 0.25
        ? '#E67E22'
        : '#C0392B';

  const getState = (i: number): PadState => {
    if (!isAnswerRevealed && selectedAnswer === null) return 'default';
    if (!isAnswerRevealed && selectedAnswer === i) return 'selected';
    if (isAnswerRevealed && i === question.correctIndex) return 'correct';
    if (isAnswerRevealed && selectedAnswer === i && i !== question.correctIndex) return 'incorrect';
    if (isAnswerRevealed) return 'dimmed';
    return 'default';
  };

  const disabled = selectedAnswer !== null || isAnswerRevealed;

  // Keyboard navigation: 1-4 or A-D to answer, H for hint
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if focus is in an input or textarea
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

    if (!disabled) {
      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onSubmitAnswer(0);
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onSubmitAnswer(1);
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        onSubmitAnswer(2);
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onSubmitAnswer(3);
      }
    }

    if ((e.key === 'h' || e.key === 'H') && !hintUsed && !hintLoading && !disabled) {
      e.preventDefault();
      onRequestHint();
    }
  }, [disabled, onSubmitAnswer, hintUsed, hintLoading, onRequestHint]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isAnswerRevealed && selectedAnswer !== null) {
      if (selectedAnswer === question.correctIndex) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    }
  }, [isAnswerRevealed, selectedAnswer, question.correctIndex]);

  // Screen-reader announcement message for live result
  const announcementText = isAnswerRevealed
    ? selectedAnswer === question.correctIndex
      ? `Correct! You answered Option ${PADS[selectedAnswer].label}: ${question.options[selectedAnswer]}.`
      : selectedAnswer !== null
        ? `Incorrect. You chose Option ${PADS[selectedAnswer].label}. The correct answer was Option ${PADS[question.correctIndex].label}: ${question.options[question.correctIndex]}.`
        : `Time is up! The correct answer was Option ${PADS[question.correctIndex].label}: ${question.options[question.correctIndex]}.`
    : '';

  return (
    <main
      role="main"
      aria-label={`Question ${questionNumber} of ${totalQuestions}`}
      className="min-h-screen bg-canvas flex flex-col p-4 sm:p-6 max-w-3xl mx-auto"
    >
      {/* Live accessibility announcement region */}
      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcementText}
      </div>

      {/* Meta row */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-4 mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-bold text-smoke">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-smoke/70 px-2 py-0.5 rounded bg-white/5 border border-white/10">
            Press keys 1–4 to answer
          </span>
        </div>

        {streak > 1 && (
          <motion.span
            key={streak}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="badge"
            aria-label={`${streak} streak`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            {streak}× streak
          </motion.span>
        )}

        {/* Timer */}
        <motion.div
          animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
          transition={isUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
          className="flex items-center gap-1.5 text-sm font-bold tabular-nums"
          style={{ color: timerColor }}
          aria-label={`${timeRemaining} seconds remaining`}
        >
          <Clock className="w-4 h-4" />
          <span>{timeRemaining}s</span>
        </motion.div>
      </motion.div>

      {/* Accessible Timer Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={timeRemaining}
        aria-valuemin={0}
        aria-valuemax={question.timeLimit}
        aria-label="Time remaining progress bar"
        className="h-[4px] rounded-full overflow-hidden mb-7 bg-rim"
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: timerColor }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.95, ease: 'linear' }}
        />
      </div>

      {/* Question Card */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="card rounded-2xl px-6 py-8 mb-5 text-center shadow-lg"
        aria-label="Current Question"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-alabaster leading-relaxed">
          {question.text}
        </h2>
      </motion.section>

      {/* Hint Master bubble */}
      <HintBubble
        hintUsed={hintUsed}
        hintLoading={hintLoading}
        hint={hint}
        disabled={selectedAnswer !== null || isAnswerRevealed}
        onRequestHint={onRequestHint}
      />

      {/* 2×2 Answer grid with full ARIA radiogroup semantics */}
      <div
        role="radiogroup"
        aria-label="Answer choices"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 mb-6"
      >
        {question.options.map((option, i) => {
          const state = getState(i);
          const pad = PADS[i];
          const isUserChoice = selectedAnswer === i;
          const isCorrectAnswer = i === question.correctIndex;

          const bgStyle =
            state === 'correct'
              ? 'linear-gradient(135deg, #059669 0%, #064E3B 100%)'
              : state === 'incorrect'
                ? 'linear-gradient(135deg, #881337 0%, #4C0519 100%)'
                : state === 'selected'
                  ? pad.gradient
                  : pad.gradient;
          const opacity = state === 'dimmed' ? 0.22 : 1;

          // Multi-sensory borders & ring styles (not reliant on color alone)
          const borderStyle =
            state === 'correct'
              ? '3px solid #34D399' // Solid bold emerald border for correct
              : state === 'incorrect'
                ? '3px dashed #FB7185' // Dashed bold rose border for incorrect
                : state === 'selected'
                  ? '3px solid rgba(255,255,255,0.85)'
                  : `1.5px solid ${pad.border}`;

          const shadowStyle =
            state === 'correct'
              ? '0 0 24px rgba(52, 211, 153, 0.45)'
              : state === 'incorrect'
                ? '0 0 20px rgba(251, 113, 133, 0.35)'
                : state === 'selected'
                  ? `0 0 22px ${pad.glow}, 0 4px 14px rgba(0,0,0,0.35)`
                  : '0 4px 14px rgba(0,0,0,0.18)';

          // Tactile animation for wrong vs correct
          const shakeAnim = state === 'incorrect' ? { x: [-4, 4, -3, 3, 0] } : {};
          const bounceAnim = state === 'correct' ? { scale: [1, 1.025, 1] } : {};

          return (
            <motion.button
              key={i}
              role="radio"
              aria-checked={isUserChoice}
              aria-label={`Option ${pad.label} (${pad.shapeName}): ${option}${
                isAnswerRevealed
                  ? isCorrectAnswer
                    ? ' — Correct Answer'
                    : isUserChoice
                      ? ' — Your Choice, Incorrect'
                      : ''
                  : ''
              }`}
              tabIndex={disabled ? -1 : 0}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity, y: 0, ...shakeAnim, ...bounceAnim }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={!disabled ? { scale: 1.015, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => !disabled && onSubmitAnswer(i)}
              disabled={disabled}
              style={{
                background: bgStyle,
                border: borderStyle,
                boxShadow: shadowStyle,
                borderRadius: '12px',
              }}
              className="relative p-5 sm:p-6 text-left font-semibold text-white transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60 overflow-hidden"
            >
              {/* Subtle top edge highlight */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <div className="flex items-start gap-3">
                {/* Dual-shape & letter badge */}
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-inner border border-white/20 transition-transform"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
                  }}
                  title={`${pad.shapeName} ${pad.label}`}
                >
                  <span className="mr-0.5 text-[11px]" style={{ color: pad.accentColor }}>{pad.shape}</span>
                  <span className="text-white">{pad.label}</span>
                </span>

                <div className="flex-1 min-w-0 pr-8">
                  <span className="text-sm sm:text-base leading-snug font-bold block text-white drop-shadow-sm">
                    {option}
                  </span>
                </div>
              </div>

              {/* Keyboard shortcut pill */}
              {!isAnswerRevealed && (
                <span
                  className="absolute bottom-2.5 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/25 text-white/70 border border-white/10"
                  aria-hidden="true"
                >
                  [{pad.key}]
                </span>
              )}

              {/* Multi-sensory Explicit Status Badges (Colorblind-Safe) */}
              <AnimatePresence>
                {isAnswerRevealed && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {state === 'correct' && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Correct</span>
                      </motion.span>
                    )}

                    {state === 'incorrect' && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Your Choice</span>
                      </motion.span>
                    )}

                    {/* If this option is the correct answer and the user chose something else */}
                    {state === 'dimmed' && isCorrectAnswer && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-md"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Correct Answer</span>
                      </motion.span>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswerRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pb-4"
          >
            <p className="text-xs font-semibold text-smoke">
              {selectedAnswer === question.correctIndex
                ? 'Nicely done! Preparing next round…'
                : 'Review the correct answer above. Loading leaderboard…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

