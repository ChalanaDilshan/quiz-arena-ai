import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

interface HintBubbleProps {
  hintUsed: boolean;
  hintLoading: boolean;
  hint: string | null;
  disabled: boolean; // true when answer is selected or time is up
  onRequestHint: () => void;
}

export function HintBubble({ hintUsed, hintLoading, hint, disabled, onRequestHint }: HintBubbleProps) {
  const canClick = !hintUsed && !disabled;

  return (
    <div className="w-full mb-4">
      <AnimatePresence mode="wait">

        {/* ── State 1: Button — Hint not yet requested ── */}
        {!hintUsed && (
          <motion.div
            key="hint-button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={canClick ? { scale: 1.04, y: -1 } : {}}
              whileTap={canClick ? { scale: 0.96 } : {}}
              onClick={canClick ? onRequestHint : undefined}
              disabled={!canClick}
              aria-label="Request a hint from Hint Master (or press H on keyboard)"
              aria-expanded={hintUsed}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                border transition-all duration-200 select-none
                ${canClick
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 cursor-pointer shadow-sm shadow-amber-500/10'
                  : 'border-rim bg-canvas text-smoke opacity-40 cursor-not-allowed'
                }
              `}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Need a Hint?</span>
              <span className="hidden sm:inline-block text-[10px] opacity-60 font-mono">[H]</span>
            </motion.button>
          </motion.div>
        )}

        {/* ── State 2: Loading skeleton while AI thinks ── */}
        {hintUsed && hintLoading && (
          <motion.div
            key="hint-loading"
            role="status"
            aria-live="polite"
            aria-label="Hint Master is thinking"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Hint Master is thinking…
              </span>
            </div>
            {/* Shimmer skeleton lines */}
            <div className="space-y-2 pl-8">
              <div className="h-3 rounded-full bg-amber-500/10 animate-pulse w-[85%]" />
              <div className="h-3 rounded-full bg-amber-500/10 animate-pulse w-[60%]" />
            </div>
          </motion.div>
        )}

        {/* ── State 3: Hint text revealed ── */}
        {hintUsed && !hintLoading && hint && (
          <motion.div
            key="hint-revealed"
            role="region"
            aria-live="polite"
            aria-label="AI Hint from Hint Master"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4"
            style={{ background: 'rgba(245, 158, 11, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Hint Master Says
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-sm text-amber-100/90 leading-relaxed pl-8 italic"
            >
              "{hint}"
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
