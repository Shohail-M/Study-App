import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFirebase } from '../utils/firebaseMode';
import type { ChatAttachment, ChatMessage } from '../types/multiplayer';

function asDate(v: any): Date {
  return v?.toDate?.() ?? (v instanceof Date ? v : new Date());
}

function mapMessage(id: string, data: any): ChatMessage {
  return {
    id,
    senderId: data.senderId,
    senderName: data.senderName || 'Student',
    senderPhotoURL: data.senderPhotoURL,
    type: data.type || 'text',
    text: data.text,
    attachments: data.attachments || [],
    createdAt: asDate(data.createdAt),
    deleted: data.deleted || false,
  };
}

export type ChatScope = { kind: 'room' | 'guild'; id: string };

function messagesPath(scope: ChatScope): string[] {
  return scope.kind === 'room'
    ? ['rooms', scope.id, 'messages']
    : ['guilds', scope.id, 'messages'];
}

export function useChat(scope: ChatScope) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!useFirebase) return;
    if (!scope?.id) return;
    setIsLoading(true);
    const col = collection(db, ...messagesPath(scope));
    const q = query(col, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => mapMessage(d.id, d.data())));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [scope.kind, scope.id]);

  const sendText = useCallback(async (text: string) => {
    if (!useFirebase) throw new Error('Chat requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    const trimmed = text.trim();
    if (!trimmed) return;
    await addDoc(collection(db, ...messagesPath(scope)), {
      senderId: user.id,
      senderName: user.name,
      senderPhotoURL: '',
      type: 'text',
      text: trimmed,
      createdAt: serverTimestamp(),
    });
  }, [scope.kind, scope.id, user]);

  const sendImage = useCallback(async (file: File, text?: string) => {
    if (!useFirebase) throw new Error('Chat requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');

    const messageId = crypto.randomUUID();
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const storagePath = `chat/${scope.kind}/${scope.id}/${user.id}/${messageId}/${safeName}`;
    const objectRef = ref(storage, storagePath);
    const result = await uploadBytes(objectRef, file, { contentType: file.type });
    const url = await getDownloadURL(result.ref);

    const attachment: ChatAttachment = {
      kind: 'image',
      storagePath,
      url,
      sizeBytes: file.size,
      contentType: file.type,
    };

    const trimmed = (text || '').trim();
    await addDoc(collection(db, ...messagesPath(scope)), {
      senderId: user.id,
      senderName: user.name,
      senderPhotoURL: '',
      type: trimmed ? 'mixed' : 'image',
      text: trimmed || '',
      attachments: [attachment],
      createdAt: serverTimestamp(),
    });
  }, [scope.kind, scope.id, user]);

  const canSend = useMemo(() => !!user && useFirebase, [user]);

  return { messages, isLoading, canSend, sendText, sendImage };
}

