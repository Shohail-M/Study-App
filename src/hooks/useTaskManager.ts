import { useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { Task } from '../data/db';
import { useAuth } from '../context/AuthContext';
import { db as firestoreDb } from '../config/firebase';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore';

const useFirebase = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useTaskManager() {
  const { user, addXP } = useAuth();

  // ── Local (Dexie) ───────────────────────────────────────────────────
  const localTasks = useLiveQuery<Task[]>(
    () => user && !useFirebase
      ? dexieDb.tasks.where('userId').equals(user.id).toArray()
      : Promise.resolve([] as Task[]),
    [user?.id]
  );

  // ── Cloud (Firestore) ────────────────────────────────────────────────
  const [cloudTasks, setCloudTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!useFirebase || !user) return;
    const q = query(collection(firestoreDb, 'tasks'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      } as Task));
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setCloudTasks(data);
    });
    return () => unsub();
  }, [user]);

  const tasks: Task[] = useFirebase ? cloudTasks : (localTasks || []);

  // ── Add ─────────────────────────────────────────────────────────────
  const addTask = useCallback(async (title: string, description: string, priority: Task['priority'], time: string) => {
    if (!user) return;
    if (useFirebase) {
      await addDoc(collection(firestoreDb, 'tasks'), {
        userId: user.id, title, description, priority, time,
        completed: false, createdAt: serverTimestamp(),
      });
    } else {
      const newTask: Task = {
        id: generateId(), userId: user.id, title, description,
        priority, time, completed: false, createdAt: new Date(),
      };
      await dexieDb.tasks.add(newTask);
      return newTask;
    }
  }, [user]);

  // ── Toggle ───────────────────────────────────────────────────────────
  const toggleTask = useCallback(async (id: string) => {
    if (useFirebase) {
      const task = cloudTasks.find(t => t.id === id);
      if (!task) return;
      const nowCompleted = !task.completed;
      await updateDoc(doc(firestoreDb, 'tasks', id), { completed: nowCompleted });
      if (nowCompleted && user) {
        const xpByPriority = { high: 100, normal: 60, low: 30 };
        addXP(xpByPriority[task.priority]);
      }
    } else {
      const task = await dexieDb.tasks.get(id);
      if (!task) return;
      const nowCompleted = !task.completed;
      await dexieDb.tasks.update(id, { completed: nowCompleted });
      if (nowCompleted && user) {
        const xpByPriority = { high: 100, normal: 60, low: 30 };
        addXP(xpByPriority[task.priority]);
      }
    }
  }, [user, addXP, cloudTasks]);

  // ── Delete ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (id: string) => {
    if (useFirebase) {
      await deleteDoc(doc(firestoreDb, 'tasks', id));
    } else {
      await dexieDb.tasks.delete(id);
    }
  }, []);

  // ── Update ───────────────────────────────────────────────────────────
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (useFirebase) {
      await updateDoc(doc(firestoreDb, 'tasks', id), updates as any);
    } else {
      await dexieDb.tasks.update(id, updates);
    }
  }, []);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return { tasks, incompleteTasks, completedTasks, addTask, toggleTask, deleteTask, updateTask };
}
