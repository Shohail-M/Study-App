import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as dexieDb } from '../data/db';
import type { Book } from '../data/db';
import { useAuth } from '../context/AuthContext';

export function useBooks() {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const books = useLiveQuery(
    async () => {
      if (!user) return [];
      const items = await dexieDb.books.where('userId').equals(user.id).toArray();
      return items.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
    },
    [user?.id],
    []
  );

  const addBook = useCallback(async (file: File, title: string, author: string, subject: string) => {
    if (!user) return;

    const id = crypto.randomUUID();
    // Simulate progress for local processing
    setUploadProgress(10);
    const arrayBuffer = await file.arrayBuffer();
    setUploadProgress(80);
    
    await dexieDb.books.add({
      id,
      userId: user.id,
      title,
      author,
      subject,
      coverColor: 'bg-primary/20',
      pdfData: arrayBuffer,
      progress: 0,
      lastReadAt: new Date()
    } as Book);
    
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 500);
  }, [user]);

  const updateProgress = useCallback(async (id: string, progress: number) => {
    await dexieDb.books.update(id, { progress, lastReadAt: new Date() });
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    await dexieDb.books.delete(id);
  }, []);

  return {
    books: books || [],
    addBook,
    updateProgress,
    deleteBook,
    uploadProgress
  };
}
