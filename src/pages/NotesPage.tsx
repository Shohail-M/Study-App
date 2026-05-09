import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNotes } from '../hooks/useNotes';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';
import type { Note } from '../data/db';

export const NotesPage: React.FC = () => {
  const { notes, saveNote, deleteNote } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const { user } = useAuth();

  // Auto-save debouncing — paused while a proposed change is awaiting review so we
  // don't accidentally persist the user's pre-review state on top of their input.
  useEffect(() => {
    if (selectedNote && isEditing && proposedContent === null) {
      const timer = setTimeout(() => {
        saveNote(selectedNote.id, selectedNote);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedNote, isEditing, saveNote, proposedContent]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      userId: user?.id || '', 
      title: 'New Note',
      content: '',
      subject: 'General',
      color: 'bg-primary/20',
      updatedAt: new Date()
    };
    saveNote(newNote.id, newNote);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleBack = (shouldSave: boolean = true) => {
    if (shouldSave && selectedNote) {
      saveNote(selectedNote.id, selectedNote);
    }
    setIsEditing(false);
    setSelectedNote(null);
    setProposedContent(null);
    setAiError(null);
  };

  const handleAIMagic = async () => {
    if (!selectedNote) return;
    const instruction = window.prompt(
      "Tell the AI what to do with this note (e.g. 'Add a section on mitochondria', 'Rewrite the intro for clarity', 'Delete bullet points about glycolysis')."
    );
    if (!instruction) return;

    setIsGenerating(true);
    setAiError(null);
    try {
      const { askGemini } = await import('../lib/gemini');
      const apiKey = user?.settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
      // Pass the current note content so the model can edit / delete existing
      // lines instead of always appending. The model is asked to return the
      // FULL revised note as an HTML fragment we can show in a review pane.
      const prompt = [
        "You are an editor for the user's existing study note (HTML fragment).",
        "Apply the user's instruction to the note: you may add, edit, or remove lines.",
        "Return ONLY the FULL revised note as a valid HTML fragment (no <html>/<body> wrappers, no markdown fences, no commentary).",
        "Preserve content the user did not ask to change.",
        "",
        `Title: ${selectedNote.title || 'Untitled'}`,
        `Subject: ${selectedNote.subject || 'General'}`,
        "",
        "Current note (HTML):",
        selectedNote.content || '<p></p>',
        "",
        `User instruction: ${instruction}`,
      ].join('\n');

      const response = await askGemini(prompt, apiKey);
      const cleaned = (response || '').replace(/```html|```/g, '').trim();
      if (!cleaned) {
        setAiError('AI returned an empty response.');
        return;
      }
      setProposedContent(cleaned);
    } catch (error: any) {
      setAiError(error?.message || 'AI request failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptProposed = async () => {
    if (!selectedNote || proposedContent === null) return;
    const updated = { ...selectedNote, content: proposedContent };
    setSelectedNote(updated);
    setProposedContent(null);
    await saveNote(updated.id, updated);
  };

  const handleRejectProposed = () => {
    setProposedContent(null);
    setAiError(null);
  };

  if (isEditing && selectedNote) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => handleBack(true)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Save & Back
            </button>
            <div className="flex gap-2">
              <button 
                onClick={handleAIMagic}
                disabled={isGenerating}
                className="flex items-center gap-1 p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all font-bold text-xs mr-2"
                title="AI Magic Generate"
              >
                <span className="material-symbols-outlined text-sm">{isGenerating ? 'hourglass_bottom' : 'smart_toy'}</span>
                {isGenerating ? 'Generating...' : 'AI Magic'}
              </button>
              <button 
                onClick={() => { 
                  if (window.confirm("Are you sure you want to delete this note?")) {
                    deleteNote(selectedNote.id); 
                    handleBack(false); 
                  }
                }}
                className="p-2 text-error hover:bg-error/10 rounded-lg transition-all"
                title="Delete Note"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="md:col-span-2">
              <input 
                type="text"
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                className="w-full bg-transparent border-none text-3xl font-extrabold headline-text text-white outline-none placeholder:text-white/20"
                placeholder="Note Title"
              />
            </div>
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-outline">label</span>
               <input 
                type="text"
                value={selectedNote.subject}
                onChange={(e) => setSelectedNote({ ...selectedNote, subject: e.target.value })}
                className="flex-1 bg-surface-container-high border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary/40 uppercase tracking-widest"
                placeholder="Subject"
              />
            </div>
          </div>

          {aiError && (
            <div className="mb-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {aiError}
            </div>
          )}

          {proposedContent !== null ? (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Current</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Original</span>
                </div>
                <div
                  className="flex-1 p-5 overflow-auto prose prose-invert max-w-none text-on-surface"
                  dangerouslySetInnerHTML={{ __html: selectedNote.content || '<p class="text-outline">Empty note</p>' }}
                />
              </div>
              <div className="bg-surface-container rounded-2xl border border-primary/30 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-primary/20 flex items-center justify-between bg-primary/5">
                  <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    Proposed Changes
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRejectProposed}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-highest border border-white/10 text-white text-xs font-black hover:bg-surface-bright transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Reject
                    </button>
                    <button
                      onClick={handleAcceptProposed}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Accept
                    </button>
                  </div>
                </div>
                <div
                  className="flex-1 p-5 overflow-auto prose prose-invert max-w-none text-on-surface"
                  dangerouslySetInnerHTML={{ __html: proposedContent }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <RichTextEditor
                content={selectedNote.content}
                onChange={(html) => setSelectedNote({ ...selectedNote, content: html })}
                placeholder="Start typing your brilliance..."
              />
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8 animate-fade-in-up">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">My Notes</h2>
          <p className="text-on-surface-variant mt-2">Capture your thoughts and summaries.</p>
        </div>
        <button 
          onClick={handleCreateNote}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">edit_square</span>
          New Note
        </button>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-5xl text-outline">description</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No notes yet</h3>
          <p className="text-on-surface-variant max-w-xs">Create your first note to start organizing your study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notes.map((note: Note, i: number) => (
            <div 
              key={note.id} 
              onClick={() => handleSelectNote(note)}
              className="group bg-surface-container-high rounded-2xl p-6 border border-white/5 hover:border-primary/50 transition-all cursor-pointer animate-fade-in-up hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${note.color} flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
              <div 
                className="text-sm text-on-surface-variant mb-6 line-clamp-3 overflow-hidden h-15 prose prose-invert prose-xs opacity-60"
                dangerouslySetInnerHTML={{ __html: note.content || 'No content yet...' }}
              />
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-outline">
                <span>{note.subject}</span>
                <span className="text-[10px]">{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};


export default NotesPage;
