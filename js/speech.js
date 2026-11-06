// Spoken instructions. A pre-reader can't use text, so every prompt is said out loud
// and repeated if the child goes quiet.

import { getState } from './store.js';
import { audioContext, voiceOutput } from './sound.js';
import { splitSentences, normKey } from './voicekey.js';
import { loadNameBuffer } from './namevoice.js';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
// Apple's novelty voices (and a few very old ones) sound robotic on purpose.
const NOVELTY = /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Shelley|Flo|Eddy|Reed|Sandy|Deranged|Hysterical|Pipe Organ)\b/i;
const FRIENDLY = /\b(Ava|Zoe|Samantha|Allison|Susan|Evan|Nathan|Joelle|Noelle|Tom|Nicky|Aria|Jenny|Ana|Emma|Michelle)\b/i;
let voices = [];

// Higher is more natural: Premium/Enhanced (Apple) and Natural/Online (Microsoft Edge) voices
// are neural and sound far less robotic than the default compact ones.
export function voiceScore(v) {
  const id = `${v.name} ${v.voiceURI}`;
  let s = 0;
  if (NOVELTY.test(v.name)) return -100;
  if (/premium/i.test(id)) s += 100;
  else if (/natural/i.test(id)) s += 90;
  else if (/enhanced/i.test(id)) s += 70;
  else if (/google/i.test(id)) s += 40;
  if (FRIENDLY.test(v.name)) s += 15;
  if (/en[-_]US/i.test(v.lang)) s += 10;
  if (/Microsoft (David|Zira|Mark)\b/i.test(v.name) && !/natural/i.test(id)) s -= 20;
  return s;
}

export function voiceQuality(v) {
  const s = voiceScore(v);
  return s >= 90 ? 'best' : s >= 70 ? 'good' : s <= -50 ? 'silly' : 'basic';
}

function loadVoices() {
  voices = synth ? synth.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)) : [];
}
if (synth) {
  loadVoices();
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
  else synth.onvoiceschanged = loadVoices;
}

export function englishVoices() {
  if (!voices.length) loadVoices();
  return voices;
}

export function rankedVoices() {
  return [...englishVoices()].sort((a, b) => voiceScore(b) - voiceScore(a));
}

function pickVoice() {
  const chosen = getState().settings.voiceName;
  return englishVoices().find(v => v.name === chosen) || rankedVoices()[0] || null;
}

// ---- Recorded voice --------------------------------------------------------------
// Every line the app says was pre-recorded with a natural neural voice
// (tools/voice). A sentence plays as one clip when it exists whole, otherwise
// stitched from phrase and word clips. Only sentences with no recording at all
// fall back to the device's text-to-speech.

const VOICE_DIR = 'audio/voice/';
let clipIndex = null;
let maxWords = 1;
const indexReady = fetch(`${VOICE_DIR}index.json`)
  .then(r => (r.ok ? r.json() : null))
  .then(json => {
    clipIndex = json;
    if (json) maxWords = Math.max(...Object.keys(json).map(k => k.split(' ').length));
  })
  .catch(() => {});

const buffers = new Map();
function loadClip(file) {
  if (!buffers.has(file)) {
    const ac = audioContext();
    const p = fetch(VOICE_DIR + file)
      .then(r => { if (!r.ok) throw new Error(file); return r.arrayBuffer(); })
      .then(buf => new Promise((res, rej) => ac.decodeAudioData(buf, res, rej)));
    p.catch(() => buffers.delete(file));
    buffers.set(file, p);
  }
  return buffers.get(file);
}

let nameBuffer = null;
export async function refreshNameVoice() {
  nameBuffer = await loadNameBuffer(audioContext());
}

// Fewest clips that cover the whole sentence; the child's name uses the grown-up's
// recording, or is skipped if there isn't one. Returns null if a word has no clip.
function planSentence(sentence) {
  const tokens = normKey(sentence).split(' ').filter(Boolean);
  const name = normKey(getState().childName).split(' ').filter(Boolean);
  const n = tokens.length;
  const best = Array(n + 1).fill(null);
  best[n] = [];
  for (let i = n - 1; i >= 0; i--) {
    let choice = null;
    if (name.length && name.every((t, k) => tokens[i + k] === t) && best[i + name.length]) {
      choice = nameBuffer ? [{ name: true }, ...best[i + name.length]] : best[i + name.length];
    }
    for (let len = Math.min(maxWords, n - i); len > 0; len--) {
      const file = clipIndex[tokens.slice(i, i + len).join(' ')];
      const rest = best[i + len];
      if (file && rest && (!choice || rest.length + 1 < choice.length)) choice = [{ file }, ...rest];
    }
    best[i] = choice;
  }
  return best[0];
}

