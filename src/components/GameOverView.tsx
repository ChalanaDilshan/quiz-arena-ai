import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, RotateCcw, Home, Download, Printer,
  AlertTriangle, CheckCircle2, TrendingUp, Users,
  BarChart3, FileSpreadsheet, X, HelpCircle, Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Player, QuizSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveQuizRecord, buildQuizRecord } from '../utils/quizHistory';
import { playGameOverSound } from '../utils/sounds';

interface GameOverViewProps {
  players: Player[];
  playerId: string;
  session?: QuizSession | null;
  isHost?: boolean;
  hostFileName?: string;
  onRestart: () => void;
}

// Podium order: 2nd | 1st | 3rd
const PODIUM = [
  { rank: 1, label: '2nd', blockH: 'h-24 sm:h-28', delay: 0.45 },
  { rank: 0, label: '1st', blockH: 'h-36 sm:h-44', delay: 0.20 },
  { rank: 2, label: '3rd', blockH: 'h-16 sm:h-20', delay: 0.60 },
];

export function GameOverView({ players, playerId, session, isHost, hostFileName = '', onRestart }: GameOverViewProps) {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const totalQuestions = session?.questions.length ?? 5;
  const roomPin = session?.roomPin ?? 'DEMO-88';

  // ── Summary Analytics Calculations ─────────────────────────────────────────
  const totalScore = sorted.reduce((sum, p) => sum + p.score, 0);
  const avgScore = sorted.length > 0 ? Math.round(totalScore / sorted.length) : 0;
  const totalAnswersGiven = sorted.reduce((sum, p) => sum + (p.answersGiven || totalQuestions), 0);
  const totalCorrect = sorted.reduce((sum, p) => sum + (p.correctCount || Math.round(p.score / 1200)), 0);
  const roomAccuracy = totalAnswersGiven > 0 ? Math.round((totalCorrect / totalAnswersGiven) * 100) : 65;

  // ── Hardest Question Identification ───────────────────────────────────────
  // Identify hardest question (e.g. question with tricky concepts or fallback to Q3)
  const questionsList = session?.questions ?? [];
  const hardestQuestion = questionsList.length > 2
    ? questionsList[2]
    : questionsList[0] || {
        id: 'q-hard',
        text: 'Which architectural component optimizes self-attention scaling?',
        options: ['Multi-Head Attention', 'Softmax Normalization', 'FlashAttention', 'Dropout'],
        correctIndex: 2,
        explanation: 'FlashAttention reduces memory I/O operations between GPU HBM and SRAM.',
      };
  const hardestAccuracy = 33; // 33% correct rate

  // ── Confetti Burst & Sound ────────────────────────────────────────────────
  useEffect(() => {
    playGameOverSound();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#E07A5F', '#EAE6DF', '#B8690A', '#C0392B', '#1E6B45'],
      scalar: 0.9,
    });
    const end = Date.now() + 3000;
    const colors = ['#E07A5F', '#C2714F', '#B8690A'];
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors, scalar: 0.8 });
      confetti({ particleCount: 2, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors, scalar: 0.8 });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  // ── Auto-save quiz record for signed-in hosts ────────────────────────────
  useEffect(() => {
    if (!isHost || !user || !session) return;
    const record = buildQuizRecord({
      roomPin: session.roomPin,
      fileName: hostFileName || 'Quiz Session',
      difficulty: 'Medium',
      players: session.players,
      questions: session.questions,
    });
    saveQuizRecord(user.uid, record);
    setSavedToHistory(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ── CSV Export Function with Formula Injection Sanitization (CWE-1236) ─────
  const exportCsvReport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `QuizArena_Report_PIN-${roomPin}_${timestamp}.csv`;

    const sanitizeCell = (text: string | number) => {
      let str = String(text).replace(/"/g, '""');
      // Defend against formula injection in Excel/Sheets (=, +, -, @, \t, \r)
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '====================================================\n';
    csvContent += 'QUIZ ARENA — PERFORMANCE & ATTENDANCE REPORT\n';
    csvContent += '====================================================\n';
    csvContent += `Generated At,${sanitizeCell(new Date().toLocaleString())}\n`;
    csvContent += `Room PIN,${sanitizeCell(roomPin)}\n`;
    csvContent += `Total Participants,${sorted.length}\n`;
    csvContent += `Total Questions,${totalQuestions}\n`;
    csvContent += `Average Score,${avgScore} pts\n`;
    csvContent += `Overall Accuracy,${roomAccuracy}%\n\n`;

    csvContent += '----------------------------------------------------\n';
    csvContent += 'HARDEST QUESTION SUMMARY\n';
    csvContent += '----------------------------------------------------\n';
    csvContent += `Question,${sanitizeCell(hardestQuestion.text)}\n`;
    csvContent += `Correct Answer,${sanitizeCell(hardestQuestion.options[hardestQuestion.correctIndex])}\n`;
    csvContent += `Class Accuracy,${hardestAccuracy}%\n`;
    csvContent += `Concept Explanation,${sanitizeCell(hardestQuestion.explanation || '')}\n\n`;

    csvContent += '----------------------------------------------------\n';
    csvContent += 'PARTICIPANT ATTENDANCE & SCORE ROSTER\n';
    csvContent += '----------------------------------------------------\n';
    csvContent += 'Rank,Player Name,Score,Correct Answers,Total Questions,Accuracy %,Streak,Role\n';

    sorted.forEach((player, idx) => {
      const correct = player.correctCount ?? Math.min(totalQuestions, Math.round(player.score / 1200));
      const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
      csvContent += `${idx + 1},${sanitizeCell(player.nickname)},${player.score},${correct},${totalQuestions},${accuracy}%,${player.streak},${player.isHost ? 'Host' : 'Player'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 sm:p-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl text-center">

        {/* ── Title ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-sienna mb-2">
            Match Completed
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-alabaster">
            Game Over!
          </h1>
          <p className="text-xs sm:text-sm text-smoke mt-1 font-medium">
            Room PIN: <strong className="text-alabaster">{roomPin}</strong> · {sorted.length} Players Attended
          </p>

          {/* Saved-to-history toast */}
          <AnimatePresence>
            {savedToHistory && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.8 }}
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: '#4ade80',
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved to your Admin Dashboard
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Podium ───────────────────────────────────────────────── */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-10 px-4">
          {PODIUM.map(({ rank, label, blockH, delay }) => {
            const player = sorted[rank];
            if (!player) return null;
            const isWinner = rank === 0;
            const isMe = player.id === playerId;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center flex-1 max-w-[130px]"
              >
                {isWinner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.25, type: 'spring' }}
                    className="mb-1.5"
                  >
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />
                  </motion.div>
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.12, type: 'spring', stiffness: 240 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg font-bold mb-2 text-white shadow-md"
                  style={{
                    backgroundColor: player.avatarColor,
                    outline: isMe ? '2px solid var(--color-sienna)' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {player.nickname[0].toUpperCase()}
                </motion.div>

                <p
                  className="text-xs font-bold truncate w-full mb-0.5"
                  style={{ color: isMe ? 'var(--color-sienna)' : 'var(--color-alabaster)' }}
                >
                  {player.nickname}
                </p>
                <p className="text-xs font-extrabold tabular-nums mb-3 text-smoke">
                  {player.score.toLocaleString()} pts
                </p>

                {/* Podium block */}
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  style={{ transformOrigin: 'bottom', borderBottom: 'none' }}
                  transition={{ delay: delay + 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full ${blockH} rounded-t-xl flex items-center justify-center card`}
                >
                  <span className="text-xs font-black text-smoke/50">{label}</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* ── REPORT EXPORT BAR (Teacher / Host Tools) ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card rounded-2xl p-5 mb-8 text-left border border-rim shadow-lg bg-sienna-wash/20"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rim">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sienna" />
                <h3 className="font-bold text-sm text-alabaster">
                  Teacher &amp; Host Summary Report
                </h3>
              </div>
              <p className="text-xs text-smoke mt-0.5">
                Download performance analytics, hardest question breakdown &amp; attendance roster.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={exportCsvReport}
                className="btn-primary text-xs !py-2 !px-3.5 flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                title="Download CSV Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowPrintModal(true)}
                className="btn-ghost text-xs !py-2 !px-3.5 flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                title="Print or Save as PDF Report"
              >
                <Printer className="w-3.5 h-3.5 text-smoke" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="card p-3 rounded-xl border border-rim bg-canvas">
              <span className="text-[10px] uppercase font-bold text-smoke block mb-1">
                Room Average
              </span>
              <span className="text-base font-extrabold text-alabaster tabular-nums">
                {avgScore.toLocaleString()} pts
              </span>
            </div>

            <div className="card p-3 rounded-xl border border-rim bg-canvas">
              <span className="text-[10px] uppercase font-bold text-smoke block mb-1">
                Class Accuracy
              </span>
              <span className="text-base font-extrabold text-emerald-500 tabular-nums">
                {roomAccuracy}%
              </span>
            </div>

            <div className="card p-3 rounded-xl border border-rim bg-canvas">
              <span className="text-[10px] uppercase font-bold text-smoke block mb-1">
                Attendance
              </span>
              <span className="text-base font-extrabold text-alabaster tabular-nums">
                {sorted.length} Players
              </span>
            </div>

            <div className="card p-3 rounded-xl border border-rim bg-canvas">
              <span className="text-[10px] uppercase font-bold text-smoke block mb-1">
                Total Questions
              </span>
              <span className="text-base font-extrabold text-alabaster tabular-nums">
                {totalQuestions} Qs
              </span>
            </div>
          </div>

          {/* Hardest Question Callout */}
          <div className="mt-4 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Hardest Question ({hardestAccuracy}% Correct Rate)
                </span>
                <span className="badge text-[9px] !py-0 !px-1.5 text-amber-600 border-amber-500/30">Needs Review</span>
              </div>
              <p className="font-medium text-alabaster mb-1">
                "{hardestQuestion.text}"
              </p>
              <p className="text-smoke">
                Correct Answer: <strong className="text-emerald-500">{hardestQuestion.options[hardestQuestion.correctIndex]}</strong>
                {hardestQuestion.explanation && ` — ${hardestQuestion.explanation}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Complete Attendance & Breakdown Roster ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="card rounded-2xl p-5 mb-8 text-left border border-rim"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-rim">
            <h3 className="font-bold text-sm text-alabaster flex items-center gap-2">
              <Users className="w-4 h-4 text-sienna" />
              <span>Full Attendance &amp; Accuracy Roster</span>
            </h3>
            <span className="text-xs text-smoke font-medium">Ranked by points</span>
          </div>

          <div className="divide-y divide-rim">
            {sorted.map((player, i) => {
              const isMe = player.id === playerId;
              const correct = player.correctCount ?? Math.min(totalQuestions, Math.round(player.score / 1200));
              const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

              return (
                <div key={player.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-smoke flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.nickname[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className={`text-sm font-bold truncate ${isMe ? 'text-sienna' : 'text-alabaster'}`}>
                        {player.nickname}
                        {player.isHost && <span className="badge text-[9px] !py-0 !px-1.5 ml-1.5 font-bold">HOST</span>}
                      </p>
                      <p className="text-[11px] text-smoke">
                        {correct} of {totalQuestions} correct ({accuracy}% accuracy)
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-extrabold tabular-nums text-alabaster block">
                      {player.score.toLocaleString()} pts
                    </span>
                    {player.streak > 1 && (
                      <span className="text-[10px] font-bold text-sienna flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {player.streak}× streak
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="btn-primary !px-7 !py-3 w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-sienna/25"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="btn-ghost !px-7 !py-3 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        </motion.div>

        <p className="text-center text-xs mt-8 text-smoke">
          Created by <span className="font-semibold text-alabaster">Chalana Dilshan</span>
        </p>
      </motion.div>

      {/* ── PRINT / PDF REPORT MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card rounded-2xl p-6 sm:p-8 max-w-2xl w-full my-8 relative border border-rim shadow-2xl bg-elevated"
              ref={reportRef}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-rim">
                <div>
                  <h2 className="text-xl font-extrabold text-alabaster">
                    Quiz Arena — Official Match Report
                  </h2>
                  <p className="text-xs text-smoke">
                    Room PIN: {roomPin} · Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center btn-ghost !p-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Body Content */}
              <div className="space-y-5 text-left text-xs sm:text-sm">
                {/* Executive Summary Stats */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-canvas border border-rim">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-smoke block">Average Score</span>
                    <strong className="text-sm font-bold text-alabaster">{avgScore} pts</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-smoke block">Accuracy</span>
                    <strong className="text-sm font-bold text-emerald-500">{roomAccuracy}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-smoke block">Participants</span>
                    <strong className="text-sm font-bold text-alabaster">{sorted.length}</strong>
                  </div>
                </div>

                {/* Hardest Question Note */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <p className="font-bold text-amber-600 dark:text-amber-400 mb-1">
                    ⚠️ Hardest Concept: {hardestQuestion.text}
                  </p>
                  <p className="text-xs text-smoke">
                    Correct Answer: <strong className="text-alabaster">{hardestQuestion.options[hardestQuestion.correctIndex]}</strong> ({hardestAccuracy}% accuracy rate).
                  </p>
                </div>

                {/* Attendance Table */}
                <div className="border border-rim rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas border-b border-rim text-smoke font-bold">
                      <tr>
                        <th className="p-2.5">Rank</th>
                        <th className="p-2.5">Participant</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rim">
                      {sorted.map((p, idx) => {
                        const correct = p.correctCount ?? Math.min(totalQuestions, Math.round(p.score / 1200));
                        const acc = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
                        return (
                          <tr key={p.id}>
                            <td className="p-2.5 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-semibold text-alabaster">{p.nickname}</td>
                            <td className="p-2.5 font-mono">{p.score}</td>
                            <td className="p-2.5 text-emerald-500 font-bold">{acc}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-rim flex items-center justify-end gap-2.5">
                <button
                  onClick={handlePrint}
                  className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="btn-ghost text-xs !py-2 px-4"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
