import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirebase } from '../utils/firebaseMode';
import type { WeeklyUserEntry } from '../types/multiplayer';

function asDate(v: any): Date {
  return v?.toDate?.() ?? (v instanceof Date ? v : new Date());
}

function weekKey(d = new Date()): string {
  // ISO week (simple, good enough for v1)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function mapEntry(id: string, data: any): WeeklyUserEntry {
  return {
    id,
    displayName: data.displayName,
    photoURL: data.photoURL,
    focusMinutes: data.focusMinutes ?? 0,
    xpGained: data.xpGained ?? 0,
    tasksCompleted: data.tasksCompleted ?? 0,
    booksCompleted: data.booksCompleted ?? 0,
    score: data.score ?? 0,
    updatedAt: asDate(data.updatedAt),
  };
}

export function useWeeklyLeaderboard() {
  const [entries, setEntries] = useState<WeeklyUserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentWeekKey = useMemo(() => weekKey(), []);

  useEffect(() => {
    if (!useFirebase) return;
    setIsLoading(true);
    const q = query(collection(db, 'seasons', currentWeekKey, 'users'), orderBy('score', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => mapEntry(d.id, d.data())));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [currentWeekKey]);

  return { entries, isLoading, weekKey: currentWeekKey };
}

