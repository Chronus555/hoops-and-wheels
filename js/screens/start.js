import { go } from '../router.js';
import { getState } from '../store.js';
import { carSVG, ballSVG } from '../art.js';
import { unlockAudio, sfx } from '../sound.js';
import { primeSpeech } from '../speech.js';
import { startSession } from '../session.js';
import { html } from '../util.js';

// One big button: the first tap is what lets iPad play sound and speech.
export function startScreen(ctx) {
  const view = html(`<div class="start">
    <h1 class="logo">Hoops <span>&amp;</span> Wheels</h1>
    <button class="play-btn" aria-label="Start"><span></span></button>
    <div class="start-road">
      <div class="start-car">${carSVG(getState().carColor)}</div>
      <div class="start-ball">${ballSVG()}</div>
    </div>
  </div>`);
  ctx.root.append(view);
  view.querySelector('.play-btn').addEventListener('click', () => {
    unlockAudio();
    primeSpeech();
    startSession();
    sfx.vroom();
    go('home');
  });
}
