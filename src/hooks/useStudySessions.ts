import { useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { StudySession } from '../data/db';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../config/firebase';
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp, updateDoc, doc, increment, setDoc
} from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function useStudySessions() {
  const { user, addXP } = useAuth();
  const currentWeekKey = weekKey();

  // ── Local ────────────────────────────────────────────────────────────
  const localSessions = useLiveQuery<StudySession[]>(
    () => user && !useFirebase
      ? dexieDb.studySessions.where('userId').equals(user.id).toArray()
      : Promise.resolve([] as StudySession[]),
    [user?.id]
  );

  // ── Cloud ────────────────────────────────────────────────────────────
  const [cloudSessions, setCloudSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (!useFirebase || !user) return;
    const q = query(collection(firestoreDb, 'studySessions'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.() ?? new Date(),
      } as StudySession));
      setCloudSessions(data);
    });
    return () => unsub();
  }, [user]);

  const sessions: StudySession[] = useFirebase ? cloudSessions : (localSessions || []);

  // ── Add session ──────────────────────────────────────────────────────
  const addSession = useCallback(async (subject: string, durationMinutes: number, focusLevel = 100) => {
    if (!user) return;
    const durationMs = durationMinutes * 60 * 1000;

    if (useFirebase) {
      await addDoc(collection(firestoreDb, 'studySessions'), {
        userId: user.id,
        subject: subject || 'General Study',
        durationMs,
        focusLevel,
        date: serverTimestamp(),
      });
      // Update user's total study time
      await updateDoc(doc(firestoreDb, 'users', user.id), {
        studyTimeMs: (user.studyTimeMs || 0) + durationMs,
      });

      // v1: update weekly leaderboard doc (client-side). Prefer Cloud Functions later.
      const weeklyRef = doc(firestoreDb, 'seasons', currentWeekKey, 'users', user.id);
      await setDoc(weeklyRef, {
        displayName: user.name,
        photoURL: '',
        focusMinutes: increment(durationMinutes),
        xpGained: increment(durationMinutes * 5),
        tasksCompleted: increment(0),
        booksCompleted: increment(0),
        score: increment(durationMinutes * 2),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      const newSession: StudySession = {
        id: generateId(),
        userId: user.id,
        subject: subject || 'General Study',
        durationMs,
        focusLevel,
        date: new Date(),
      };
      await dexieDb.studySessions.add(newSession);
      await dexieDb.users.update(user.id, {
        studyTimeMs: (user.studyTimeMs || 0) + durationMs,
      });
    }

    addXP(durationMinutes * 5);
  }, [user, addXP, currentWeekKey]);

  return { sessions, addSession };
}
