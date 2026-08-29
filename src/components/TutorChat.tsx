import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface TutorChatProps {
  questionText: string;
  playerAnswer: string;
  correctAnswer: string;
  onClose: () => void;
}

export function TutorChat({ questionText, playerAnswer, correctAnswer, onClose }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch initial explanation on mount
  useEffect(() => {
    fetchExplanation([], null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExplanation = async (history: Message[], userInput: string | null) => {
    setIsLoading(true);

    // Build Gemini-format history from our message array
    const geminiHistory = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // If this is a follow-up, add the user's new message to history
    if (userInput) {
      geminiHistory.push({ role: 'user', parts: [{ text: userInput }] });
    }

    try {
      const res = await fetch('http://localhost:3001/api/tutor/explain', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-agent-api-key': import.meta.env.VITE_AGENT_API_KEY || ''
        },
        body: JSON.stringify({
          questionText,
          playerAnswer,
          correctAnswer,
          history: geminiHistory,
        }),
      });

      if (res.status === 429) {
        setMessages(prev => [
          ...prev,
          ...(userInput ? [{ role: 'user' as const, text: userInput }] : []),
          { role: 'model', text: "I'm currently helping too many students (API Rate Limit reached). Please give me 30 seconds to catch my breath and ask me again!" },
        ]);
        return;
      }

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (data.explanation) {
        setMessages(prev => [
          ...prev,
          ...(userInput ? [{ role: 'user' as const, text: userInput }] : []),
          { role: 'model', text: data.explanation },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        ...(userInput ? [{ role: 'user' as const, text: userInput }] : []),
        { role: 'model', text: "Sorry, I had trouble connecting. Please try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    setInput('');
    fetchExplanation(messages, question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--color-card, #1a1a1a)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(224,122,95,0.2)' }}
          >
            <Bot className="w-4 h-4" style={{ color: 'var(--color-sienna, #E07A5F)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-alabaster">Professor Q</p>
            <p className="text-[10px] text-smoke truncate">AI Tutor · Personalized Explanation</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-smoke hover:text-alabaster transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Context pill */}
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-lg text-[11px] flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <span className="text-amber-400 font-semibold">Question: </span>
          <span className="text-smoke">{questionText}</span>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: msg.role === 'model'
                      ? 'rgba(224,122,95,0.2)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {msg.role === 'model'
                    ? <Bot className="w-3 h-3" style={{ color: 'var(--color-sienna, #E07A5F)' }} />
                    : <User className="w-3 h-3 text-smoke" />
                  }
                </div>
                <div
                  className="px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[80%] whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'model'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(224,122,95,0.15)',
                    border: `1px solid ${msg.role === 'model' ? 'rgba(255,255,255,0.08)' : 'rgba(224,122,95,0.25)'}`,
                    color: msg.role === 'model' ? 'var(--color-alabaster, #EAE6DF)' : 'var(--color-alabaster, #EAE6DF)',
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 items-center"
              >
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(224,122,95,0.2)' }}
                >
                  <Bot className="w-3 h-3" style={{ color: 'var(--color-sienna, #E07A5F)' }} />
                </div>
                <div
                  className="px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#9a9a9a' }}
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Professor Q is thinking…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div
          className="px-4 py-3 flex gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question…"
            className="flex-1 text-xs rounded-lg px-3 py-2 bg-transparent outline-none text-alabaster placeholder:text-smoke"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 flex-shrink-0"
            style={{
              background: input.trim() && !isLoading ? 'var(--color-sienna, #E07A5F)' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !isLoading ? 'white' : '#666',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
