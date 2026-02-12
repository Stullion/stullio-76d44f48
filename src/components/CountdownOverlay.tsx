import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  onComplete: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center">
      <div
        key={count}
        className="text-9xl font-bold text-primary-foreground animate-countdown-pop"
      >
        {count > 0 ? count : ""}
      </div>
    </div>
  );
}
