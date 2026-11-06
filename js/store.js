// Everything the app remembers lives here, saved to localStorage on every change.

const KEY = 'hoops-and-wheels';
export const GAMES = [
  'race', 'parking', 'monster',
  'hoop', 'letterpark', 'trace', 'drum', 'blend',
  'build', 'train', 'sort', 'size',
  'band', 'listen',
];

function defaults() {
  return {
    childName: '',
    carColor: '#e63946',
    setupDone: false,
    settings: { sessionMinutes: 10, voiceRate: 0.9, voiceName: '', voiceMode: 'natural' },
    skills: Object.fromEntries(GAMES.map(g => [g, { level: 1, recent: [] }])),
    items: {},      // 'num:4' -> { seen, correct } (correct = right on the first try)
    stickers: [],
    stars: 0,
    days: {},       // 'YYYY-MM-DD' -> { minutes, rounds }
    restUntil: 0,
  };
}

function load() {
  const base = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return {
        ...base,
        ...saved,
        settings: { ...base.settings, ...saved.settings },
        skills: { ...base.skills, ...saved.skills },
      };
    }
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return base;
}

let state = load();

export const getState = () => state;

export function update(fn) {
  fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

export function resetProgress() {
  const { childName, carColor, setupDone, settings } = state;
  state = { ...defaults(), childName, carColor, setupDone, settings };
  update(() => {});
}

export const childName = () => state.childName.trim() || 'superstar';

export function nameLetters() {
  return [...new Set(state.childName.toUpperCase().replace(/[^A-Z]/g, ''))];
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function today(s) {
  return (s.days[todayKey()] ||= { minutes: 0, rounds: 0 });
}

export function addPlayTime(minutes) {
  update(s => { today(s).minutes += minutes; });
}

export function recordAnswer(key, firstTry) {
  update(s => {
    const it = (s.items[key] ||= { seen: 0, correct: 0 });
    it.seen++;
    if (firstTry) it.correct++;
  });
}

export function itemStats(key) {
  return state.items[key] || { seen: 0, correct: 0 };
}

export const skillLevel = game => state.skills[game]?.level || 1;

export function setSkillLevel(game, level) {
  update(s => { s.skills[game] = { level, recent: [] }; });
}

// Two strong rounds in a row moves a game up a level; two rough ones moves it down.
export function recordRound(game, rate) {
  let levelUp = false;
  update(s => {
    today(s).rounds++;
    const sk = s.skills[game];
    sk.recent = [...sk.recent, rate].slice(-2);
    if (sk.recent.length < 2) return;
    if (sk.recent.every(r => r >= 0.8) && sk.level < 3) {
      sk.level++;
      sk.recent = [];
      levelUp = true;
    } else if (sk.recent.every(r => r < 0.5) && sk.level > 1) {
      sk.level--;
      sk.recent = [];
    }
  });
  return { levelUp };
}

export function awardSticker(all) {
  const owned = new Set(state.stickers);
  const left = all.filter(s => !owned.has(s.id));
  if (!left.length) {
    update(s => { s.stars++; });
    return null;
  }
  const sticker = left[Math.floor(Math.random() * left.length)];
  update(s => { s.stickers.push(sticker.id); });
  return sticker;
}

// Favor items the child hasn't seen or tends to miss, and never repeat the last one.
export function pickTarget(keys, avoid) {
  const weights = keys.map(k => {
    if (k === avoid && keys.length > 1) return 0;
    const it = state.items[k];
    if (!it || !it.seen) return 3;
    return 1 + 3 * (1 - it.correct / it.seen);
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}
