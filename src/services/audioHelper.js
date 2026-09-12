// Web Audio API Chime & Haptic Vibration Helper
// Zero external audio files required, guaranteed to work across modern desktop & mobile browsers

let audioContextInstance = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContextInstance || audioContextInstance.state === "closed") {
    audioContextInstance = new AudioContextClass();
  }
  return audioContextInstance;
};

// Play an elegant, modern two-tone notification chime
export const playNotificationChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: Gentle pleasant harmonic
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Uplifting resolve
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("Notice: Audio chime could not play:", err);
  }
};

// Trigger mobile phone physical vibration
export const triggerMobileVibration = (pattern = [180, 80, 180]) => {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // Some browsers restrict vibrate without user interaction
  }
};

// Full notification alert: Audio + Vibration
export const triggerNotificationAlert = () => {
  playNotificationChime();
  triggerMobileVibration();
};
