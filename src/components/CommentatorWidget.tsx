import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface CommentatorWidgetProps {
  comment: string | null;
  isVisible: boolean;
  isTyping: boolean;
}

export function CommentatorWidget({ comment, isVisible, isTyping }: CommentatorWidgetProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs sm:max-w-sm"
        >
          <div className="relative">
            {/* Connection line to avatar */}
            <div className="absolute -left-3 top-1/2 w-3 h-0.5 bg-indigo-500/30" />
            
            <div className="card rounded-2xl p-4 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10"
                 style={{ background: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)', backdropFilter: 'blur(12px)' }}>
              
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  {/* Glowing dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-canvas shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Host</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  
                  {isTyping ? (
                    <div className="flex items-center gap-1 mt-2.5 mb-1.5">
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-xs sm:text-sm font-medium text-alabaster leading-relaxed"
                    >
                      {comment}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
