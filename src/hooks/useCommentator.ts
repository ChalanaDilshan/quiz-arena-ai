import { useState, useCallback } from 'react';
import { getApiUrl } from '../utils/apiConfig';

export interface CommentatorState {
  currentComment: string | null;
  isTyping: boolean;
  isVisible: boolean;
}

export function useCommentator() {
  const [state, setState] = useState<CommentatorState>({
    currentComment: null,
    isTyping: false,
    isVisible: false,
  });

  const triggerCommentary = useCallback(async (eventType: string, data: any, roomPin: string = 'MOCK_TEST_ROOM') => {
    // Show typing indicator immediately
    setState({ isVisible: true, isTyping: true, currentComment: null });

    let accumulated = '';
    let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleAutoHide = () => {
      if (autoHideTimer) clearTimeout(autoHideTimer);
      autoHideTimer = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: false }));
      }, 8000);
    };

    try {
      const response = await fetch(`${getApiUrl()}/api/commentary/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data, roomPin }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Show streaming comment immediately on first token
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.token) {
              accumulated += payload.token;
              // On first token: clear the typing indicator and start showing text
              setState({ isVisible: true, isTyping: false, currentComment: accumulated });
            }

            if (payload.done) {
              scheduleAutoHide();
            }
          } catch {
            // Malformed SSE line — skip
          }
        }
      }

      // If nothing streamed at all, hide
      if (!accumulated) {
        setState({ isVisible: false, isTyping: false, currentComment: null });
      } else {
        scheduleAutoHide();
      }
    } catch (error) {
      console.error('Commentator stream error:', error);
      setState({ isVisible: false, isTyping: false, currentComment: null });
    }
  }, []);

  return {
    ...state,
    triggerCommentary,
  };
}
