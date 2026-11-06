// Saved on the iPad, one record per place (and one for settings), under
// "sudsy-town:<name>" in localStorage.

const PREFIX = 'sudsy-town:';

export function loadData(name, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) return JSON.parse(raw);
  } catch { /* private mode or broken data */ }
  return fallback;
}

// If the iPad is out of room, shrink() is asked to drop something (it returns false
// when there's nothing left to drop) and saving is tried again.
export function saveData(name, data, shrink = null) {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      localStorage.setItem(PREFIX + name, JSON.stringify(data));
      return true;
    } catch {
      if (!shrink || !shrink()) return false;
    }
  }
  return false;
}

export function clearAll() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX) || k === 'sudsy-garage-v1').forEach(k => localStorage.removeItem(k));
  } catch { /* nothing saved */ }
}

// Grown-up settings and today's play time.
export const settings = loadData('settings', { limit: 0 });
export const saveSettings = () => saveData('settings', settings);

const today = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
export function playTime() {
  const t = loadData('time', null);
  return t && t.day === today() ? t : { day: today(), seconds: 0, extra: 0 };
}
export const savePlayTime = t => saveData('time', t);
