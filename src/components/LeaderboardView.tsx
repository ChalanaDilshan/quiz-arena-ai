import { motion } from 'framer-motion';
import { Trophy, ChevronRight, TrendingUp } from 'lucide-react';
import type { Player } from '../types';

interface LeaderboardViewProps {
  players: Player[];
  currentQuestionIndex: number;
  totalQuestions: number;
  isHost: boolean;
  playerId: string;
  onNextQuestion: () => void;
}

export function LeaderboardView({
  players, currentQuestionIndex, totalQuestions, playerId, onNextQuestion,
}: LeaderboardViewProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const isLast = currentQuestionIndex >= totalQuestions - 1;
  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sienna">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-alabaster">Leaderboard</h2>
          </div>
          <p className="text-sm text-smoke pl-[2.625rem]">
            After question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Rankings */}
        <div className="card rounded-2xl mb-5 overflow-hidden">
          {sorted.map((player, rank) => {
            const isMe = player.id === playerId;
            return (
              <motion.div
                key={player.id} layout
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ layout: { type: 'spring', stiffness: 350, damping: 34 }, delay: rank * 0.05 }}
                className="relative flex items-center gap-3 px-4 py-3.5 transition-colors"
                style={{
                  borderBottom: rank < sorted.length - 1 ? '1px solid var(--color-rim)' : 'none',
                  background: isMe ? 'var(--color-sienna-wash)' : 'transparent',
                }}
              >
                {/* Left accent bar for current player */}
                {isMe && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-sienna" />
                )}

                <div className="w-7 flex-shrink-0 text-center">
                  {medals[rank]
                    ? <span className="text-base leading-none">{medals[rank]}</span>
                    : <span className="text-xs font-bold text-smoke">{rank + 1}</span>}
                </div>

                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: player.avatarColor }}>
                  {player.nickname[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: isMe ? 'var(--color-sienna)' : 'var(--color-alabaster)' }}>
                    {player.nickname}
                    {isMe && <span className="text-xs font-normal text-smoke ml-1.5">(you)</span>}
                  </p>
                  {player.streak > 1 && (
                    <div className="flex items-center gap-1 text-xs mt-0.5 font-medium text-sienna">
                      <TrendingUp className="w-3 h-3" />{player.streak}× streak
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold tabular-nums text-alabaster">
                    {player.score.toLocaleString()}
                  </p>
                  {player.lastScoreDelta != null && player.lastScoreDelta > 0 && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold" style={{ color: '#27AE60' }}>
                      +{player.lastScoreDelta.toLocaleString()}
                    </motion.p>
                  )}
                  {player.lastAnswerCorrect === false && (
                    <p className="text-xs font-medium" style={{ color: '#C0392B' }}>+0</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onNextQuestion} className="btn-primary !px-8">
            {isLast ? 'See Final Results' : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
          {!isLast && (
            <p className="text-xs mt-3 text-smoke">
              {totalQuestions - currentQuestionIndex - 1} question
              {totalQuestions - currentQuestionIndex - 1 !== 1 ? 's' : ''} left
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
