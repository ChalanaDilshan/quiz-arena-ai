import { useState, useCallback } from 'react';

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

  const triggerCommentary = useCallback(async (eventType: string, data: any) => {
    // Show typing indicator
    setState((prev) => ({ ...prev, isVisible: true, isTyping: true, currentComment: null }));

    try {
      const response = await fetch('http://localhost:3001/api/commentary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch commentary');
      }

      const result = await response.json();
      
      // Show actual comment
      setState({
        isVisible: true,
        isTyping: false,
        currentComment: result.comment,
      });

      // Auto-hide after 8 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: false }));
      }, 8000);

    } catch (error) {
      console.error('Commentator error:', error);
      setState({
        isVisible: false,
        isTyping: false,
        currentComment: null,
      });
    }
  }, []);

  return {
    ...state,
    triggerCommentary,
  };
}
