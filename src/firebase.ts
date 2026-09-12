import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (apiKey && apiKey !== 'undefined' && apiKey !== 'your-firebase-api-key') {
  try {
    const firebaseConfig = {
      apiKey:            apiKey,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
  }
} else {
  console.warn('[Firebase] VITE_FIREBASE_API_KEY is not configured. Running in guest mode.');
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;

