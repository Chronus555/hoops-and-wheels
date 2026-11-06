// Animal Band: the band plays a short tune, he plays it back (like Simon).
// Remembering and repeating a growing sequence trains working memory, which
// predicts school readiness as strongly as early math or reading.

import { skillLevel, recordAnswer } from '../store.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { BAND } from '../data.js';
import { html, rand } from '../util.js';

const TUNES = 5;

export function bandScreen(ctx) {
  const level = skillLevel('band');
  const startLen = level + 1;
  let len = startLen;

  topBar(ctx, { center: '<div class="tune-dots"></div>' });
  const dots = ctx.root.querySelector('.tune-dots');
  const view = html(`<div class="stage band-game">
    <div class="pads">${BAND.map((b, i) => `<button class="pad" data-i="${i}" style="--c:${b.color}"><span>${b.pic}</span></button>`).join('')}</div>
  </div>`);
  ctx.root.append(view);
  const pads = [...view.querySelectorAll('.pad')];
  let listening = false;
  let onPad = null;

  function flash(i, ms = 420) {
    sfx.note(BAND[i].freq);
    pads[i].classList.add('lit');
    setTimeout(() => pads[i].classList.remove('lit'), ms);
  }

  pads.forEach((p, i) => p.addEventListener('pointerdown', () => {
    if (!listening) return;
    flash(i, 250);
    onPad?.(i);
  }));

  async function play(seq) {
    listening = false;
    view.classList.add('playing');
    await ctx.wait(500);
    for (const i of seq) {
      flash(i);
      await ctx.wait(620);
    }
    view.classList.remove('playing');
  }

  function showDots(n, filled) {
    dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  }

  // Resolves true when he plays the whole tune back correctly, false on a slip.
  function listen(seq) {
    return new Promise(resolve => {
      let k = 0;
      showDots(seq.length, 0);
      listening = true;
      onPad = i => {
        if (i !== seq[k]) {
          listening = false;
          onPad = null;
          resolve(false);
          return;
        }
        k++;
        showDots(seq.length, k);
        if (k === seq.length) {
          listening = false;
          onPad = null;
          resolve(true);
        }
      };
    });
  }

  ctx.run(async () => {
    await ctx.wait(say('Animal band! Listen to the band, then play it back!'));
    let firstTries = 0;
    for (let t = 0; t < TUNES; t++) {
      let seq = Array.from({ length: len }, () => rand(0, BAND.length - 1));
      let misses = 0;
      showDots(seq.length, 0);
      await play(seq);
      for (;;) {
        setPrompt('Your turn!');
        const ok = await ctx.wait(listen(seq));
        clearPrompt();
        if (ok) break;
        misses++;
        sfx.oops();
        // Two slips: make the tune one note shorter so he can still finish it.
        if (misses >= 2 && seq.length > 2) seq = seq.slice(0, -1);
        await ctx.wait(say('Oops! Listen again.'));
        showDots(seq.length, 0);
        await play(seq);
      }
      recordAnswer(`band:${seq.length}`, misses === 0);
      if (misses === 0) firstTries++;
      sfx.chime();
      pads.forEach(p => p.classList.add('dance'));
      await ctx.wait(say(`${praise()} You remembered ${seq.length} notes!`));
      pads.forEach(p => p.classList.remove('dance'));
      len = misses === 0 ? Math.min(len + 1, startLen + 3) : Math.max(2, seq.length);
    }
    finishRound('band', firstTries / TUNES);
  });
}
