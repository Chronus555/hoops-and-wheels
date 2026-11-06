// Gets Sudsy Town ready to publish:
//  1. writes carwash/files.json, the list of every app file the service worker saves
//     for offline play (voice clips are listed separately in audio/voice/index.json);
//  2. bumps VERSION in carwash/sw.js so iPads pick up the new version.
// Run with: npm run carwash:release (which also records any new voice lines first).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'carwash');
const SKIP = new Set(['sw.js', 'files.json', 'audio/voice/meta.json']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : [path.relative(APP, full).split(path.sep).join('/')];
  });
}
const files = walk(APP).filter(f => !SKIP.has(f) && !/^audio\/voice\/.+\.mp3$/.test(f)).sort();
fs.writeFileSync(path.join(APP, 'files.json'), `${JSON.stringify(files, null, 1)}\n`);

const swPath = path.join(APP, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');
const next = sw.replace(/const VERSION = 'sg-v(\d+)';/, (_, n) => `const VERSION = 'sg-v${Number(n) + 1}';`);
fs.writeFileSync(swPath, next);
console.log(`${files.length} files listed; ${next.match(/sg-v\d+/)[0]}`);
