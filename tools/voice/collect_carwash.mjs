// Gathers every line the Sudsy Garage drivers say into tools/voice/carwash-lines.json,
// so build_voice.py can record them into carwash/audio/voice/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, EXTRA } from '../../carwash/js/lines.js';
import { normKey } from '../../carwash/js/voicekey.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const phrases = new Map();
for (const text of [...Object.values(LINES).flat(), ...EXTRA]) {
  const key = normKey(text);
  if (key && !phrases.has(key)) phrases.set(key, text);
}
const lines = [...phrases].map(([key, text]) => ({ key, text })).sort((a, b) => a.key.localeCompare(b.key));
fs.writeFileSync(path.join(ROOT, 'tools/voice/carwash-lines.json'), `${JSON.stringify(lines, null, 1)}\n`);
console.log(`${lines.length} lines`);
