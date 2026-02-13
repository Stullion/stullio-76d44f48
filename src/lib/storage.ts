/**
 * storage.ts
 * Handles book metadata in localStorage.
 * Audio blobs are stored separately in IndexedDB via audio-storage.ts.
 */

import { Book } from "@/types/book";
import { deleteAudioBlob } from "@/lib/audio-storage";

const BOOKS_KEY = "stullio-books";
const SETTINGS_KEY = "stullio-settings";

export interface Settings {
  pageTurnVolume: number; // 0–100
}

const DEFAULT_SETTINGS: Settings = {
  pageTurnVolume: 80,
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBook(book: Omit<Book, "audioBlob">): void {
  const books = getBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) {
    books[idx] = book;
  } else {
    books.unshift(book);
  }
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function deleteBook(id: string): void {
  const books = getBooks().filter((b) => b.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  // Also remove the audio blob from IndexedDB (fire-and-forget)
  deleteAudioBlob(id).catch(() => {});
}

export function renameBook(id: string, newTitle: string): void {
  const books = getBooks().map((b) =>
    b.id === id ? { ...b, title: newTitle } : b
  );
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(partial: Partial<Settings>): void {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
}
