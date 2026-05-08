import { useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { TimetableEntry } from '../data/db';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../config/firebase';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot
} from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

export function useTimetable() {
  const { user } = useAuth();

  // ── Local ─────────────────────────────────────────────
  const localTimetable = useLiveQuery<TimetableEntry[]>(
    () => user && !useFirebase
      ? dexieDb.timetable.where('userId').equals(user.id).toArray()
      : Promise.resolve([] as TimetableEntry[]),
    [user?.id]
  );

  // ── Cloud ─────────────────────────────────────────────
  const [cloudTimetable, setCloudTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    if (!useFirebase || !user) return;
    const q = query(collection(firestoreDb, 'timetable'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry));
      setCloudTimetable(data);
    });
    return () => unsub();
  }, [user]);

  const timetable: TimetableEntry[] = useFirebase ? cloudTimetable : (localTimetable || []);

  const addEntry = useCallback(async (entry: Omit<TimetableEntry, 'id' | 'userId'>) => {
    if (!user) return;
    if (useFirebase) {
      await addDoc(collection(firestoreDb, 'timetable'), { ...entry, userId: user.id });
    } else {
      await dexieDb.timetable.add({ ...entry, id: crypto.randomUUID(), userId: user.id });
    }
  }, [user]);

  const updateEntry = useCallback(async (id: string, entry: Partial<TimetableEntry>) => {
    if (useFirebase) {
      await updateDoc(doc(firestoreDb, 'timetable', id), entry as any);
    } else {
      await dexieDb.timetable.update(id, entry);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    if (useFirebase) {
      await deleteDoc(doc(firestoreDb, 'timetable', id));
    } else {
      await dexieDb.timetable.delete(id);
    }
  }, []);

  return { timetable, addEntry, updateEntry, deleteEntry };
}
