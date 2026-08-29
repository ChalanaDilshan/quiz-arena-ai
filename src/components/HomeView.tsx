import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Users, Zap, FileText, ArrowRight,
  Sparkles, ChevronLeft, ChevronUp, ChevronDown, LogIn, LayoutDashboard, BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSavedQuizzes, type SavedQuiz } from '../utils/quizHistory';

interface HomeViewProps {
  onJoinGame: (pin: string, nickname: string) => void;
  onHostGame: (file: File, numQuestions: number, difficulty: string) => void;
  uploadProgress: number;
  error: string | null;
  initialTab?: 'join' | 'host';
  initialPin?: string;
  onHostSavedQuiz?: (quiz: SavedQuiz) => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const DIFFICULTY_META: Record<Difficulty, { desc: string }> = {
  Easy:   { desc: 'Accessible & broad' },
  Medium: { desc: 'Balanced depth' },
  Hard:   { desc: 'Deep & tricky' },
};

const MIN_Q = 3, MAX_Q = 20;

export function HomeView({ onJoinGame, onHostGame, onHostSavedQuiz, uploadProgress, error, initialTab = 'join', initialPin }: HomeViewProps) {
  const [activeTab, setActiveTab] = useState<'join' | 'host'>(initialTab);
  const [pin, setPin] = useState<string[]>(() => {
    if (initialPin && initialPin.length === 6) {
      return initialPin.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [nickname, setNickname] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hostStep, setHostStep] = useState<'upload' | 'config'>('upload');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, signInWithGoogle } = useAuth();
  
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  
  useEffect(() => {
    if (user) {
      setSavedQuizzes(getSavedQuizzes(user.uid));
    } else {
      setSavedQuizzes([]);
    }
  }, [user]);

  const handlePinChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...pin]; next[i] = v.slice(-1); setPin(next);
    if (v && i < 5) pinRefs.current[i + 1]?.focus();
  };
  const handlePinKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) pinRefs.current[i - 1]?.focus();
  };
  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...pin];
    for (let i = 0; i < digits.length; i++) next[i] = digits[i];
    setPin(next);
    pinRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const fullPin = pin.join('');
  const canJoin = fullPin.length === 6 && nickname.trim().length >= 2;

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setSelectedFile(f);
  };
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === 'application/pdf') setSelectedFile(f);
  };

  const adjustQ = (d: number) => setNumQuestions(q => Math.min(MAX_Q, Math.max(MIN_Q, q + d)));

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="mb-9">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sienna flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-alabaster">Quiz Arena</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-alabaster leading-tight">
            Ready to play?
          </h1>
          <p className="text-smoke text-sm mt-1">Join an existing game or host your own.</p>
        </div>

        {/* Card */}
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-rim">
            {(['join', 'host'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setHostStep('upload'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all duration-150"
                style={{
                  color: activeTab === tab ? 'var(--color-alabaster)' : 'var(--color-smoke)',
                  borderBottom: activeTab === tab ? '2px solid var(--color-sienna)' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: 'transparent',
                }}
              >
                {tab === 'join' ? <Users className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                {tab === 'join' ? 'Join Game' : 'Host Game'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="px-4 py-3 rounded-lg text-sm font-medium badge !rounded-lg !px-4 !py-3"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeTab === 'join' ? (
                <motion.div key="join" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.16 }}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-smoke mb-2">Game PIN</p>
                  <div className="flex gap-1.5 mb-5" onPaste={handlePinPaste}>
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { pinRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handlePinChange(i, e.target.value)}
                        onKeyDown={e => handlePinKeyDown(i, e)}
                        className="w-full text-center text-xl font-bold rounded-lg transition-all duration-150"
                        style={{
                          height: '3rem',
                          background: 'var(--color-canvas)',
                          border: digit ? '1.5px solid var(--color-sienna)' : '1px solid var(--color-rim)',
                          color: 'var(--color-alabaster)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-smoke mb-2">Nickname</p>
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canJoin && onJoinGame(fullPin, nickname.trim())}
                    placeholder="How should we call you?" maxLength={16} className="input-field mb-5" />
                  <button onClick={() => canJoin && onJoinGame(fullPin, nickname.trim())} disabled={!canJoin}
                    className="btn-primary w-full">
                    Join Game <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>

              ) : hostStep === 'upload' ? (
                <motion.div key="host-upload" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-sienna mb-3">Step 1 of 2 · Upload PDF</p>

                  {/* Google sign-in prompt for guests */}
                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 px-3.5 py-3 rounded-xl border flex items-center justify-between gap-3"
                      style={{ background: 'var(--color-canvas)', borderColor: 'var(--color-rim)' }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-alabaster">Save quiz history</p>
                        <p className="text-[10px] text-smoke mt-0.5">Sign in to track student performance.</p>
                      </div>
                      <button
                        onClick={signInWithGoogle}
                        className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-sienna/40 text-sienna hover:bg-sienna/10 transition-colors"
                      >
                        <LogIn className="w-3 h-3" />
                        Sign in
                      </button>
                    </motion.div>
                  )}

                  {/* Signed-in badge */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 px-3.5 py-2.5 rounded-xl border flex items-center gap-2"
                      style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}
                    >
                      {user.photoURL
                        ? <img src={user.photoURL} alt="avatar" className="w-5 h-5 rounded-full flex-shrink-0" />
                        : <LayoutDashboard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      }
                      <p className="text-[11px] font-semibold text-emerald-400 truncate">
                        Quiz will be saved to your dashboard
                      </p>
                    </motion.div>
                  )}
                  <div
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-5"
                    style={{
                      border: isDragging ? '1.5px dashed var(--color-sienna)' : selectedFile ? '1.5px dashed color-mix(in srgb, var(--color-sienna) 40%, transparent)' : '1.5px dashed var(--color-rim)',
                      background: isDragging ? 'var(--color-sienna-wash)' : selectedFile ? 'color-mix(in srgb, var(--color-sienna) 4%, transparent)' : 'var(--color-canvas)',
                    }}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                    {selectedFile ? (
                      <>
                        <FileText className="w-9 h-9 mx-auto mb-3 text-sienna" />
                        <p className="text-sm font-semibold text-alabaster">{selectedFile.name}</p>
                        <p className="text-xs mt-1 text-smoke">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-9 h-9 mx-auto mb-3 transition-colors" style={{ color: isDragging ? 'var(--color-sienna)' : 'var(--color-smoke)' }} />
                        <p className="text-sm font-semibold text-alabaster">Drop your PDF</p>
                        <p className="text-xs mt-1 text-smoke">or click to browse</p>
                      </>
                    )}
                  </div>
                  <button onClick={() => selectedFile && setHostStep('config')} disabled={!selectedFile} className="btn-primary w-full">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Saved Quizzes Section */}
                  {savedQuizzes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-rim">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-smoke mb-3">Or host a saved quiz</p>
                      <div className="space-y-2">
                        {savedQuizzes.map(quiz => (
                          <div 
                            key={quiz.id} 
                            className="flex items-center justify-between p-3 rounded-xl border border-rim hover:border-sienna transition-colors bg-canvas cursor-pointer" 
                            onClick={() => onHostSavedQuiz?.(quiz)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sienna/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-sienna" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-alabaster">{quiz.topic}</p>
                                <p className="text-[10px] text-smoke">{quiz.questions.length} questions</p>
                              </div>
                            </div>
                            <button className="btn-ghost !px-2 !py-1 text-xs text-sienna hover:bg-sienna/10">Host</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

              ) : (
                <motion.div key="host-config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-sienna">Step 2 of 2 · Configure</p>
                    <button onClick={() => setHostStep('upload')} className="text-xs font-medium text-smoke hover:text-alabaster transition-colors flex items-center gap-1">
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  {/* File pill */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rim mb-6" style={{ background: 'var(--color-canvas)' }}>
                    <FileText className="w-3.5 h-3.5 text-sienna flex-shrink-0" />
                    <span className="text-xs text-smoke truncate">{selectedFile?.name}</span>
                  </div>

                  {/* Question count */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-alabaster">Number of Questions</p>
                        <p className="text-xs text-smoke mt-0.5">AI generates {numQuestions} Q&As</p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => adjustQ(1)} disabled={numQuestions >= MAX_Q}
                          className="w-7 h-6 rounded-md border border-rim flex items-center justify-center hover:border-sienna transition-colors disabled:opacity-30"
                          style={{ background: 'var(--color-canvas)' }}>
                          <ChevronUp className="w-3.5 h-3.5 text-smoke" />
                        </button>
                        <span className="text-2xl font-extrabold text-alabaster tabular-nums leading-none my-0.5">{numQuestions}</span>
                        <button onClick={() => adjustQ(-1)} disabled={numQuestions <= MIN_Q}
                          className="w-7 h-6 rounded-md border border-rim flex items-center justify-center hover:border-sienna transition-colors disabled:opacity-30"
                          style={{ background: 'var(--color-canvas)' }}>
                          <ChevronDown className="w-3.5 h-3.5 text-smoke" />
                        </button>
                      </div>
                    </div>
                    <input type="range" min={MIN_Q} max={MAX_Q} step={1} value={numQuestions}
                      onChange={e => setNumQuestions(Number(e.target.value))}
                      className="w-full h-1 rounded-full"
                      style={{ background: `linear-gradient(to right, var(--color-sienna) ${((numQuestions - MIN_Q) / (MAX_Q - MIN_Q)) * 100}%, var(--color-rim) 0%)` }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-smoke">{MIN_Q}</span>
                      <span className="text-[10px] text-smoke">{MAX_Q}</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-alabaster mb-2.5">Difficulty</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(DIFFICULTY_META) as Difficulty[]).map(d => {
                        const active = difficulty === d;
                        return (
                          <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => setDifficulty(d)}
                            className="py-3 px-1.5 rounded-lg text-center transition-all duration-150"
                            style={{
                              background: active ? 'var(--color-sienna-wash)' : 'var(--color-canvas)',
                              border: active ? '1.5px solid var(--color-sienna)' : '1px solid var(--color-rim)',
                            }}>
                            <p className="text-xs font-bold" style={{ color: active ? 'var(--color-sienna)' : 'var(--color-smoke)' }}>{d}</p>
                            <p className="text-[10px] mt-0.5 leading-tight" style={{ color: active ? 'var(--color-sienna)' : 'var(--color-rim)' }}>
                              {DIFFICULTY_META[d].desc}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-smoke">Generating {numQuestions} {difficulty.toLowerCase()} questions…</span>
                        <span className="text-sienna font-semibold">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden bg-rim">
                        <motion.div className="h-full rounded-full bg-sienna" initial={{ width: 0 }}
                          animate={{ width: `${Math.min(uploadProgress, 100)}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </motion.div>
                  )}

                  <button onClick={() => selectedFile && onHostGame(selectedFile, numQuestions, difficulty)}
                    disabled={!selectedFile || (uploadProgress > 0 && uploadProgress < 100)}
                    className="btn-primary w-full">
                    <Sparkles className="w-4 h-4" /> Generate {numQuestions} Questions
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs mt-5 text-smoke">
          AI-powered · Developed by <span className="font-semibold text-alabaster">Chalana Dilshan</span>
        </p>
      </motion.div>
    </div>
  );
}
