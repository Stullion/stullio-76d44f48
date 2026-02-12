import { useState, useEffect, useCallback, useRef } from "react";
import { Book, Marker } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

interface PlayerScreenProps {
  book: Book;
  onBack: () => void;
}

export function PlayerScreen({ book, onBack }: PlayerScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [delaying, setDelaying] = useState(true);
  const intervalRef = useRef<number>();

  // 2-second delay before playback
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelaying(false);
      setIsPlaying(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Playback timer
  useEffect(() => {
    if (isPlaying && !delaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= book.duration) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, delaying, book.duration]);

  const togglePlay = useCallback(() => {
    if (currentTime >= book.duration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  }, [currentTime, book.duration]);

  const skip = useCallback(
    (seconds: number) => {
      setCurrentTime((prev) => Math.max(0, Math.min(book.duration, prev + seconds)));
    },
    [book.duration]
  );

  const chapterMarkers = book.markers
    .filter((m) => m.type === "chapter")
    .map((m) => m.timestamp)
    .sort((a, b) => a - b);

  const skipChapter = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "next") {
        const next = chapterMarkers.find((t) => t > currentTime);
        if (next !== undefined) setCurrentTime(next);
      } else {
        const prev = [...chapterMarkers].reverse().find((t) => t < currentTime - 2);
        if (prev !== undefined) setCurrentTime(prev);
        else setCurrentTime(0);
      }
    },
    [chapterMarkers, currentTime]
  );

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-background px-6 pt-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate flex-1">
          {book.title}
        </h1>
      </div>

      {/* Delay message */}
      {delaying && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg font-medium animate-pulse">
            Starting playback...
          </p>
        </div>
      )}

      {!delaying && (
        <>
          {/* Spacer */}
          <div className="flex-1" />

          {/* Controls */}
          <div className="flex flex-col items-center gap-8 mb-8">
            {/* Time */}
            <div className="text-center">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                {formatTime(currentTime)}
              </span>
              <span className="text-muted-foreground ml-2">
                / {formatTime(book.duration)}
              </span>
            </div>

            {/* Main controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => skipChapter("prev")}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
              >
                <ChevronFirst className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => skip(-15)}
                className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
              >
                <SkipBack className="w-5 h-5 text-secondary-foreground" />
              </button>
              <button
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-primary-foreground fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
                )}
              </button>
              <button
                onClick={() => skip(15)}
                className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
              >
                <SkipForward className="w-5 h-5 text-secondary-foreground" />
              </button>
              <button
                onClick={() => skipChapter("next")}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
              >
                <ChevronLast className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-4 border-t border-border">
            <RecordingTimeline elapsed={book.duration} markers={book.markers} />
          </div>
        </>
      )}
    </div>
  );
}
