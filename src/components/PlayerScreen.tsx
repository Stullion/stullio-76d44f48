import { useState, useEffect, useCallback, useRef } from "react";
import { Book } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import { getAudioBlob } from "@/lib/audio-storage";
import { getSettings } from "@/lib/storage";
import { playPageTurnSound, warmUpAudioContext } from "@/lib/page-turn-sounds";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronFirst,
  ChevronLast,
  Loader2,
} from "lucide-react";

interface PlayerScreenProps {
  book: Book;
  onBack: () => void;
}

export function PlayerScreen({ book, onBack }: PlayerScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false); // user has tapped play at least once
  const lastTimeRef = useRef<number>(-1);

  // Load audio blob from IndexedDB directly onto the audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let url: string | null = null;

    getAudioBlob(book.id)
      .then((blob) => {
        if (!blob) {
          setError("Recording not found. The audio may have been cleared.");
          setLoading(false);
          return;
        }
        url = URL.createObjectURL(blob);
        audio.src = url;
        audio.load();
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load recording.");
        setLoading(false);
      });

    return () => {
      if (url) URL.revokeObjectURL(url);
      if (audio) audio.src = "";
    };
  }, [book.id]);

  // Attach audio event listeners once on mount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const tFloor = Math.floor(audio.currentTime);
      setCurrentTime(tFloor);

      const prev = lastTimeRef.current;
      if (prev >= 0 && tFloor > prev) {
        const settings = getSettings();
        book.markers
          .filter((m) => m.type === "page-turn")
          .forEach((m) => {
            if (m.timestamp > prev && m.timestamp <= tFloor) {
              playPageTurnSound(book.pageTurnSound, settings.pageTurnVolume);
            }
          });
      }
      lastTimeRef.current = tFloor;
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      lastTimeRef.current = -1;
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onSeeked = () => {
      lastTimeRef.current = Math.floor(audio.currentTime) - 1;
      setCurrentTime(Math.floor(audio.currentTime));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onSeeked);
    };
  }, [book]);

  // togglePlay is the ONLY place audio starts — always from a direct user tap
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Warm up AudioContext synchronously inside this gesture handler
    // This MUST happen in the same call stack as the user tap
    warmUpAudioContext();

    if (!hasStarted) {
      setHasStarted(true);
    }

    if (audio.ended || audio.currentTime >= (audio.duration || 0)) {
      audio.currentTime = 0;
      lastTimeRef.current = -1;
    }

    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [hasStarted]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  }, []);

  const chapterMarkers = book.markers
    .filter((m) => m.type === "chapter")
    .map((m) => m.timestamp)
    .sort((a, b) => a - b);

  const skipChapter = useCallback(
    (direction: "prev" | "next") => {
      const audio = audioRef.current;
      if (!audio) return;
      const t = audio.currentTime;
      if (direction === "next") {
        const next = chapterMarkers.find((ts) => ts > t);
        if (next !== undefined) audio.currentTime = next;
      } else {
        const prev = [...chapterMarkers].reverse().find((ts) => ts < t - 2);
        audio.currentTime = prev !== undefined ? prev : 0;
      }
    },
    [chapterMarkers]
  );

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-background px-6 pt-6 pb-6">
      {/* Audio element always in the DOM */}
      <audio ref={audioRef} preload="auto" />

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

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading recording...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={onBack}
            className="rounded-xl bg-muted px-6 py-3 font-medium text-foreground"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Player */}
      {!loading && !error && (
        <>
          <div className="flex-1" />

          <div className="flex flex-col items-center gap-8 mb-8">
            {/* Time display */}
            <div className="text-center">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                {formatTime(currentTime)}
              </span>
              <span className="text-muted-foreground ml-2">
                / {formatTime(book.duration)}
              </span>
            </div>

            {/* Tap to begin hint — shown until first tap */}
            {!hasStarted && (
              <p className="text-sm text-muted-foreground animate-pulse -mb-4">
                Tap play to begin
              </p>
            )}

            {/* Controls */}
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
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
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
            <RecordingTimeline
              elapsed={currentTime}
              markers={book.markers}
              duration={book.duration}
            />
          </div>
        </>
      )}
    </div>
  );
}
