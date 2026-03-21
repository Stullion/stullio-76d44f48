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
      console.log("[RecordTab] Recording complete, blob size:", audioBlob.size);
      const bookId = generateId();
      
      try {
        // Save audio FIRST to IndexedDB
        console.log("[RecordTab] Saving audio blob to IndexedDB with ID:", bookId);
        await saveAudioBlob(bookId, audioBlob);
        console.log("[RecordTab] Audio blob saved successfully");
        
        // THEN save metadata to localStorage with same ID
        const book = {
          id: bookId,
          title: bookName,
          thumbnail: coverPhoto,
          duration,
          pageTurns: markers.filter((m) => m.type === "page-turn").length,
          chapters: markers.filter((m) => m.type === "chapter").length,
          markers,
          pageTurnSound,
          createdAt: Date.now(),
        };
        
        console.log("[RecordTab] Saving book metadata to localStorage");
        saveBook(book);
        console.log("[RecordTab] Book saved successfully");
        
        // Reset state
        setPhase("setup");
        setBookName("");
        setCoverPhoto(null);
        
        // Notify parent
        onRecordingComplete();
      } catch (err) {
        console.error("[RecordTab] Error saving recording:", err);
        // TODO: Show error to user
      }
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
        pageTurnSound={pageTurnSound}
        onComplete={handleRecordingComplete}
        onCancel={handleCancel}
      />
    );
  }

  return <RecordingSetup onStart={handleStart} />;
}
