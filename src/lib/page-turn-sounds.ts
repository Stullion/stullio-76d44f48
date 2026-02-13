/**
 * page-turn-sounds.ts
 * Synthesizes page turn sounds entirely in the browser using Web Audio API.
 * No audio files required — works in any browser that supports AudioContext.
 */

type SoundId = "soft-flip" | "gentle-chime" | "soft-pop" | "paper-rustle";

function getAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

/** Soft Page Flip: short filtered noise burst */
function playSoftFlip(ctx: AudioContext, volume: number) {
  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Gentle Chime: soft sine tone with fast decay */
function playGentleChime(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

/** Soft Pop: quick transient */
function playSoftPop(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06);

  gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

/** Paper Rustle: longer noise burst with gentle envelope */
function playPaperRustle(ctx: AudioContext, volume: number) {
  const bufferSize = ctx.sampleRate * 0.22;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env =
      i < bufferSize * 0.3
        ? i / (bufferSize * 0.3)
        : Math.pow(1 - (i - bufferSize * 0.3) / (bufferSize * 0.7), 2);
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.45, ctx.currentTime);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/**
 * Play a page turn sound.
 * @param soundId  One of the PAGE_TURN_SOUNDS ids
 * @param volumePct  0–100, from settings
 */
export function playPageTurnSound(soundId: string, volumePct: number) {
  try {
    const ctx = getAudioContext();
    // Resume in case the context was suspended (browser autoplay policy)
    const volume = volumePct / 100;

    const play = () => {
      switch (soundId as SoundId) {
        case "soft-flip":
          playSoftFlip(ctx, volume);
          break;
        case "gentle-chime":
          playGentleChime(ctx, volume);
          break;
        case "soft-pop":
          playSoftPop(ctx, volume);
          break;
        case "paper-rustle":
          playPaperRustle(ctx, volume);
          break;
        default:
          playSoftFlip(ctx, volume);
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(play);
    } else {
      play();
    }
  } catch (e) {
    // Silently fail — audio is non-critical
    console.warn("Page turn sound failed:", e);
  }
}
