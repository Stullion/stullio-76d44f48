import { useEffect, useRef } from "react";
import { Marker } from "@/types/book";

interface RecordingTimelineProps {
  elapsed: number;
  markers: Marker[];
}

export function RecordingTimeline({ elapsed, markers }: RecordingTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pxPerSecond = 4;
  const totalWidth = Math.max(elapsed * pxPerSecond + 80, 300);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [elapsed]);

  const tickCount = Math.floor(elapsed / 15) + 1;

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

        {/* Current position */}
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
