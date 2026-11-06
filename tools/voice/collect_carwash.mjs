// Gathers every line the Sudsy Town friends say into tools/voice/carwash-lines.json,
// so build_voice.py can record them into carwash/audio/voice/. Each place (and the
// town) has a lines.js exporting LINES (groups of lines) and optionally EXTRA.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normKey } from '../../carwash/js/core/voicekey.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const JS = path.join(ROOT, 'carwash/js');
const files = [path.join(JS, 'town/lines.js'), ...fs.readdirSync(path.join(JS, 'places')).map(p => path.join(JS, 'places', p, 'lines.js'))]
  .filter(f => fs.existsSync(f));

const phrases = new Map();
for (const file of files) {
  const { LINES = {}, EXTRA = [] } = await import(pathToFileURL(file).href);
  for (const text of [...Object.values(LINES).flat(), ...EXTRA]) {
    const key = normKey(text);
    if (key && !phrases.has(key)) phrases.set(key, text);
  }
}
const lines = [...phrases].map(([key, text]) => ({ key, text })).sort((a, b) => a.key.localeCompare(b.key));
fs.writeFileSync(path.join(ROOT, 'tools/voice/carwash-lines.json'), `${JSON.stringify(lines, null, 1)}\n`);
console.log(`${lines.length} lines from ${files.length} files`);
