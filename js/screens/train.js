// Pattern Train: the voice chants the riders ("dog, cat, dog, cat…") while each car hops,
// then the child picks who rides next. Saying patterns out loud in rhythm is how pre-K
// classrooms teach them, and pattern skill is an early predictor of later math.

import { skillLevel, recordAnswer, pickTarget } from '../store.js';
import { engineSVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise, flyTo } from '../ui.js';
import { finishRound } from '../round.js';
import { COLORS, RIDERS } from '../data.js';
import { html, rand, range, sampleExcept, shuffle, waitAny } from '../util.js';

const TRAINS = 4;
const UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };
const TYPES = { 1: ['AB'], 2: ['AB', 'AAB', 'ABB', 'ABC'], 3: ['AAB', 'ABB', 'ABC', 'AABB'] };
const PAINT = COLORS.filter(c => ['red', 'blue', 'yellow', 'green', 'purple', 'orange'].includes(c.name))
  .map(c => ({ ...c, pic: '' }));
const WOOD = '#e9c46a';

export function trainScreen(ctx) {
  const level = skillLevel('train');
  let lastKey = '';

  topBar(ctx);
  const view = html(`<div class="stage train-game">
    <div class="rail-zone"><div class="train"></div><div class="rails"></div></div>
    <div class="choices pattern-choices"></div>
  </div>`);
  ctx.root.append(view);
  const train = view.querySelector('.train');
  const choices = view.querySelector('.pattern-choices');

  function makePattern() {
    const key = pickTarget(TYPES[level].map(t => `pattern:${t}`), lastKey);
    lastKey = key;
    const type = key.slice('pattern:'.length);
    const unit = UNITS[type];
    const kind = Math.random() < 0.5 ? 'animal' : 'color';
    const elems = sampleExcept(kind === 'animal' ? RIDERS : PAINT, 3);
    const len = unit.length === 2 ? 6 : 7;
    const seq = range(0, len - 1).map(i => elems[unit[i % unit.length]]);
    const gap = level === 3 && Math.random() < 0.5 ? rand(unit.length, len - 2) : len - 1;
    const answer = seq[gap];
    const options = shuffle([answer, ...elems.filter(e => e !== answer).slice(0, 2)]);
    return { key, kind, seq, gap, answer, options };
  }

  const carHTML = (e, kind, isGap) => {
    if (isGap) return '<div class="tcar gap"><span class="q">?</span><i class="w l"></i><i class="w r"></i></div>';
    const color = kind === 'color' ? e.hex : WOOD;
    return `<div class="tcar" style="--c:${color}">${kind === 'animal' ? `<span class="rider">${e.pic}</span>` : ''}<i class="w l"></i><i class="w r"></i></div>`;
  };

  async function chant(P, cars) {
    for (let i = 0; i < P.seq.length; i++) {
      cars[i].classList.add('hop');
      await ctx.wait(say(i === P.gap ? 'hmm?' : P.seq[i].name, { rate: 1 }));
      cars[i].classList.remove('hop');
    }
  }

  async function playTrain(t) {
    const P = makePattern();
    // Jump back off-screen right without animating the trip there.
    train.style.transition = 'none';
    train.classList.remove('arrive', 'depart');
    void train.offsetWidth;
    train.style.transition = '';
    train.innerHTML = `<div class="engine-wrap">${engineSVG()}<span class="smoke"></span></div>${P.seq.map((e, i) => carHTML(e, P.kind, i === P.gap)).join('')}`;
    const cars = [...train.querySelectorAll('.tcar')];
    choices.innerHTML = '';
    void train.offsetWidth;
    train.classList.add('arrive', 'moving');
    sfx.choo();
    await ctx.wait(1500);
    train.classList.remove('moving');

    if (t === 0) await ctx.wait(say("All aboard the pattern train! Let's say it together."));
    await chant(P, cars);

    choices.innerHTML = P.options.map(o => `<button class="pchoice">${P.kind === 'animal'
      ? `<span class="rider">${o.pic}</span>` : `<span class="paint" style="--c:${o.hex}"></span>`}</button>`).join('');
    const btns = [...choices.children];
    const ask = P.gap === P.seq.length - 1 ? 'What comes next?' : 'What is missing?';
    setPrompt(ask);

    let misses = 0;
    for (;;) {
      const k = await ctx.wait(waitAny(btns));
      clearPrompt();
      if (P.options[k] === P.answer) {
        const gapCar = cars[P.gap];
        const r = gapCar.getBoundingClientRect();
        sfx.pop();
        await ctx.wait(flyTo(btns[k].firstElementChild, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, { duration: 450, scale: 0.9 }));
        gapCar.outerHTML = carHTML(P.answer, P.kind, false);
        break;
      }
      misses++;
      sfx.oops();
      btns[k].classList.add('wrong');
      await ctx.wait(say(`Not ${P.options[k].name}. Listen again!`));
      await chant(P, cars);
      if (misses >= 2) btns[P.options.indexOf(P.answer)].classList.add('glow');
      setPrompt(ask);
    }

    sfx.chime();
    recordAnswer(P.key, misses === 0);
    await ctx.wait(say(`${P.answer.name}! ${praise()} ${P.seq.map(e => e.name).join(', ')}!`, { rate: 1 }));
    choices.innerHTML = '';
    sfx.choo();
    train.classList.add('depart', 'moving');
    await ctx.wait(1500);
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let t = 0; t < TRAINS; t++) {
      if (await playTrain(t)) firstTries++;
    }
    finishRound('train', firstTries / TRAINS);
  });
}
