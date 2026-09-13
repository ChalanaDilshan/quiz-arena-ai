import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (fires immediately on mount)
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.warn('[Auth] Firebase auth check notice:', error.message);
        setUser(null);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const [authError, setAuthError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!auth || !googleProvider) {
      const msg = 'Google sign-in is not configured: missing Firebase API key. Please verify root .env has VITE_FIREBASE_* variables and rebuild the frontend container.';
      console.warn(msg);
      setAuthError(msg);
      alert(msg);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      const code = err?.code || '';
      let userMsg = err?.message || 'Google sign-in failed.';

      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your server';
        userMsg = `Firebase Auth Error: Domain/IP "${host}" is not authorized.\n\nFix: Go to Firebase Console > Authentication > Settings > Authorized domains and add "${host}".`;
      } else if (code === 'auth/popup-blocked') {
        userMsg = 'Google Sign-In popup was blocked by your browser. Please allow popups for this site.';
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return; // User intentionally closed popup, no error needed
      }

      setAuthError(userMsg);
      alert(userMsg);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error: authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
