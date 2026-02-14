import { Book } from "@/types/book";
import { ArrowLeft, Play, Clock, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { warmUpAudioContext } from "@/lib/page-turn-sounds";

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onPlay: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function BookDetail({ book, onBack, onPlay }: BookDetailProps) {
  const handlePlay = () => {
    // Warm up the AudioContext HERE, synchronously inside this user gesture,
    // before the screen transition. By the time PlayerScreen mounts and
    // timeupdate fires page-turn sounds, the context will already be "running".
    warmUpAudioContext();
    onPlay();
  };

  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground mb-6 self-start"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Large thumbnail */}
      <div className="w-full aspect-[3/4] max-h-[40vh] rounded-2xl bg-muted overflow-hidden flex items-center justify-center mb-6">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="w-16 h-16 text-muted-foreground" />
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-3">{book.title}</h1>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {formatDuration(book.duration)}
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          {book.pageTurns} pages
        </span>
        {book.chapters > 0 && (
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            {book.chapters} chapters
          </span>
        )}
      </div>

      {/* Play button */}
      <div className="flex-1" />
      <Button
        onClick={handlePlay}
        className="w-full h-16 rounded-2xl text-xl font-bold shadow-lg gap-3"
        size="lg"
      >
        <Play className="w-7 h-7 fill-current" />
        Play
      </Button>
    </div>
  );
}
