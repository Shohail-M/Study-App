import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useChat, type ChatScope } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface LightboxItem {
  url: string;
  senderName: string;
  createdAt: Date;
}

// Triggers a browser download for the given image URL. Works for both inline
// data URLs (no fetch needed) and remote HTTPS URLs.
function downloadImage(url: string, suggestedName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// WhatsApp-style fullscreen image viewer: dark backdrop, top bar with sender
// info + download + close, prev/next navigation across all images in the
// thread, thumbnail strip, and keyboard shortcuts (Esc/Left/Right).
const ChatImageLightbox: React.FC<{
  items: LightboxItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}> = ({ items, index, onIndexChange, onClose }) => {
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      else if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndexChange]);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-fade-in" onClick={onClose}>
      <div className="px-4 py-3 flex items-center gap-3 text-white border-b border-white/5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
          title="Close (Esc)"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-white/5 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-base">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate">{item.senderName}</p>
          <p className="text-[11px] text-white/60 font-bold">{item.createdAt.toLocaleString()}</p>
        </div>
        {items.length > 1 && (
          <span className="text-[11px] text-white/60 font-black uppercase tracking-widest px-2">
            {index + 1} / {items.length}
          </span>
        )}
        <button
          onClick={() => downloadImage(item.url, `image_${Date.now()}.jpg`)}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
          title="Download"
        >
          <span className="material-symbols-outlined">download</span>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={onClose}>
        <img
          src={item.url}
          alt="Full size"
          className="max-w-[94vw] max-h-[78vh] object-contain select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            title="Previous (←)"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {index < items.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            title="Next (→)"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="px-3 py-3 flex gap-2 overflow-x-auto justify-center border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-primary scale-105' : 'border-white/10 opacity-60 hover:opacity-100'}`}
              title={`${it.senderName} · ${it.createdAt.toLocaleString()}`}
            >
              <img src={it.url} alt="" className="w-14 h-14 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface PendingUpload {
  localId: string;       // synthetic id
  previewUrl: string;    // object URL for instant preview
  text: string;
  progress: number;      // 0..1
  startedAt: Date;
}

export const ChatThread: React.FC<{ scope: ChatScope; title?: string }> = ({ scope, title }) => {
  const { messages, canSend, sendText, sendImage } = useChat(scope);
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visibleMessages = useMemo(() => messages.filter(m => !m.deleted), [messages]);

  // Flatten every visible image attachment in chronological order so the
  // lightbox can navigate across the whole thread (WhatsApp-style).
  const lightboxItems = useMemo<LightboxItem[]>(() => {
    const arr: LightboxItem[] = [];
    for (const m of visibleMessages) {
      if (!m.attachments?.length) continue;
      for (const a of m.attachments) {
        arr.push({ url: a.url, senderName: m.senderName, createdAt: m.createdAt });
      }
    }
    return arr;
  }, [visibleMessages]);

  const openLightboxFor = (msgId: string, attachIdx: number) => {
    let global = 0;
    for (const m of visibleMessages) {
      if (m.id === msgId) {
        setLightboxIdx(global + attachIdx);
        return;
      }
      global += m.attachments?.length || 0;
    }
  };

  // Revoke any preview object URL on unmount/replacement to avoid leaks.
  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending?.previewUrl]);

  const handleFile = async (file: File) => {
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    const localId = `pending_${Date.now()}`;
    const captionAtSend = text;
    setPending({ localId, previewUrl, text: captionAtSend, progress: 0, startedAt: new Date() });
    setText('');
    try {
      await sendImage(file, captionAtSend, fraction => {
        setPending(p => (p && p.localId === localId ? { ...p, progress: fraction } : p));
      });
    } catch (err: any) {
      console.error('Chat image upload failed', err);
      setError(err?.message || 'Failed to send image.');
      // Restore caption so the user doesn't lose their typed text.
      setText(captionAtSend);
    } finally {
      setPending(prev => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
    }
  };

  return (
    <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black headline-text text-white">{title || 'Study Chat'}</p>
          <p className="text-xs text-on-surface-variant">Share updates, images, and keep each other accountable.</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!canSend || !!pending}
          className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
            canSend && !pending ? 'bg-surface-container-highest text-white hover:bg-surface-bright' : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-base">{pending ? 'hourglass_bottom' : 'image'}</span>
          {pending ? `Uploading ${Math.round(pending.progress * 100)}%` : 'Image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const inputEl = e.target;
            if (!file) return;
            try {
              await handleFile(file);
            } finally {
              inputEl.value = '';
            }
          }}
        />
      </div>

      {error && (
        <div className="mx-5 mt-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-bold flex items-start gap-2">
          <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
          <span className="flex-1 break-words">{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 text-error/80 hover:text-error"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {visibleMessages.length === 0 && !pending ? (
          <div className="py-16 text-center text-outline/40">
            <span className="material-symbols-outlined text-4xl mb-2">forum</span>
            <p className="text-xs font-black uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          visibleMessages.map(m => (
            <div key={m.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-white/5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-base">person</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{m.senderName}</span>
                  <span className="text-[10px] font-bold text-outline/70 uppercase tracking-widest">{formatTime(m.createdAt)}</span>
                </div>
                {m.text && (
                  <p className="text-sm text-on-surface mt-1 whitespace-pre-wrap break-words">{m.text}</p>
                )}
                {m.attachments?.length ? (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {m.attachments.map((a, idx) => (
                      <button
                        type="button"
                        key={`${m.id}-${idx}`}
                        onClick={() => openLightboxFor(m.id, idx)}
                        className="block rounded-xl overflow-hidden border border-white/10 bg-surface-container-highest hover:border-primary/30 transition-colors cursor-zoom-in text-left"
                        title="Tap to view"
                      >
                        <img alt="Attachment" src={a.url} className="w-full h-28 object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}

        {/* Optimistic pending upload tile — appears instantly on file pick. */}
        {pending && (
          <div className="flex gap-3 opacity-90">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-white/5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-base">person</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{user?.name || 'You'}</span>
                <span className="text-[10px] font-bold text-outline/70 uppercase tracking-widest">{formatTime(pending.startedAt)}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 rounded-full bg-primary/15">
                  Sending {Math.round(pending.progress * 100)}%
                </span>
              </div>
              {pending.text && (
                <p className="text-sm text-on-surface mt-1 whitespace-pre-wrap break-words">{pending.text}</p>
              )}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-surface-container-highest">
                  <img alt="Pending upload" src={pending.previewUrl} className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                      <span className="material-symbols-outlined text-white animate-spin text-lg">progress_activity</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all" style={{ width: `${Math.round(pending.progress * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        className="p-4 border-t border-white/5 flex gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await sendText(text);
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canSend ? 'Write a message…' : 'Chat requires Firebase login'}
          disabled={!canSend}
          className="flex-1 bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend || !text.trim()}
          className={`px-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
            canSend && text.trim()
              ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary-container hover:scale-[1.02] active:scale-95'
              : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </form>

      {lightboxIdx !== null && lightboxItems.length > 0 && (
        <ChatImageLightbox
          items={lightboxItems}
          index={Math.min(lightboxIdx, lightboxItems.length - 1)}
          onIndexChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
};

export default ChatThread;

