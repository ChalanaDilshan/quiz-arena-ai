import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount = null;
const keyPath = join(__dirname, 'serviceAccountKey.json');

if (existsSync(keyPath)) {
  try {
    const raw = readFileSync(keyPath, 'utf8').trim();
    if (raw && raw !== '{}') {
      serviceAccount = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Warning reading serviceAccountKey.json:', err.message);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.warn('[FirebaseAdmin] Warning parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
  }
}

// Initialize Firebase Admin SDK only if valid credentials are present
if (getApps().length === 0 && serviceAccount && serviceAccount.project_id) {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (err) {
    console.warn('[FirebaseAdmin] Initialization failed:', err.message);
  }
}

export const adminAuth = getApps().length > 0 ? getAuth() : null;

