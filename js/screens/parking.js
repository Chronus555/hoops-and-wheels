// Parking Lot: hear a number or letter, then drag (or tap) the car into that spot.
// Level 1 shows the answer on the car so it's a matching game first.

import { skillLevel, recordAnswer, pickTarget, nameLetters } from '../store.js';
import { carSVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { ALPHABET, LETTER_NAMES, STARTER_LETTERS, COLORS } from '../data.js';
import { html, pick, range, sampleExcept, shuffle } from '../util.js';

const CARS = 5;

// The same lot runs as Parking Lot (numbers) in the Numbers world and as
// Letter Parking in the Letters world.
export function parkingScreen(ctx, focus = 'numbers') {
  const game = focus === 'letters' ? 'letterpark' : 'parking';
  const level = skillLevel(game);
  const bayCount = [3, 4, 5][level - 1];
  const modes = focus === 'numbers'
    ? Array(CARS).fill('num')
    : level === 3 ? ['upper', 'lower', 'upper', 'lower', 'lower'] : Array(CARS).fill('upper');
  const numbers = level === 1 ? range(1, 5) : level === 2 ? range(0, 10) : range(0, 20);
  const uppers = level === 1 ? [...new Set([...nameLetters(), ...STARTER_LETTERS])] : ALPHABET;

  function itemsFor(mode) {
    if (mode === 'num') return numbers.map(n => ({ key: `num:${n}`, label: String(n), spoken: String(n) }));
    if (mode === 'upper') return uppers.map(L => ({ key: `letter:${L}`, label: L, spoken: `the letter ${LETTER_NAMES[L]}` }));
    return ALPHABET.map(L => ({ key: `lower:${L.toLowerCase()}`, label: L.toLowerCase(), spoken: `little ${LETTER_NAMES[L]}` }));
  }

  topBar(ctx);
  const view = html(`<div class="stage parking">
    <div class="lot"></div>
    <div class="road"><div class="road-line"></div></div>
  </div>`);
  ctx.root.append(view);
  const lot = view.querySelector('.lot');
  const road = view.querySelector('.road');

  let car = null;
  let parked = false;
  let answer = null; // resolver for the current car's choice

  function carSize() {
    return Math.min(road.getBoundingClientRect().height * 1.5, 230);
  }

  function homePos() {
    const v = view.getBoundingClientRect();
    const r = road.getBoundingClientRect();
    const w = carSize();
    const h = (w * 70) / 120;
    return { x: r.left - v.left + (r.width - w) / 2, y: r.top - v.top + (r.height - h) / 2, w };
  }

  function bayPos(bay) {
    const v = view.getBoundingClientRect();
    const s = bay.querySelector('.spot').getBoundingClientRect();
    const w = Math.min(s.width * 0.92, carSize());
    const h = (w * 70) / 120;
    return { x: s.left - v.left + (s.width - w) / 2, y: s.top - v.top + Math.max(0, (s.height - h) / 2), w };
  }

  function setCar({ x, y, w }, animate) {
    car.classList.toggle('anim', animate);
    car.style.left = `${x}px`;
    car.style.top = `${y}px`;
    car.style.width = `${w}px`;
  }

  async function drive(pos) {
    car.classList.add('driving');
    setCar(pos, true);
    await ctx.wait(650);
    car.classList.remove('driving');
  }

  const onResize = () => { if (car && !parked) setCar(homePos(), false); };
  window.addEventListener('resize', onResize);
  ctx.onCleanup(() => window.removeEventListener('resize', onResize));

  lot.addEventListener('click', e => {
    const bay = e.target.closest('.bay');
    if (bay && answer) answer([...lot.children].indexOf(bay));
  });

  function enableDrag() {
    let start = null;
    car.addEventListener('pointerdown', e => {
      if (!answer) return;
      const rect = car.getBoundingClientRect();
      const v = view.getBoundingClientRect();
      start = { px: e.clientX, py: e.clientY, x: rect.left - v.left, y: rect.top - v.top, w: rect.width };
      car.setPointerCapture(e.pointerId);
      car.classList.add('dragging');
      car.classList.remove('anim');
    });
    car.addEventListener('pointermove', e => {
      if (!start) return;
      car.style.left = `${start.x + e.clientX - start.px}px`;
      car.style.top = `${start.y + e.clientY - start.py}px`;
    });
    const end = e => {
      if (!start) return;
      const moved = Math.hypot(e.clientX - start.px, e.clientY - start.py);
      start = null;
      car.classList.remove('dragging');
      const bays = [...lot.children];
      const hit = bays.findIndex(b => {
        const r = b.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (hit >= 0 && answer) answer(hit);
      else {
        drive(homePos()).catch(() => {});
        if (moved < 12) setPrompt(currentPrompt);
      }
    };
    car.addEventListener('pointerup', end);
    car.addEventListener('pointercancel', end);
  }

  let currentPrompt = '';
  let lastKey = '';

  async function playCar(i) {
    const mode = modes[i];
    const items = itemsFor(mode);
    const targetKey = pickTarget(items.map(x => x.key), lastKey);
    lastKey = targetKey;
    const target = items.find(x => x.key === targetKey);
    const bays = shuffle([target, ...sampleExcept(items, bayCount - 1, [target])]);
    lot.innerHTML = bays.map(b => `<button class="bay"><div class="sign ${mode}">${b.label}</div><div class="spot"></div></button>`).join('');
    const bayEls = [...lot.children];

    parked = false;
    car = html(`<div class="park-car">${carSVG(pick(COLORS).hex, { label: level === 1 ? target.label : '' })}</div>`);
    view.append(car);
    const home = homePos();
    setCar({ ...home, x: -home.w - 20 }, false);
    void car.offsetWidth;
    sfx.vroom();
    await drive(home);
    enableDrag();

    currentPrompt = mode === 'num' ? `Park in spot ${target.spoken}!` : `Park at ${target.spoken}!`;
    setPrompt(i === 0 ? `${focus === 'letters' ? 'Letter parking' : 'Parking lot'}! Drag the car to the right spot. ${currentPrompt}` : currentPrompt);

    let misses = 0;
    for (;;) {
      const idx = await ctx.wait(new Promise(res => { answer = res; }));
      answer = null;
      clearPrompt();
      if (bays[idx] === target) {
        parked = true;
        await drive(bayPos(bayEls[idx]));
        sfx.honk();
        bayEls[idx].classList.add('done');
        recordAnswer(target.key, misses === 0);
        await ctx.wait(say(`${target.spoken.replace('the letter ', '')}! ${praise()}`));
        break;
      }
      misses++;
      sfx.oops();
      bayEls[idx].classList.add('nope');
      setTimeout(() => bayEls[idx].classList.remove('nope'), 500);
      await drive(homePos());
      if (misses >= 2) bayEls[bays.indexOf(target)].classList.add('glow');
      setPrompt(`That's ${bays[idx].spoken}. ${currentPrompt}`);
    }

    car.classList.add('leave');
    await ctx.wait(400);
    car.remove();
    car = null;
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let i = 0; i < CARS; i++) {
      if (await playCar(i)) firstTries++;
    }
    finishRound(game, firstTries / CARS);
  });
}
