import { Book } from "@/types/book";

const BOOKS_KEY = "stullio_books";
const SETTINGS_KEY = "stullio_settings";

export function getBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBook(book: Book): void {
  const books = getBooks();
  books.unshift(book);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function deleteBook(id: string): void {
  const books = getBooks().filter((b) => b.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function renameBook(id: string, newTitle: string): void {
  const books = getBooks().map((b) =>
    b.id === id ? { ...b, title: newTitle } : b
  );
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function getSettings(): { pageTurnVolume: number } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { pageTurnVolume: 80 };
  } catch {
    return { pageTurnVolume: 80 };
  }
}

export function saveSettings(settings: { pageTurnVolume: number }): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
