import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useFirebase } from '../utils/firebaseMode';
import { blobToDataUrl, compressImageToTargetSize } from '../utils/imageCompression';
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

function messagesPath(scope: ChatScope): string {
  return scope.kind === 'room'
    ? `rooms/${scope.id}/messages`
    : `guilds/${scope.id}/messages`;
}

export function useChat(scope: ChatScope) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!useFirebase) return;
    if (!scope?.id) return;
    setIsLoading(true);
    const col = collection(db, messagesPath(scope));
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
    // Use a client-side Timestamp so the message is immediately visible in
    // the orderBy('createdAt') snapshot — Firestore excludes docs with null
    // ordered fields, and serverTimestamp() reads back as null until the
    // server confirms the write.
    await addDoc(collection(db, messagesPath(scope)), {
      senderId: user.id,
      senderName: user.name,
      senderPhotoURL: '',
      type: 'text',
      text: trimmed,
      createdAt: Timestamp.now(),
    });
  }, [scope.kind, scope.id, user]);

  // Optional progress callback fired with 0..1 during the upload.
  type ProgressFn = (fraction: number) => void;

  const sendImage = useCallback(async (file: File, text?: string, onProgress?: ProgressFn) => {
    if (!useFirebase) throw new Error('Chat requires Firebase mode.');
    if (!user) throw new Error('Not signed in.');
    if (!file) throw new Error('No file provided.');
    if (!file.type?.startsWith('image/')) throw new Error('Only image uploads are supported.');
    const MAX_INPUT_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_INPUT_BYTES) {
      throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 20MB.`);
    }

    // Inline-image strategy: Firebase Storage isn't enabled for this project,
    // so the compressed image is embedded directly into the Firestore message
    // doc as a base64 data URL. Firestore enforces a 1MB per-doc cap, so the
    // image must compress under ~700KB after base64 expansion (~525KB binary).
    const TARGET_BINARY_BYTES = 520 * 1024;

    onProgress?.(0.05);
    const compressed = await compressImageToTargetSize(file, TARGET_BINARY_BYTES);
    console.info('[chat] compressed image', {
      originalKB: Math.round(compressed.originalBytes / 1024),
      compressedKB: Math.round(compressed.compressedBytes / 1024),
      size: `${compressed.width}x${compressed.height}`,
    });

    if (compressed.compressedBytes > TARGET_BINARY_BYTES) {
      throw new Error(
        `Image still too large after compression (${Math.round(compressed.compressedBytes / 1024)}KB). ` +
        `Pick a smaller / less detailed photo, or enable Firebase Storage for full-size uploads.`,
      );
    }

    onProgress?.(0.4);
    const dataUrl = await blobToDataUrl(compressed.blob);
    onProgress?.(0.7);

    const messageId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const attachment: ChatAttachment = {
      kind: 'image',
      storagePath: '', // not stored in Firebase Storage; image lives inline
      url: dataUrl,
      width: compressed.width,
      height: compressed.height,
      sizeBytes: compressed.compressedBytes,
      contentType: compressed.file.type,
    };

    const trimmed = (text || '').trim();
    const messageDocRef = doc(db, `${messagesPath(scope)}/${messageId}`);
    try {
      await setDoc(messageDocRef, {
        messageId,
        senderId: user.id,
        senderName: user.name,
        senderPhotoURL: '',
        type: trimmed ? 'mixed' : 'image',
        text: trimmed || '',
        attachments: [attachment],
        createdAt: Timestamp.now(),
      });
      onProgress?.(1);
      console.info('[chat] message saved (inline image)', {
        messageId,
        bytes: compressed.compressedBytes,
        dataUrlKB: Math.round(dataUrl.length / 1024),
      });
    } catch (err: any) {
      const code = err?.code || 'firestore/unknown';
      if (code === 'permission-denied') {
        throw new Error('Firestore permission denied. Run: firebase deploy --only firestore:rules');
      }
      if (code === 'invalid-argument' || /1048487|too large|exceeds/i.test(String(err?.message))) {
        throw new Error('Image is too large for inline embedding. Try a smaller photo.');
      }
      throw new Error(`Could not save message (${code}): ${err?.message || 'unknown error'}`);
    }
  }, [scope.kind, scope.id, user]);

  const canSend = useMemo(() => !!user && useFirebase, [user]);

  return { messages, isLoading, canSend, sendText, sendImage };
}

