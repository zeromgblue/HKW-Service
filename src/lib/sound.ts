// Original confirmation chime synthesized with the Web Audio API (no audio files, no
// third-party sounds). Browsers only allow audio after a user gesture, so call
// prepareAudio() from the gesture handler and playSuccessChime() once the server confirms.

const MUTE_KEY = "hkw_sound_muted";
const MUTE_EVENT = "hkw-sound-mute-change";

export function subscribeSoundMuted(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(MUTE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(MUTE_EVENT, callback);
  };
}

let ctx: AudioContext | null = null;

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Not persisted if storage is unavailable.
  }
  window.dispatchEvent(new Event(MUTE_EVENT));
}

export function prepareAudio() {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function playSuccessChime() {
  if (!ctx || isSoundMuted()) return;
  const now = ctx.currentTime;
  // Soft rising major triad (C5 → E5 → G5 → C6), quick and unobtrusive.
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const start = now + i * 0.09;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (i === notes.length - 1 ? 0.55 : 0.28));
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

// Two-note "new job" ding for the staff page (original tones, like the success chime).
export function playNewJobChime() {
  if (!ctx || isSoundMuted()) return;
  const now = ctx.currentTime;
  [880, 1174.66].forEach((freq, i) => {
    const start = now + i * 0.14;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.45);
  });
}
