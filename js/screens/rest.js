import { go } from '../router.js';
import { getState, childName } from '../store.js';
import { isResting, beginRest, endRest } from '../session.js';
import { carSVG } from '../art.js';
import { say } from '../speech.js';
import { holdButton, openGate } from '../ui.js';
import { html } from '../util.js';

// A gentle, built-in stopping point instead of an endless loop.
export function restScreen(ctx) {
  if (!isResting()) beginRest();
  const view = html(`<div class="rest">
    <button class="lock-btn rest-lock" aria-label="Grown-ups: press and hold">🔒</button>
    <div class="moon">🌙</div>
    <div class="zzz"><span>Z</span><span>z</span><span>z</span></div>
    <div class="rest-garage">
      <div class="garage-door"></div>
      <div class="sleep-car">${carSVG(getState().carColor)}</div>
    </div>
  </div>`);
  ctx.root.append(view);
  holdButton(view.querySelector('.rest-lock'), 1500, () => openGate(() => { endRest(); go('home'); }));
  say(`Great playing today, ${childName()}! The garage is closed now, so your car can rest. Let's go play outside!`);
}
