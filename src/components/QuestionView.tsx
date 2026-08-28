import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, Zap } from 'lucide-react';
import type { Question } from '../types';

interface QuestionViewProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  selectedAnswer: number | null;
  isAnswerRevealed: boolean;
  streak: number;
  onSubmitAnswer: (index: number) => void;
}

// Answer pads — vivid fills; these stay the same in both themes
const PADS = [
  { bg: '#C0392B', active: '#E74C3C', label: 'A' },
  { bg: '#1A6B8A', active: '#2980B9', label: 'B' },
  { bg: '#1E6B45', active: '#27AE60', label: 'C' },
  { bg: '#B8690A', active: '#E67E22', label: 'D' },
];

type PadState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

export function QuestionView({
  question, questionNumber, totalQuestions,
  timeRemaining, selectedAnswer, isAnswerRevealed, streak, onSubmitAnswer,
}: QuestionViewProps) {
  const progress = timeRemaining / question.timeLimit;
  const timerColor = progress > 0.5 ? 'var(--color-sienna)' : progress > 0.25 ? '#E67E22' : '#C0392B';

  const getState = (i: number): PadState => {
    if (!isAnswerRevealed && selectedAnswer === null) return 'default';
    if (!isAnswerRevealed && selectedAnswer === i) return 'selected';
    if (isAnswerRevealed && i === question.correctIndex) return 'correct';
    if (isAnswerRevealed && selectedAnswer === i && i !== question.correctIndex) return 'incorrect';
    if (isAnswerRevealed) return 'dimmed';
    return 'default';
  };

  const disabled = selectedAnswer !== null || isAnswerRevealed;

  return (
    <div className="min-h-screen bg-canvas flex flex-col p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Meta row */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-4 mb-3">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-smoke">
          Q{questionNumber}<span className="text-rim mx-1">/</span>{totalQuestions}
        </span>
        {streak > 1 && (
          <motion.span key={streak} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="badge">
            <Zap className="w-3 h-3" />{streak}× streak
          </motion.span>
        )}
        <div className="flex items-center gap-1.5 text-sm font-bold tabular-nums" style={{ color: timerColor }}>
          <Clock className="w-4 h-4" />{timeRemaining}s
        </div>
      </motion.div>

      {/* Timer track */}
      <div className="h-[3px] rounded-full overflow-hidden mb-8 bg-rim">
        <motion.div className="h-full rounded-full" style={{ background: timerColor }}
          animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.95, ease: 'linear' }} />
      </div>

      {/* Question card */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="card rounded-2xl px-6 py-8 mb-5 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-alabaster leading-relaxed">{question.text}</h2>
      </motion.div>

      {/* 2×2 Answer grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 mb-6">
        {question.options.map((option, i) => {
          const state = getState(i);
          const pad = PADS[i];
          const bgColor =
            state === 'correct' ? '#1E6B45' : state === 'incorrect' ? '#6B1E1E' :
            state === 'selected' ? pad.active : pad.bg;
          const opacity = state === 'dimmed' ? 0.22 : 1;
          const ringStyle =
            state === 'selected' ? '0 0 0 2px rgba(255,255,255,0.35)' :
            state === 'correct' ? '0 0 0 2px rgba(39,174,96,0.5)' :
            state === 'incorrect' ? '0 0 0 2px rgba(192,57,43,0.5)' : 'none';

          return (
            <motion.button key={i}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={!disabled ? { scale: 1.015, y: -1 } : {}} whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => !disabled && onSubmitAnswer(i)} disabled={disabled}
              style={{ background: bgColor, opacity, boxShadow: ringStyle, borderRadius: '10px' }}
              className="relative p-5 sm:p-6 text-left font-semibold text-white transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {pad.label}
                </span>
                <span className="text-sm sm:text-base leading-snug">{option}</span>
              </div>
              <AnimatePresence>
                {state === 'correct' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
                {state === 'incorrect' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <X className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswerRevealed && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-xs pb-4 font-medium text-smoke">
            Loading leaderboard…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
