// The friends talk with pre-recorded natural voice clips (tools/voice). Each animal
// plays them at its own speed, so the hippo sounds a little lower than the frog.

import { audioContext, voiceOutput } from './sound.js';
import { normKey, clipFile } from './voicekey.js';
import { FRIENDS } from './friends.js';
import { pick } from './stage.js';

const DIR = 'audio/voice/';
let index = null;
fetch(`${DIR}index.json`).then(r => (r.ok ? r.json() : null)).then(j => { index = j; }).catch(() => {});

const buffers = new Map();
function load(file) {
  if (!buffers.has(file)) {
    const ac = audioContext();
    const p = fetch(DIR + file)
      .then(r => { if (!r.ok) throw new Error(file); return r.arrayBuffer(); })
      .then(buf => new Promise((res, rej) => ac.decodeAudioData(buf, res, rej)));
    p.catch(() => buffers.delete(file));
    buffers.set(file, p);
  }
  return buffers.get(file);
}

let current = null;
let lastChat = 0;
let token = 0;

export function stopVoice() {
  token++;
  try { current?.stop(); } catch { /* done */ }
  current = null;
}

// Resolves when the clip ends. Missing clips are skipped silently.
export async function say(text, rate = 1) {
  const ac = audioContext();
  if (!ac || !text) return;
  const key = normKey(text);
  const file = index?.[key] || clipFile(key);
  stopVoice();
  const my = token;
  let buffer;
  try {
    buffer = await load(file);
  } catch {
    if (['localhost', '127.0.0.1'].includes(location.hostname)) console.info('[voice] no recording:', text);
    return;
  }
  if (my !== token) return;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  src.connect(voiceOutput());
  src.start();
  current = src;
  await new Promise(r => { src.onended = r; });
}

// A friend says one line, picked at random from a list (a place's LINES group).
// Chatty lines (reactions to continuous actions like spraying) are spaced out so
// they don't pile up.
export function talk(kind, lines, { chatty = false } = {}) {
  const now = performance.now();
  if (chatty && now - lastChat < 3200) return Promise.resolve();
  lastChat = now;
  const list = Array.isArray(lines) ? lines : [lines];
  return say(pick(list), FRIENDS[kind]?.pitch || 1);
}

export function talkText(kind, text) {
  lastChat = performance.now();
  return say(text, FRIENDS[kind]?.pitch || 1);
}

export function preload(texts) {
  if (!audioContext()) return;
  texts.forEach(t => {
    const key = normKey(t);
    const file = index?.[key];
    if (file) load(file).catch(() => {});
  });
}
