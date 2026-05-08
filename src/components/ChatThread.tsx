import React, { useMemo, useRef, useState } from 'react';
import { useChat, type ChatScope } from '../hooks/useChat';

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatThread: React.FC<{ scope: ChatScope; title?: string }> = ({ scope, title }) => {
  const { messages, canSend, sendText, sendImage } = useChat(scope);
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visibleMessages = useMemo(() => messages.filter(m => !m.deleted), [messages]);

  return (
    <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black headline-text text-white">{title || 'Study Chat'}</p>
          <p className="text-xs text-on-surface-variant">Share updates, images, and keep each other accountable.</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!canSend}
          className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
            canSend ? 'bg-surface-container-highest text-white hover:bg-surface-bright' : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-base">image</span>
          Image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await sendImage(file, text);
            setText('');
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {visibleMessages.length === 0 ? (
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
                      <a
                        key={`${m.id}-${idx}`}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-white/10 bg-surface-container-highest hover:border-primary/30 transition-colors"
                        title="Open image"
                      >
                        <img alt="Attachment" src={a.url} className="w-full h-28 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
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
    </div>
  );
};

export default ChatThread;

