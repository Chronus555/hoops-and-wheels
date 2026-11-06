// Tiny screen switcher. Each screen gets a ctx whose wait() throws ABORT once the
// child has left the screen, so long async game loops stop cleanly.

import { stopSpeech, clearPrompt } from './speech.js';
import { sleep } from './util.js';

export const ABORT = Symbol('abort');
const screens = {};
let token = 0;
let cleanups = [];
let current = '';

export const register = (name, mount) => { screens[name] = mount; };
export const currentScreen = () => current;

export function go(name, params = {}) {
  const my = ++token;
  stopSpeech();
  clearPrompt();
  for (const fn of cleanups.splice(0)) {
    try { fn(); } catch (e) { console.error(e); }
  }
  current = name;
  const root = document.getElementById('app');
  root.innerHTML = '';
  root.className = `screen-${name}`;
  const alive = () => my === token;
  const ctx = {
    root,
    params,
    alive,
    onCleanup: fn => cleanups.push(fn),
    async wait(p) {
      let r;
      try {
        r = await (typeof p === 'number' ? sleep(p) : p);
      } catch (e) {
        if (!alive()) throw ABORT;
        throw e;
      }
      if (!alive()) throw ABORT;
      return r;
    },
    run(fn) {
      fn().catch(e => { if (e !== ABORT) console.error(e); });
    },
  };
  screens[name](ctx);
}
