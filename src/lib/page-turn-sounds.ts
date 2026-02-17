/**
 * page-turn-sounds.ts
 * Plays real audio files from public/sounds/ folder.
 * Mobile Safari compatible - audio unlocked on first user gesture.
 */

type SoundId = "soft-flip" | "gentle-chime" | "soft-pop" | "paper-rustle";

// Audio pool - multiple instances per sound for overlapping playback
const audioPools = new Map<SoundId, HTMLAudioElement[]>();
const POOL_SIZE = 3; // Allow 3 overlapping sounds per type

function createAudioPool(id: SoundId, filename: string): void {
  const pool: HTMLAudioElement[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(`/stullio-76d44f48/sounds/${filename}`);
    audio.preload = "auto";
    audio.load(); // Force load
    pool.push(audio);
  }
  audioPools.set(id, pool);
}

// Initialize audio pools on module load
createAudioPool("soft-flip", "soft-flip.wav");
createAudioPool("gentle-chime", "Bell.wav");
createAudioPool("soft-pop", "soft-pop.wav");
createAudioPool("paper-rustle", "paper-rustle.wav");

// Track if audio has been unlocked (required for mobile Safari)
let audioUnlocked = false;

/**
 * Unlock audio playback by playing a silent sound on user gesture.
 * MUST be called synchronously inside a click/tap handler for mobile Safari.
 */
export function warmUpAudioContext(): void {
  if (audioUnlocked) {
    console.log("[audio] Already unlocked");
    return;
  }

  console.log("[audio] Unlocking audio for mobile Safari...");
  
  // Play and immediately pause a sound from each pool to unlock
  audioPools.forEach((pool) => {
    const audio = pool[0];
    audio.volume = 0; // Silent
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1; // Restore volume
        })
        .catch(() => {}); // Ignore errors
    }
  });
  
  audioUnlocked = true;
  console.log("[audio] Audio unlocked successfully");
}

/**
 * Play a page turn sound with volume control.
 * @param soundId - One of: soft-flip, gentle-chime, soft-pop, paper-rustle
 * @param volumePct - Volume 0-100
 */
export function playPageTurnSound(soundId: string, volumePct: number): void {
  if (!audioUnlocked) {
    console.warn("[audio] Audio not unlocked yet - sound will be silent on mobile");
  }

  try {
    const pool = audioPools.get(soundId as SoundId);
    if (!pool) {
      console.warn(`[audio] Unknown soundId: ${soundId}`);
      return;
    }

    // Find an available audio element (not currently playing)
    let audio = pool.find(a => a.paused);
    if (!audio) {
      // All busy, use the first one (will interrupt it)
      audio = pool[0];
    }

    audio.volume = Math.max(0, Math.min(1, volumePct / 100));
    audio.currentTime = 0; // Reset to start
    
    console.log(`[audio] Playing ${soundId} at ${volumePct}% volume`);
    
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((e) => {
        console.warn(`[audio] Failed to play ${soundId}:`, e);
      });
    }
  } catch (e) {
    console.error("[audio] playPageTurnSound error:", e);
  }
}
