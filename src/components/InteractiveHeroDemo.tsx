import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Zap, Trophy, Clock, Sparkles,
  RotateCcw, ArrowRight, Flame, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveHeroDemoProps {
  onHost: () => void;
  onJoin: () => void;
}

interface DemoQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 1,
    category: 'AI & Machine Learning',
    question: 'Which architecture revolutionized modern generative AI models?',
    options: [
      'Convolutional Networks',
      'Transformer Architecture',
      'Recurrent Networks',
      'Random Forests'
    ],
    correctIndex: 1,
    explanation: 'Transformers use self-attention mechanisms to process text tokens in parallel!',
  },
  {
    id: 2,
    category: 'Astrophysics & Space',
    question: 'What is the largest planet in our solar system by mass and volume?',
    options: [
      'Saturn',
      'Jupiter',
      'Neptune',
      'Uranus'
    ],
    correctIndex: 1,
    explanation: 'Jupiter is more than twice as massive as all other planets combined!',
  },
  {
    id: 3,
    category: 'Earth Science',
    question: 'What is the primary gas that comprises ~78% of Earth’s atmosphere?',
    options: [
      'Oxygen',
      'Nitrogen',
      'Carbon Dioxide',
      'Argon'
    ],
    correctIndex: 1,
    explanation: 'Nitrogen makes up ~78% of Earth’s atmosphere, followed by Oxygen at ~21%.',
  },
];

const PAD_COLORS = [
  { bg: '#C0392B', active: '#E74C3C', border: '#E74C3C', letter: 'A' },
  { bg: '#1A6B8A', active: '#2980B9', border: '#2980B9', letter: 'B' },
  { bg: '#1E6B45', active: '#27AE60', border: '#27AE60', letter: 'C' },
  { bg: '#B8690A', active: '#E67E22', border: '#E67E22', letter: 'D' },
];

