// Sound effects are synthesized with Web Audio, so there are no effect files.
// The voice clips play through their own, louder channel.

let ac = null;
let out = null;
let voice = null;
let noiseBuf = null;

export function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ac) {
    ac = new AC();
    out = ac.createGain();
    out.gain.value = 0.45;
    out.connect(ac.destination);
    voice = ac.createGain();
    voice.gain.value = 1;
    voice.connect(ac.destination);
  }
  if (ac.state !== 'running') ac.resume();
  const src = ac.createBufferSource();
  src.buffer = ac.createBuffer(1, 1, 22050);
  src.connect(out);
  src.start(0);
}

export const audioContext = () => ac;
export const voiceOutput = () => voice;

// iOS suspends audio in the background and only resumes it from a touch.
document.addEventListener('pointerdown', () => { if (ac && ac.state !== 'running') unlockAudio(); }, true);

function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, to = null, dest = null } = {}) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseBuffer() {
  noiseBuf ||= (() => {
    const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  return noiseBuf;
}

function noise(dur, { vol = 0.3, at = 0, freq = 2000, q = 1, to = null } = {}) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer();
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// A sound that keeps going until the returned function is called.
export function loop(kind) {
  if (!ac) return () => {};
  const t = ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.connect(out);
  const nodes = [];
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  let level = 0.3;
  if (kind === 'water') { f.frequency.value = 2600; f.Q.value = 0.6; level = 0.5; }
  if (kind === 'spray') { f.frequency.value = 6000; f.Q.value = 0.8; level = 0.3; }
  if (kind === 'brush') {
    f.frequency.value = 500; f.Q.value = 0.7; level = 0.55;
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 70;
    const og = ac.createGain();
    og.gain.value = 0.15;
    o.connect(og).connect(g);
    o.start(t);
    nodes.push(o);
  }
  src.connect(f).connect(g);
  src.start(t);
  nodes.push(src);
  g.gain.exponentialRampToValueAtTime(level, t + 0.08);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const e = ac.currentTime;
    g.gain.cancelScheduledValues(e);
    g.gain.setValueAtTime(level, e);
    g.gain.exponentialRampToValueAtTime(0.0001, e + 0.15);
    nodes.forEach(n => n.stop(e + 0.2));
  };
}

export const sfx = {
  tap: () => tone(700, 0.08, { type: 'triangle', vol: 0.2 }),
  pop: () => tone(520, 0.15, { to: 1040, vol: 0.3 }),
  squish: () => {
    noise(0.14, { freq: 700, q: 2, vol: 0.5, to: 400 });
    tone(260, 0.12, { to: 160, vol: 0.12 });
  },
  bubble: () => tone(500 + Math.random() * 700, 0.07, { to: 1400 + Math.random() * 500, vol: 0.15 }),
  splat: () => {
    noise(0.3, { freq: 350, q: 1.2, vol: 0.8, to: 120 });
    tone(160, 0.25, { to: 60, vol: 0.25 });
  },
  squeak: () => tone(1400 + Math.random() * 600, 0.09, { type: 'triangle', to: 2200, vol: 0.08 }),
  sparkle: () => [0, 1, 2, 3, 4].forEach(i => tone(1300 + Math.random() * 1600, 0.25, { vol: 0.12, at: i * 0.07 })),
  ta_da: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.25, at: i * 0.09 }));
    tone(1568, 0.6, { vol: 0.12, at: 0.4 });
  },
  vroom: () => {
    tone(70, 0.9, { type: 'sawtooth', vol: 0.12, to: 190 });
    tone(73, 0.9, { type: 'square', vol: 0.05, to: 180 });
  },
  lift: () => {
    tone(90, 1.1, { type: 'sawtooth', vol: 0.1, to: 150 });
    noise(1.1, { freq: 3000, q: 0.5, vol: 0.12 });
  },
  clank: () => {
    tone(1250, 0.12, { type: 'square', vol: 0.06 });
    tone(1860, 0.2, { vol: 0.12, at: 0.01 });
    noise(0.07, { freq: 4000, q: 2, vol: 0.3 });
  },
  pump: () => {
    noise(0.28, { freq: 1300, q: 0.9, vol: 0.5, to: 2200 });
    tone(220, 0.2, { to: 420, vol: 0.08 });
  },
  deflate: () => {
    for (let i = 0; i < 8; i++) tone(300 - i * 25, 0.12, { type: 'sawtooth', vol: 0.1, at: i * 0.09 });
    noise(0.8, { freq: 1800, q: 0.8, vol: 0.35, to: 500 });
  },
  boing: () => tone(300, 0.4, { to: 900, vol: 0.25 }),
  honk: () => {
    tone(392, 0.16, { type: 'triangle', vol: 0.32 });
    tone(370, 0.16, { type: 'square', vol: 0.06 });
    tone(392, 0.22, { type: 'triangle', vol: 0.32, at: 0.22 });
    tone(370, 0.22, { type: 'square', vol: 0.06, at: 0.22 });
  },
  quack: () => {
    [0, 0.22].forEach(at => {
      tone(620, 0.16, { type: 'sawtooth', vol: 0.12, to: 380, at });
      noise(0.14, { freq: 900, q: 3, vol: 0.25, at });
    });
  },
  moo: () => {
    tone(150, 1.0, { type: 'sawtooth', vol: 0.14, to: 120 });
    tone(152, 1.0, { type: 'triangle', vol: 0.2, to: 118 });
  },
  toot: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.4 : 0.14, { type: 'square', vol: 0.08, at: i * 0.13 })),
  siren: () => [0, 1, 2, 3].forEach(i => tone(i % 2 ? 620 : 830, 0.32, { type: 'triangle', vol: 0.2, at: i * 0.32 })),
  swish: () => noise(0.35, { freq: 5000, q: 0.7, vol: 0.45, to: 2500 }),
  whirr: () => { for (let i = 0; i < 16; i++) noise(0.05, { at: i * 0.06, freq: 900, q: 1, vol: 0.35 }); },
  rocket: () => {
    noise(1.3, { freq: 500, q: 0.6, vol: 0.7, to: 2400 });
    tone(90, 1.2, { type: 'sawtooth', vol: 0.12, to: 500 });
  },
  gloop: () => {
    tone(260, 0.3, { to: 90, vol: 0.3 });
    noise(0.3, { freq: 600, q: 2, vol: 0.4, at: 0.1, to: 200 });
  },
  sticker: () => {
    noise(0.06, { freq: 6000, q: 1, vol: 0.25 });
    tone(880, 0.12, { to: 1320, vol: 0.18, at: 0.03 });
  },
  peel: () => noise(0.18, { freq: 5000, q: 0.8, vol: 0.3, to: 9000 }),
  glug: () => {
    tone(200, 0.16, { to: 120, vol: 0.28 });
    noise(0.12, { freq: 400, q: 3, vol: 0.3 });
  },
  ding: () => {
    tone(1318, 0.6, { vol: 0.2 });
    tone(1760, 0.8, { vol: 0.14, at: 0.12 });
  },
  shutter: () => {
    noise(0.04, { freq: 3000, q: 1, vol: 0.6 });
    noise(0.05, { freq: 2200, q: 1, vol: 0.5, at: 0.09 });
  },
  beep: i => tone(660 + (i % 3) * 220, 0.18, { type: 'triangle', vol: 0.22 }),
  drip: () => tone(900 + Math.random() * 500, 0.08, { to: 300, vol: 0.12 }),
  whoosh: () => noise(0.5, { freq: 800, q: 0.6, vol: 0.4, to: 3000 }),
};

export const HORNS = { honk: sfx.honk, quack: sfx.quack, moo: sfx.moo, toot: sfx.toot };

// A cheerful little radio tune, made up as it plays.
let music = null;
export function toggleMusic() {
  if (!ac) return false;
  if (music) {
    clearInterval(music);
    music = null;
    return false;
  }
  const chords = [[262, 330, 392], [196, 247, 294], [220, 262, 330], [175, 220, 262]];
  const scale = [523, 587, 659, 784, 880, 1047];
  let step = 0;
  let note = 2;
  music = setInterval(() => {
    const chord = chords[Math.floor(step / 8) % 4];
    if (step % 4 === 0) chord.forEach(f => tone(f, 0.5, { type: 'triangle', vol: 0.06 }));
    if (step % 2 === 0) tone(chord[0] / 2, 0.2, { type: 'triangle', vol: 0.12 });
    if (Math.random() < 0.8) {
      note = Math.max(0, Math.min(scale.length - 1, note + Math.floor(Math.random() * 3) - 1));
      tone(scale[note], 0.18, { type: 'square', vol: 0.035 });
    }
    step++;
  }, 220);
  return true;
}
export const musicOn = () => !!music;
