import { useState, useEffect, useCallback, useRef } from "react";
import { Marker } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { X } from "lucide-react";

interface ActiveRecordingProps {
  onComplete: (markers: Marker[], duration: number, audioBlob: Blob) => void;
  onCancel: () => void;
}

export function ActiveRecording({ onComplete, onCancel }: ActiveRecordingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();
  // Store the blob when MediaRecorder finishes, then fire onComplete
  const pendingRef = useRef<{ markers: Marker[]; duration: number } | null>(null);

  const handleAudioComplete = useCallback((blob: Blob) => {
    if (pendingRef.current) {
      onComplete(pendingRef.current.markers, pendingRef.current.duration, blob);
      pendingRef.current = null;
    }
  }, [onComplete]);

  const { start, stop, cancel } = useAudioRecorder({
    onComplete: handleAudioComplete,
    onError: setError,
  });

  // Start recording + timer together on mount
  useEffect(() => {
    start();
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [start]);

  const addMarker = useCallback(
    (type: Marker["type"]) => {
      setMarkers((prev) => [...prev, { type, timestamp: elapsed }]);
    },
    [elapsed]
  );

  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Stash markers + duration so handleAudioComplete can use them
    // elapsed is captured at the moment The End is tapped
    pendingRef.current = { markers, duration: elapsed };
    stop();
  }, [markers, elapsed, stop]);

  const handleCancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancel();
    onCancel();
  }, [cancel, onCancel]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const pageTurns = markers.filter((m) => m.type === "page-turn").length;
  const chapters = markers.filter((m) => m.type === "chapter").length;

  if (error) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-8 gap-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Microphone Error</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-xl bg-muted px-6 py-3 font-medium text-foreground"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top: Recording indicator + cancel */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2" style={{ height: "22%" }}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-destructive animate-pulse" />
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Middle: Three stacked buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        {/* Turn Page — Most prominent */}
        <button
          onClick={() => addMarker("page-turn")}
          className="rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-lg active:scale-95 transition-transform"
          style={{ width: "65%", height: "22vh" }}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Turn Page</span>
            <span className="text-sm font-normal opacity-80">{pageTurns} pages</span>
          </div>
        </button>

        {/* The End — Second */}
        <button
          onClick={handleEnd}
          className="rounded-2xl bg-accent text-accent-foreground font-bold text-xl shadow-md active:scale-95 transition-transform"
          style={{ width: "65%", height: "22vh" }}
        >
          The End
        </button>

        {/* New Chapter — Least prominent */}
        <button
          onClick={() => addMarker("chapter")}
          className="rounded-2xl bg-secondary text-secondary-foreground font-semibold text-lg shadow-sm active:scale-95 transition-transform"
          style={{ width: "65%", height: "22vh" }}
        >
          <div className="flex flex-col items-center gap-1">
            <span>New Chapter</span>
            <span className="text-sm font-normal opacity-70">{chapters} chapters</span>
          </div>
        </button>
      </div>

      {/* Bottom: Timeline */}
      <div className="px-4 pb-6 pt-2">
        <RecordingTimeline elapsed={elapsed} markers={markers} />
      </div>
    </div>
  );
}
