// Play-session limit: when time is up the round finishes, then the garage "closes"
// for an hour (a grown-up can reopen it).

import { getState, update } from './store.js';

const REST_MS = 60 * 60 * 1000;
let startedAt = Date.now();
let greeted = false;

export function startSession() { startedAt = Date.now(); }

export function sessionOver() {
  const m = getState().settings.sessionMinutes;
  return m > 0 && Date.now() - startedAt >= m * 60000;
}

export const isResting = () => Date.now() < getState().restUntil;

export function beginRest() {
  update(s => { s.restUntil = Date.now() + REST_MS; });
}

export function endRest() {
  update(s => { s.restUntil = 0; });
  startSession();
}

export function firstGreeting() {
  const first = !greeted;
  greeted = true;
  return first;
}
