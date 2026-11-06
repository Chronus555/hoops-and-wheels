// Clean-up Sort: drag each toy into the box where it belongs (by color, shape or kind).
// Sorting by one rule, then switching rules, builds classification and flexible thinking.

import { skillLevel, recordAnswer } from '../store.js';
import { carSVG, shapeSVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, flyTo, confetti } from '../ui.js';
import { finishRound } from '../round.js';
import { COLORS, SHAPES, BASIC_SHAPES, KINDS } from '../data.js';
import { html, pick, sampleExcept, shuffle } from '../util.js';

const SORT_COLORS = COLORS.filter(c => ['red', 'blue', 'yellow', 'green'].includes(c.name));

function makeRound(level) {
  const rule = level === 1 ? 'color'
    : level === 2 ? pick(['color', 'shape'])
    : pick(['shape', 'kind']);
  const binCount = level === 1 ? 2 : 3;
  const perBin = 3;

  if (rule === 'color') {
    const colors = sampleExcept(SORT_COLORS, binCount);
    return {
      rule,
      intro: 'Clean-up time! Put each car in the garage with the same color.',
      bins: colors.map(c => ({ value: c.name, label: `<span class="bin-swatch" style="--c:${c.hex}"></span>`, say: c.name })),
      items: shuffle(colors.flatMap(c => Array.from({ length: perBin }, () => ({ value: c.name, html: carSVG(c.hex) })))),
      hint: v => `That car is ${v}. Put it in the ${v} garage!`,
    };
  }
  if (rule === 'shape') {
    const shapes = sampleExcept(BASIC_SHAPES, binCount);
    return {
      rule,
      intro: 'Clean-up time! Put each shape in the box with the same shape. Colors don\'t matter!',
      bins: shapes.map(s => ({ value: s, label: shapeSVG(s, '#ffffff'), say: `${s}s` })),
      items: shuffle(shapes.flatMap(s => Array.from({ length: perBin }, () => ({ value: s, html: shapeSVG(s, pick(SORT_COLORS).hex) })))),
      hint: v => `That's a ${v}. Put it in the ${v} box!`,
    };
  }
  const kinds = Object.keys(KINDS);
  return {
    rule,
    intro: 'Clean-up time! Put the animals, the food, and the things that go in the right boxes.',
    bins: kinds.map(k => ({ value: k, label: `<span class="bin-emoji">${KINDS[k].label}</span>`, say: KINDS[k].say })),
    items: shuffle(kinds.flatMap(k => sampleExcept(KINDS[k].items, perBin).map(e => ({ value: k, html: `<span class="toy-emoji">${e}</span>` })))),
    hint: v => `That goes with the ${KINDS[v].say}!`,
  };
}

export function sortScreen(ctx) {
  const level = skillLevel('sort');
  const R = makeRound(level);

  topBar(ctx);
  const view = html(`<div class="stage sort-game">
    <div class="toy-pile">${R.items.map((it, i) => `<button class="toy" data-i="${i}">${it.html}</button>`).join('')}</div>
    <div class="bins">${R.bins.map((b, i) => `<button class="bin" data-i="${i}"><div class="bin-label">${b.label}</div><div class="bin-inside"></div></button>`).join('')}</div>
  </div>`);
  ctx.root.append(view);
  const toys = [...view.querySelectorAll('.toy')];
  const bins = [...view.querySelectorAll('.bin')];

  let selected = null;
  let busy = false;
  let sorted = 0;
  let firstTries = 0;
  const misses = new Map();
  let finish;
  const allDone = new Promise(r => { finish = r; });

  async function drop(toy, binIdx) {
    if (busy) return;
    busy = true;
    const item = R.items[Number(toy.dataset.i)];
    const bin = bins[binIdx];
    toy.classList.remove('selected');
    selected = null;
    clearPrompt();
    if (R.bins[binIdx].value === item.value) {
      const r = bin.getBoundingClientRect();
      sfx.pop();
      await flyTo(toy, { x: r.left + r.width / 2, y: r.top + r.height * 0.65 }, { duration: 420, scale: 0.5 });
      if (!ctx.alive()) return;
      toy.classList.add('gone');
      bin.querySelector('.bin-inside').insertAdjacentHTML('beforeend', `<span class="in-bin">${item.html}</span>`);
      bin.classList.remove('bump');
      void bin.offsetWidth;
      bin.classList.add('bump');
      const m = misses.get(toy) || 0;
      if (m === 0) firstTries++;
      recordAnswer(`sort:${R.rule}`, m === 0);
      sorted++;
      say(R.bins[binIdx].say);
      if (sorted === R.items.length) finish();
    } else {
      const m = (misses.get(toy) || 0) + 1;
      misses.set(toy, m);
      sfx.oops();
      bin.classList.add('nope');
      setTimeout(() => bin.classList.remove('nope'), 500);
      if (m >= 2) {
        bins[R.bins.findIndex(b => b.value === item.value)].classList.add('glow');
        say(R.hint(item.value));
      } else {
        say('Hmm, not that box. Look again!');
      }
    }
    busy = false;
  }

  // Drag a toy onto a box, or tap a toy and then tap a box.
  toys.forEach(toy => {
    let start = null;
    toy.addEventListener('pointerdown', e => {
      if (busy) return;
      start = { x: e.clientX, y: e.clientY };
      toy.setPointerCapture(e.pointerId);
      toy.classList.add('dragging');
    });
    toy.addEventListener('pointermove', e => {
      if (!start) return;
      toy.style.transform = `translate(${e.clientX - start.x}px, ${e.clientY - start.y}px) scale(1.1)`;
    });
    const end = e => {
      if (!start) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      start = null;
      toy.classList.remove('dragging');
      toy.style.transform = '';
      if (moved < 12) {
        toys.forEach(t => t.classList.toggle('selected', t === toy && selected !== toy));
        selected = selected === toy ? null : toy;
        if (selected) sfx.tap();
        return;
      }
      const hit = bins.findIndex(b => {
        const r = b.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (hit >= 0) drop(toy, hit);
    };
    toy.addEventListener('pointerup', end);
    toy.addEventListener('pointercancel', () => { start = null; toy.style.transform = ''; toy.classList.remove('dragging'); });
  });
  bins.forEach((bin, i) => bin.addEventListener('click', () => { if (selected) drop(selected, i); }));

  ctx.run(async () => {
    setPrompt(R.intro);
    await ctx.wait(allDone);
    bins.forEach(b => b.classList.remove('glow'));
    sfx.cheer();
    confetti(ctx.root);
    await ctx.wait(say('All clean! Great sorting!'));
    finishRound('sort', firstTries / R.items.length);
  });
}
