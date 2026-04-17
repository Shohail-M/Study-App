import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import type { Task, Note, Book, TimetableEntry } from '../data/db';
import { useAuth } from '../context/AuthContext';

export interface SearchResults {
  tasks: Task[];
  notes: Note[];
  books: Book[];
  timetable: TimetableEntry[];
}

export function useGlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tasks: [], notes: [], books: [], timetable: [] });

  const recentSearches = useLiveQuery(
    async () => {
      if (!user) return [];
      const items = await db.recentSearches
        .where('userId')
        .equals(user.id)
        .reverse()
        .sortBy('timestamp');
      return items.slice(0, 5);
    },
    [user?.id],
    []
  );

  const performSearch = useCallback(async (q: string) => {
    if (!user || !q.trim()) {
      setResults({ tasks: [], notes: [], books: [], timetable: [] });
      return;
    }

    const lowerQuery = q.toLowerCase();

    const [tasks, notes, books, timetable] = await Promise.all([
      db.tasks
        .where('userId').equals(user.id)
        .filter(t => t.title.toLowerCase().includes(lowerQuery))
        .toArray(),
      db.notes
        .where('userId').equals(user.id)
        .filter(n => n.title.toLowerCase().includes(lowerQuery) || n.subject.toLowerCase().includes(lowerQuery))
        .toArray(),
      db.books
        .where('userId').equals(user.id)
        .filter(b => b.title.toLowerCase().includes(lowerQuery) || b.author.toLowerCase().includes(lowerQuery))
        .toArray(),
      db.timetable
        .where('userId').equals(user.id)
        .filter(tt => tt.subject.toLowerCase().includes(lowerQuery) || tt.room.toLowerCase().includes(lowerQuery))
        .toArray(),
    ]);

    setResults({ tasks, notes, books, timetable });
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const saveSearch = useCallback(async (q: string) => {
    if (!user || !q.trim()) return;

    // Check if query already exists for this user
    const existing = await db.recentSearches
      .where({ userId: user.id, query: q.trim() })
      .first();

    if (existing) {
      await db.recentSearches.update(existing.id, { timestamp: new Date() });
    } else {
      await db.recentSearches.add({
        id: crypto.randomUUID(),
        userId: user.id,
        query: q.trim(),
        timestamp: new Date()
      });
    }
  }, [user]);

  const clearRecent = useCallback(async () => {
    if (!user) return;
    await db.recentSearches.where('userId').equals(user.id).delete();
  }, [user]);

  return {
    query,
    setQuery,
    results,
    recentSearches,
    saveSearch,
    clearRecent
  };
}
