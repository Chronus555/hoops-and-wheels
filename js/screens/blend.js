// Robot Talk: the robot says a word in pieces ("cup… cake") and he picks the picture.
// Blending parts into a word is the step before blending letter sounds when reading.

import { skillLevel, recordAnswer } from '../store.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { BEAT_WORDS, COMPOUNDS } from '../data.js';
import { html, sampleExcept, shuffle, waitAny } from '../util.js';

const QUESTIONS = 5;

const ROBOT_SVG = `<svg class="robot-svg" viewBox="0 0 200 240" aria-hidden="true">
  <line x1="100" y1="8" x2="100" y2="40" stroke="#495057" stroke-width="6"/>
  <circle class="antenna" cx="100" cy="10" r="10" fill="#ffbe0b"/>
  <rect x="30" y="40" width="140" height="110" rx="24" fill="#adb5bd" stroke="#495057" stroke-width="6"/>
  <circle class="eye" cx="70" cy="85" r="16" fill="#3a86ff"/>
  <circle class="eye" cx="130" cy="85" r="16" fill="#3a86ff"/>
  <rect class="mouth" x="65" y="115" width="70" height="14" rx="7" fill="#495057"/>
  <rect x="50" y="158" width="100" height="70" rx="16" fill="#ced4da" stroke="#495057" stroke-width="6"/>
  <circle cx="100" cy="190" r="12" fill="#e63946"/>
</svg>`;

export function blendScreen(ctx) {
  const level = skillLevel('blend');
  const pool = level === 1 ? COMPOUNDS
    : level === 2 ? BEAT_WORDS.filter(w => w.parts.length === 2)
    : BEAT_WORDS.filter(w => w.parts.length >= 3);
  const targets = sampleExcept(pool, QUESTIONS);

  topBar(ctx);
  const view = html(`<div class="stage blend-game">
    <div class="robot">${ROBOT_SVG}<div class="robot-bubble"></div></div>
    <div class="pic-choices"></div>
  </div>`);
  ctx.root.append(view);
  const robot = view.querySelector('.robot');
  const bubble = view.querySelector('.robot-bubble');
  const choices = view.querySelector('.pic-choices');

  async function robotTalk(w) {
    robot.classList.add('talking');
    bubble.textContent = '';
    for (let i = 0; i < w.parts.length; i++) {
      sfx.beep(i);
      bubble.textContent += i ? ' … ●' : '●';
      await ctx.wait(say(w.parts[i], { rate: 0.75, pitch: 0.8 }));
      await ctx.wait(450);
    }
    robot.classList.remove('talking');
  }

  async function ask(w, q) {
    const options = shuffle([w, ...sampleExcept(pool, 2, [w])]);
    choices.innerHTML = options.map(o => `<button class="pic-choice">${o.pic}</button>`).join('');
    const btns = [...choices.children];
    if (q === 0) await ctx.wait(say("Robot talk! I say words in pieces. Listen, and find what I said!"));
    await robotTalk(w);
    setPrompt('What did the robot say?');

    let misses = 0;
    for (;;) {
      const k = await ctx.wait(waitAny(btns));
      clearPrompt();
      if (options[k] === w) {
        btns[k].classList.add('right');
        break;
      }
      misses++;
      sfx.oops();
      btns[k].classList.add('wrong');
      await ctx.wait(say(`That's ${options[k].word}. Listen again!`));
      await robotTalk(w);
      if (misses >= 2) btns[options.indexOf(w)].classList.add('glow');
      setPrompt('What did the robot say?');
    }
    sfx.chime();
    robot.classList.add('happy');
    bubble.textContent = w.pic;
    recordAnswer(`blend:${level === 1 ? 'compound' : w.parts.length}`, misses === 0);
    await ctx.wait(say(`Yes! ${w.parts.join('... ')}. ${w.word}! ${praise()}`));
    robot.classList.remove('happy');
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let q = 0; q < targets.length; q++) {
      if (await ask(targets[q], q)) firstTries++;
    }
    finishRound('blend', firstTries / targets.length);
  });
}
