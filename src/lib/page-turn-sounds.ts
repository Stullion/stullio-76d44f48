/**
 * page-turn-sounds.ts
 * Plays real audio files from public/sounds/ folder.
 * Mobile Safari compatible - audio unlocked on first user gesture.
 *
 * playPageTurnSound now returns Promise<void> that resolves when the
 * sound finishes, so the player can pause the recording, await the
 * sound, then resume — keeping them strictly sequential.
 */

type SoundId = "soft-flip" | "gentle-chime" | "soft-pop" | "paper-rustle";

// Single audio element per sound — sequential playback means no overlap needed
const audioElements = new Map<SoundId, HTMLAudioElement>();

function createAudioElement(id: SoundId, filename: string): void {
  const audio = new Audio(`/stullio-76d44f48/sounds/${filename}`);
  audio.preload = "auto";
  audio.load();
  audioElements.set(id, audio);
}

createAudioElement("soft-flip", "soft-flip.wav");
createAudioElement("gentle-chime", "Bell.wav");
createAudioElement("soft-pop", "soft-pop.wav");
createAudioElement("paper-rustle", "paper-rustle.wav");

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

  audioElements.forEach((audio) => {
    audio.volume = 0;
    const p = audio.play();
    if (p) {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      }).catch(() => {});
    }
  });

  audioUnlocked = true;
  console.log("[audio] Audio unlocked successfully");
}

/**
 * Play a page turn sound and return a Promise that resolves when it ends.
 * The recording should be paused before calling this and resumed in .then().
 *
 * @param soundId  - One of: soft-flip, gentle-chime, soft-pop, paper-rustle
 * @param volumePct - Volume 0–100
 */
export function playPageTurnSound(soundId: string, volumePct: number): Promise<void> {
  if (!audioUnlocked) {
    console.warn("[audio] Audio not unlocked yet - sound will be silent on mobile");
  }

  const audio = audioElements.get(soundId as SoundId);
  if (!audio) {
    console.warn(`[audio] Unknown soundId: ${soundId}`);
    return Promise.resolve();
  }

  // Reset and configure
  audio.volume = Math.max(0, Math.min(1, volumePct / 100));
  audio.currentTime = 0;

  console.log(`[audio] Playing ${soundId} at ${volumePct}% volume`);

  return new Promise<void>((resolve) => {
    const onEnded = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      resolve(); // Resolve (not reject) so the recording always resumes
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.play().catch((e) => {
      console.warn(`[audio] Failed to play ${soundId}:`, e);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      resolve(); // Always resolve so recording resumes
    });
  });
}
