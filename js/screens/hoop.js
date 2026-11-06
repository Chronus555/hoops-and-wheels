// Hoop Shot: three hoops, one right answer. Swipe the ball up (or tap a hoop) to shoot.
// Level 1 finds letters, level 2 adds beginning sounds, level 3 adds rhymes and lowercase.

import { skillLevel, recordAnswer, pickTarget, nameLetters } from '../store.js';
import { ballSVG, NET_SVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { ALPHABET, LETTER_NAMES, STARTER_LETTERS, WORDS, RHYMES } from '../data.js';
import { finished, html, pick, sampleExcept, shuffle } from '../util.js';

const SHOTS = 5;

export function hoopScreen(ctx) {
  const level = skillLevel('hoop');
  const starter = [...new Set([...nameLetters(), ...STARTER_LETTERS])];
  let lastKey = '';

  function letterQuestion(lower) {
    const pool = level === 1 ? starter : ALPHABET;
    const prefix = lower ? 'lower:' : 'letter:';
    const key = pickTarget(pool.map(L => prefix + (lower ? L.toLowerCase() : L)), lastKey);
    const T = key.slice(prefix.length).toUpperCase();
    const letters = shuffle([T, ...sampleExcept(pool.length >= 3 ? pool : ALPHABET, 2, [T])]);
    const nameOf = L => (lower ? `little ${LETTER_NAMES[L]}` : LETTER_NAMES[L]);
    return {
      key,
      choices: letters.map(L => ({ label: lower ? L.toLowerCase() : L, correct: L === T, spoken: nameOf(L) })),
      prompt: `Find ${lower ? '' : 'the letter '}${nameOf(T)}!`,
      right: `${nameOf(T)}! ${praise()}`,
      retry: c => `That's ${c.spoken}. Find ${nameOf(T)}!`,
      reveal: `Here's ${nameOf(T)}. Shoot it in!`,
    };
  }

  function soundQuestion() {
    const key = pickTarget(WORDS.map(w => `sound:${w.L}`), lastKey);
    const w = WORDS.find(x => `sound:${x.L}` === key);
    const letters = shuffle([w.L, ...sampleExcept(WORDS.map(x => x.L), 2, [w.L])]);
    return {
      key,
      pic: w.pic,
      choices: letters.map(L => ({ label: L, correct: L === w.L, spoken: LETTER_NAMES[L] })),
      prompt: `${w.word}. What letter does ${w.word} start with?`,
      right: `Yes! ${w.word} starts with ${LETTER_NAMES[w.L]}!`,
      retry: c => `That's ${c.spoken}. Listen. ${w.word}. Try again!`,
      reveal: `${w.word} starts with ${LETTER_NAMES[w.L]}. Shoot it in!`,
    };
  }

  function rhymeQuestion() {
    const key = pickTarget(RHYMES.map(p => `rhyme:${p[0].word}`), lastKey);
    const pair = RHYMES.find(p => `rhyme:${p[0].word}` === key);
    const [a, b] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    const others = sampleExcept(RHYMES.filter(p => p !== pair), 2).map(p => pick(p));
    const options = shuffle([b, ...others]);
    return {
      key,
      pic: a.pic,
      choices: options.map(o => ({ label: o.pic, isPic: true, correct: o === b, spoken: o.word })),
      prompt: `What rhymes with ${a.word}? ${options.map(o => o.word).join('... ')}?`,
      right: `Yes! ${a.word}, ${b.word}! They rhyme!`,
      retry: c => `${c.spoken} doesn't rhyme with ${a.word}. Try again!`,
      reveal: `${a.word}, ${b.word}! They rhyme. Shoot it in!`,
    };
  }

  function makeQuestion() {
    const r = Math.random();
    if (level === 1) return letterQuestion(false);
    if (level === 2) return r < 0.5 ? letterQuestion(false) : soundQuestion();
    return r < 0.4 ? soundQuestion() : r < 0.7 ? rhymeQuestion() : letterQuestion(true);
  }

  const bar = topBar(ctx, { center: '<div class="scoreboard">🏀 <b>0</b></div>' });
  const scoreboard = bar.querySelector('.scoreboard');
  const view = html(`<div class="court">
    <div class="hoops"></div>
    <div class="prompt-pic hidden"></div>
    <div class="ball-spot"><div class="hoop-ball">${ballSVG()}</div></div>
  </div>`);
  ctx.root.append(view);
  const hoopsEl = view.querySelector('.hoops');
  const pic = view.querySelector('.prompt-pic');
  const ball = view.querySelector('.hoop-ball');

  let shot = null; // resolver while waiting for a shot
  const nextShot = () => new Promise(res => { shot = res; ball.classList.add('ready'); });
  function fire(i) {
    if (!shot) return;
    const r = shot;
    shot = null;
    ball.classList.remove('ready');
    r(i);
  }

  hoopsEl.addEventListener('click', e => {
    const h = e.target.closest('.hoop');
    if (h) fire([...hoopsEl.children].indexOf(h));
  });

  // Swipe: pick the hoop whose direction best matches the flick.
  let start = null;
  ball.addEventListener('pointerdown', e => {
    if (!shot) return;
    start = { x: e.clientX, y: e.clientY };
    ball.setPointerCapture(e.pointerId);
  });
  ball.addEventListener('pointermove', e => {
    if (!start) return;
    ball.style.transform = `translate(${(e.clientX - start.x) * 0.3}px, ${(e.clientY - start.y) * 0.3}px)`;
  });
  const endSwipe = e => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    ball.style.transform = '';
    if (dy > -25 || Math.hypot(dx, dy) < 40) {
      say('Swipe the ball up to a hoop!');
      return;
    }
    const b = ball.getBoundingClientRect();
    const angle = Math.atan2(dy, dx);
    let best = 0;
    let bestDiff = Infinity;
    [...hoopsEl.children].forEach((h, i) => {
      const r = h.querySelector('.rim').getBoundingClientRect();
      const a = Math.atan2(r.top - (b.top + b.height / 2), r.left + r.width / 2 - (b.left + b.width / 2));
      const diff = Math.abs(a - angle);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });
    fire(best);
  };
  ball.addEventListener('pointerup', endSwipe);
  ball.addEventListener('pointercancel', () => { start = null; ball.style.transform = ''; });

  async function shoot(hoop, made) {
    const rim = hoop.querySelector('.rim').getBoundingClientRect();
    const b = ball.getBoundingClientRect();
    const dx = rim.left + rim.width / 2 - (b.left + b.width / 2);
    const dy = rim.top - (b.top + b.height / 2) - b.height * 0.2;
    const peak = Math.min(dy, 0) - 90;
    sfx.tap();
    await ctx.wait(finished(ball.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.55}px, ${peak}px) scale(.75)`, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.55)` },
    ], { duration: 650, easing: 'ease-in-out', fill: 'forwards' })));
    if (made) {
      sfx.swish();
      const net = hoop.querySelector('.net');
      net.classList.add('swish');
      setTimeout(() => net.classList.remove('swish'), 600);
      await ctx.wait(finished(ball.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 90}px) scale(.5)`, opacity: 0 },
      ], { duration: 400, fill: 'forwards' })));
    } else {
      sfx.boing();
      hoop.classList.add('nope');
      setTimeout(() => hoop.classList.remove('nope'), 500);
      const side = dx >= 0 ? 1 : -1;
      await ctx.wait(finished(ball.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 1 },
        { transform: `translate(${dx + side * 90}px, ${dy - 50}px) scale(.6)`, opacity: 1 },
        { transform: `translate(${dx + side * 150}px, ${dy + 220}px) scale(.7)`, opacity: 0 },
      ], { duration: 700, fill: 'forwards' })));
    }
    ball.getAnimations().forEach(a => a.cancel());
    ball.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 250 });
  }

  ctx.run(async () => {
    let score = 0;
    let firstTries = 0;
    for (let q = 0; q < SHOTS; q++) {
      const Q = makeQuestion();
      lastKey = Q.key;
      hoopsEl.innerHTML = Q.choices.map(c => `<button class="hoop">
        <div class="backboard"><span class="label${c.isPic ? ' pic' : ''}">${c.label}</span></div>
        <div class="rim"></div>${NET_SVG}
      </button>`).join('');
      const hoops = [...hoopsEl.children];
      pic.classList.toggle('hidden', !Q.pic);
      pic.textContent = Q.pic || '';
      setPrompt(q === 0 ? `Hoop shot! ${Q.prompt}` : Q.prompt);

      let misses = 0;
      for (;;) {
        const i = await ctx.wait(nextShot());
        clearPrompt();
        const made = Q.choices[i].correct;
        await shoot(hoops[i], made);
        if (made) {
          score++;
          scoreboard.querySelector('b').textContent = score;
          scoreboard.classList.remove('pulse');
          void scoreboard.offsetWidth;
          scoreboard.classList.add('pulse');
          await ctx.wait(say(Q.right));
          break;
        }
        misses++;
        if (misses >= 2) {
          hoops[Q.choices.findIndex(c => c.correct)].classList.add('glow');
          setPrompt(Q.reveal);
        } else {
          setPrompt(Q.retry(Q.choices[i]));
        }
      }
      recordAnswer(Q.key, misses === 0);
      if (misses === 0) firstTries++;
    }

    hoopsEl.innerHTML = '';
    pic.classList.add('hidden');
    await ctx.wait(say("Let's count your baskets!"));
    for (let i = 1; i <= score; i++) {
      scoreboard.querySelector('b').textContent = i;
      scoreboard.classList.remove('pulse');
      void scoreboard.offsetWidth;
      scoreboard.classList.add('pulse');
      sfx.step(i);
      await ctx.wait(say(String(i)));
    }
    finishRound('hoop', firstTries / SHOTS);
  });
}
