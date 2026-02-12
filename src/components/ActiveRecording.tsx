import { useState, useEffect, useCallback, useRef } from "react";
import { Marker } from "@/types/book";
import { RecordingTimeline } from "@/components/RecordingTimeline";
import { X } from "lucide-react";

interface ActiveRecordingProps {
  onComplete: (markers: Marker[], duration: number) => void;
  onCancel: () => void;
}

export function ActiveRecording({ onComplete, onCancel }: ActiveRecordingProps) {
  const [elapsed, setElapsed] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const intervalRef = useRef<number>();

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const addMarker = useCallback(
    (type: Marker["type"]) => {
      setMarkers((prev) => [...prev, { type, timestamp: elapsed }]);
    },
    [elapsed]
  );

  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onComplete(markers, elapsed);
  }, [markers, elapsed, onComplete]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const pageTurns = markers.filter((m) => m.type === "page-turn").length;
  const chapters = markers.filter((m) => m.type === "chapter").length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top: Recording indicator + cancel */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2" style={{ height: "22%" }}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-destructive animate-pulse-record" />
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          onClick={onCancel}
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
