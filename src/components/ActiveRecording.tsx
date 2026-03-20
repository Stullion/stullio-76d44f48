import { useState, useEffect, useCallback, useRef } from "react";
import { Marker } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { playPageTurnSound } from "@/lib/page-turn-sounds";
import { getSettings } from "@/lib/storage";
import { X } from "lucide-react";

interface ActiveRecordingProps {
  pageTurnSound: string;
  onComplete: (markers: Marker[], duration: number, audioBlob: Blob) => void;
  onCancel: () => void;
}

export function ActiveRecording({ pageTurnSound, onComplete, onCancel }: ActiveRecordingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();
  const audioBlobRef = useRef<Blob | null>(null);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    audioBlobRef.current = blob;
  }, []);

  const handleRecordingError = useCallback((err: string) => {
    setError(err);
  }, []);

  const { start, stop, pause, resume, cancel } = useAudioRecorder({
    onComplete: handleRecordingComplete,
    onError: handleRecordingError,
  });

  // Start recording when component mounts
  useEffect(() => {
    start();
    return () => {
      cancel();
    };
  }, [start, cancel]);

  // Main timer
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const addMarker = useCallback(
    (type: Marker["type"]) => {
      if (type === "page-turn") {
        // Capture timestamp BEFORE pausing
        const timestamp = elapsed;
        
        // Pause both timer AND MediaRecorder
        setIsPaused(true);
        pause();
        
        // Play sound effect during recording
        const settings = getSettings();
        playPageTurnSound(pageTurnSound, settings.pageTurnVolume);
        
        // Add marker with pre-sound timestamp
        setMarkers((prev) => [...prev, { type, timestamp }]);
        
        // Resume after 1 second (after sound finishes)
        setTimeout(() => {
          resume();
          setIsPaused(false);
        }, 1000);
      } else {
        // Chapter markers don't need sound or pause
        setMarkers((prev) => [...prev, { type, timestamp: elapsed }]);
      }
    },
    [elapsed, pageTurnSound, pause, resume]
  );

  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Stop MediaRecorder and wait for blob
    stop();
    
    // Poll for blob (onstop is async)
    const checkBlob = setInterval(() => {
      if (audioBlobRef.current) {
        clearInterval(checkBlob);
        onComplete(markers, elapsed, audioBlobRef.current);
      }
    }, 100);
    
    // Timeout after 3 seconds
    setTimeout(() => {
      clearInterval(checkBlob);
      if (!audioBlobRef.current) {
        setError("Recording timed out. Please try again.");
      }
    }, 3000);
  }, [markers, elapsed, stop, onComplete]);

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
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6 text-center">
        <p className="text-destructive font-semibold">{error}</p>
        <button
          onClick={handleCancel}
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
          <div className="w-4 h-4 rounded-full bg-destructive animate-pulse-record" />
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {formatTime(elapsed)}
          </span>
          {isPaused && (
            <span className="text-sm text-muted-foreground animate-pulse">
              (paused)
            </span>
          )}
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
          disabled={isPaused}
          className="rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
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
