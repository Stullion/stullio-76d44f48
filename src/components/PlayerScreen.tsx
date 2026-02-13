import { useState, useEffect, useCallback, useRef } from "react";
import { Book } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import { getAudioBlob } from "@/lib/audio-storage";
import { getSettings } from "@/lib/storage";
import { playPageTurnSound } from "@/lib/page-turn-sounds";
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
  const [delaying, setDelaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  // Track the last time we checked for markers to catch any skipped seconds
  const lastTimeRef = useRef<number>(-1);

  // Load audio blob from IndexedDB on mount
  useEffect(() => {
    let url: string | null = null;
    getAudioBlob(book.id)
      .then((blob) => {
        if (!blob) {
          setError("Recording not found. The audio may have been cleared.");
          setLoading(false);
          return;
        }
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load recording.");
        setLoading(false);
      });

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [book.id]);

  // 2-second delay before playback starts (per spec)
  useEffect(() => {
    if (loading || error) return;
    const timer = setTimeout(() => {
      setDelaying(false);
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading, error]);

  // Sync currentTime and fire page-turn sounds
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      const tFloor = Math.floor(t);
      setCurrentTime(tFloor);

      // Fire page-turn sounds for ANY marker timestamp we've passed since last check
      // This range check catches markers even if timeupdate skips an exact integer second
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
    // Reset marker tracking on seek
    const onSeeked = () => {
      lastTimeRef.current = Math.floor(audio.currentTime) - 1;
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

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ended || audio.currentTime >= (audio.duration || 0)) {
      audio.currentTime = 0;
      lastTimeRef.current = -1;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

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
      {/* Hidden audio element */}
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="auto" />}

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

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading recording...</p>
        </div>
      )}

      {/* Error state */}
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

      {/* Delay message */}
      {!loading && !error && delaying && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg font-medium animate-pulse">
            Starting playback...
          </p>
        </div>
      )}

      {/* Player controls */}
      {!loading && !error && !delaying && (
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

            {/* Controls row */}
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

          {/* Timeline — passes currentTime so it scrolls during playback */}
          <div className="pt-4 border-t border-border">
            <RecordingTimeline elapsed={currentTime} markers={book.markers} />
          </div>
        </>
      )}
    </div>
  );
}