export function InteractiveHeroDemo({ onHost, onJoin }: InteractiveHeroDemoProps) {
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(18);
  const [userScore, setUserScore] = useState(1720);
  const [displayScore, setDisplayScore] = useState(1720);
  const [streak, setStreak] = useState(3);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const currentQ = DEMO_QUESTIONS[qIndex];

  // Countdown timer when not answered
  useEffect(() => {
    if (isRevealed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 20; // loop timer for demo if untouched
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRevealed, qIndex]);

  // Smooth animated number rollup when userScore changes
  useEffect(() => {
    if (displayScore === userScore) return;
    const diff = userScore - displayScore;
    const step = Math.ceil(diff / 15);
    const interval = setInterval(() => {
      setDisplayScore(prev => {
        const next = prev + step;
        if (next >= userScore) {
          clearInterval(interval);
          return userScore;
        }
        return next;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [userScore, displayScore]);

  // Handle answer click
  const handleSelectOption = (idx: number) => {
    if (isRevealed) return;
    setHasInteracted(true);
    setSelectedAnswer(idx);
    setIsRevealed(true);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      // Calculate realistic score: Base 1,000 + Time bonus (timeLeft * 45) * Streak multiplier
      const timeBonus = timeLeft * 45;
      const streakBonusMultiplier = 1 + (streak * 0.1);
      const delta = Math.round((1000 + timeBonus) * streakBonusMultiplier);

      setLastDelta(delta);
      setUserScore(prev => prev + delta);
      setStreak(prev => prev + 1);

      // Trigger celebratory confetti burst from the card position
      try {
        const rect = cardRef.current?.getBoundingClientRect();
        const originX = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.7;
        const originY = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.4;

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: originX, y: originY },
          colors: ['#E07A5F', '#4ADE80', '#F59E0B', '#38BDF8', '#FFFFFF'],
          disableForReducedMotion: true,
        });
      } catch {
        // Confetti fallback
      }
    } else {
      setLastDelta(0);
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    setQIndex(prev => (prev + 1) % DEMO_QUESTIONS.length);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setTimeLeft(18);
    setLastDelta(null);
  };

  const handleResetDemo = () => {
    setQIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setTimeLeft(18);
    setUserScore(1720);
    setDisplayScore(1720);
    setStreak(3);
    setLastDelta(null);
    setHasInteracted(false);
  };

  // Dynamic Leaderboard sorting based on live score!
  const leaderboardPlayers = [
    { id: 'alice', name: 'Alice', score: 2100, avatar: 'A', color: '#EC4899', isMe: false },
    { id: 'bob', name: 'Bob', score: 1850, avatar: 'B', color: '#3B82F6', isMe: false },
    { id: 'you', name: 'You', score: displayScore, avatar: 'Y', color: 'var(--color-sienna)', isMe: true },
  ].sort((a, b) => b.score - a.score);

  const yourRank = leaderboardPlayers.findIndex(p => p.isMe) + 1;

  return (
    <div className="relative w-full max-w-md mx-auto" ref={cardRef}>
      {/* ── Ambient Background Glow ──────────────────────────────────── */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none transition-all duration-700"
        style={{
          background: isRevealed && selectedAnswer === currentQ.correctIndex
            ? 'radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, rgba(224, 122, 95, 0.2) 60%, transparent 80%)'
            : 'radial-gradient(circle, rgba(224, 122, 95, 0.3) 0%, rgba(139, 92, 246, 0.1) 60%, transparent 80%)',
        }}
      />

      {/* ── Interactive Pointer Guide (Visible before first interaction) ── */}
      {!hasInteracted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{
            y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            opacity: { duration: 0.3 }
          }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sienna to-amber-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(224,122,95,0.4)] select-none whitespace-nowrap cursor-default border border-white/20 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Interactive Demo — Click an answer!</span>
        </motion.div>
      )}

      {/* ── Floating Live Leaderboard Widget ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        className="absolute -right-2 sm:-right-8 -top-8 z-20 p-4 min-w-[160px] shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 rounded-2xl bg-elevated/80"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-rim">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-sienna" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-smoke">Live Standings</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex flex-col gap-1.5">
          {leaderboardPlayers.map((player, idx) => (
            <motion.div
              key={player.id}
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs transition-colors ${
                player.isMe
                  ? 'bg-sienna-wash text-sienna font-bold border border-sienna/20'
                  : 'text-alabaster font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[11px] select-none">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span className="truncate">{player.name}</span>
              </div>
              <span className="tabular-nums text-[11px] font-semibold text-smoke">
                {player.score.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Floating Streak & Score Badge ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
        className="absolute -left-2 sm:-left-8 -bottom-6 z-20 px-4 py-3 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 rounded-2xl bg-elevated/80 backdrop-blur-xl"
      >
        <div className="w-7 h-7 rounded-lg bg-sienna-wash flex items-center justify-center text-sienna">
          <Flame className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-smoke">
            Your Score
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-alabaster tabular-nums">
              {displayScore.toLocaleString()} pts
            </span>
            {lastDelta !== null && lastDelta > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 4, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded"
              >
                +{lastDelta}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── MAIN QUIZ CARD ───────────────────────────────────────────── */}
      <motion.div
        className="rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 border border-white/10 overflow-hidden bg-elevated/60 backdrop-blur-xl"
      >
        {/* Subtle Inner Highlight */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/5 mix-blend-overlay" />

        {/* Card Header: Category & Timer */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="badge text-[10px] !py-0.5 !px-2 font-bold tracking-wide">
            {currentQ.category}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-sienna tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Question Counter & Timer Bar */}
        <div className="h-1.5 w-full bg-rim rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-sienna"
            animate={{ width: `${(timeLeft / 20) * 100}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>

        {/* Question Text */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={qIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="min-h-[64px] mb-6"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-smoke mb-2 block flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sienna"></span>
              Sample Question {qIndex + 1} of {DEMO_QUESTIONS.length}
            </span>
            <h3 className="text-alabaster font-extrabold text-base sm:text-lg leading-relaxed">
              {currentQ.question}
            </h3>
          </motion.div>
        </AnimatePresence>

        {/* 2×2 Answer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 relative z-10">
          {currentQ.options.map((option, idx) => {
            const pad = PAD_COLORS[idx];
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let buttonBg = pad.bg;
            let ring = 'none';
            let opacity = 1;

            if (isRevealed) {
              if (isCorrect) {
                buttonBg = '#1E6B45'; // Emerald green for correct
                ring = '0 0 0 2px #4ADE80';
              } else if (isSelected && !isCorrect) {
                buttonBg = '#991B1B'; // Dark red for wrong
                ring = '0 0 0 2px #F87171';
              } else {
                opacity = 0.35; // Dim others
              }
            }

            return (
              <motion.button
                key={`${qIndex}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: opacity, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={!isRevealed ? { 
                  scale: 1.02, 
                  y: -2,
                  boxShadow: `0 10px 25px -5px ${buttonBg}80`,
                  filter: 'brightness(1.15)'
                } : {}}
                whileTap={!isRevealed ? { scale: 0.98, y: 0 } : {}}
                onClick={() => handleSelectOption(idx)}
                disabled={isRevealed}
                style={{
                  backgroundColor: buttonBg,
                  boxShadow: ring !== 'none' ? ring : `inset 0 2px 0 0 rgba(255,255,255,0.1), inset 0 -4px 0 0 rgba(0,0,0,0.2)`,
                }}
                className={`relative p-4 sm:p-5 rounded-2xl text-left font-semibold text-white transition-colors duration-300 cursor-pointer overflow-hidden ${
                  isRevealed ? 'cursor-default' : ''
                }`}
              >
                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <span className="w-7 h-7 rounded-lg bg-black/30 shadow-inner flex items-center justify-center text-sm font-extrabold flex-shrink-0 backdrop-blur-sm border border-white/10">
                    {pad.letter}
                  </span>
                  <span className="text-sm sm:text-base font-bold leading-snug line-clamp-2 text-shadow-sm">
                    {option}
                  </span>
                </div>

                {/* State Icons */}
                <AnimatePresence>
                  {isRevealed && isCorrect && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                  {isRevealed && isSelected && !isCorrect && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* ── Interactive Results & Controls Area ──────────────────────── */}
        <AnimatePresence mode="wait">
          {isRevealed ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-rim"
            >
              {/* Feedback Banner */}
              <div
                className={`p-3 rounded-xl mb-3 text-xs flex items-start gap-2.5 ${
                  selectedAnswer === currentQ.correctIndex
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedAnswer === currentQ.correctIndex ? (
                  <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold mb-0.5 text-inherit">
                    {selectedAnswer === currentQ.correctIndex
                      ? `🎉 Correct! You earned +${lastDelta} points (Rank #${yourRank})`
                      : `Nice try! The correct answer was "${currentQ.options[currentQ.correctIndex]}".`}
                  </p>
                  <p className="text-[11px] opacity-85 leading-relaxed text-inherit">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary text-xs !py-2 flex-1 flex items-center justify-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetDemo}
                  className="btn-ghost text-xs !py-2 px-3 flex items-center gap-1"
                  title="Reset Demo"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-smoke" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unrevealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-2 text-center"
            >
              <p className="text-[11px] text-smoke flex items-center justify-center gap-1.5">
                <Zap className="w-3 h-3 text-sienna" />
                Faster answers award up to 2× speed & streak multipliers
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
