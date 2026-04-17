import { useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { StudySession } from '../data/db';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../config/firebase';
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp, updateDoc, doc
} from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useStudySessions() {
  const { user, addXP } = useAuth();

  // ── Local ────────────────────────────────────────────────────────────
  const localSessions = useLiveQuery(
    () => user && !useFirebase ? dexieDb.studySessions.where('userId').equals(user.id).toArray() : Promise.resolve([]),
    [user?.id],
    []
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
  }, [user, addXP]);

  return { sessions, addSession };
}
