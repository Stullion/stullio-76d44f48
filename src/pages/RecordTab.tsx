import { useState, useCallback } from "react";
import { RecordingSetup } from "@/components/RecordingSetup";
import { CountdownOverlay } from "@/components/CountdownOverlay";
import { ActiveRecording } from "@/components/ActiveRecording";
import { RecordingPhase, Marker } from "@/types/book";
import { saveBook, generateId } from "@/lib/storage";
import { saveAudioBlob } from "@/lib/audio-storage";

interface RecordTabProps {
  onRecordingComplete: () => void;
}

export function RecordTab({ onRecordingComplete }: RecordTabProps) {
  const [phase, setPhase] = useState<RecordingPhase>("setup");
  const [bookName, setBookName] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [pageTurnSound, setPageTurnSound] = useState<string>("soft-flip");

  const handleStart = useCallback(
    (name: string, cover: string | null, sound: string) => {
      setBookName(name);
      setCoverPhoto(cover);
      setPageTurnSound(sound);
      setPhase("countdown");
    },
    []
  );

  const handleCountdownComplete = useCallback(() => {
    setPhase("recording");
  }, []);

  const handleRecordingComplete = useCallback(
    async (markers: Marker[], duration: number, audioBlob: Blob) => {
      const id = generateId();
      const book = {
        id,
        title: bookName,
        thumbnail: coverPhoto,
        duration,
        pageTurns: markers.filter((m) => m.type === "page-turn").length,
        chapters: markers.filter((m) => m.type === "chapter").length,
        markers,
        pageTurnSound,
        createdAt: Date.now(),
      };

      // Save metadata to localStorage, audio blob to IndexedDB
      saveBook(book);
      await saveAudioBlob(id, audioBlob);

      setPhase("setup");
      setBookName("");
      setCoverPhoto(null);
      onRecordingComplete();
    },
    [bookName, coverPhoto, pageTurnSound, onRecordingComplete]
  );

  const handleCancel = useCallback(() => {
    setPhase("setup");
    setBookName("");
    setCoverPhoto(null);
  }, []);

  if (phase === "countdown") {
    return <CountdownOverlay onComplete={handleCountdownComplete} />;
  }

  if (phase === "recording") {
    return (
      <ActiveRecording
        onComplete={handleRecordingComplete}
        onCancel={handleCancel}
      />
    );
  }

  return <RecordingSetup onStart={handleStart} />;
}
