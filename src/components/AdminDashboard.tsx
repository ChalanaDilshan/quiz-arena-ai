import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowLeft, LogOut, BarChart3, Users, Trophy,
  Target, Trash2, ChevronRight, Calendar, BookOpen,
  TrendingUp, AlertTriangle, CheckCircle2, Download,
  FileSpreadsheet, X, Award, Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getQuizHistory, deleteQuizRecord, saveQuiz,
  type QuizRecord,
} from '../utils/quizHistory';
import type { Player, Question } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminDashboardProps {
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AccuracyBar({ value, color = 'var(--color-sienna)' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-rim overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ─── Quiz Detail View ─────────────────────────────────────────────────────────

function QuizDetailView({
  record,
  onBack,
  onDelete,
}: {
  record: QuizRecord;
  onBack: () => void;
  onDelete: () => void;
}) {
  const sorted = [...record.players]
    .filter((p) => !p.isHost)
    .sort((a, b) => b.score - a.score);

  const hardestQuestion = record.questions.length > 2
    ? record.questions[2]
    : record.questions[0];

  const exportCsv = () => {
    const sanitize = (v: string | number) => {
      let s = String(v).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s}"`;
    };
    let csv = 'data:text/csv;charset=utf-8,';
    csv += `Quiz Arena — Session Report\n`;
    csv += `Date,${sanitize(formatDate(record.date))}\n`;
    csv += `Room PIN,${sanitize(record.roomPin)}\n`;
    csv += `Source File,${sanitize(record.fileName)}\n`;
    csv += `Questions,${record.numQuestions}\n`;
    csv += `Difficulty,${sanitize(record.difficulty)}\n`;
    csv += `Avg Score,${record.avgScore}\n`;
    csv += `Accuracy,${record.accuracy}%\n\n`;
    csv += 'Rank,Name,Score,Accuracy%,Streak\n';
    sorted.forEach((p, i) => {
      const correct = p.correctCount ?? Math.round(p.score / 1200);
      const acc = record.numQuestions > 0
        ? Math.round((correct / record.numQuestions) * 100)
        : 0;
      csv += `${i + 1},${sanitize(p.nickname)},${p.score},${acc}%,${p.streak}\n`;
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `QuizArena_${record.roomPin}_${record.date.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-smoke hover:text-alabaster transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Quizzes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onDelete}
            className="btn-ghost text-xs !py-2 !px-3 flex items-center gap-1.5 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quiz Meta */}
      <div className="card rounded-2xl p-5 mb-5 border border-rim">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-extrabold text-alabaster text-lg leading-tight truncate max-w-xs">
              {record.fileName || 'Quiz Session'}
            </h2>
            <p className="text-xs text-smoke mt-1">
              PIN: <span className="font-bold text-alabaster">{record.roomPin}</span>
              {' · '}
              {formatDate(record.date)} at {formatTime(record.date)}
            </p>
          </div>
          <span
            className="badge text-[10px] !px-2.5 !py-1 font-bold flex-shrink-0"
            style={{
              background:
                record.difficulty === 'Hard'
                  ? 'rgba(239,68,68,0.15)'
                  : record.difficulty === 'Easy'
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(234,179,8,0.15)',
              color:
                record.difficulty === 'Hard'
                  ? '#f87171'
                  : record.difficulty === 'Easy'
                    ? '#4ade80'
                    : '#fbbf24',
              border:
                record.difficulty === 'Hard'
                  ? '1px solid rgba(239,68,68,0.3)'
                  : record.difficulty === 'Easy'
                    ? '1px solid rgba(34,197,94,0.3)'
                    : '1px solid rgba(234,179,8,0.3)',
            }}
          >
            {record.difficulty}
          </span>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Players', value: record.totalPlayers, icon: Users, color: 'var(--color-sienna)' },
            { label: 'Questions', value: record.numQuestions, icon: BookOpen, color: '#a78bfa' },
            { label: 'Avg Score', value: `${record.avgScore.toLocaleString()}`, icon: Trophy, color: '#fbbf24' },
            { label: 'Accuracy', value: `${record.accuracy}%`, icon: Target, color: '#4ade80' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card rounded-xl p-3 border border-rim bg-canvas text-center">
              <Icon className="w-3.5 h-3.5 mx-auto mb-1.5" style={{ color }} />
              <p className="text-sm font-extrabold text-alabaster tabular-nums">{value}</p>
              <p className="text-[10px] text-smoke uppercase font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hardest Question */}
      {hardestQuestion && (
        <div className="mb-5 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Hardest Question</span>
          </div>
          <p className="text-sm font-semibold text-alabaster mb-1">"{hardestQuestion.text}"</p>
          <p className="text-xs text-smoke">
            Correct answer:{' '}
            <strong className="text-emerald-400">
              {hardestQuestion.options[hardestQuestion.correctIndex]}
            </strong>
            {hardestQuestion.explanation && ` — ${hardestQuestion.explanation}`}
          </p>
        </div>
      )}

      {/* Player Roster */}
      <div className="card rounded-2xl p-5 border border-rim">
        <h3 className="font-bold text-sm text-alabaster flex items-center gap-2 mb-4 pb-3 border-b border-rim">
          <Users className="w-4 h-4 text-sienna" />
          Student Performance Roster
          <span className="text-smoke font-normal text-xs ml-auto">{sorted.length} students</span>
        </h3>

        {sorted.length === 0 ? (
          <p className="text-sm text-smoke text-center py-4">No player data recorded.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((player, i) => {
              const correct = player.correctCount ?? Math.round(player.score / 1200);
              const acc = record.numQuestions > 0
                ? Math.min(100, Math.round((correct / record.numQuestions) * 100))
                : 0;
              const accColor =
                acc >= 75 ? '#4ade80' : acc >= 50 ? '#fbbf24' : '#f87171';

              return (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-smoke flex-shrink-0 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.nickname[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-alabaster truncate">{player.nickname}</span>
                      <span className="text-xs font-extrabold tabular-nums text-alabaster ml-2 flex-shrink-0">
                        {player.score.toLocaleString()} pts
                      </span>
                    </div>
                    <AccuracyBar value={acc} color={accColor} />
                    {player.streak > 1 && (
                      <span className="text-[10px] font-bold text-sienna flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {player.streak}× streak
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

function QuizCard({
  record,
  onClick,
}: {
  record: QuizRecord;
  onClick: () => void;
}) {
  const accColor =
    record.accuracy >= 75
      ? '#4ade80'
      : record.accuracy >= 50
        ? '#fbbf24'
        : '#f87171';

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="card rounded-2xl p-5 border border-rim cursor-pointer transition-colors hover:border-sienna/40"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-alabaster truncate">
            {record.fileName || 'Quiz Session'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-smoke" />
            <span className="text-[11px] text-smoke">{formatDate(record.date)}</span>
            <span className="text-[11px] text-smoke">· PIN: {record.roomPin}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-smoke flex-shrink-0 mt-0.5" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-sm font-extrabold text-alabaster tabular-nums">{record.totalPlayers}</p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Players</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold text-alabaster tabular-nums">{record.numQuestions}</p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Questions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold tabular-nums" style={{ color: accColor }}>
            {record.accuracy}%
          </p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Accuracy</p>
        </div>
      </div>

      <AccuracyBar value={record.accuracy} color={accColor} />
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-sienna/10 border border-sienna/20 flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-sienna/60" />
      </div>
      <h3 className="font-bold text-alabaster mb-1">No quizzes yet</h3>
      <p className="text-sm text-smoke max-w-xs">
        Host your first quiz and it will automatically appear here with full student analytics.
      </p>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user, signOut } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<QuizRecord | null>(null);
  const [records, setRecords] = useState<QuizRecord[]>(() =>
    user ? getQuizHistory(user.uid) : [],
  );

  const [pendingQuiz, setPendingQuiz] = useState<Question[] | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/agent/pending')
      .then(res => res.json())
      .then(data => {
        if (data.pendingQuiz) setPendingQuiz(data.pendingQuiz);
      })
      .catch(console.error);
  }, []);

  const handleApproveQuiz = () => {
    if (!user || !pendingQuiz) return;
    setIsApproving(true);
    
    saveQuiz(user.uid, {
      id: `syllabus_${Date.now()}`,
      topic: 'CS 101: React Hooks Fundamentals',
      dateSaved: new Date().toISOString(),
      questions: pendingQuiz,
    });

    fetch('http://localhost:3001/api/agent/clear', { method: 'POST' })
      .then(() => setPendingQuiz(null))
      .catch(console.error)
      .finally(() => setIsApproving(false));
  };

  const handleDismissQuiz = () => {
    fetch('http://localhost:3001/api/agent/clear', { method: 'POST' })
      .then(() => setPendingQuiz(null))
      .catch(console.error);
  };

  const simulateBackgroundAgent = () => {
    setIsTriggering(true);
    fetch('http://localhost:3001/api/agent/trigger', { method: 'POST' })
      .then(() => {
        // Poll for the result after a few seconds
        const interval = setInterval(() => {
          fetch('http://localhost:3001/api/agent/pending')
            .then(res => res.json())
            .then(data => {
              if (data.pendingQuiz) {
                setPendingQuiz(data.pendingQuiz);
                setIsTriggering(false);
                clearInterval(interval);
              }
            });
        }, 2000);
      })
      .catch(() => setIsTriggering(false));
  };

  const refreshRecords = () => {
    if (user) setRecords(getQuizHistory(user.uid));
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    deleteQuizRecord(user.uid, id);
    setSelectedRecord(null);
    refreshRecords();
  };

  // Aggregate stats across all quizzes
  const stats = useMemo(() => {
    const totalQuizzes = records.length;
    const totalStudents = records.reduce((s, r) => s + r.totalPlayers, 0);
    const avgAccuracy =
      records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.accuracy, 0) / records.length)
        : 0;
    const bestAccuracy = records.length > 0 ? Math.max(...records.map((r) => r.accuracy)) : 0;
    return { totalQuizzes, totalStudents, avgAccuracy, bestAccuracy };
  }, [records]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-40 border-b border-rim/60"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-canvas) 90%, transparent)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="btn-ghost !p-2 rounded-lg"
              title="Back to app"
            >
              <ArrowLeft className="w-4 h-4 text-smoke" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sienna flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-alabaster">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* User Info + Sign Out */}
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="w-8 h-8 rounded-full border-2 border-rim"
              />
            )}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-alabaster leading-none">
                {user?.displayName ?? 'Host'}
              </p>
              <p className="text-[10px] text-smoke mt-0.5 truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>
            
            <button
              onClick={simulateBackgroundAgent}
              disabled={isTriggering}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 hidden sm:flex"
            >
              <Zap className="w-3.5 h-3.5" />
              {isTriggering ? 'Agent Running...' : 'Simulate Agent'}
            </button>

            <button
              onClick={signOut}
              className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-smoke hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <AnimatePresence mode="wait">
          {selectedRecord ? (
            <QuizDetailView
              key={selectedRecord.id}
              record={selectedRecord}
              onBack={() => setSelectedRecord(null)}
              onDelete={() => handleDelete(selectedRecord.id)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Page Title */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-alabaster">
                  Your Quiz History
                </h1>
                <p className="text-sm text-smoke mt-1">
                  All quizzes you've hosted, with full student performance analytics.
                </p>
              </div>

              {/* AI Agent Notification Card */}
              <AnimatePresence>
                {pendingQuiz && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="card rounded-2xl p-5 border-2 border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-1">
                            🤖 AI Agent Notification
                          </h3>
                          <p className="text-sm text-alabaster mb-4">
                            I scanned your CS 101 syllabus. You are teaching <strong>React Hooks Fundamentals</strong> next week. I autonomously generated a 5-question Quiz Arena match for it. Would you like to review and publish it to your class?
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleApproveQuiz}
                              disabled={isApproving}
                              className="btn-primary text-xs !py-2 !px-4 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isApproving ? 'Saving...' : 'Review & Publish'}
                            </button>
                            <button
                              onClick={handleDismissQuiz}
                              className="btn-ghost text-xs !py-2 !px-4 text-smoke hover:text-alabaster"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Summary Stats */}
              {records.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
                >
                  {[
                    {
                      label: 'Total Quizzes',
                      value: stats.totalQuizzes,
                      icon: BookOpen,
                      color: 'var(--color-sienna)',
                    },
                    {
                      label: 'Students Taught',
                      value: stats.totalStudents,
                      icon: Users,
                      color: '#a78bfa',
                    },
                    {
                      label: 'Avg Accuracy',
                      value: `${stats.avgAccuracy}%`,
                      icon: Target,
                      color: '#4ade80',
                    },
                    {
                      label: 'Best Session',
                      value: `${stats.bestAccuracy}%`,
                      icon: Award,
                      color: '#fbbf24',
                    },
                  ].map(({ label, value, icon: Icon, color }, idx) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + idx * 0.04 }}
                      className="card rounded-2xl p-4 border border-rim"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <p className="text-xl font-extrabold text-alabaster tabular-nums">
                        {value}
                      </p>
                      <p className="text-[11px] text-smoke uppercase font-semibold mt-0.5">
                        {label}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Quiz List */}
              {records.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-bold text-smoke uppercase tracking-wider">
                      Past Sessions
                    </h2>
                    <span className="text-xs text-smoke">{records.length} total</span>
                  </div>
                  {records.map((record, idx) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      <QuizCard
                        record={record}
                        onClick={() => setSelectedRecord(record)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
