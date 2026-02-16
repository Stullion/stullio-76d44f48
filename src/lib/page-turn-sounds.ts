/**
 * page-turn-sounds.ts — with diagnostic logging
 */

type SoundId = "soft-flip" | "gentle-chime" | "soft-pop" | "paper-rustle";

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log("[audio] AudioContext created, state:", _ctx.state);
  }
  return _ctx;
}

export function warmUpAudioContext(): void {
  const ctx = getCtx();
  console.log("[audio] warmUpAudioContext called, state:", ctx.state);
  if (ctx.state === "suspended") {
    ctx.resume().then(() => {
      console.log("[audio] AudioContext resumed, state now:", ctx.state);
    }).catch((e) => {
      console.error("[audio] AudioContext resume failed:", e);
    });
  }
}

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

export function playPageTurnSound(soundId: string, volumePct: number) {
  try {
    const ctx = getCtx();
    const volume = volumePct / 100;
    console.log(`[audio] playPageTurnSound called — sound: ${soundId}, volume: ${volume}, ctx state: ${ctx.state}`);

    const play = () => {
      console.log(`[audio] actually playing sound: ${soundId}`);
      switch (soundId as SoundId) {
        case "soft-flip":    playSoftFlip(ctx, volume); break;
        case "gentle-chime": playGentleChime(ctx, volume); break;
        case "soft-pop":     playSoftPop(ctx, volume); break;
        case "paper-rustle": playPaperRustle(ctx, volume); break;
        default:
          console.log(`[audio] unknown soundId "${soundId}", falling back to soft-flip`);
          playSoftFlip(ctx, volume);
      }
    };

    if (ctx.state === "running") {
      play();
    } else {
      console.warn(`[audio] ctx not running (${ctx.state}), attempting resume before play`);
      ctx.resume().then(play).catch((e) => {
        console.error("[audio] resume failed:", e);
      });
    }
  } catch (e) {
    console.error("[audio] playPageTurnSound threw:", e);
  }
}
