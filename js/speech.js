// Spoken instructions. A pre-reader can't use text, so every prompt is said out loud
// and repeated if the child goes quiet.

import { getState } from './store.js';

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

// Resolves when the sentence finishes (or is cut off by the next one).
// Pitch stays at 1: shifting it makes most voices sound more synthetic.
export function say(text, { rate, pitch = 1 } = {}) {
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
  synth?.cancel();
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
