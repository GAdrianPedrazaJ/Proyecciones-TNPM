import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Solo inicializar si existe configuración válida
if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    // Silencioso en producción, solo log básico en desarrollo si fuera necesario
  }
}

export { auth, db };
export const requestNotificationPermission = async () => null;
export const onMessageListener = () => new Promise(() => {});
export default app;
