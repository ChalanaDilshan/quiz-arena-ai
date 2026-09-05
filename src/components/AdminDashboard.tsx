import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowLeft, LogOut, BarChart3, Users, Trophy,
  Target, Trash2, ChevronRight, Calendar, BookOpen,
  TrendingUp, AlertTriangle, CheckCircle2, Download,
  FileSpreadsheet, X, Award, Bot, Search, ArrowUpDown,
  MoreVertical, ChevronDown, Play,
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
  onRehost?: (record: QuizRecord) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cleanTitle(fileName?: string): string {
  if (!fileName) return 'Quiz Session';
  // Strip trailing file extensions (e.g. .pdf, .json, .csv, .docx)
  const withoutExt = fileName.replace(/\.[a-zA-Z0-9]{1,6}$/i, '').trim();
  return withoutExt || 'Quiz Session';
}

export function getAccuracyColor(accuracy: number): {
  hex: string;
  twClass: string;
  badgeBg: string;
  label: string;
} {
  if (accuracy > 75) {
    return {
      hex: '#22c55e', // Green (>75%)
      twClass: 'text-emerald-400',
      badgeBg: 'rgba(34, 197, 94, 0.15)',
      label: 'Strong (>75%)',
    };
  }
  if (accuracy >= 50) {
    return {
      hex: '#eab308', // Yellow (50% - 75%)
      twClass: 'text-amber-400',
      badgeBg: 'rgba(234, 179, 8, 0.15)',
      label: 'Moderate (50%–75%)',
    };
  }
  return {
    hex: '#ef4444', // Red (<50%)
    twClass: 'text-rose-400',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    label: 'Needs Review (<50%)',
  };
}

export function exportRecordCsv(record: QuizRecord) {
  const sorted = [...record.players]
    .filter((p) => !p.isHost)
    .sort((a, b) => b.score - a.score);

  const sanitize = (v: string | number) => {
    let s = String(v).replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s}"`;
  };
  let csv = 'data:text/csv;charset=utf-8,';
  csv += `Quiz Arena — Session Report\n`;
  csv += `Date,${sanitize(formatDate(record.date))}\n`;
  csv += `Room PIN,${sanitize(record.roomPin)}\n`;
  csv += `Source File,${sanitize(cleanTitle(record.fileName))}\n`;
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
}

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

