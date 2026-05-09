import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFirebase } from '../utils/firebaseMode';
import type { Guild, GuildMember } from '../types/multiplayer';

function asDate(v: any): Date {
  return v?.toDate?.() ?? (v instanceof Date ? v : new Date());
}

function mapGuild(id: string, data: any): Guild {
  return {
    id,
    name: data.name,
    description: data.description,
    ownerId: data.ownerId,
    createdAt: asDate(data.createdAt),
    weeklyGoalMinutes: data.weeklyGoalMinutes ?? 600,
    privacy: data.privacy ?? 'open',
  };
}

function mapGuildMember(id: string, data: any): GuildMember {
  return {
    id,
    displayName: data.displayName || 'Student',
    photoURL: data.photoURL,
    role: data.role ?? 'member',
    joinedAt: asDate(data.joinedAt),
  };
}

export function useGuilds() {
  const { user } = useAuth();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!useFirebase) return;
    setIsLoading(true);
    const q = query(collection(db, 'guilds'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setGuilds(snap.docs.map(d => mapGuild(d.id, d.data())));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, []);

  const createGuild = useCallback(async (input: { name: string; description?: string; weeklyGoalMinutes: number; privacy: Guild['privacy'] }) => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'guilds', id), {
      ownerId: user.id,
      name: input.name,
      description: input.description || '',
      weeklyGoalMinutes: input.weeklyGoalMinutes,
      privacy: input.privacy,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'guilds', id, 'members', user.id), {
      displayName: user.name,
      photoURL: '',
      role: 'owner',
      joinedAt: serverTimestamp(),
    });
    return id;
  }, [user]);

  const joinGuild = useCallback(async (guildId: string) => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    await setDoc(doc(db, 'guilds', guildId, 'members', user.id), { displayName: user.name, photoURL: '', role: 'member', joinedAt: serverTimestamp() }, { merge: true });
  }, [user]);

  const leaveGuild = useCallback(async (guildId: string) => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    await deleteDoc(doc(db, 'guilds', guildId, 'members', user.id));
  }, [user]);

  const deleteGuild = useCallback(async (guildId: string) => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    // Delete all members subcollection
    const membersSnap = await getDocs(collection(db, 'guilds', guildId, 'members'));
    for (const memberDoc of membersSnap.docs) {
      await deleteDoc(memberDoc.ref);
    }
    // Delete the guild document
    await deleteDoc(doc(db, 'guilds', guildId));
  }, [user]);

  return { guilds, isLoading, createGuild, joinGuild, leaveGuild, deleteGuild };
}

export function useGuild(guildId: string) {
  const { user } = useAuth();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);

  useEffect(() => {
    if (!useFirebase || !guildId) return;
    const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), snap => {
      if (!snap.exists()) return setGuild(null);
      setGuild(mapGuild(snap.id, snap.data()));
    });

    const qMembers = query(collection(db, 'guilds', guildId, 'members'), orderBy('joinedAt', 'asc'));
    const unsubMembers = onSnapshot(qMembers, snap => {
      setMembers(snap.docs.map(d => mapGuildMember(d.id, d.data())));
    });

    return () => { unsubGuild(); unsubMembers(); };
  }, [guildId]);

  const myMembership = useMemo(() => (user ? members.find(m => m.id === user.id) : undefined), [user, members]);

  const updateGuild = useCallback(async (updates: Partial<Guild>) => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    await updateDoc(doc(db, 'guilds', guildId), updates as any);
  }, [guildId]);

  const deleteGuildInHook = useCallback(async () => {
    if (!useFirebase) throw new Error('Guilds require Firebase mode.');
    // Delete all members subcollection
    const membersSnap = await getDocs(collection(db, 'guilds', guildId, 'members'));
    for (const memberDoc of membersSnap.docs) {
      await deleteDoc(memberDoc.ref);
    }
    // Delete the guild document
    await deleteDoc(doc(db, 'guilds', guildId));
  }, [guildId]);

  return { guild, members, myMembership, updateGuild, deleteGuildInHook };
}

