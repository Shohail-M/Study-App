import { useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { Note } from '../data/db';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../config/firebase';
import {
  collection, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, serverTimestamp, getDoc
} from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

export function useNotes() {
  const { user } = useAuth();

  // ── Local ─────────────────────────────────────────────────────────
  const localNotes = useLiveQuery(
    async () => {
      if (!user || useFirebase) return [];
      const items = await dexieDb.notes.where('userId').equals(user.id).toArray();
      return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },
    [user?.id],
    []
  );

  // ── Cloud ─────────────────────────────────────────────────────────
  const [cloudNotes, setCloudNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!useFirebase || !user) return;
    const q = query(collection(firestoreDb, 'notes'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      } as Note));
      data.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setCloudNotes(data);
    });
    return () => unsub();
  }, [user]);

  const notes: Note[] = useFirebase ? cloudNotes : (localNotes || []);

  // ── Get single note ────────────────────────────────────────────────
  const getNote = useCallback(async (id: string) => {
    if (useFirebase) {
      const snap = await getDoc(doc(firestoreDb, 'notes', id));
      if (!snap.exists()) return undefined;
      return { id: snap.id, ...snap.data(), updatedAt: snap.data().updatedAt?.toDate?.() ?? new Date() } as Note;
    }
    return await dexieDb.notes.get(id);
  }, []);

  // ── Save note ──────────────────────────────────────────────────────
  const saveNote = useCallback(async (id: string, updates: Partial<Note>) => {
    if (!user) return;
    const { userId: _uid, ...noteData } = updates;

    if (useFirebase) {
      // Check if doc exists
      const docRef = doc(firestoreDb, 'notes', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...noteData, userId: user.id, updatedAt: serverTimestamp() });
      } else {
        // Use setDoc with explicit ID via addDoc trick — use a different approach
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, {
          title: noteData.title || 'Untitled Note',
          content: noteData.content || '',
          subject: noteData.subject || 'General',
          color: noteData.color || 'bg-primary/20',
          ...noteData,
          userId: user.id,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const existing = await dexieDb.notes.get(id);
      if (existing) {
        await dexieDb.notes.update(id, { ...noteData, userId: user.id, updatedAt: new Date() });
      } else {
        await dexieDb.notes.add({
          id,
          title: noteData.title || 'Untitled Note',
          content: noteData.content || '',
          subject: noteData.subject || 'General',
          color: noteData.color || 'bg-primary/20',
          ...noteData,
          userId: user.id,
          updatedAt: new Date(),
        } as Note);
      }
    }
  }, [user]);

  // ── Delete note ────────────────────────────────────────────────────
  const deleteNote = useCallback(async (id: string) => {
    if (useFirebase) {
      await deleteDoc(doc(firestoreDb, 'notes', id));
    } else {
      await dexieDb.notes.delete(id);
    }
  }, []);

  return { notes, getNote, saveNote, deleteNote };
}
