import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Clock, Users, SkipForward, StopCircle, TrendingUp,
  CheckCircle2, XCircle, BarChart3, Crown, Zap,
} from 'lucide-react';
import type { Question, Player } from '../types';
import type { GameState } from '../types';

interface HostDashboardProps {
  gameState: GameState;
  question: Question | null;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  isAnswerRevealed: boolean;
  players: Player[];
  playerId: string;
  onNextQuestion: () => void;
  onStopGame: () => void;
}

const MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const ANSWER_COLORS = ['#7C3AED', '#0369A1', '#C2410C', '#047857'];
const ANSWER_GLOW  = ['rgba(124,58,237,0.35)', 'rgba(3,105,161,0.35)', 'rgba(194,65,12,0.35)', 'rgba(4,120,87,0.35)'];

export function HostDashboard({
  gameState,
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  isAnswerRevealed,
  players,
  onNextQuestion,
  onStopGame,
}: HostDashboardProps) {
  const [confirmStop, setConfirmStop] = useState(false);

  const activePlayers = players.filter(p => !p.isHost);
  const sortedPlayers = [...activePlayers].sort((a, b) => b.score - a.score);

  const isLast = questionNumber >= totalQuestions;
  const isLeaderboard = gameState === 'LEADERBOARD';

  const progress = question ? timeRemaining / question.timeLimit : 0;
  const isUrgent = timeRemaining <= 5 && !isAnswerRevealed && gameState === 'QUESTION';
  const timerColor = isUrgent
    ? '#EF4444'
    : progress > 0.5
      ? 'var(--color-sienna)'
      : progress > 0.25
        ? '#E67E22'
        : '#C0392B';

  return (
    <main
      role="main"
      aria-label="Host Dashboard"
      className="min-h-screen bg-canvas flex flex-col p-4 sm:p-6"
      style={{ maxWidth: 1100, margin: '0 auto' }}
    >
      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5 pt-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-sienna)' }}>
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-smoke">Host View</p>
            <h1 className="text-lg font-extrabold text-alabaster leading-tight">
              {isLeaderboard ? 'Leaderboard' : 'Question ' + questionNumber + ' of ' + totalQuestions}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-smoke px-3 py-1.5 rounded-lg card">
            <Users className="w-4 h-4" />
            {activePlayers.length}
          </span>

          {!confirmStop ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setConfirmStop(true)}
              id="host-stop-quiz-btn"
              aria-label="Stop quiz"
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#EF4444',
              }}
            >
              <StopCircle className="w-4 h-4" />
              Stop Quiz
            </motion.button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg card border"
              style={{ borderColor: 'rgba(239,68,68,0.5)' }}
            >
              <span className="text-xs font-bold text-alabaster">Are you sure?</span>
              <button
                onClick={() => { setConfirmStop(false); onStopGame(); }}
                className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                id="host-confirm-stop-btn"
              >
                End Now
              </button>
              <button
                onClick={() => setConfirmStop(false)}
                className="text-xs font-semibold px-2 py-0.5 rounded text-smoke hover:text-alabaster transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* LEFT: Question Panel */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Timer (QUESTION state only) */}
          {gameState === 'QUESTION' && question && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest font-bold text-smoke">Time Remaining</span>
                <motion.div
                  animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                  transition={isUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
                  className="flex items-center gap-1.5 font-black text-2xl tabular-nums"
                  style={{ color: timerColor }}
                >
                  <Clock className="w-5 h-5" />
                  {timeRemaining}s
                </motion.div>
              </div>
              <div
                role="progressbar"
                aria-valuenow={timeRemaining}
                aria-valuemin={0}
                aria-valuemax={question.timeLimit}
                className="h-3 rounded-full overflow-hidden bg-rim"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: timerColor }}
                  animate={{ width: (progress * 100) + '%' }}
                  transition={{ duration: 0.95, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}

          {/* Question Card */}
          {question && (
            <motion.section
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card rounded-2xl px-6 py-7 shadow-lg"
              aria-label="Current Question"
            >
              <p className="text-xs uppercase tracking-widest font-bold text-smoke mb-3">
                {isLeaderboard ? 'Last Question' : 'Current Question'}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-alabaster leading-relaxed mb-5">
                {question.text}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correctIndex;
                  const showCorrect = isAnswerRevealed || isLeaderboard;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: showCorrect && isCorrect
                          ? 'linear-gradient(135deg, #059669 0%, #064E3B 100%)'
                          : 'linear-gradient(135deg, ' + ANSWER_COLORS[i] + 'cc 0%, ' + ANSWER_COLORS[i] + '88 100%)',
                        border: showCorrect && isCorrect
                          ? '2px solid #34D399'
                          : '1.5px solid ' + ANSWER_COLORS[i] + '55',
                        boxShadow: showCorrect && isCorrect
                          ? '0 0 18px rgba(52,211,153,0.4)'
                          : '0 2px 10px ' + ANSWER_GLOW[i],
                        opacity: showCorrect && !isCorrect ? 0.55 : 1,
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      >
                        {ANSWER_LABELS[i]}
                      </span>
                      <span className="text-sm font-semibold text-white leading-snug flex-1">{opt}</span>
                      {showCorrect && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {(isAnswerRevealed || isLeaderboard) && question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 px-4 py-3 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
                  >
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Explanation</p>
                    <p className="text-sm text-alabaster leading-relaxed">{question.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={<Users className="w-4 h-4" />} label="Players" value={String(activePlayers.length)} />
            <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Progress" value={questionNumber + '/' + totalQuestions} />
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Leader" value={sortedPlayers[0]?.nickname ?? '\u2014'} small />
          </div>
        </div>

        {/* RIGHT: Live Leaderboard */}
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-80 flex flex-col gap-4"
          aria-label="Live Leaderboard"
        >
          <div className="card rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-rim)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-sienna)' }}>
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-alabaster">Live Leaderboard</p>
                <p className="text-xs text-smoke">{activePlayers.length} players</p>
              </div>
            </div>

            <div role="list" aria-label="Player rankings" className="flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
              <AnimatePresence>
                {sortedPlayers.map((player, rank) => (
                  <motion.div
                    key={player.id}
                    layout
                    role="listitem"
                    aria-label={'Rank ' + (rank + 1) + ': ' + player.nickname + ', ' + player.score.toLocaleString() + ' points'}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ layout: { type: 'spring', stiffness: 350, damping: 34 }, delay: rank * 0.04 }}
                    className="flex items-center gap-3 px-5 py-3 transition-colors"
                    style={{ borderBottom: rank < sortedPlayers.length - 1 ? '1px solid var(--color-rim)' : 'none' }}
                  >
                    <div className="w-7 text-center shrink-0">
                      {MEDALS[rank]
                        ? <span className="text-sm leading-none">{MEDALS[rank]}</span>
                        : <span className="text-xs font-bold text-smoke">{rank + 1}</span>}
                    </div>

                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.nickname[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-alabaster truncate">{player.nickname}</p>
                      {player.streak > 1 && (
                        <div className="flex items-center gap-1 text-xs font-medium mt-0.5"
                          style={{ color: 'var(--color-sienna)' }}>
                          <Zap className="w-3 h-3" />
                          {player.streak}x streak
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-alabaster">
                        {player.score.toLocaleString()}
                      </p>
                      {player.lastScoreDelta != null && player.lastScoreDelta > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-semibold"
                          style={{ color: '#27AE60' }}
                        >
                          +{player.lastScoreDelta.toLocaleString()}
                        </motion.p>
                      )}
                      {player.lastAnswerCorrect === false && (
                        <p className="text-xs font-medium" style={{ color: '#C0392B' }}>+0</p>
                      )}
                    </div>

                    {player.lastAnswerCorrect !== undefined && (
                      <div className="shrink-0">
                        {player.lastAnswerCorrect
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {activePlayers.length === 0 && (
                <div className="flex items-center justify-center h-24 text-sm text-smoke">
                  No players joined yet
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <AnimatePresence>
            {isLeaderboard && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex flex-col gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextQuestion}
                  id="host-next-question-btn"
                  aria-label={isLast ? 'See Final Results' : 'Next Question'}
                  className="btn-primary w-full justify-center !px-5"
                >
                  {isLast ? 'See Final Results' : 'Next Question'}
                  {!isLast && <SkipForward className="w-4 h-4 ml-1" />}
                </motion.button>
                <p className="text-xs text-center text-smoke">
                  {isLast
                    ? 'Moving to final results… or click button above'
                    : `Auto-advancing to question ${questionNumber + 1}… or click Next`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {gameState === 'QUESTION' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card rounded-2xl px-5 py-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(209,88,54,0.12)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-sienna)' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-alabaster mb-0.5">Question in Progress</p>
                  <p className="text-xs text-smoke leading-relaxed">
                    {activePlayers.length === 0
                      ? 'Waiting for players…'
                      : (activePlayers.filter(p => p.hasAnswered).length >= activePlayers.length)
                        ? 'All players have answered! Updating leaderboard…'
                        : `${activePlayers.filter(p => p.hasAnswered).length} of ${activePlayers.length} player${activePlayers.length !== 1 ? 's' : ''} answered. Advances immediately when all answer.`}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNextQuestion}
                id="host-skip-question-btn"
                aria-label={isLast ? 'End & See Results' : 'Skip to Next Question'}
                className="btn-secondary w-full justify-center !py-2 text-xs font-semibold"
              >
                {isLast ? 'End & See Results' : 'Skip to Next Question'}
                <SkipForward className="w-3.5 h-3.5 ml-1" />
              </motion.button>
            </motion.div>
          )}
        </motion.aside>
      </div>
    </main>
  );
}

function StatCard({
  icon, label, value, small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-smoke"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-bold text-smoke">{label}</p>
        <p className={'font-extrabold text-alabaster truncate ' + (small ? 'text-sm' : 'text-base')}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}
