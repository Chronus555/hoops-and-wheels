// Big & Small: find the biggest or smallest, then line things up by size.
// Comparing and ordering by size is early measurement (and uses "-est" words).

import { skillLevel, recordAnswer } from '../store.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise, flyTo } from '../ui.js';
import { finishRound } from '../round.js';
import { SIZE_THINGS } from '../data.js';
import { html, pick, sampleExcept, shuffle, waitAny } from '../util.js';

const QUESTIONS = 5;

export function sizeScreen(ctx) {
  const level = skillLevel('size');
  const things = sampleExcept(SIZE_THINGS, QUESTIONS);

  topBar(ctx);
  const view = html(`<div class="stage size-game">
    <div class="size-row"></div>
    <div class="lineup"></div>
  </div>`);
  ctx.root.append(view);
  const row = view.querySelector('.size-row');
  const lineup = view.querySelector('.lineup');

  function render(thing, sizes) {
    const order = shuffle(sizes.map((s, i) => i));
    row.innerHTML = order.map(i => `<button class="size-item" data-size="${i}" style="font-size:${sizes[i]}px">${thing.pic}</button>`).join('');
    return [...row.children];
  }

  // "Tap the biggest bear!"
  async function pickQuestion(thing, q) {
    const sizes = level === 3 ? [60, 84, 108, 136] : [56, 96, 140];
    const btns = render(thing, sizes);
    lineup.innerHTML = '';
    const want = pick(['biggest', 'smallest']);
    const target = want === 'biggest' ? sizes.length - 1 : 0;
    const ask = `Tap the ${want} ${thing.one}!`;
    setPrompt(q === 0 ? `Big and small! ${ask}` : ask);
    let misses = 0;
    for (;;) {
      const k = await ctx.wait(waitAny(btns));
      clearPrompt();
      if (Number(btns[k].dataset.size) === target) {
        btns[k].classList.add('right');
        break;
      }
      misses++;
      sfx.oops();
      btns[k].classList.add('nope');
      setTimeout(() => btns[k].classList.remove('nope'), 500);
      if (misses >= 2) btns.find(b => Number(b.dataset.size) === target).classList.add('glow');
      setPrompt(`Not that one. ${ask}`);
    }
    sfx.chime();
    recordAnswer(`size:${want}`, misses === 0);
    await ctx.wait(say(`Yes! That's the ${want} ${thing.one}! ${praise()}`));
    return misses === 0;
  }

  // "Line them up from smallest to biggest!"
  async function orderQuestion(thing, q) {
    const sizes = level === 3 ? [50, 78, 106, 136] : [56, 96, 140];
    const bigFirst = level === 3 && Math.random() < 0.5;
    const btns = render(thing, sizes);
    lineup.innerHTML = sizes.map(() => '<span class="line-slot"></span>').join('')
      + `<span class="line-arrow">${bigFirst ? 'big ➜ small' : 'small ➜ big'}</span>`;
    const slots = [...lineup.querySelectorAll('.line-slot')];
    const sequence = sizes.map((s, i) => i);
    if (bigFirst) sequence.reverse();
    const from = bigFirst ? 'biggest' : 'smallest';
    const to = bigFirst ? 'smallest' : 'biggest';
    setPrompt(`${q === 0 ? 'Big and small! ' : ''}Line up the ${thing.many} from ${from} to ${to}. Tap the ${from} one first!`);

    let misses = 0;
    for (let step = 0; step < sequence.length; step++) {
      for (;;) {
        const live = btns.filter(b => !b.classList.contains('placed'));
        const k = await ctx.wait(waitAny(live));
        clearPrompt();
        const btn = live[k];
        if (Number(btn.dataset.size) === sequence[step]) {
          const r = slots[step].getBoundingClientRect();
          sfx.step(step);
          await ctx.wait(flyTo(btn, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, { duration: 400, scale: 0.85 }));
          btn.classList.add('placed');
          slots[step].innerHTML = `<span style="font-size:${sizes[sequence[step]] * 0.85}px">${thing.pic}</span>`;
          btns.forEach(b => b.classList.remove('glow'));
          break;
        }
        misses++;
        sfx.oops();
        btn.classList.add('nope');
        setTimeout(() => btn.classList.remove('nope'), 500);
        const want = bigFirst ? 'biggest' : 'smallest';
        if (misses >= 2) btns.find(b => Number(b.dataset.size) === sequence[step]).classList.add('glow');
        setPrompt(`Find the ${want} one that's left!`);
      }
    }
    sfx.chime();
    recordAnswer('size:order', misses === 0);
    await ctx.wait(say(`${praise()} From ${from} to ${to}!`));
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let q = 0; q < things.length; q++) {
      const ordering = level === 2 || (level === 3 && q % 2 === 0);
      const ok = ordering ? await orderQuestion(things[q], q) : await pickQuestion(things[q], q);
      if (ok) firstTries++;
      await ctx.wait(300);
    }
    finishRound('size', firstTries / things.length);
  });
}
