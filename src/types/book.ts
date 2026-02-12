export interface Marker {
  type: "page-turn" | "chapter";
  timestamp: number; // seconds from start
}

export interface Book {
  id: string;
  title: string;
  thumbnail: string | null; // base64 data URL
  duration: number; // seconds
  pageTurns: number;
  chapters: number;
  markers: Marker[];
  pageTurnSound: string;
  audioBlob?: Blob;
  createdAt: number;
}

export type TabId = "record" | "library" | "settings";

export type RecordingPhase = "setup" | "countdown" | "recording" | "complete";

export const PAGE_TURN_SOUNDS = [
  { id: "soft-flip", label: "Soft Page Flip" },
  { id: "gentle-chime", label: "Gentle Chime" },
  { id: "soft-pop", label: "Soft Pop" },
  { id: "paper-rustle", label: "Paper Rustle" },
] as const;