let playId = 0;
let playing = [];
let cancelWait = null;

async function playClips(plan, id, slow) {
  const ac = audioContext();
  const list = await Promise.all(plan.map(p => (p.name ? nameBuffer : loadClip(p.file))));
  if (id !== playId) return;
  if (ac.state !== 'running') ac.resume();
  const rate = slow ? 0.94 : 1;
  let t = ac.currentTime + 0.03;
  for (const buffer of list) {
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    src.connect(voiceOutput());
    src.start(t);
    playing.push(src);
    t += buffer.duration / rate + 0.04;
  }
  await new Promise(resolve => {
    const timer = setTimeout(resolve, (t - ac.currentTime) * 1000);
    cancelWait = () => { clearTimeout(timer); resolve(); };
  });
  if (id === playId) playing = [];
}

// Dev aid: sentences with no recording are listed here (and in the console on localhost).
export const missingLines = new Set();

// Resolves when the whole text has been spoken (or it's cut off by the next say).
export async function say(text, opts = {}) {
  stopSpeech();
  const id = ++playId;
  if (!text) return;
  await indexReady;
  const natural = clipIndex && audioContext() && getState().settings.voiceMode !== 'device';
  const sentences = splitSentences(text);
  // Coverage check used during development: note gaps without actually speaking.
  if (window.__voiceCoverage) {
    sentences.filter(s => !planSentence(s)).forEach(s => missingLines.add(s));
    return;
  }
  for (let s = 0; s < sentences.length && id === playId; s++) {
    const plan = natural ? planSentence(sentences[s]) : null;
    if (plan) {
      try {
        await playClips(plan, id, opts.pitch < 1);
      } catch {
        if (id === playId) await deviceSay(sentences[s], opts);
      }
    } else {
      if (natural) {
        missingLines.add(sentences[s]);
        if (['localhost', '127.0.0.1'].includes(location.hostname)) console.info('[voice] no recording:', sentences[s]);
      }
      if (id === playId) await deviceSay(sentences[s], opts);
    }
    if (s < sentences.length - 1 && id === playId) await new Promise(r => setTimeout(r, 160));
  }
}

// ---- Device text-to-speech (backup) ------------------------------------------

// Pitch stays at 1: shifting it makes most voices sound more synthetic.
function deviceSay(text, { rate, pitch = 1 } = {}) {
  if (!synth || !text) return Promise.resolve();
  synth.cancel();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || 'en-US';
    u.rate = rate ?? getState().settings.voiceRate;
    u.pitch = pitch;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    // iOS sometimes never fires onend, so don't wait forever.
    const timer = setTimeout(finish, 2000 + (text.length * 110) / u.rate);
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}

export function stopSpeech() {
  playId++;
  synth?.cancel();
  playing.forEach(src => { try { src.stop(); } catch { /* already done */ } });
  playing = [];
  cancelWait?.();
  cancelWait = null;
}

// iOS only allows speech that starts from a tap, so call this inside the first tap.
export function primeSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

let prompt = '';
let idleTimer = 0;
let repeats = 0;
const IDLE_MS = 12000;
const MAX_REPEATS = 2;

export function setPrompt(text) {
  prompt = text;
  repeats = 0;
  armIdle();
  return say(text);
}

export function repeatPrompt() {
  if (!prompt) return Promise.resolve();
  repeats = 0;
  armIdle();
  return say(prompt);
}

export function clearPrompt() {
  prompt = '';
  clearTimeout(idleTimer);
}

function armIdle() {
  clearTimeout(idleTimer);
  if (!prompt) return;
  idleTimer = setTimeout(() => {
    if (repeats++ >= MAX_REPEATS) return;
    say(prompt);
    armIdle();
  }, IDLE_MS);
}

document.addEventListener('pointerdown', () => { repeats = 0; armIdle(); }, true);
