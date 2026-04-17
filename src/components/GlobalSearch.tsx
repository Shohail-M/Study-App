import React, { useState, useRef, useEffect } from 'react';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';

export const GlobalSearch: React.FC = () => {
  const { query, setQuery, results, recentSearches, saveSearch, clearRecent } = useGlobalSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'task' | 'note' | 'book' | 'timetable', _id: string, title: string) => {
    saveSearch(title);
    setIsOpen(false);
    setQuery('');
    
    // Navigate to the relevant page
    switch (type) {
      case 'task': navigate('/tasks'); break;
      case 'note': navigate('/notes'); break;
      case 'book': navigate('/books'); break;
      case 'timetable': navigate('/timetable'); break;
    }
  };

  const hasResults = results.tasks.length > 0 || results.notes.length > 0 || results.books.length > 0 || results.timetable.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
      <input
        className="w-full bg-surface-container-highest border-none rounded-full py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        placeholder="Search tasks, notes, books, schedule..."
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) {
            saveSearch(query);
          }
        }}
      />

      {/* Search Overlay */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-surface-container-high rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
            
            {/* Recent Searches */}
            {!query && recentSearches && recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center px-3 py-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Recent Searches</span>
                  <button onClick={clearRecent} className="text-[10px] text-primary hover:underline uppercase font-bold">Clear</button>
                </div>
                {recentSearches.map((s: { id: string; query: string }) => (
                  <button
                    key={s.id}
                    onClick={() => setQuery(s.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-on-surface transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-outline text-sm">history</span>
                    {s.query}
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {query && !hasResults && (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
                <p className="text-sm text-on-surface-variant font-medium">No results found for "{query}"</p>
              </div>
            )}

            {/* Results - Categorized */}
            {query && hasResults && (
              <div className="space-y-4">
                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Tasks</h3>
                    {results.tasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect('task', t.id, t.title)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={`w-2 h-2 rounded-full ${t.completed ? 'bg-success' : 'bg-primary'}`} />
                        <span className="text-sm font-medium text-on-surface line-clamp-1">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {results.notes.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1 text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-1">Notes</h3>
                    {results.notes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleSelect('note', n.id, n.title)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-tertiary text-sm">description</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface line-clamp-1">{n.title}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">{n.subject}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Books */}
                {results.books.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1 text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Books</h3>
                    {results.books.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect('book', b.id, b.title)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-secondary text-sm">menu_book</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface line-clamp-1">{b.title}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{b.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Timetable */}
                {results.timetable.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1 text-[10px] font-black text-[#FF9B71] uppercase tracking-[0.2em] mb-1">Schedule</h3>
                    {results.timetable.map(tt => (
                      <button
                        key={tt.id}
                        onClick={() => handleSelect('timetable', tt.id, tt.subject)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <span className={`material-symbols-outlined text-sm ${tt.color || 'text-[#FF9B71]'}`}>calendar_today</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface line-clamp-1">{tt.subject}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{tt.day} at {tt.timeSlot} • Room {tt.room}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
