// Build It!: make a rocket, robot or car one shape at a time, then make it go.
// The big payoff at the end (countdown and blast-off, dance, drive away) is the reason to
// finish; the countdown also practices counting backwards from 5.

import { skillLevel, recordAnswer } from '../store.js';
import { shapeMarkup, shapeSVG, shade } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise, flyTo } from '../ui.js';
import { finishRound } from '../round.js';
import { BLUEPRINTS, SHAPES, BASIC_SHAPES, ALL_SHAPES } from '../data.js';
import { html, rand, sampleExcept, shuffle, waitAny, waitClick } from '../util.js';

const ATTRIBUTES = {
  triangle: 'the shape with 3 sides',
  star: 'the shape with 5 points',
  circle: 'the round shape with no corners',
  square: 'the shape with 4 sides that are all the same',
  rectangle: 'the shape with 2 long sides and 2 short sides',
};
// Shapes that would also fit a description (or look too alike), so they're never distractors.
const CONFUSABLE = {
  circle: ['oval'], oval: ['circle'], square: ['rectangle', 'diamond'],
  rectangle: ['square', 'diamond'], diamond: ['square'],
};
const article = name => (/^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`);

let nextBlueprint = 0;

export function buildScreen(ctx) {
  const level = skillLevel('build');
  const bp = BLUEPRINTS[nextBlueprint++ % BLUEPRINTS.length];
  const shapeOf = slot => (level >= 2 && slot.fancy) || slot.shape;
  const pool = level === 1 ? BASIC_SHAPES : ALL_SHAPES;
  const filled = new Set();
  let current = -1;

  topBar(ctx);
  const view = html(`<div class="stage build">
    <div class="board-wrap"><div class="board"></div><div class="countdown"></div></div>
    <div class="tray"></div>
  </div>`);
  ctx.root.append(view);
  const board = view.querySelector('.board');
  const tray = view.querySelector('.tray');
  const countdown = view.querySelector('.countdown');

  function drawBoard() {
    const flame = bp.payoff === 'launch'
      ? `<g class="flame"><path d="M160 290 Q200 400 240 290Z" fill="#ffbe0b"/><path d="M178 290 Q200 352 222 290Z" fill="#e63946"/></g>`
      : '';
    const slots = bp.slots.map((s, i) => {
      const type = shapeOf(s);
      if (filled.has(i)) {
        return `<g data-slot="${i}">${shapeMarkup(type, s.x, s.y, s.w, s.h,
          `fill="${s.color}" stroke="${shade(s.color, -70)}" stroke-width="4" stroke-linejoin="round"`)}</g>`;
      }
      const cls = i === current ? 'slot current' : 'slot';
      // Level 1 shows the shape's outline; later levels hide it so the name is the clue.
      const outline = level === 1
        ? shapeMarkup(type, s.x, s.y, s.w, s.h, 'fill="rgba(255,255,255,.08)" stroke-width="4" stroke-dasharray="9 7"')
        : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="12" fill="rgba(255,255,255,.06)" stroke-width="4" stroke-dasharray="9 7"/>
           ${i === current ? `<text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 12}" text-anchor="middle" font-size="34" font-weight="900" fill="#ffd166">?</text>` : ''}`;
      return `<g data-slot="${i}" class="${cls}">${outline}</g>`;
    }).join('');
    board.innerHTML = `<svg class="blueprint ${bp.id}" viewBox="0 0 400 400">${flame}${slots}</svg>`;
  }

  function pieceSize(type, slot, isAnswer) {
    if (isAnswer) return [slot.w, slot.h];
    if (type === 'rectangle') return [120, 70];
    if (type === 'oval') return [110, 72];
    return [100, 100];
  }

  async function placeSlot(i) {
    const slot = bp.slots[i];
    const type = shapeOf(slot);
    current = i;
    drawBoard();

    const others = sampleExcept(pool, 2, [type, ...(CONFUSABLE[type] || [])]);
    const options = shuffle([type, ...others]);
    tray.innerHTML = options.map(t => {
      const [w, h] = pieceSize(t, slot, t === type);
      return `<button class="piece" aria-label="${t}">${shapeSVG(t, t === type ? slot.color : SHAPES[t].color, w, h)}</button>`;
    }).join('');
    const pieces = [...tray.children];

    const described = level === 3 && ATTRIBUTES[type] && Math.random() < 0.5;
    const ask = described ? `Find ${ATTRIBUTES[type]}!` : `Find the ${type}!`;
    setPrompt(filled.size === 0 ? `Let's build a ${bp.name}! ${ask}` : ask);

    let misses = 0;
    for (;;) {
      const k = await ctx.wait(waitAny(pieces));
      clearPrompt();
      if (options[k] === type) {
        const target = board.querySelector(`[data-slot="${i}"]`).getBoundingClientRect();
        const svg = pieces[k].querySelector('svg');
        const scale = Math.max(0.3, target.width / svg.getBoundingClientRect().width);
        sfx.pop();
        await ctx.wait(flyTo(svg, { x: target.left + target.width / 2, y: target.top + target.height / 2 }, { duration: 500, scale }));
        filled.add(i);
        current = -1;
        drawBoard();
        sfx.chime();
        recordAnswer(`shape:${type}`, misses === 0);
        await ctx.wait(say(described ? `Yes! The ${type}! ${praise()}` : `${type}! ${praise()}`));
        return misses === 0;
      }
      misses++;
      sfx.oops();
      pieces[k].classList.add('nope');
      setTimeout(() => pieces[k].classList.remove('nope'), 500);
      if (misses >= 2) pieces[options.indexOf(type)].classList.add('glow');
      setPrompt(`That's ${article(options[k])}. ${ask}`);
    }
  }

  async function payoff() {
    tray.innerHTML = '';
    view.classList.add('finale');
    const svg = board.querySelector('svg');
    setPrompt({
      launch: 'Your rocket is ready! Tap it to blast off!',
      dance: 'Your robot is ready! Tap it to make it dance!',
      drive: 'Your car is ready! Tap it to drive!',
    }[bp.payoff]);
    board.classList.add('ready-go');
    await ctx.wait(waitClick(board));
    board.classList.remove('ready-go');
    clearPrompt();

    if (bp.payoff === 'launch') {
      await ctx.wait(say('Count down with me!'));
      for (let n = 5; n >= 1; n--) {
        countdown.textContent = n;
        countdown.classList.remove('show');
        void countdown.offsetWidth;
        countdown.classList.add('show');
        sfx.beep(n);
        await ctx.wait(say(String(n)));
        await ctx.wait(250);
      }
      countdown.textContent = '';
      sfx.rumble();
      svg.classList.add('launching');
      await ctx.wait(say('Blast off!'));
      await ctx.wait(1400);
    } else if (bp.payoff === 'dance') {
      svg.classList.add('dancing');
      for (let i = 0; i < 8; i++) {
        sfx.beep(i);
        await ctx.wait(rand(200, 300));
      }
      await ctx.wait(say('Beep boop! Dance party!'));
    } else {
      sfx.vroom();
      svg.classList.add('driving-off');
      await ctx.wait(say('Vroom vroom! Bye bye!'));
      await ctx.wait(600);
    }
  }

  ctx.run(async () => {
    drawBoard();
    let firstTries = 0;
    for (let i = 0; i < bp.slots.length; i++) {
      if (await placeSlot(i)) firstTries++;
    }
    await payoff();
    finishRound('build', firstTries / bp.slots.length);
  });
}
