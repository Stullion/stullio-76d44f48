import { useEffect, useRef } from "react";
import { Marker } from "@/types/book";

interface RecordingTimelieProps {
  elapsed: number;    // current playhead position (seconds)
  markers: Marker[];
  duration?: number;  // total recording duration — pass this in player mode
                      // so the canvas is sized correctly regardless of playhead position
}

export function RecordingTimeline({ elapsed, markers, duration }: RecordingTimelieProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pxPerSecond = 4;
  // Canvas always sized to the full duration (or elapsed if no duration given, for recording mode)
  const canvasSeconds = duration !== undefined ? duration : elapsed;
  const totalWidth = Math.max(canvasSeconds * pxPerSecond + 80, 300);

  // Auto-scroll to keep the playhead visible
  useEffect(() => {
    if (scrollRef.current) {
      const playheadX = elapsed * pxPerSecond;
      const containerWidth = scrollRef.current.clientWidth;
      // Scroll so playhead is near the right edge with some padding
      scrollRef.current.scrollLeft = Math.max(0, playheadX - containerWidth + 60);
    }
  }, [elapsed]);

  const tickCount = Math.floor(canvasSeconds / 15) + 2;

  return (
    <div
      ref={scrollRef}
      className="w-full overflow-x-auto scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      <div
        className="relative h-16 flex items-end"
        style={{ width: `${totalWidth}px` }}
      >
        {/* Tick marks every 15 seconds */}
        {Array.from({ length: tickCount }).map((_, i) => {
          const x = i * 15 * pxPerSecond;
          if (x > totalWidth) return null;
          return (
            <div
              key={`tick-${i}`}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${x}px` }}
            >
              <span className="text-[10px] text-muted-foreground mb-1">
                {formatTime(i * 15)}
              </span>
              <div className="w-px h-4 bg-muted-foreground/40" />
            </div>
          );
        })}

        {/* Markers */}
        {markers.map((m, i) => {
          const x = m.timestamp * pxPerSecond;
          const isPage = m.type === "page-turn";
          return (
            <div
              key={`marker-${i}`}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${x}px` }}
            >
              <div
                className={`w-2 h-2 rounded-full mb-1 ${
                  isPage ? "bg-primary" : "bg-sage"
                }`}
              />
              <div
                className={`w-px ${isPage ? "h-6 bg-primary/60" : "h-8 bg-sage"}`}
              />
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute bottom-0 w-0.5 h-12 bg-destructive rounded-full"
          style={{ left: `${elapsed * pxPerSecond}px` }}
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
