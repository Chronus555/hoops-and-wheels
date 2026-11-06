// Race Track: a numbered board game. Linear number-board games like this are one of the
// best-studied ways to build early number sense: the child counts each step out loud
// while seeing the number line.

import { getState, skillLevel, recordAnswer, childName } from '../store.js';
import { carSVG, dieHTML } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, confetti, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { html, rand, range, sampleExcept, shuffle, waitAny, waitClick } from '../util.js';

const ROW = 10;

function rivalFor(color) {
  return color === '#3a86ff'
    ? { color: '#2a9d8f', name: 'green' }
    : { color: '#3a86ff', name: 'blue' };
}

export function raceScreen(ctx) {
  const level = skillLevel('race');
  const finish = level === 1 ? 10 : 20;
  const maxRoll = [3, 5, 6][level - 1];
  const rivalMax = level === 3 ? 3 : 2;
  const rows = finish / ROW;
  const rival = rivalFor(getState().carColor);

  topBar(ctx);
  const view = html(`<div class="stage race">
    <div class="race-board">
      <div class="track" style="--rows:${rows}"></div>
    </div>
    <div class="race-controls">
      <button class="die" aria-label="Roll the die">${dieHTML(1)}</button>
      <div class="choices"></div>
    </div>
  </div>`);
  ctx.root.append(view);

  const board = view.querySelector('.race-board');
  const track = view.querySelector('.track');
  const die = view.querySelector('.die');
  const choices = view.querySelector('.choices');
  const cells = [];
  for (let r = 0; r < rows; r++) {
    track.append(html(r === 0 ? '<div class="cell start-cell">🚦</div>' : '<div class="cell spacer"></div>'));
    for (let c = 1; c <= ROW; c++) {
      const n = r * ROW + c;
      const cell = html(`<div class="cell${n === finish ? ' finish' : ''}"><span>${n}</span></div>`);
      cells.push(cell);
      track.append(cell);
    }
  }
  const startCell = track.querySelector('.start-cell');
  const kid = html(`<div class="racer kid">${carSVG(getState().carColor)}</div>`);
  const bot = html(`<div class="racer bot">${carSVG(rival.color)}</div>`);
  board.append(bot, kid);

  let kidPos = 0;
  let botPos = 0;

  function place(car, pos, lane, animate = true) {
    const cell = pos === 0 ? startCell : cells[pos - 1];
    const b = board.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const labelH = 30;
    const laneH = (c.height - labelH) / 2;
    const w = Math.min(c.width * 0.98, laneH / 0.5, 130);
    const h = (w * 70) / 120;
    const x = c.left - b.left + (c.width - w) / 2;
    const y = c.top - b.top + labelH + lane * laneH + (laneH - h) / 2;
    car.style.transition = animate ? '' : 'none';
    car.style.width = `${w}px`;
    car.style.transform = `translate(${x}px, ${y}px)`;
  }

  function placeAll(animate) {
    place(kid, kidPos, 0, animate);
    place(bot, botPos, 1, animate);
  }

  function mark(pos, cls) {
    cells.forEach((c, i) => c.classList.toggle(cls, i === pos - 1));
  }

  const onResize = () => placeAll(false);
  window.addEventListener('resize', onResize);
  ctx.onCleanup(() => window.removeEventListener('resize', onResize));
  placeAll(false);

  async function roll(n, range) {
    sfx.dice();
    die.classList.add('rolling');
    for (let i = 0; i < 6; i++) {
      die.innerHTML = dieHTML(rand(1, range));
      await ctx.wait(80);
    }
    die.innerHTML = dieHTML(n);
    die.classList.remove('rolling');
  }

  // Returns true if the child named the dot count on the first try.
  async function askHowMany(n) {
    const opts = shuffle([n, ...sampleExcept(range(1, Math.max(maxRoll, 4)), 2, [n])]);
    choices.innerHTML = opts.map(o => `<button class="choice">${o}</button>`).join('');
    const btns = [...choices.children];
    setPrompt('How many dots? Tap the number.');
    let first = true;
    for (;;) {
      const i = await ctx.wait(waitAny(btns));
      if (opts[i] === n) {
        sfx.pop();
        btns[i].classList.add('right');
        break;
      }
      first = false;
      sfx.oops();
      btns[i].classList.add('wrong');
      clearPrompt();
      await ctx.wait(say("Let's count them together!"));
      const pips = [...die.querySelectorAll('.pip.on')];
      for (let k = 0; k < pips.length; k++) {
        pips[k].classList.add('count');
        sfx.step(k);
        say(String(k + 1));
        await ctx.wait(750);
      }
      pips.forEach(p => p.classList.remove('count'));
      btns[opts.indexOf(n)].classList.add('glow');
      setPrompt(`${n}! Tap the number ${n}.`);
    }
    clearPrompt();
    recordAnswer(`num:${n}`, first);
    await ctx.wait(say(first ? `${n}! ${praise()}` : `${n}! Good counting!`));
    choices.innerHTML = '';
    return first;
  }

  ctx.run(async () => {
    let questions = 0;
    let firstTries = 0;
    let turn = 0;
    for (;;) {
      setPrompt(turn++ === 0 ? `Race track! Let's race to ${finish}. Tap the die to roll!` : 'Your turn! Tap the die.');
      die.classList.add('ready');
      await ctx.wait(waitClick(die));
      die.classList.remove('ready');
      clearPrompt();
      const n = rand(1, maxRoll);
      await roll(n, maxRoll);

      if (level >= 2) {
        questions++;
        if (await askHowMany(n)) firstTries++;
      } else {
        await ctx.wait(say(`You rolled ${n}!`));
      }

      // One tap = one step, and each step's number is read aloud.
      const steps = Math.min(n, finish - kidPos);
      setPrompt(steps < n
        ? 'Tap the road to drive to the finish!'
        : `Tap the road ${n === 1 ? 'one time' : `${n} times`} to drive!`);
      board.classList.add('tap-to-drive');
      for (let i = 0; i < steps; i++) {
        mark(kidPos + 1, 'next');
        await ctx.wait(waitClick(board));
        kidPos++;
        sfx.step(i);
        place(kid, kidPos, 0);
        mark(kidPos, 'here');
        say(String(kidPos));
        await ctx.wait(420);
      }
      board.classList.remove('tap-to-drive');
      mark(-1, 'next');
      clearPrompt();
      if (kidPos >= finish) break;
      await ctx.wait(say(`You're on ${kidPos}!`));

      await ctx.wait(say(`${rival.name} car's turn!`));
      const r = rand(1, rivalMax);
      await roll(r, maxRoll);
      for (let i = 0; i < Math.min(r, finish - botPos); i++) {
        botPos++;
        sfx.step(i);
        place(bot, botPos, 1);
        await ctx.wait(320);
      }
      if (botPos >= finish) break;
      await ctx.wait(400);
    }

    const won = kidPos >= finish;
    if (won) kid.classList.add('winner');
    sfx.cheer();
    confetti(ctx.root);
    await ctx.wait(say(won
      ? `You won the race, ${childName()}!`
      : `The ${rival.name} car won this time. What a great race!`));
    finishRound('race', questions ? firstTries / questions : 1);
  });
}
