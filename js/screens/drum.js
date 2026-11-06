// Beat Drum: hear a word, drum once for each beat (syllable), then tap thumbs up.
// Clapping syllables is one of the first phonological-awareness skills in pre-K.

import { skillLevel, recordAnswer } from '../store.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise } from '../ui.js';
import { finishRound } from '../round.js';
import { BEAT_WORDS } from '../data.js';
import { html, sampleExcept, waitClick } from '../util.js';

const WORDS_PER_ROUND = 5;

const DRUM_SVG = `<svg class="drum-svg" viewBox="0 0 200 170" aria-hidden="true">
  <ellipse cx="100" cy="132" rx="82" ry="26" fill="#a4161a"/>
  <rect x="18" y="58" width="164" height="74" fill="#e63946"/>
  <path d="M18 64 L52 128 L86 64 L120 128 L154 64 L182 110" fill="none" stroke="#ffd166" stroke-width="5" stroke-linejoin="round"/>
  <ellipse class="drum-head" cx="100" cy="58" rx="82" ry="26" fill="#f8f9fa" stroke="#adb5bd" stroke-width="5"/>
</svg>`;

export function drumScreen(ctx) {
  const level = skillLevel('drum');
  const maxBeats = [2, 3, 4][level - 1];
  const words = sampleExcept(BEAT_WORDS.filter(w => w.parts.length <= maxBeats), WORDS_PER_ROUND);

  topBar(ctx);
  const view = html(`<div class="stage drum-game">
    <div class="word-card"><span class="word-pic"></span></div>
    <div class="beats"></div>
    <div class="drum-row">
      <button class="drum" aria-label="Drum">${DRUM_SVG}</button>
      <button class="done-btn" aria-label="All done">👍</button>
    </div>
  </div>`);
  ctx.root.append(view);
  const pic = view.querySelector('.word-pic');
  const beats = view.querySelector('.beats');
  const drum = view.querySelector('.drum');
  const done = view.querySelector('.done-btn');

  function hit() {
    sfx.drum();
    drum.classList.remove('hit');
    void drum.offsetWidth;
    drum.classList.add('hit');
    beats.insertAdjacentHTML('beforeend', '<i class="beat"></i>');
  }

  // Drum and say each beat, like a teacher clapping it out.
  async function model(w) {
    beats.innerHTML = '';
    for (const part of w.parts) {
      hit();
      await ctx.wait(say(part, { rate: 0.8 }));
      await ctx.wait(250);
    }
  }

  async function playWord(w, q) {
    beats.innerHTML = '';
    pic.textContent = w.pic;
    pic.classList.remove('pop');
    void pic.offsetWidth;
    pic.classList.add('pop');

    if (level === 1) {
      await ctx.wait(say(q === 0 ? `Beat drum! ${w.word}. Listen to the beats.` : `${w.word}. Listen.`));
      await model(w);
      await ctx.wait(600);
      beats.innerHTML = '';
      setPrompt(`Your turn! Drum ${w.word}, then tap thumbs up.`);
    } else {
      setPrompt(q === 0
        ? `Beat drum! ${w.word}. Tap the drum for each beat in ${w.word}, then tap thumbs up.`
        : `${w.word}. Drum the beats, then tap thumbs up.`);
    }

    let count = 0;
    const onDrum = () => { clearPrompt(); count++; hit(); };
    drum.addEventListener('click', onDrum);
    let misses = 0;
    for (;;) {
      await ctx.wait(waitClick(done));
      if (count === 0) {
        setPrompt(`Tap the drum first! ${w.word}.`);
        continue;
      }
      if (count === w.parts.length) break;
      misses++;
      sfx.oops();
      drum.removeEventListener('click', onDrum);
      await ctx.wait(say(`You drummed ${count}. Let's drum it together.`));
      await model(w);
      await ctx.wait(500);
      beats.innerHTML = '';
      count = 0;
      drum.addEventListener('click', onDrum);
      setPrompt(`Your turn! Drum ${w.word}, then tap thumbs up.`);
    }
    drum.removeEventListener('click', onDrum);
    clearPrompt();
    sfx.chime();
    beats.querySelectorAll('.beat').forEach(b => b.classList.add('right'));
    recordAnswer(`syll:${w.parts.length}`, misses === 0);
    const n = w.parts.length;
    await ctx.wait(say(`Yes! ${w.word} has ${n} beat${n === 1 ? '' : 's'}! ${praise()}`));
    return misses === 0;
  }

  ctx.run(async () => {
    let firstTries = 0;
    for (let q = 0; q < words.length; q++) {
      if (await playWord(words[q], q)) firstTries++;
    }
    finishRound('drum', firstTries / words.length);
  });
}
