import { useState, useEffect } from "react";
import { Book } from "@/types/book";
import { getBooks, deleteBook, renameBook } from "@/lib/storage";
import { BookCard } from "@/components/BookCard";
import { BookDetail } from "@/components/BookDetail";
import { PlayerScreen } from "@/components/PlayerScreen";
import { BookOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LibraryTabProps {
  refreshKey: number;
}

type LibraryView = "list" | "detail" | "player";

export function LibraryTab({ refreshKey }: LibraryTabProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<LibraryView>("list");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [renameTarget, setRenameTarget] = useState<Book | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setBooks(getBooks());
  }, [refreshKey]);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteBook(deleteTarget.id);
      setBooks(getBooks());
      setDeleteTarget(null);
      if (selectedBook?.id === deleteTarget.id) {
        setView("list");
        setSelectedBook(null);
      }
    }
  };

  const handleRename = () => {
    if (renameTarget && renameValue.trim()) {
      renameBook(renameTarget.id, renameValue.trim());
      setBooks(getBooks());
      setRenameTarget(null);
      if (selectedBook?.id === renameTarget.id) {
        setSelectedBook({ ...selectedBook, title: renameValue.trim() });
      }
    }
  };

  if (view === "player" && selectedBook) {
    return (
      <PlayerScreen
        book={selectedBook}
        onBack={() => setView("detail")}
      />
    );
  }

  if (view === "detail" && selectedBook) {
    return (
      <BookDetail
        book={selectedBook}
        onBack={() => {
          setView("list");
          setSelectedBook(null);
        }}
        onPlay={() => setView("player")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Library</h1>

      {books.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">No books yet</h2>
          <p className="text-muted-foreground text-sm">
            Head to the Record tab to create your first storytime recording!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => {
                setSelectedBook(book);
                setView("detail");
              }}
              onRename={() => {
                setRenameTarget(book);
                setRenameValue(book.title);
              }}
              onDelete={() => setDeleteTarget(book)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl mx-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this recording. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="rounded-2xl mx-6">
          <DialogHeader>
            <DialogTitle>Rename Book</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="rounded-xl h-12"
            placeholder="Enter new title..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim()}
              className="rounded-xl"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
