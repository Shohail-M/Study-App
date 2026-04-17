import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useBooks } from '../hooks/useBooks';
import type { Book } from '../data/db';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

interface PdfViewerProps {
  book: Book;
  onBack: () => void;
  updateProgress: (id: string, progress: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ book, onBack, updateProgress }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const getBlob = (data: ArrayBuffer) => URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const pdfSource = book.pdfUrl || (book.pdfData ? getBlob(book.pdfData) : undefined);

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(false);
    if (book.progress > 0) {
      setPageNumber(Math.max(1, Math.round((book.progress / 100) * numPages)));
    }
  };

  const goToPage = useCallback((p: number) => {
    const clamped = Math.min(Math.max(1, p), numPages || 1);
    setPageNumber(clamped);
    if (numPages) updateProgress(book.id, Math.round((clamped / numPages) * 100));
  }, [numPages, book.id, updateProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(pageNumber + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPage(pageNumber - 1);
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(3, s + 0.25));
      if (e.key === '-') setScale(s => Math.max(0.5, s - 0.25));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pageNumber, goToPage]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n)) goToPage(n);
    setJumpInput('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in" ref={viewerRef}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (pdfSource && !book.pdfUrl) URL.revokeObjectURL(pdfSource); onBack(); }}
              className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors font-bold"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="hidden sm:inline">Library</span>
            </button>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center hover:bg-surface-bright transition-colors"
              title="Toggle thumbnails"
            >
              <span className="material-symbols-outlined text-sm">menu</span>
            </button>
          </div>

          <h3 className="font-bold text-white text-sm truncate max-w-[180px] sm:max-w-xs">{book.title}</h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom */}
            <div className="flex items-center bg-surface-container rounded-lg p-0.5">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">zoom_out</span>
              </button>
              <span className="text-xs font-bold px-2 text-white w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1.5 hover:bg-surface-bright rounded text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">zoom_in</span>
              </button>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-1.5 bg-surface-container rounded-lg px-2 py-1">
              <button disabled={pageNumber <= 1} onClick={() => goToPage(pageNumber - 1)}
                className="text-on-surface-variant hover:text-white disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <form onSubmit={handleJump} className="flex items-center gap-1">
                <input
                  type="text"
                  value={jumpInput || pageNumber}
                  onChange={e => setJumpInput(e.target.value)}
                  onFocus={() => setJumpInput('')}
                  className="w-10 bg-transparent text-center text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 rounded"
                />
              </form>
              <span className="text-xs text-on-surface-variant">/ {numPages || '--'}</span>

              <button disabled={pageNumber >= numPages} onClick={() => goToPage(pageNumber + 1)}
                className="text-on-surface-variant hover:text-white disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 bg-surface-container rounded-lg flex items-center justify-center hover:bg-surface-bright transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <span className="material-symbols-outlined text-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Unified Document Wrapper */}
        <Document
          file={pdfSource}
          onLoadSuccess={onLoadSuccess}
          onLoadError={() => setLoadError(true)}
          loading={
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-on-surface-variant flex-1">
              <div className="w-16 h-16 rounded-2xl bg-surface-container animate-pulse" />
              <div className="w-48 h-3 rounded-full bg-surface-container animate-pulse" />
              <p className="text-sm">Loading document...</p>
            </div>
          }
        >
          <div className="flex flex-1 gap-4 min-h-0">
            {/* Optimized Sidebar: No nested Document components */}
            {sidebarOpen && numPages > 0 && (
              <div className="w-28 flex-shrink-0 bg-surface-container-lowest rounded-2xl border border-white/5 overflow-y-auto flex flex-col gap-2 p-2 scrollbar-none">
                {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all group shrink-0 ${
                      p === pageNumber ? 'border-primary' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <Page
                      pageNumber={p}
                      scale={0.15}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={null}
                      className="pointer-events-none"
                    />
                    <div className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-bold ${p === pageNumber ? 'bg-primary text-on-primary' : 'bg-black/50 text-white/60'}`}>
                      {p}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Main PDF area */}
            <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center relative">
               <div className="flex-1 overflow-auto w-full flex justify-center py-8 px-4">
                {loadError ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center py-20">
                    <span className="material-symbols-outlined text-5xl text-error">error</span>
                    <h3 className="text-white font-bold">Failed to load PDF</h3>
                    <p className="text-on-surface-variant text-sm max-w-xs">The file may be corrupted or inaccessible.</p>
                    <button onClick={onBack} className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold text-white border border-white/10 hover:bg-surface-bright transition-colors">
                      Back to Library
                    </button>
                  </div>
                ) : (
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    className="shadow-2xl rounded-sm max-w-full"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                )}
              </div>
            </div>
          </div>
        </Document>

        {/* Progress bar */}
        {numPages > 0 && (
          <div className="mt-3 h-1 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(pageNumber / numPages) * 100}%` }}
            />
          </div>
        )}

        <p className="text-xs text-on-surface-variant text-center mt-2">
          Use <kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">←</kbd> <kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">→</kbd> keys • <kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">+</kbd> <kbd className="bg-surface-container px-1.5 py-0.5 rounded text-xs font-mono">-</kbd> to zoom
        </p>
      </div>
    </DashboardLayout>
  );
};

