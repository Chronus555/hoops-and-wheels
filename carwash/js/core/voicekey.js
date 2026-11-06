// Shared by the app and tools/voice: how spoken text is split and matched to
// pre-recorded clips. Keep both sides using these exact rules.

export function splitSentences(text) {
  return (String(text).replace(/…/g, '... ').match(/[^.!?]+[.!?]*/g) || [])
    .map(s => s.trim())
    .filter(s => /[a-z0-9]/i.test(s));
}

export function normKey(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/(^|\s)[-']+|[-']+(\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Stable short file name for a clip key.
export function clipFile(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}.mp3`;
}
