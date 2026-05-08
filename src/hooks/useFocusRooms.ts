import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFirebase } from '../utils/firebaseMode';
import type { FocusRoom, RoomMember } from '../types/multiplayer';

function asDate(v: any): Date {
  return v?.toDate?.() ?? (v instanceof Date ? v : new Date());
}

function mapRoom(id: string, data: any): FocusRoom {
  return {
    id,
    ownerId: data.ownerId,
    name: data.name,
    visibility: data.visibility || 'public',
    subjectTag: data.subjectTag,
    createdAt: asDate(data.createdAt),
    settings: {
      workMin: data.settings?.workMin ?? 25,
      breakMin: data.settings?.breakMin ?? 5,
      cycles: data.settings?.cycles ?? 4,
      allowJoinMidSession: data.settings?.allowJoinMidSession ?? true,
    },
    timerState: {
      phase: data.timerState?.phase ?? 'work',
      status: data.timerState?.status ?? 'idle',
      startedAt: data.timerState?.startedAt ? asDate(data.timerState.startedAt) : undefined,
      durationSec: data.timerState?.durationSec,
      pausedAt: data.timerState?.pausedAt ? asDate(data.timerState.pausedAt) : undefined,
      accumulatedPausedSec: data.timerState?.accumulatedPausedSec ?? 0,
    },
  };
}

function mapMember(id: string, data: any): RoomMember {
  return {
    id,
    displayName: data.displayName || 'Student',
    photoURL: data.photoURL,
    role: data.role || 'member',
    joinedAt: asDate(data.joinedAt),
    presence: {
      state: data.presence?.state || 'active',
      lastPingAt: asDate(data.presence?.lastPingAt),
    },
  };
}

export function useFocusRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<FocusRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!useFirebase) return;
    setIsLoading(true);
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => mapRoom(d.id, d.data()));
      setRooms(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, []);

  const createRoom = useCallback(async (input: { name: string; visibility: 'public' | 'private'; subjectTag?: string }) => {
    if (!useFirebase) throw new Error('Multiplayer requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'rooms', id), {
      ownerId: user.id,
      name: input.name,
      visibility: input.visibility,
      subjectTag: input.subjectTag || '',
      createdAt: serverTimestamp(),
      settings: { workMin: 25, breakMin: 5, cycles: 4, allowJoinMidSession: true },
      timerState: { phase: 'work', status: 'idle' },
    });
    await setDoc(doc(db, 'rooms', id, 'members', user.id), {
      displayName: user.name,
      photoURL: '',
      role: 'owner',
      joinedAt: serverTimestamp(),
      presence: { state: 'active', lastPingAt: serverTimestamp() },
    });
    return id;
  }, [user]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!useFirebase) throw new Error('Multiplayer requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    await setDoc(doc(db, 'rooms', roomId, 'members', user.id), {
      displayName: user.name,
      photoURL: '',
      role: 'member',
      joinedAt: serverTimestamp(),
      presence: { state: 'active', lastPingAt: serverTimestamp() },
    }, { merge: true });
  }, [user]);

  const updatePresence = useCallback(async (roomId: string, state: 'active' | 'away') => {
    if (!useFirebase) return;
    if (!user) return;
    await updateDoc(doc(db, 'rooms', roomId, 'members', user.id), {
      presence: { state, lastPingAt: serverTimestamp() }
    } as any);
  }, [user]);

  const deleteRoom = useCallback(async (roomId: string) => {
    if (!useFirebase) throw new Error('Multiplayer requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    // Delete all members subcollection
    const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'));
    for (const memberDoc of membersSnap.docs) {
      await deleteDoc(memberDoc.ref);
    }
    // Delete the room document
    await deleteDoc(doc(db, 'rooms', roomId));
  }, [user]);

  return { rooms, isLoading, createRoom, joinRoom, updatePresence, deleteRoom };
}

export function useFocusRoom(roomId: string) {
  const { user } = useAuth();
  const [room, setRoom] = useState<FocusRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!useFirebase || !roomId) return;
    setIsLoading(true);
    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (!snap.exists()) {
        setRoom(null);
        setIsLoading(false);
        return;
      }
      setRoom(mapRoom(snap.id, snap.data()));
      setIsLoading(false);
    }, () => setIsLoading(false));

    const qMembers = query(collection(db, 'rooms', roomId, 'members'), orderBy('joinedAt', 'asc'));
    const unsubMembers = onSnapshot(qMembers, snap => {
      setMembers(snap.docs.map(d => mapMember(d.id, d.data())));
    });

    return () => { unsubRoom(); unsubMembers(); };
  }, [roomId]);

  const isMember = useMemo(() => !!user && members.some(m => m.id === user.id), [user, members]);

  const setTimerState = useCallback(async (next: Partial<FocusRoom['timerState']>) => {
    if (!useFirebase) throw new Error('Multiplayer requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    // Filter out undefined values to prevent Firebase errors
    const filtered = Object.fromEntries(
      Object.entries(next).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'rooms', roomId), { timerState: filtered } as any);
  }, [roomId, user]);

  const startPhase = useCallback(async (phase: 'work' | 'break', durationSec: number) => {
    await setTimerState({
      phase,
      status: 'running',
      startedAt: new Date(),
      durationSec,
      accumulatedPausedSec: 0,
    });
  }, [setTimerState]);

  const pause = useCallback(async () => {
    if (!room?.timerState?.startedAt) return;
    await setTimerState({ status: 'paused', pausedAt: new Date() });
  }, [room?.timerState?.startedAt, setTimerState]);

  const resume = useCallback(async () => {
    if (!room?.timerState?.pausedAt) return;
    const pausedAt = room.timerState.pausedAt;
    const deltaSec = Math.max(0, Math.floor((Date.now() - pausedAt.getTime()) / 1000));
    await setTimerState({
      status: 'running',
      accumulatedPausedSec: (room.timerState.accumulatedPausedSec || 0) + deltaSec,
    });
  }, [room?.timerState, setTimerState]);

  const end = useCallback(async () => {
    await setTimerState({ status: 'idle' });
  }, [setTimerState]);

  return { room, members, isLoading, isMember, startPhase, pause, resume, end };
}

