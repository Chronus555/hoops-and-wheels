// Listen & Tap: follow spoken directions with 1, 2 or 3 steps ("Tap the dog, then the star").
// Holding a multi-step direction in mind is exactly what kindergarten asks of him.

import { skillLevel, recordAnswer } from '../store.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { THINGS } from '../data.js';
import { html, sampleExcept, waitAny } from '../util.js';

const QUESTIONS = 5;

export function listenScreen(ctx) {
  const level = skillLevel('listen');
  const steps = level;
  const gridSize = [6, 8, 9][level - 1];

  topBar(ctx, { center: '<div class="step-dots"></div>' });
  const dots = ctx.root.querySelector('.step-dots');
  const view = html(`<div class="stage listen-game"><div class="things count-${gridSize}"></div></div>`);
  ctx.root.append(view);
  const grid = view.querySelector('.things');

  function showDots(filled) {
    dots.innerHTML = Array.from({ length: steps }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  }

  function sentence(targets) {
    const names = targets.map(t => `the ${t.name}`);
    if (names.length === 1) return `Tap ${names[0]}!`;
    return `Tap ${names.slice(0, -1).join(', then ')}, then ${names[names.length - 1]}.`;
  }

  async function question(q) {
    const items = sampleExcept(THINGS, gridSize);
    const targets = sampleExcept(items, steps);
    grid.innerHTML = items.map(t => `<button class="thing">${t.pic}</button>`).join('');
    const btns = [...grid.children];
    const text = sentence(targets);
    showDots(0);
    if (q === 0) await ctx.wait(say(`Listen and tap! Listen carefully${steps > 1 ? `, and remember ${steps} things` : ''}.`));
    setPrompt(text);

    let misses = 0;
    let k = 0;
    while (k < targets.length) {
      const i = await ctx.wait(waitAny(btns));
      clearPrompt();
      if (items[i] === targets[k]) {
        sfx.step(k);
        btns[i].classList.add('right');
        btns.forEach(b => b.classList.remove('glow'));
        k++;
        showDots(k);
        if (misses >= 2 && k < targets.length) btns[items.indexOf(targets[k])].classList.add('glow');
        continue;
      }
      misses++;
      sfx.oops();
      btns[i].classList.add('nope');
      setTimeout(() => btns[i].classList.remove('nope'), 500);
      btns.forEach(b => b.classList.remove('right'));
      k = 0;
      showDots(0);
      if (misses >= 2) btns[items.indexOf(targets[0])].classList.add('glow');
      setPrompt(`Oops! Listen again. ${text}`);
    }
    sfx.chime();
    recordAnswer(`listen:${steps}`, misses === 0);
    await ctx.wait(say(`${praise()} Great listening!`));
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let q = 0; q < QUESTIONS; q++) {
      if (await question(q)) firstTries++;
    }
    finishRound('listen', firstTries / QUESTIONS);
  });
}
