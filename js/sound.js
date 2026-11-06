// One shared Web Audio context for the recorded voice and the sound effects.
// Effects are synthesized, so there are no effect files to load.

let ac = null;
let out = null; // effects, kept quieter than the voice so instructions stay clear
let voice = null;
let noiseBuf = null;

export function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ac) {
    ac = new AC();
    out = ac.createGain();
    out.gain.value = 0.4;
    out.connect(ac.destination);
    voice = ac.createGain();
    voice.gain.value = 1;
    voice.connect(ac.destination);
  }
  if (ac.state !== 'running') ac.resume();
  // A silent blip inside the tap wakes up audio on iOS.
  const src = ac.createBufferSource();
  src.buffer = ac.createBuffer(1, 1, 22050);
  src.connect(out);
  src.start(0);
}

export const audioContext = () => ac;
export const voiceOutput = () => voice;

// iOS suspends audio when the app goes to the background or the screen locks,
// and only lets it restart from a touch, so every touch nudges it back on.
document.addEventListener('pointerdown', () => { if (ac && ac.state !== 'running') unlockAudio(); }, true);

function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, to = null } = {}) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur, { vol = 0.3, at = 0, freq = 2000, q = 1 } = {}) {
  if (!ac) return;
  noiseBuf ||= (() => {
    const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(700, 0.08, { type: 'triangle', vol: 0.2 }),
  pop: () => tone(520, 0.15, { to: 1040, vol: 0.3 }),
  step: i => tone(440 * 2 ** (((i % 8) * 2) / 12), 0.14, { type: 'triangle', vol: 0.25 }),
  vroom: () => {
    tone(70, 0.9, { type: 'sawtooth', vol: 0.12, to: 180 });
    tone(72, 0.9, { type: 'square', vol: 0.05, to: 170 });
  },
  honk: () => {
    tone(392, 0.16, { type: 'triangle', vol: 0.3 });
    tone(392, 0.22, { type: 'triangle', vol: 0.3, at: 0.22 });
  },
  swish: () => noise(0.4, { freq: 3500, q: 0.8, vol: 0.5 }),
  boing: () => tone(320, 0.35, { to: 110, vol: 0.3 }),
  oops: () => {
    tone(330, 0.14, { type: 'triangle', vol: 0.25 });
    tone(247, 0.25, { type: 'triangle', vol: 0.25, at: 0.14 });
  },
  dice: () => {
    for (let i = 0; i < 6; i++) noise(0.05, { at: i * 0.08, freq: 1500 + Math.random() * 1500, q: 3, vol: 0.4 });
  },
  cheer: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.25, at: i * 0.1 }));
    noise(0.8, { at: 0.35, freq: 1200, q: 0.5, vol: 0.15 });
  },
  chime: () => [784, 1175].forEach((f, i) => tone(f, 0.4, { vol: 0.2, at: i * 0.12 })),
  chomp: () => {
    noise(0.08, { freq: 400, q: 1.5, vol: 0.5 });
    noise(0.08, { at: 0.15, freq: 350, q: 1.5, vol: 0.5 });
  },
  burp: () => {
    tone(110, 0.45, { type: 'sawtooth', vol: 0.15, to: 70 });
    noise(0.4, { freq: 200, q: 2, vol: 0.25 });
  },
  choo: () => {
    tone(587, 0.6, { vol: 0.18 });
    tone(740, 0.6, { vol: 0.14 });
    for (let i = 0; i < 4; i++) noise(0.12, { at: 0.7 + i * 0.22, freq: 900, q: 0.7, vol: 0.35 });
  },
  rumble: () => {
    noise(2.2, { freq: 120, q: 0.5, vol: 0.6 });
    tone(60, 2.2, { type: 'sawtooth', vol: 0.1, to: 200 });
  },
  beep: i => tone(880 + (i % 3) * 220, 0.12, { type: 'triangle', vol: 0.22 }),
  drum: () => {
    tone(110, 0.3, { vol: 0.5, to: 55 });
    noise(0.12, { freq: 900, q: 0.8, vol: 0.25 });
  },
  note: freq => {
    tone(freq, 0.5, { type: 'triangle', vol: 0.3 });
    tone(freq * 2, 0.3, { vol: 0.05 });
  },
};
