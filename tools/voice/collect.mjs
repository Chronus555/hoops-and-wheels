// Gathers every phrase the app can speak into tools/voice/lines.json, so
// build_voice.py can pre-record each one with a natural voice.
//
// Three sources:
//   1. Text pieces harvested from the game source (string literals and the static
//      parts of template strings). Variable parts are filled from 2 at play time.
//   2. Vocabulary from js/data.js (numbers, letter names, words, foods, ...).
//   3. Whole sentences for the most common short templates, so they sound natural
//      instead of stitched together.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from '../../js/data.js';
import { splitSentences, normKey } from '../../js/voicekey.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCES = [
  ...fs.readdirSync(path.join(ROOT, 'js/screens')).filter(f => f.endsWith('.js') && f !== 'parent.js').map(f => `js/screens/${f}`),
  'js/ui.js',
];

// ---- 1. harvest text pieces from source ---------------------------------------

function extractStrings(src) {
  const out = [];
  let i = 0;
  const readQuoted = q => {
    let s = '';
    i++;
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') { s += src[i + 1]; i += 2; continue; }
      s += src[i++];
    }
    i++;
    return s;
  };
  const skipRegex = () => {
    i++;
    let inClass = false;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '[') inClass = true;
      else if (c === ']') inClass = false;
      else if (c === '/' && !inClass) { i++; break; }
      i++;
    }
  };
  const readTemplate = () => {
    i++;
    let chunk = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { chunk += src[i + 1]; i += 2; continue; }
      if (c === '`') { i++; break; }
      if (c === '$' && src[i + 1] === '{') {
        out.push(chunk);
        chunk = '';
        i += 2;
        readCode(true);
        continue;
      }
      chunk += c;
      i++;
    }
    out.push(chunk);
  };
  // Walks code; inside ${...} stops at the matching brace.
  const readCode = inExpr => {
    let depth = 1;
    let prev = '(';
    while (i < src.length) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
      if (c === "'" || c === '"') { out.push(readQuoted(c)); prev = 'x'; continue; }
      if (c === '`') { readTemplate(); prev = 'x'; continue; }
      if (c === '/' && '(,=:[!&|?{};+'.includes(prev)) { skipRegex(); prev = 'x'; continue; }
      if (inExpr) {
        if (c === '{') depth++;
        if (c === '}' && --depth === 0) { i++; return; }
      }
      if (!/\s/.test(c)) prev = c;
      i++;
    }
  };
  readCode(false);
  return out;
}

const looksSpoken = s => /[a-z]/i.test(s)
  && !/[<>={}#/\\:]|\.js|\bhttps?\b/.test(s)
  && !/(^|\s)\.[a-z]/i.test(s) // CSS selectors
  && !/^[a-z0-9_-]+$/.test(s.trim());

const phrases = new Map(); // key -> text to speak
function add(text, spokenAs) {
  for (const sentence of splitSentences(text)) {
    const key = normKey(sentence);
    if (key && !phrases.has(key)) phrases.set(key, spokenAs ?? sentence.replace(/^[,;\s]+/, ''));
  }
}

for (const file of SOURCES) {
  for (const s of extractStrings(fs.readFileSync(path.join(ROOT, file), 'utf8'))) {
    if (looksSpoken(s)) add(s);
  }
}

// ---- 2. vocabulary --------------------------------------------------------------

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const word = (text, spokenAs) => {
  const key = normKey(text);
  if (key && !phrases.has(key)) phrases.set(key, spokenAs ?? text);
};

range(0, 40).forEach(n => word(String(n), `${n}.`));
// Letter names are spelled phonetically for device voices; record the real letter.
Object.entries(D.LETTER_NAMES).forEach(([L, name]) => word(name, `${L}.`));
D.WORDS.forEach(w => word(w.word));
D.RHYMES.flat().forEach(w => word(w.word));
D.FOODS.forEach(f => { word(f.one); word(f.many); });
D.THINGS.forEach(t => word(t.name));
D.RIDERS.forEach(r => word(r.name));
D.COLORS.forEach(c => word(c.name));
Object.keys(D.SHAPES).forEach(s => { word(s); word(`${s}s`); word(`a ${s}`); word(`an ${s}`); });
D.STICKERS.forEach(s => word(s.name));
Object.values(D.KINDS).forEach(k => word(k.say));
D.SIZE_THINGS.forEach(t => { word(t.one); word(t.many); });
[...D.BEAT_WORDS, ...D.COMPOUNDS].forEach(w => { word(w.word); w.parts.forEach(p => word(p, `${p}.`)); });
D.BAND.forEach(b => word(b.name));
D.PRAISE.forEach(p => word(p));
D.CHALLENGES.forEach(c => add(c.say));
D.WORLDS.forEach(w => word(w.say));
D.BLUEPRINTS.forEach(b => word(b.name));
['superstar', 'beats', 'beat', 'notes', 'stickers', 'sticker', 'little', 'hmm', 'the', 'a', 'an', 'and', 'is', 'than', 'more', 'less',
  'biggest', 'smallest', 'then', 'one time', 'times'].forEach(w => word(w));

// ---- 3. whole sentences for common short templates ---------------------------

const noun = (f, n) => (n === 1 ? f.one : f.many);
range(0, 20).forEach(n => add(`Park in spot ${n}!`));
range(1, 20).forEach(n => add(`You're on ${n}!`));
range(1, 6).forEach(n => add(`You rolled ${n}!`));
range(1, 6).forEach(n => add(`Tap the number ${n}.`));
Object.values(D.LETTER_NAMES).forEach(name => {
  add(`Find the letter ${name}!`, `Find the letter ${Object.keys(D.LETTER_NAMES).find(L => D.LETTER_NAMES[L] === name)}!`);
});
range(1, 10).forEach(n => D.FOODS.forEach(f => add(`Feed me ${n} ${noun(f, n)}!`)));
D.THINGS.forEach(t => add(`Tap the ${t.name}!`));
Object.keys(D.SHAPES).forEach(s => add(`Find the ${s}!`));
D.SIZE_THINGS.forEach(t => ['biggest', 'smallest'].forEach(w => add(`Tap the ${w} ${t.one}!`)));
D.WORDS.forEach(w => add(`${w.word}. What letter does ${w.word} start with?`));
D.RHYMES.flat().forEach(w => add(`What rhymes with ${w.word}?`));
D.BEAT_WORDS.forEach(w => add(`${w.word} has ${w.parts.length} beat${w.parts.length === 1 ? '' : 's'}!`));
[['smallest', 'biggest'], ['biggest', 'smallest']].forEach(([from, to]) => {
  add(`From ${from} to ${to}!`);
  D.SIZE_THINGS.forEach(t => add(`Line up the ${t.many} from ${from} to ${to}.`));
});
[2, 3].forEach(n => add(`Listen carefully, and remember ${n} things.`));
['has', 'from', 'to', 'things', 'remember'].forEach(w => word(w));

const lines = [...phrases].map(([key, text]) => ({ key, text })).sort((a, b) => a.key.localeCompare(b.key));
fs.writeFileSync(path.join(ROOT, 'tools/voice/lines.json'), `${JSON.stringify(lines, null, 1)}\n`);
console.log(`${lines.length} lines`);
