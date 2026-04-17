import React, { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  readonly content: string;
  readonly onChange: (html: string) => void;
  readonly placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content only once or when it changes externally only if NOT focused
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-surface-container-high border-b border-white/5 overflow-x-auto no-scrollbar">
        <ToolbarButton icon="format_bold" onClick={() => execCommand('bold')} title="Bold" />
        <ToolbarButton icon="format_italic" onClick={() => execCommand('italic')} title="Italic" />
        <ToolbarButton icon="format_underlined" onClick={() => execCommand('underline')} title="Underline" />
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <ToolbarButton icon="format_list_bulleted" onClick={() => execCommand('insertUnorderedList')} title="Bullet List" />
        <ToolbarButton icon="format_list_numbered" onClick={() => execCommand('insertOrderedList')} title="Numbered List" />
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <ToolbarButton icon="format_h1" onClick={() => execCommand('formatBlock', 'H1')} title="Heading 1" />
        <ToolbarButton icon="format_h2" onClick={() => execCommand('formatBlock', 'H2')} title="Heading 2" />
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <ToolbarButton icon="format_quote" onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote" />
        <ToolbarButton icon="code" onClick={() => execCommand('formatBlock', 'pre')} title="Code Block" />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-6 text-on-surface outline-none prose prose-invert max-w-none overflow-y-auto custom-scrollbar min-h-[300px]"
        data-placeholder={placeholder}
        onFocus={(e) => {
           if (e.target.innerHTML === '<br>') e.target.innerHTML = '';
        }}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.3);
          cursor: text;
        }
        .prose h1 { font-size: 1.875rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; color: white; }
        .prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: white; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
        .prose blockquote { border-left: 4px solid var(--primary); padding-left: 1rem; font-style: italic; color: rgba(255,255,255,0.7); margin: 1rem 0; }
        .prose pre { background: rgba(0,0,0,0.3); padding: 1rem; rounded: 0.5rem; font-family: monospace; margin: 1rem 0; }
      `}</style>
    </div>
  );
};

interface ToolbarButtonProps {
  readonly icon: string;
  readonly onClick: () => void;
  readonly title: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all flex items-center justify-center min-w-[36px]"
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </button>
);
