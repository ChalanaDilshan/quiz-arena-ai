import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface TutorChatProps {
  questionText: string;
  playerAnswer: string;
  correctAnswer: string;
  roomPin: string;
  playerId: string;
  onClose: () => void;
}

export function TutorChat({ questionText, playerAnswer, correctAnswer, roomPin, playerId, onClose }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Strands session ID — persisted across turns so the agent remembers context
  const [sessionId, setSessionId] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Fetch initial explanation on mount
  useEffect(() => {
    fetchExplanation(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExplanation = async (userInput: string | null) => {
    setIsLoading(true);

    if (userInput) {
      setMessages(prev => [...prev, { role: 'user' as const, text: userInput }]);
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/tutor/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomPin,
          playerId,
          questionText,
          playerAnswer,
          correctAnswer,
          sessionId,          // Strands uses this to restore conversation history
          followUp: userInput ?? '',
        }),
      });

      if (res.status === 429) {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: "I'm currently helping too many students (API Rate Limit reached). Please give me 30 seconds to catch my breath and ask me again!" },
        ]);
        setIsLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        // Fallback to non-streaming endpoint if streaming is not supported
        const fallbackRes = await fetch(`${getApiUrl()}/api/tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomPin,
            playerId,
            questionText,
            playerAnswer,
            correctAnswer,
            sessionId,
            followUp: userInput ?? '',
          }),
        });

        if (!fallbackRes.ok) throw new Error('API Error');
        const data = await fallbackRes.json();
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.explanation) {
          setMessages(prev => [...prev, { role: 'model', text: data.explanation }]);
        }
        setIsLoading(false);
        return;
      }

      // Add placeholder model message for streaming tokens
      setMessages(prev => [...prev, { role: 'model' as const, text: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const payload = JSON.parse(trimmed.slice(6));
              if (payload.session_id) {
                setSessionId(payload.session_id);
              }
              if (payload.token) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'model') {
                    return [
                      ...updated.slice(0, -1),
                      { ...last, text: last.text + payload.token }
                    ];
                  }
                  return updated;
                });
              }
            } catch (err) {
              console.warn('[TutorChat] Stream chunk parse notice:', err);
            }
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
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
    fetchExplanation(question);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-dialog-title"
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
            <h2 id="tutor-dialog-title" className="text-sm font-bold text-alabaster">Professor Q</h2>
            <p className="text-[10px] text-smoke truncate">AI Tutor · Personalized Explanation</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Professor Q AI Tutor"
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
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation with Professor Q"
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ minHeight: 0 }}
        >
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
                  {isLoading && i === messages.length - 1 && msg.role === 'model' && (
                    <span className="inline-block w-1.5 h-3 bg-sienna ml-0.5 animate-pulse align-middle rounded-sm" />
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator (only shown before the first streamed token arrives) */}
            {isLoading && (messages.length === 0 || messages[messages.length - 1].text === '') && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 items-center text-smoke text-xs"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(224,122,95,0.2)' }}
                >
                  <Bot className="w-3 h-3" style={{ color: 'var(--color-sienna, #E07A5F)' }} />
                </div>
                <span className="flex items-center gap-1.5 italic text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Professor Q is thinking…
                </span>
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
            aria-label="Type your follow-up question for Professor Q"
            className="flex-1 text-xs rounded-lg px-3 py-2 bg-transparent outline-none text-alabaster placeholder:text-smoke"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send message to Professor Q"
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
