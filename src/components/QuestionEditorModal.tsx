import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Plus, Trash2, Clock, Sparkles, AlertCircle,
  HelpCircle, ChevronDown, ChevronUp, CheckCircle2, ArrowRight
} from 'lucide-react';
import type { Question } from '../types';

interface QuestionEditorModalProps {
  isOpen: boolean;
  title?: string;
  topic?: string;
  initialQuestions?: Question[];
  questions?: Question[];
  onSave: (questions: Question[]) => void;
  onClose: () => void;
  saveButtonLabel?: string;
  isEmbedded?: boolean;
}

const SHAPES = [
  { symbol: '⬢', label: 'A', name: 'Hexagon', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.4)' },
  { symbol: '◆', label: 'B', name: 'Diamond', color: '#0284C7', bg: 'rgba(2,132,199,0.15)', border: 'rgba(2,132,199,0.4)' },
  { symbol: '★', label: 'C', name: 'Star',    color: '#D97706', bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.4)' },
  { symbol: '■', label: 'D', name: 'Square',  color: '#059669', bg: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.4)' },
];

const TIME_LIMITS = [10, 15, 20, 30, 45, 60];

export function QuestionEditorModal({
  isOpen,
  title = 'Review & Edit Questions',
  topic,
  initialQuestions,
  questions: passedQuestions,
  onSave,
  onClose,
  saveButtonLabel = 'Save Questions',
  isEmbedded = false,
}: QuestionEditorModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sourceQuestions = passedQuestions || initialQuestions || [];

  useEffect(() => {
    if (isOpen || isEmbedded) {
      const cloned = sourceQuestions && sourceQuestions.length > 0
        ? sourceQuestions.map(q => ({
            ...q,
            options: [...q.options],
            timeLimit: q.timeLimit || 20,
          }))
        : [createNewBlankQuestion(1)];
      setQuestions(cloned);
      setActiveIdx(0);
      setValidationError(null);
    }
  }, [isOpen, isEmbedded, initialQuestions]);

  function createNewBlankQuestion(index: number): Question {
    return {
      id: `q-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: `Question ${index}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      timeLimit: 20,
      explanation: 'Educational explanation for why this answer is correct.',
    };
  }

  const handleTextChange = (idx: number, text: string) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text };
      return next;
    });
    setValidationError(null);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions(prev => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
    setValidationError(null);
  };

  const handleSetCorrectIndex = (qIdx: number, optIdx: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], correctIndex: optIdx };
      return next;
    });
  };

  const handleTimeLimitChange = (qIdx: number, timeLimit: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], timeLimit };
      return next;
    });
  };

  const handleExplanationChange = (qIdx: number, explanation: string) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], explanation };
      return next;
    });
  };

  const handleAddQuestion = () => {
    setQuestions(prev => {
      const newQ = createNewBlankQuestion(prev.length + 1);
      return [...prev, newQ];
    });
    setActiveIdx(questions.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setValidationError('A quiz must have at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (activeIdx >= questions.length - 1) {
      setActiveIdx(Math.max(0, questions.length - 2));
    }
    setValidationError(null);
  };

  const handleSave = () => {
    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setValidationError(`Question ${i + 1} cannot have empty question text.`);
        setActiveIdx(i);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setValidationError(`Question ${i + 1} has an empty option.`);
        setActiveIdx(i);
        return;
      }
    }
    onSave(questions);
  };

  if (!isOpen && !isEmbedded) return null;

  const currentQ = questions[activeIdx] || questions[0];

  const content = (
    <div
      className={`flex flex-col ${isEmbedded ? 'w-full' : 'max-h-[88vh]'} overflow-hidden`}
      style={{ backgroundColor: 'var(--color-elevated)' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-rim flex-shrink-0"
        style={{ backgroundColor: 'var(--color-elevated)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-sienna/15 border border-sienna/30">
            <Sparkles className="w-5 h-5 text-sienna" />
          </div>
          <div className="min-w-0">
            <h2 id="question-editor-title" className="text-base font-bold text-alabaster truncate">{title}</h2>
            <p className="text-xs text-smoke truncate">
              {topic ? `${topic} · ` : ''}{questions.length} questions in this quiz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEmbedded && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close question editor"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-smoke hover:text-alabaster hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main 2-Column Body: Questions List (Left) + Current Editor (Right) ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-rim">
        
        {/* Left Column: Question Navigator */}
        <div
          className="md:col-span-4 p-4 overflow-y-auto max-h-[350px] md:max-h-[560px] space-y-2 border-r border-rim"
          style={{ backgroundColor: 'var(--color-canvas)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-smoke uppercase tracking-wider">
              Question Navigator ({questions.length})
            </span>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-xs font-semibold text-sienna hover:text-sienna-hover flex items-center gap-1 py-1 px-2 rounded-md hover:bg-sienna/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-1.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === activeIdx;
              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => { setActiveIdx(idx); setValidationError(null); }}
                  className="w-full text-left p-3 rounded-xl transition-all border flex items-start gap-2.5 cursor-pointer"
                  style={{
                    backgroundColor: isCurrent ? 'var(--color-sienna-wash)' : 'var(--color-elevated)',
                    borderColor: isCurrent ? 'var(--color-sienna)' : 'var(--color-rim)',
                    boxShadow: isCurrent ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: isCurrent ? 'var(--color-sienna)' : 'var(--color-rim)',
                      color: isCurrent ? '#FFFFFF' : 'var(--color-smoke)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium line-clamp-2 leading-snug"
                      style={{ color: isCurrent ? 'var(--color-alabaster)' : 'var(--color-alabaster)' }}
                    >
                      {q.text || <span className="italic text-smoke/60">Empty question</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-smoke">
                      <span>{q.options.length} options</span>
                      <span>·</span>
                      <span className="text-emerald-500 font-semibold">Ans: {SHAPES[q.correctIndex]?.label || 'A'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Editor Form */}
        <div
          className="md:col-span-8 p-5 overflow-y-auto max-h-[500px] md:max-h-[560px] space-y-5"
          style={{ backgroundColor: 'var(--color-elevated)' }}
        >
          {currentQ ? (
            <>
              {/* Question Header Row: Title & Actions */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-sienna/20 border border-sienna/30 text-sienna font-extrabold text-xs">
                    Question {activeIdx + 1}
                  </span>
                  <span className="text-xs text-smoke">of {questions.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Time limit picker */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs text-smoke"
                    style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-rim)' }}
                  >
                    <Clock className="w-3.5 h-3.5 text-smoke" />
                    <select
                      value={currentQ.timeLimit || 20}
                      onChange={e => handleTimeLimitChange(activeIdx, Number(e.target.value))}
                      className="bg-transparent text-alabaster text-xs font-semibold focus:outline-none cursor-pointer"
                      aria-label="Time limit per question in seconds"
                      style={{ color: 'var(--color-alabaster)' }}
                    >
                      {TIME_LIMITS.map(t => (
                        <option
                          key={t}
                          value={t}
                          style={{ backgroundColor: 'var(--color-elevated)', color: 'var(--color-alabaster)' }}
                        >
                          {t}s
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(activeIdx)}
                    disabled={questions.length <= 1}
                    aria-label={`Delete question ${activeIdx + 1}`}
                    className="p-1.5 rounded-lg border border-rim/80 hover:border-red-500/40 text-smoke hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title={questions.length <= 1 ? "Cannot delete the only question" : "Delete question"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-alabaster mb-1.5">
                  Question Text <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={currentQ.text}
                  onChange={e => handleTextChange(activeIdx, e.target.value)}
                  placeholder="Enter the question prompt..."
                  rows={3}
                  className="w-full text-xs sm:text-sm font-medium rounded-xl p-3.5 border outline-none transition-colors resize-none shadow-sm focus:border-sienna"
                  style={{
                    backgroundColor: 'var(--color-canvas)',
                    color: 'var(--color-alabaster)',
                    borderColor: 'var(--color-rim)',
                  }}
                />
              </div>

              {/* Options: 4 Answer Choices with shape tags and radio selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-alabaster">
                    Answer Options <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-smoke">
                    Click <CheckCircle2 className="w-3 h-3 inline text-emerald-400 mx-0.5" /> to set the correct answer
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isCorrect = currentQ.correctIndex === oIdx;
                    const shape = SHAPES[oIdx] || SHAPES[0];

                    return (
                      <div
                        key={oIdx}
                        className="flex items-center gap-2.5 p-2 rounded-xl border transition-all shadow-sm"
                        style={{
                          backgroundColor: isCorrect
                            ? 'color-mix(in srgb, #10B981 12%, var(--color-canvas))'
                            : 'var(--color-canvas)',
                          borderColor: isCorrect ? '#10B981' : 'var(--color-rim)',
                        }}
                      >
                        {/* Shape / Label Tag */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                          style={{ background: shape.bg, color: shape.color, border: `1px solid ${shape.border}` }}
                          title={`Pad ${shape.label} (${shape.name})`}
                        >
                          {shape.symbol}
                        </div>

                        {/* Text Input */}
                        <input
                          type="text"
                          value={opt}
                          onChange={e => handleOptionChange(activeIdx, oIdx, e.target.value)}
                          placeholder={`Option ${shape.label}...`}
                          className="flex-1 bg-transparent text-xs sm:text-sm font-medium outline-none"
                          style={{ color: 'var(--color-alabaster)' }}
                        />

                        {/* Correct Answer Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleSetCorrectIndex(activeIdx, oIdx)}
                          className={`flex items-center gap-1 py-1 px-2.5 rounded-md text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                              : 'text-smoke hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          aria-label={`Mark option ${shape.label} as correct`}
                          aria-pressed={isCorrect}
                        >
                          {isCorrect ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <span>Set Correct</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Educational Explanation */}
              <div>
                <label className="block text-xs font-semibold text-alabaster mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Educational Rationale & Explanation</span>
                  <span className="text-smoke text-[10px] font-normal">(Used by Professor Q for Socratic tutoring)</span>
                </label>
                <textarea
                  value={currentQ.explanation || ''}
                  onChange={e => handleExplanationChange(activeIdx, e.target.value)}
                  placeholder="Explain why the correct answer is right and clarify common student misconceptions..."
                  rows={2}
                  className="w-full text-xs font-normal rounded-xl p-3 border outline-none transition-colors resize-none shadow-sm focus:border-sienna"
                  style={{
                    backgroundColor: 'var(--color-canvas)',
                    color: 'var(--color-alabaster)',
                    borderColor: 'var(--color-rim)',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-smoke">No question selected.</div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-t border-rim flex-shrink-0"
        style={{ backgroundColor: 'var(--color-elevated)' }}
      >
        <div className="text-xs text-smoke">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'} ready
        </div>

        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs !py-2 !px-4"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary text-xs !py-2 !px-5 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveButtonLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div
        className="card rounded-2xl border border-rim shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-elevated)' }}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-editor-title"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl rounded-2xl border border-rim shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-elevated)' }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}
