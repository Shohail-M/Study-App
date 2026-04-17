import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db as dexieDb } from '../data/db';
import type { User } from '../data/db';
import { auth, db as firestoreDb, googleProvider } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  addXP: (amount: number) => Promise<void>;
  isGoogleUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CURRENT_USER_KEY = 'study_app_current_user';

const DEFAULT_SETTINGS: User['settings'] = {
  pomodoroWork: 25,
  pomodoroBreak: 5,
  pomodoroCycles: 4,
  defaultSubjects: ['Math', 'Science', 'History', 'English'],
  bgMusic: 'none',
  theme: 'dark',
};

// ─── Helper: load/save user from Firestore ───────────────────────────────
async function loadFirestoreUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestoreDb, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as User;
}

async function saveFirestoreUser(user: User): Promise<void> {
  const { id, ...data } = user;
  await setDoc(doc(firestoreDb, 'users', id), data, { merge: true });
}

// ─── Provider ────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ── Firebase Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!useFirebase) {
      // Dexie path: read from localStorage
      const loadSession = async () => {
        const storedId = localStorage.getItem(CURRENT_USER_KEY);
        if (storedId) {
          try {
            const storedUser = await dexieDb.users.get(storedId);
            if (storedUser) setUser(storedUser);
            else localStorage.removeItem(CURRENT_USER_KEY);
          } catch (e) {
            console.error('Failed to load user from DB', e);
          }
        }
        setIsAuthLoading(false);
      };
      loadSession();
      return;
    }

    // Firebase path: listen to auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsAuthLoading(true);
      if (fbUser) {
        try {
          let profile = await loadFirestoreUser(fbUser.uid);
          if (!profile && fbUser.email) {
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              passwordHash: '',
              xp: 0,
              level: 1,
              streak: 0,
              studyTimeMs: 0,
              joinedAt: new Date(),
              settings: DEFAULT_SETTINGS,
            };
            await saveFirestoreUser(profile);
          }
          setUser(profile);
        } catch (e) {
          console.error('Failed to load/create Firestore user', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      if (useFirebase) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        let profile = await loadFirestoreUser(cred.user.uid);
        
        // Robustness: create profile if missing (helps with cross-device sync if signup was interrupted)
        if (!profile && cred.user.email) {
          profile = {
            id: cred.user.uid,
            name: cred.user.displayName || email.split('@')[0],
            email: cred.user.email,
            passwordHash: '',
            xp: 0,
            level: 1,
            streak: 0,
            studyTimeMs: 0,
            joinedAt: new Date(),
            settings: DEFAULT_SETTINGS,
          };
          await saveFirestoreUser(profile);
        }
        
        if (!profile) return { success: false, error: 'User profile not found and could not be created.' };
        setUser(profile);
        return { success: true };
      } else {
        const existingUser = await dexieDb.users.where('email').equals(email).first();
        if (!existingUser) return { success: false, error: 'No account found with this email.' };
        if (existingUser.passwordHash !== password) return { success: false, error: 'Incorrect password.' };
        setUser(existingUser);
        localStorage.setItem(CURRENT_USER_KEY, existingUser.id);
        return { success: true };
      }
    } catch (e: any) {
      const msg = e?.code === 'auth/user-not-found' ? 'No account found with this email.'
        : e?.code === 'auth/wrong-password' ? 'Incorrect password.'
        : e?.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : 'Login failed. Please try again.';
      return { success: false, error: msg };
    }
  }, []);

  // ── Signup ───────────────────────────────────────────────────────────
  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      if (useFirebase) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
          id: cred.user.uid,
          name,
          email,
          passwordHash: '',
          xp: 0,
          level: 1,
          streak: 0,
          studyTimeMs: 0,
          joinedAt: new Date(),
          settings: DEFAULT_SETTINGS,
        };
        await saveFirestoreUser(newUser);
        setUser(newUser);
        return { success: true };
      } else {
        const existingUser = await dexieDb.users.where('email').equals(email).first();
        if (existingUser) return { success: false, error: 'An account with this email already exists.' };
        const newUser: User = {
          id: email,
          name,
          email,
          passwordHash: password,
          xp: 0,
          level: 1,
          streak: 0,
          studyTimeMs: 0,
          joinedAt: new Date(),
          settings: DEFAULT_SETTINGS,
        };
        await dexieDb.users.add(newUser);
        setUser(newUser);
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        return { success: true };
      }
    } catch (e: any) {
      console.error('Signup error details:', e);
      const msg = e?.code === 'auth/email-already-in-use' ? 'An account with this email already exists.'
        : e?.code === 'auth/weak-password' ? 'Password should be at least 6 characters.'
        : e?.code === 'auth/operation-not-allowed' ? 'Email/Password signup is not enabled in Firebase Console.'
        : e?.message || 'Signup failed. Please try again.';
      return { success: false, error: msg };
    }
  }, []);

  // ── Google Login ────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      if (!useFirebase) return { success: false, error: 'Google login is not available in local mode.' };
      
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user) throw new Error('Could not get user from Google');
      
      // We don't call setUser here as onAuthStateChanged will handle it 
      // when the auth state changes from the successful popup sign-in.
      // We just need to wait a tiny bit to ensure the profile is loaded.
      return { success: true };
    } catch (e: any) {
      console.error('Google login error:', e);
      let msg = 'Google login failed.';
      if (e?.code === 'auth/popup-blocked') msg = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      else if (e?.code === 'auth/popup-closed-by-user') msg = 'Sign-in was cancelled (popup closed).';
      else if (e?.code === 'auth/operation-not-allowed') msg = 'Google sign-in is not enabled in Firebase Console.';
      else if (e?.message) msg = e.message;
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (useFirebase) {
      await signOut(auth);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    setUser(null);
  }, []);

  // ── Update user ──────────────────────────────────────────────────────
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      if (useFirebase && auth.currentUser) {
        if (updates.name) {
          await updateProfile(auth.currentUser, { displayName: updates.name });
        }
        const { id, ...data } = updatedUser;
        await updateDoc(doc(firestoreDb, 'users', id), data as any);
      } else {
        await dexieDb.users.put(updatedUser);
      }
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to update user', e);
    }
  }, [user]);

  // ── Change Password ──────────────────────────────────────────────────
  const changePassword = useCallback(async (newPassword: string) => {
    try {
      if (useFirebase && auth.currentUser) {
        // Firebase updatePassword works for both email/password users 
        // and social users (who want to add a password to their account).
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      } else if (!useFirebase && user) {
        await dexieDb.users.update(user.id, { passwordHash: newPassword });
        setUser({ ...user, passwordHash: newPassword });
        return { success: true };
      }
      return { success: false, error: 'Cannot update password in this mode.' };
    } catch (e: any) {
      console.error('Password update error:', e);
      if (e?.code === 'auth/requires-recent-login') {
        return { success: false, error: 'This operation is sensitive and requires recent authentication. Please log out and log back in to change your password.' };
      }
      return { success: false, error: e?.message || 'Failed to update password.' };
    }
  }, [user]);

  // ── Add XP ───────────────────────────────────────────────────────────
  const addXP = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const newXP = user.xp + amount;
      const newLevel = Math.floor(newXP / 500) + 1;
      const updatedUser = { ...user, xp: newXP, level: newLevel };
      if (useFirebase) {
        await updateDoc(doc(firestoreDb, 'users', user.id), { xp: newXP, level: newLevel });
      } else {
        await dexieDb.users.put(updatedUser);
      }
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to add XP', e);
    }
  }, [user]);

  const isGoogleUser = useFirebase && !!auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAuthLoading, login, signup, loginWithGoogle, logout, updateUser, changePassword, addXP, isGoogleUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
