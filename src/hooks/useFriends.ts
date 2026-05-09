import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp,
  setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFirebase } from '../utils/firebaseMode';

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  id: string;
  users: string[]; // sorted [uidA, uidB]
  status: FriendshipStatus;
  requestedBy: string;
  createdAt: Date;
}

export interface FriendProfile {
  id: string;
  name: string;
  email?: string;
  xp: number;
  level: number;
  streak: number;
  rank?: string;
  completedTasks?: number;
  completedBooks?: number;
  score?: number;
}

function asDate(v: any): Date {
  return v?.toDate?.() ?? (v instanceof Date ? v : new Date());
}

function pairId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

function mapFriendship(id: string, data: any): Friendship {
  return {
    id,
    users: data.users || [],
    status: (data.status as FriendshipStatus) || 'pending',
    requestedBy: data.requestedBy,
    createdAt: asDate(data.createdAt),
  };
}

export function useFriends() {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FriendProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to friendships involving the current user.
  useEffect(() => {
    if (!useFirebase || !user) return;
    setIsLoading(true);
    const q = query(collection(db, 'friendships'), where('users', 'array-contains', user.id));
    const unsub = onSnapshot(q, snap => {
      setFriendships(snap.docs.map(d => mapFriendship(d.id, d.data())));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [user?.id]);

  // Hydrate profiles for everyone we see in a friendship row.
  useEffect(() => {
    if (!useFirebase || !user) return;
    const otherIds = Array.from(new Set(
      friendships.flatMap(f => f.users).filter(id => id !== user.id)
    ));
    const missing = otherIds.filter(id => !profiles[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates: Record<string, FriendProfile> = {};
      for (const id of missing) {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            const d = snap.data() as any;
            updates[id] = {
              id,
              name: d.name || 'Student',
              email: d.email,
              xp: d.xp || 0,
              level: d.level || 1,
              streak: d.streak || 0,
              rank: d.rank,
              completedTasks: d.completedTasks || 0,
              completedBooks: d.completedBooks || 0,
              score: d.score || 0,
            };
          }
        } catch { /* permissions / missing doc */ }
      }
      if (!cancelled && Object.keys(updates).length) {
        setProfiles(prev => ({ ...prev, ...updates }));
      }
    })();
    return () => { cancelled = true; };
  }, [friendships, user?.id]);

  const accepted = useMemo(
    () => friendships.filter(f => f.status === 'accepted'),
    [friendships]
  );
  const incoming = useMemo(
    () => friendships.filter(f => f.status === 'pending' && f.requestedBy !== user?.id),
    [friendships, user?.id]
  );
  const outgoing = useMemo(
    () => friendships.filter(f => f.status === 'pending' && f.requestedBy === user?.id),
    [friendships, user?.id]
  );

  const inviteByUserId = useCallback(async (otherId: string) => {
    if (!useFirebase) throw new Error('Friends require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    const trimmed = otherId.trim();
    if (!trimmed) throw new Error('Provide a user ID.');
    if (trimmed === user.id) throw new Error('You cannot friend yourself.');
    const id = pairId(user.id, trimmed);
    const ref = doc(db, 'friendships', id);
    const existing = await getDoc(ref);
    if (existing.exists()) throw new Error('Friendship already exists.');
    await setDoc(ref, {
      users: [user.id, trimmed].sort(),
      status: 'pending',
      requestedBy: user.id,
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const inviteByEmail = useCallback(async (email: string) => {
    if (!useFirebase) throw new Error('Friends require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    const target = email.trim().toLowerCase();
    if (!target) throw new Error('Provide an email.');
    const q = query(collection(db, 'users'), where('email', '==', target));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('No user found with that email.');
    const otherId = snap.docs[0].id;
    return inviteByUserId(otherId);
  }, [user, inviteByUserId]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    if (!useFirebase) throw new Error('Friends require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    await updateDoc(doc(db, 'friendships', friendshipId), { status: 'accepted' });
  }, [user]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!useFirebase) throw new Error('Friends require Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    await deleteDoc(doc(db, 'friendships', friendshipId));
  }, [user]);

  return {
    isLoading,
    friendships,
    accepted,
    incoming,
    outgoing,
    profiles,
    inviteByUserId,
    inviteByEmail,
    acceptRequest,
    removeFriend,
  };
}