function AccuracyBar({ value, color }: { value: number; color?: string }) {
  const barColor = color ?? getAccuracyColor(value).hex;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-rim overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: barColor }}>
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
    exportRecordCsv(record);
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
          aria-label="Back to all quizzes"
          className="flex items-center gap-2 text-sm font-medium text-smoke hover:text-alabaster transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Quizzes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            aria-label="Export quiz results as CSV spreadsheet"
            className="btn-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete this quiz record"
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
              {cleanTitle(record.fileName)}
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
            { label: 'Accuracy', value: `${record.accuracy}%`, icon: Target, color: getAccuracyColor(record.accuracy).hex },
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
              const accColor = getAccuracyColor(acc).hex;

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
  onRehost,
  onDelete,
  onExportCsv,
}: {
  record: QuizRecord;
  onClick: () => void;
  onRehost?: (record: QuizRecord) => void;
  onDelete?: (id: string) => void;
  onExportCsv?: (record: QuizRecord) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accMeta = getAccuracyColor(record.accuracy);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="card group rounded-2xl p-4 sm:p-5 border border-rim cursor-pointer transition-all hover:border-sienna/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] relative"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-alabaster truncate group-hover:text-sienna transition-colors">
              {cleanTitle(record.fileName)}
            </h3>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
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
              }}
            >
              {record.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-smoke flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(record.date)}
            </span>
            <span className="text-smoke/40">·</span>
            <span>PIN: <strong className="text-alabaster font-mono">{record.roomPin}</strong></span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {/* View Analytics quick button */}
          <button
            type="button"
            onClick={onClick}
            title="View full session analytics"
            aria-label={`View analytics for ${cleanTitle(record.fileName)}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-rim text-smoke hover:text-alabaster hover:border-smoke/40 hover:bg-white/5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sienna" />
            <span>Analytics</span>
          </button>

          {/* Re-host Game quick button */}
          {onRehost && record.questions && record.questions.length > 0 && (
            <button
              type="button"
              onClick={() => onRehost(record)}
              title="Re-host this quiz with the same questions"
              aria-label={`Re-host quiz ${cleanTitle(record.fileName)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-sienna/40 bg-sienna/10 text-sienna hover:bg-sienna hover:text-white transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Re-host</span>
            </button>
          )}

          {/* ⋮ Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More session actions"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-smoke hover:text-alabaster hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-rim bg-elevated shadow-xl z-30 p-1 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onClick(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-alabaster hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-sienna" />
                    <span>View Analytics</span>
                  </button>

                  {onRehost && record.questions && record.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onRehost(record); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-alabaster hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Re-host Game</span>
                    </button>
                  )}

                  {onExportCsv && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onExportCsv(record); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-alabaster hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export to CSV</span>
                    </button>
                  )}

                  {onDelete && (
                    <div className="border-t border-rim my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          if (confirm(`Delete session "${cleanTitle(record.fileName)}"?`)) {
                            onDelete(record.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete Session</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 bg-canvas/60 rounded-xl p-2.5 border border-rim/60">
        <div className="text-center">
          <p className="text-sm font-extrabold text-alabaster tabular-nums">{record.totalPlayers}</p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Players</p>
        </div>
        <div className="text-center border-x border-rim/50">
          <p className="text-sm font-extrabold text-alabaster tabular-nums">{record.numQuestions}</p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Questions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold tabular-nums" style={{ color: accMeta.hex }}>
            {record.accuracy}%
          </p>
          <p className="text-[10px] text-smoke uppercase font-semibold">Accuracy</p>
        </div>
      </div>

      {/* Semantic Accuracy Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-smoke font-medium">Session Accuracy</span>
          <span className="font-semibold text-xs" style={{ color: accMeta.hex }}>
            {accMeta.label}
          </span>
        </div>
        <AccuracyBar value={record.accuracy} color={accMeta.hex} />
      </div>
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

export function AdminDashboard({ onBack, onRehost }: AdminDashboardProps) {
  const { user, signOut } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<QuizRecord | null>(null);
  const [records, setRecords] = useState<QuizRecord[]>(() =>
    user ? getQuizHistory(user.uid) : [],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'date-desc' | 'date-asc' | 'accuracy-desc' | 'accuracy-asc' | 'players-desc' | 'questions-desc'
  >('date-desc');

  const filteredRecords = useMemo(() => {
    let list = records;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        (r.fileName && r.fileName.toLowerCase().includes(q)) ||
        (cleanTitle(r.fileName).toLowerCase().includes(q)) ||
        (r.roomPin && r.roomPin.toLowerCase().includes(q)) ||
        (r.difficulty && r.difficulty.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'accuracy-desc':
          return b.accuracy - a.accuracy;
        case 'accuracy-asc':
          return a.accuracy - b.accuracy;
        case 'players-desc':
          return b.totalPlayers - a.totalPlayers;
        case 'questions-desc':
          return b.numQuestions - a.numQuestions;
        default:
          return 0;
      }
    });
  }, [records, searchQuery, sortBy]);

  const [pendingQuiz, setPendingQuiz] = useState<Question[] | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(token => {
      fetch(`${import.meta.env.VITE_API_URL}/api/agent/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.pendingQuiz) setPendingQuiz(data.pendingQuiz);
        })
        .catch(console.error);
    });
  }, [user]);

  const handleApproveQuiz = () => {
    if (!user || !pendingQuiz) return;
    setIsApproving(true);
    
    saveQuiz(user.uid, {
      id: `syllabus_${Date.now()}`,
      topic: 'CS 101: React Hooks Fundamentals',
      dateSaved: new Date().toISOString(),
      questions: pendingQuiz,
    });

    user.getIdToken().then(token => {
      fetch(`${import.meta.env.VITE_API_URL}/api/agent/clear`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => setPendingQuiz(null))
        .catch(console.error)
        .finally(() => setIsApproving(false));
    });
  };

  const handleDismissQuiz = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    fetch(`${import.meta.env.VITE_API_URL}/api/agent/clear`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(() => setPendingQuiz(null))
      .catch(console.error);
  };

  const simulateBackgroundAgent = async () => {
    if (!user) return;
    setIsTriggering(true);
    const token = await user.getIdToken();
    fetch(`${import.meta.env.VITE_API_URL}/api/agent/trigger`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(() => {
        // Poll for the result after a few seconds
        const interval = setInterval(() => {
          fetch(`${import.meta.env.VITE_API_URL}/api/agent/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
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
              aria-label="Back to application"
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
              aria-label="Trigger autonomous syllabus agent"
              aria-busy={isTriggering}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 hidden sm:flex"
            >
              <Zap className="w-3.5 h-3.5" />
              {isTriggering ? 'Agent Running...' : 'Simulate Agent'}
            </button>

            <button
              onClick={signOut}
              aria-label="Sign out of host account"
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
                    role="alert"
                    aria-live="polite"
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
                      color: getAccuracyColor(stats.avgAccuracy).hex,
                    },
                    {
                      label: 'Best Session',
                      value: `${stats.bestAccuracy}%`,
                      icon: Award,
                      color: getAccuracyColor(stats.bestAccuracy).hex,
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
                <div className="space-y-4">
                  {/* Search & Sorting Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rim/60">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-alabaster uppercase tracking-wider flex items-center gap-2">
                        <span>Past Sessions</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rim text-smoke">
                          {filteredRecords.length}{filteredRecords.length !== records.length ? ` of ${records.length}` : ''}
                        </span>
                      </h2>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Search Input */}
                      <div className="relative flex-1 sm:w-60">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-smoke pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search title, PIN, difficulty..."
                          aria-label="Search past sessions"
                          className="w-full text-xs rounded-xl pl-8 pr-7 py-2 bg-canvas border border-rim text-alabaster placeholder:text-smoke/60 focus:outline-none focus:border-sienna transition-colors"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke hover:text-alabaster p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="relative flex items-center">
                        <ArrowUpDown className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-smoke pointer-events-none" />
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value as any)}
                          aria-label="Sort past sessions"
                          className="text-xs rounded-xl pl-7 pr-8 py-2 bg-canvas border border-rim text-alabaster cursor-pointer focus:outline-none focus:border-sienna transition-colors appearance-none font-medium"
                        >
                          <option value="date-desc">Date (Newest)</option>
                          <option value="date-asc">Date (Oldest)</option>
                          <option value="accuracy-desc">Accuracy (High to Low)</option>
                          <option value="accuracy-asc">Accuracy (Low to High)</option>
                          <option value="players-desc">Most Players</option>
                          <option value="questions-desc">Most Questions</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Filtered Records */}
                  {filteredRecords.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-rim/60 bg-canvas/40 p-6">
                      <Search className="w-8 h-8 mx-auto mb-2 text-smoke/40" />
                      <p className="text-sm font-bold text-alabaster">No sessions match your search</p>
                      <p className="text-xs text-smoke mt-1">
                        No quiz records match "{searchQuery}".
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="btn-ghost text-xs !py-1.5 !px-3 text-sienna hover:bg-sienna/10 mt-3"
                      >
                        Clear Filter
                      </button>
                    </div>
                  ) : (
                    filteredRecords.map((record, idx) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + idx * 0.03 }}
                      >
                        <QuizCard
                          record={record}
                          onClick={() => setSelectedRecord(record)}
                          onRehost={onRehost}
                          onDelete={handleDelete}
                          onExportCsv={exportRecordCsv}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
