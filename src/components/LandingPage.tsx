import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Upload, Users, Trophy, Brain, ArrowRight,
  Play, Share2, Sun, Moon, ChevronRight,
  Sliders, ShieldCheck, Cpu, ChevronDown, Award, Check,
  LayoutDashboard, LogOut, LogIn,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { InteractiveHeroDemo } from './InteractiveHeroDemo';

interface LandingPageProps {
  onHost: () => void;
  onJoin: () => void;
  onOpenAdmin: () => void;
}

// ── Auth User Menu ────────────────────────────────────────────────────────────
function UserMenu({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { user, signOut, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={signInWithGoogle}
        className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border border-rim transition-all hover:border-sienna/50 hover:bg-sienna/5"
        style={{ color: 'var(--color-smoke)' }}
        title="Sign in with Google to save quiz history"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign in</span>
      </motion.button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-rim hover:border-sienna/50 transition-colors"
        title={user.displayName ?? 'Account'}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-sienna flex items-center justify-center text-white text-xs font-bold">
            {(user.displayName ?? 'H')[0].toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-xs font-semibold text-alabaster max-w-[90px] truncate">
          {user.displayName?.split(' ')[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-smoke" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 card rounded-xl border border-rim shadow-xl z-50 overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-rim">
              <p className="text-xs font-bold text-alabaster truncate">{user.displayName}</p>
              <p className="text-[10px] text-smoke truncate mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); onOpenAdmin(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-smoke hover:text-alabaster hover:bg-sienna/10 transition-colors text-left"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-sienna" />
              Admin Dashboard
            </button>
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-smoke hover:text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-rim"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Theme Toggle Button ──────────────────────────────────────────────────────
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors btn-ghost !p-0 shadow-sm"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700" />
        )}
      </motion.div>
    </motion.button>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onHost, onJoin, onOpenAdmin }: LandingPageProps) {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 border-b border-rim/60"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sienna text-white shadow-md shadow-sienna/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-alabaster">
              Quiz Arena
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sienna-wash text-sienna border border-sienna/20">
              AI LIVE
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#interactive-demo"
            className="text-sm font-medium text-smoke hover:text-alabaster transition-colors"
          >
            Interactive Demo
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-smoke hover:text-alabaster transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-smoke hover:text-alabaster transition-colors"
          >
            How it Works
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-smoke hover:text-alabaster transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggleButton />
          <button
            onClick={onJoin}
            className="btn-ghost text-sm !py-2 !px-4 hidden sm:flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-smoke" />
            <span>Join Game</span>
          </button>
          <button
            onClick={onHost}
            className="btn-primary text-sm !py-2 !px-3 sm:!px-4.5 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Host Quiz</span>
          </button>
          <UserMenu onOpenAdmin={onOpenAdmin} />
        </div>
      </div>
    </header>
  );
}

// ── FAQ Accordion Item ────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card rounded-xl border border-rim overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-alabaster transition-colors hover:text-sienna cursor-pointer"
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-smoke"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-smoke leading-relaxed border-t border-rim/40 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main LandingPage Component ───────────────────────────────────────────────
export function LandingPage({ onHost, onJoin, onOpenAdmin }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'host' | 'player' | 'ai'>('host');

  const stats = [
    { value: '< 5s', label: 'AI Question Generation', icon: <Brain className="w-4 h-4 text-sienna" /> },
    { value: '100%', label: 'Live Real-time Sync', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { value: '3-20', label: 'Configurable Questions', icon: <Sliders className="w-4 h-4 text-emerald-500" /> },
    { value: '0 App', label: 'No Installs Required', icon: <ShieldCheck className="w-4 h-4 text-sky-500" /> },
  ];

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden relative">
      {/* Background Subtle Ambient Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Top Ambient Glow Orb */}
      <div className="hero-glow-orb top-[-100px] left-1/2 -translate-x-1/2" />

      <Navbar onHost={onHost} onJoin={onJoin} onOpenAdmin={onOpenAdmin} />

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION with INTERACTIVE DEMO
      ══════════════════════════════════════════════════════════════ */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column — Hero Pitch */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* Live Status Pill */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sienna-wash border border-sienna/20 text-sienna text-xs font-bold mb-6 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sienna opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sienna" />
              </span>
              <span>Next-Gen Multiplayer AI Quiz Platform</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-alabaster mb-6">
              Turn Any PDF Into a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sienna via-amber-500 to-sienna">
                Live Multiplayer
              </span>{' '}
              Quiz Arena
            </h1>

            {/* Sub-headline */}
            <p className="text-smoke text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              Drop in lecture slides, research papers, or study notes. Our AI instantly extracts key concepts into competitive multiple-choice questions with live animated leaderboards.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onHost}
                className="btn-primary text-base !px-7 !py-3.5 shadow-lg shadow-sienna/25 flex items-center justify-center gap-2.5 w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                <span>Host Quiz from PDF</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onJoin}
                className="btn-ghost text-base !px-6 !py-3.5 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Users className="w-4 h-4 text-smoke" />
                <span>Join with 6-Digit PIN</span>
              </motion.button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full pt-6 border-t border-rim/60">
              {stats.map((s, idx) => (
                <div key={idx} className="card p-3 rounded-xl border border-rim/80 bg-elevated/70">
                  <div className="flex items-center gap-1.5 mb-1">
                    {s.icon}
                    <span className="font-extrabold text-sm sm:text-base text-alabaster tabular-nums">
                      {s.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-smoke leading-tight font-medium">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column — Interactive Hero Demo */}
          <motion.div
            id="interactive-demo"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative w-full mt-8 lg:mt-16"
          >
            <InteractiveHeroDemo onHost={onHost} onJoin={onJoin} />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          INTERACTIVE WORKFLOW SHOWCASE TABS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-rim bg-elevated/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge text-[10px] uppercase tracking-widest font-bold mb-3">
              Platform Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-alabaster mb-3">
              Engineered for Speed, Engagement &amp; Retention
            </h2>
            <p className="text-smoke text-sm sm:text-base">
              See how Quiz Arena streamlines quiz generation, player onboarding, and gameplay into a cohesive real-time loop.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex justify-center mb-8">
            <div className="card p-1.5 rounded-2xl flex gap-1 border border-rim max-w-md w-full">
              {[
                { id: 'host', label: 'Host Experience', icon: <Upload className="w-3.5 h-3.5" /> },
                { id: 'player', label: 'Player View', icon: <Users className="w-3.5 h-3.5" /> },
                { id: 'ai', label: 'AI Engine', icon: <Cpu className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'host' | 'player' | 'ai')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-sienna text-white shadow-md shadow-sienna/20'
                      : 'text-smoke hover:text-alabaster'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="card rounded-2xl p-6 sm:p-8 border border-rim shadow-xl max-w-4xl mx-auto"
            >
              {activeTab === 'host' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="badge mb-3">Host Mode</div>
                    <h3 className="text-2xl font-bold text-alabaster mb-3">
                      Drop a PDF &amp; Launch in 2 Clicks
                    </h3>
                    <p className="text-smoke text-sm leading-relaxed mb-5">
                      Upload your material, select question count (3 to 20), and pick a difficulty tier (Easy, Medium, Hard). Quiz Arena handles the rest, generating ready-to-play sessions with 6-digit room PINs.
                    </p>
                    <ul className="space-y-2.5 text-xs text-smoke font-medium">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Automatic concept &amp; distractor generation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Host dashboard with live participant tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Synchronized next-question broadcasts</span>
                      </li>
                    </ul>
                  </div>
                  <div className="card p-5 rounded-xl border border-rim bg-canvas flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-rim pb-3">
                      <span className="text-xs font-bold text-alabaster">Host Control Panel</span>
                      <span className="badge text-[10px]">PIN: 482 910</span>
                    </div>
                    <div className="p-3 rounded-lg border border-dashed border-sienna/40 bg-sienna-wash/30 text-center">
                      <p className="text-xs font-bold text-sienna">Calculus_Midterm_Review.pdf</p>
                      <p className="text-[10px] text-smoke">10 Questions · Medium Difficulty</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-smoke pt-1">
                      <span>Connected Players: <strong className="text-alabaster">6 players</strong></span>
                      <button onClick={onHost} className="btn-primary text-xs !py-1.5 !px-3">
                        Launch Room
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'player' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="badge mb-3">Player Mode</div>
                    <h3 className="text-2xl font-bold text-alabaster mb-3">
                      Instant PIN Join with Zero Friction
                    </h3>
                    <p className="text-smoke text-sm leading-relaxed mb-5">
                      Participants join from any mobile phone, tablet, or browser with just the room PIN and a nickname. Answer under pressure, build streaks, and climb the leaderboard.
                    </p>
                    <ul className="space-y-2.5 text-xs text-smoke font-medium">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Touch-optimized 2×2 colored answer pads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Dynamic streak bonus multipliers up to 2×</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Instant round feedback and score rankings</span>
                      </li>
                    </ul>
                  </div>
                  <div className="card p-5 rounded-xl border border-rim bg-canvas flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-rim pb-2">
                      <span className="text-xs font-bold text-smoke">⚡ Current Streak: 4×</span>
                      <span className="text-xs font-extrabold text-sienna">2,850 pts</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-red-600/80 text-white font-bold text-xs text-center">A: Option 1</div>
                      <div className="p-3 rounded-lg bg-blue-600/80 text-white font-bold text-xs text-center">B: Option 2</div>
                      <div className="p-3 rounded-lg bg-emerald-600 text-white font-bold text-xs text-center ring-2 ring-emerald-400">C: Correct ✔</div>
                      <div className="p-3 rounded-lg bg-amber-600/80 text-white font-bold text-xs text-center">D: Option 4</div>
                    </div>
                    <div className="text-center pt-1">
                      <button onClick={onJoin} className="btn-ghost text-xs !py-1.5 !px-4 w-full">
                        Join an Active Game
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="badge mb-3">AI Engine</div>
                    <h3 className="text-2xl font-bold text-alabaster mb-3">
                      High-Precision Concept Extraction
                    </h3>
                    <p className="text-smoke text-sm leading-relaxed mb-5">
                      Our parsing engine processes your document structure, identifying core theories, numerical data, and definitions to construct plausible multiple-choice questions and authentic distractors.
                    </p>
                    <ul className="space-y-2.5 text-xs text-smoke font-medium">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Semantic analysis ensures no ambiguous choices</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Automated concise explanations for each answer</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Adaptive difficulty calibration</span>
                      </li>
                    </ul>
                  </div>
                  <div className="card p-5 rounded-xl border border-rim bg-canvas flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-rim pb-2">
                      <span className="text-alabaster">AI Prompt Output Preview</span>
                      <span className="text-emerald-500 font-semibold">100% Quality Score</span>
                    </div>
                    <div className="bg-elevated p-3 rounded-lg border border-rim text-[11px] font-mono text-smoke leading-relaxed">
                      <p className="text-sienna font-bold mb-1">// Generated Q3 (Hard Difficulty)</p>
                      <p className="text-alabaster font-semibold">"Which loss function is optimal for training binary classification?"</p>
                      <p className="text-emerald-500 mt-1">✔ Binary Cross-Entropy (Log Loss)</p>
                      <p className="text-smoke">✖ Mean Squared Error</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 px-4 sm:px-6 border-t border-rim">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <span className="badge text-[10px] uppercase tracking-widest font-bold mb-3">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-alabaster">
              Built for high-stakes classroom &amp; team engagement
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Brain className="w-5 h-5" />,
                title: 'AI Question Generation',
                desc: 'Upload lecture slides, textbooks, or whitepapers. The AI extracts key knowledge points and crafts verified questions with plausible distractors in seconds.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Real-Time Competition',
                desc: 'Low-latency multiplayer sync. Everyone answers simultaneously with a countdown timer where faster answers earn massive time bonuses.',
              },
              {
                icon: <Trophy className="w-5 h-5" />,
                title: 'Live Animated Leaderboards',
                desc: 'Watch the rankings re-shuffle after each question with smooth spring layout transitions, point deltas, and streak multipliers.',
              },
              {
                icon: <Sliders className="w-5 h-5" />,
                title: 'Customizable Game Rules',
                desc: 'Configure 3 to 20 questions, set difficulty tiers from Easy to Hard, and manage live room sessions effortlessly.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Zero Account Hassle for Players',
                desc: 'Players join immediately by entering a 6-digit PIN on any mobile phone or browser. No signup, app installation, or credit cards.',
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: 'Interactive 3D Podium & Confetti',
                desc: 'Celebrate champions with an animated 3-tier podium, confetti cannon bursts, and complete score breakdown.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className="card card-hover p-6 rounded-2xl border border-rim flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sienna-wash text-sienna flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base text-alabaster mb-2">{f.title}</h3>
                  <p className="text-smoke text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS (3-Step Process)
      ══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-rim bg-elevated/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-14">
            <span className="badge text-[10px] uppercase tracking-widest font-bold mb-3">
              Quick Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-alabaster">
              Start Your Battle in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                icon: <Upload className="w-6 h-6" />,
                title: 'Upload Your Document',
                desc: 'Drag & drop any PDF syllabus, training deck, or notes. Set question count and difficulty.',
              },
              {
                step: '02',
                icon: <Share2 className="w-6 h-6" />,
                title: 'Share the 6-Digit PIN',
                desc: 'Display the room code on a projector or share it with remote participants to join the lobby.',
              },
              {
                step: '03',
                icon: <Play className="w-6 h-6" />,
                title: 'Compete & Win',
                desc: 'Answer fast, rack up consecutive streaks, watch the live leaderboard shift, and claim the podium.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="card p-6 sm:p-7 rounded-2xl border border-rim flex flex-col items-start relative"
              >
                <div className="flex items-center justify-between w-full mb-5">
                  <div className="w-12 h-12 rounded-xl bg-sienna-wash text-sienna flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-smoke/30 tabular-nums">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-bold text-base text-alabaster mb-2">{step.title}</h3>
                <p className="text-smoke text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6 border-t border-rim">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-12">
            <span className="badge text-[10px] uppercase tracking-widest font-bold mb-3">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-alabaster">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3.5">
            <FaqItem
              question="How does the AI generate questions from my PDF?"
              answer="Quiz Arena processes the text content of your uploaded PDF, extracts key factual relationships and core concepts, and formats them into four-choice questions with one correct answer and three plausible distractors."
            />
            <FaqItem
              question="Do participants need an account or special app?"
              answer="No! Players simply navigate to the site on any phone, tablet, or laptop, enter the 6-digit PIN and their nickname, and instantly enter the lobby."
            />
            <FaqItem
              question="How are scores and streaks calculated?"
              answer="Each correct answer awards 1,000 base points plus a time bonus for remaining seconds. Consecutive correct answers increase your streak multiplier up to 2×, allowing sharp players to climb the leaderboard quickly."
            />
            <FaqItem
              question="Can I test the application without a live backend?"
              answer="Yes! Quiz Arena includes a built-in interactive simulator (Mock Mode) with pre-loaded questions and simulated opponents, allowing you to test the complete gameplay loop right away."
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 border-t border-rim relative overflow-hidden">
        <div className="hero-glow-orb bottom-[-200px] left-1/2 -translate-x-1/2" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="badge text-[10px] uppercase tracking-widest font-bold mb-4">
            Instant Setup
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-alabaster mb-4">
            Ready to Ignite Your Next Session?
          </h2>
          <p className="text-smoke text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Experience the excitement of real-time AI-powered quiz competitions. Upload your PDF now and challenge your friends or team in minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onHost}
              className="btn-primary text-base !px-8 !py-3.5 shadow-lg shadow-sienna/25 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Host a Quiz Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onJoin}
              className="btn-ghost text-base !px-7 !py-3.5 flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-smoke" />
              <span>Join Active Room</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-rim py-8 px-4 sm:px-6 bg-canvas">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sienna text-white">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-extrabold text-sm text-alabaster">Quiz Arena</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-1.5 text-xs text-smoke text-center">
            <span>AI-Driven Real-Time Quiz Competition Platform</span>
            <span className="hidden sm:inline text-smoke/40">•</span>
            <span className="font-semibold text-alabaster">Developed by Chalana Dilshan</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-smoke font-medium">Dark / Light Mode</span>
            <ThemeToggleButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
