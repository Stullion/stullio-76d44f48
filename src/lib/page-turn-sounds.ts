/**
 * page-turn-sounds.ts
 * Plays real audio files from public/sounds/ folder.
 */

type SoundId = "soft-flip" | "gentle-chime" | "soft-pop" | "paper-rustle";

// Pre-load all audio files into memory
const audioCache = new Map<SoundId, HTMLAudioElement>();

function loadSound(id: SoundId, filename: string): void {
  const audio = new Audio(`/stullio-76d44f48/sounds/${filename}`);
  audio.preload = "auto";
  audioCache.set(id, audio);
}

// Initialize audio files on module load
loadSound("soft-flip", "soft-flip.wav");
loadSound("gentle-chime", "Bell.wav");
loadSound("soft-pop", "soft-pop.wav");
loadSound("paper-rustle", "paper-rustle.wav");

/**
 * Warm up audio context (no-op for HTMLAudioElement, but kept for API compatibility)
 */
export function warmUpAudioContext(): void {
  // HTMLAudioElement doesn't need AudioContext warmup, but we keep this
  // function for API compatibility with the rest of the app
  console.log("[audio] warmUpAudioContext called (no-op for file-based sounds)");
}

/**
 * Play a page turn sound with volume control.
 * @param soundId - One of: soft-flip, gentle-chime, soft-pop, paper-rustle
 * @param volumePct - Volume 0-100
 */
export function playPageTurnSound(soundId: string, volumePct: number): void {
  try {
    const audio = audioCache.get(soundId as SoundId);
    if (!audio) {
      console.warn(`[audio] Unknown soundId: ${soundId}`);
      return;
    }

    // Clone the audio element so we can play overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = Math.max(0, Math.min(1, volumePct / 100));
    
    console.log(`[audio] Playing ${soundId} at ${volumePct}% volume`);
    
    clone.play().catch((e) => {
      console.warn(`[audio] Failed to play ${soundId}:`, e);
    });
  } catch (e) {
    console.error("[audio] playPageTurnSound error:", e);
  }
}