// ─── Books Library ─────────────────────────────────────────────────────────

const COVER_COLORS = [
  'bg-primary/20', 'bg-secondary/20', 'bg-tertiary/20',
  'bg-purple-500/20', 'bg-orange-500/20', 'bg-pink-500/20',
];

export const BooksPage: React.FC = () => {
  const { books, addBook, updateProgress, deleteBook, uploadProgress } = useBooks();
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setIsUploading(true);
    try {
      const title = file.name.replace('.pdf', '').replace(/_/g, ' ');
      await addBook(file, title, 'Local Upload', 'Study Material');
    } catch (error) {
       console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (viewingBook) {
    return (
      <PdfViewer
        book={viewingBook}
        onBack={() => setViewingBook(null)}
        updateProgress={updateProgress}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8 animate-fade-in-up">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">Library</h2>
          <p className="text-on-surface-variant mt-2">Your reading progress and materials.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".pdf" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
          <button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 overflow-hidden"
          >
            {isUploading && (
              <div 
                className="absolute inset-0 bg-white/20 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
            <span className="material-symbols-outlined relative z-10">{isUploading ? 'sync' : 'upload_file'}</span>
            <span className="relative z-10">
              {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload PDF'}
            </span>
          </button>
        </div>
      </div>

      {!books || books.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 animate-fade-in text-center cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 group-hover:bg-surface-bright transition-colors">
            <span className="material-symbols-outlined text-5xl text-outline">menu_book</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your library is empty</h3>
          <p className="text-on-surface-variant max-w-xs">Upload your study materials in PDF format to track your progress and read them in-app.</p>
          <span className="mt-4 text-primary font-bold text-sm">Click to upload a PDF →</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {books.map((book: Book, i: number) => (
            <div
              key={book.id}
              onClick={() => setViewingBook(book)}
              className="group bg-surface-container-high rounded-2xl p-6 border border-white/5 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all animate-fade-in-up cursor-pointer relative overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this book?')) deleteBook(book.id);
                }}
                className="absolute top-4 right-4 p-2 bg-black/40 text-white/40 hover:text-error rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>

              <div className={`w-full aspect-[3/4] rounded-lg ${book.coverColor || COVER_COLORS[i % COVER_COLORS.length]} mb-6 relative overflow-hidden flex items-center justify-center p-6 text-center group-hover:scale-[1.02] transition-transform origin-bottom shadow-lg`}>
                <div className="absolute inset-y-0 left-0 w-3 bg-black/20" />
                <h3 className="font-extrabold text-white text-lg leading-tight opacity-80 line-clamp-4">{book.title}</h3>
                {book.progress === 100 && (
                  <div className="absolute top-2 right-2 bg-tertiary text-on-tertiary p-1 rounded-full">
                    <span className="material-symbols-outlined text-xs">check</span>
                  </div>
                )}
                {/* Open icon overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-lg">
                  <span className="material-symbols-outlined text-3xl text-white">open_in_full</span>
                </div>
              </div>

              <h4 className="font-bold text-white mb-1 truncate group-hover:text-primary transition-colors">{book.title}</h4>
              <p className="text-[10px] text-outline font-black uppercase tracking-widest mb-4">{book.subject}</p>

              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className={book.progress === 100 ? 'text-tertiary' : 'text-primary'}>
                  {book.progress === 100 ? 'Completed' : book.progress > 0 ? 'Reading' : 'Not started'}
                </span>
                <span className="text-white">{book.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${book.progress === 100 ? 'bg-tertiary' : 'bg-primary'}`}
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BooksPage;
