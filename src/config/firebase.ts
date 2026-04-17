import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const trim = (v?: string) => v?.trim().replace(/^["'](.+)["']$/, '$1') || "";

const firebaseConfig = {
  apiKey: trim(import.meta.env.VITE_FIREBASE_API_KEY) || "dummy_api_key",
  authDomain: trim(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "dummy_auth_domain",
  projectId: trim(import.meta.env.VITE_FIREBASE_PROJECT_ID) || "dummy_project_id",
  storageBucket: trim(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "dummy_storage_bucket",
  messagingSenderId: trim(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "dummy_id",
  appId: trim(import.meta.env.VITE_FIREBASE_APP_ID) || "dummy_app_id"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
