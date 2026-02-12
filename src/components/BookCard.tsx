import { Book } from "@/types/book";
import { MoreVertical, Clock, BookOpen, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function BookCard({ book, onClick, onRename, onDelete }: BookCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-16 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate text-base">
            {book.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(book.duration)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {book.pageTurns} pages
            </span>
            {book.chapters > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {book.chapters} ch
              </span>
            )}
          </div>
        </div>

        {/* Ellipsis menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
