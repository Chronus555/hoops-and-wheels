// Monster Munch: early math with a silly, hungry monster.
// Level 1 is "counting out a set" (give me exactly 3), which is harder than counting what's
// already there: the child has to know when to stop. Later levels add more/less and tiny
// adding and taking-away stories with real objects to count.

import { skillLevel, recordAnswer } from '../store.js';
import { monsterSVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise, flyTo, countAlong } from '../ui.js';
import { finishRound } from '../round.js';
import { FOODS } from '../data.js';
import { html, pick, rand, range, sampleExcept, shuffle, waitAny, waitClick } from '../util.js';

const QUESTIONS = 5;
const noun = (food, n) => (n === 1 ? food.one : food.many);

export function monsterScreen(ctx) {
  const level = skillLevel('monster');

  topBar(ctx);
  const view = html(`<div class="stage monster-game">
    <div class="monster-side"><div class="monster-wrap">${monsterSVG()}<div class="tummy"></div></div></div>
    <div class="food-side"></div>
  </div>`);
  ctx.root.append(view);
  const monster = view.querySelector('.monster');
  const tummy = view.querySelector('.tummy');
  const side = view.querySelector('.food-side');

  function mouth() {
    const r = monster.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * (122 / 210) };
  }

  function mood(cls, ms) {
    monster.classList.remove(cls);
    void monster.getBoundingClientRect();
    monster.classList.add(cls);
    setTimeout(() => monster.classList.remove(cls), ms);
  }

  // "Feed me 4 cookies!" The child decides when to stop and taps thumbs up.
  async function feedQuestion() {
    const [lo, hi] = [[1, 5], [2, 8], [4, 10]][level - 1];
    const n = rand(lo, hi);
    const food = pick(FOODS);
    side.innerHTML = `<div class="food-tray">${range(1, Math.min(12, n + rand(2, 3)))
      .map(() => `<button class="food">${food.pic}</button>`).join('')}</div>
      <button class="done-btn" aria-label="All done">👍</button>`;
    tummy.innerHTML = '';
    const tray = side.querySelector('.food-tray');
    const done = side.querySelector('.done-btn');
    const prompt = `Feed me ${n} ${noun(food, n)}! Then tap the thumbs up.`;
    setPrompt(prompt);

    let eaten = 0;
    let misses = 0;
    let inFlight = 0;
    let locked = false;
    // Every tap counts right away, even while earlier treats are still flying.
    const onTray = e => {
      const f = e.target.closest('.food');
      if (locked || !f || f.style.visibility === 'hidden') return;
      clearPrompt();
      eaten++;
      say(String(eaten));
      inFlight++;
      monster.classList.add('open');
      flyTo(f, mouth(), { duration: 420, scale: 0.4 }).then(() => {
        if (!ctx.alive()) return;
        if (--inFlight === 0) monster.classList.remove('open');
        sfx.chomp();
        mood('chew', 500);
        tummy.insertAdjacentHTML('beforeend', `<span>${food.pic}</span>`);
      });
    };
    tray.addEventListener('click', onTray);

    for (;;) {
      await ctx.wait(waitClick(done));
      locked = true;
      while (inFlight > 0) await ctx.wait(60);
      if (eaten === n) break;
      misses++;
      if (eaten < n) {
        sfx.oops();
        mood('hungry', 1500);
        await ctx.wait(say(`I'm still hungry! I only ate ${eaten}. I want ${n}!`));
        setPrompt(`Feed me more! I want ${n} ${noun(food, n)}.`);
      } else {
        sfx.burp();
        mood('burp', 900);
        await ctx.wait(say(`Burp! That's ${eaten}. Too many! I only wanted ${n}. Let's try again.`));
        eaten = 0;
        tummy.innerHTML = '';
        tray.querySelectorAll('.food').forEach(f => { f.style.visibility = ''; });
        setPrompt(prompt);
      }
      locked = false;
    }
    tray.removeEventListener('click', onTray);
    clearPrompt();
    sfx.chime();
    mood('happy', 1400);
    recordAnswer(`set:${n}`, misses === 0);
    await ctx.wait(say(`Yum! ${n} ${noun(food, n)}! ${praise()}`));
    return misses === 0;
  }

  function plateHTML(count, food) {
    const cells = shuffle(range(0, 8)).slice(0, count);
    return `<button class="plate">${cells.map(c =>
      `<span class="pf" style="grid-area:${Math.floor(c / 3) + 1}/${(c % 3) + 1}">${food.pic}</span>`).join('')}</button>`;
  }

  // "Which plate has more?" Objects are scattered, not lined up, so he has to count.
  async function compareQuestion() {
    const ask = level === 3 && Math.random() < 0.5 ? 'less' : 'more';
    const max = level === 3 ? 8 : 6;
    let a;
    let b;
    do { a = rand(1, max); b = rand(1, max); } while (Math.abs(a - b) < (level === 3 ? 1 : 2));
    const food = pick(FOODS);
    side.innerHTML = `<div class="plates">${plateHTML(a, food)}${plateHTML(b, food)}</div>`;
    tummy.innerHTML = '';
    const plates = [...side.querySelectorAll('.plate')];
    const counts = [a, b];
    const right = ask === 'more' ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    const prompt = `Which plate has ${ask} ${food.many}? Tap it!`;
    setPrompt(prompt);

    let misses = 0;
    for (;;) {
      const i = await ctx.wait(waitAny(plates));
      clearPrompt();
      if (i === right) break;
      misses++;
      sfx.oops();
      plates[i].classList.add('nope');
      setTimeout(() => plates[i].classList.remove('nope'), 500);
      await ctx.wait(say("Let's count them!"));
      for (const p of plates) {
        await countAlong(ctx, [...p.querySelectorAll('.pf')]);
        await ctx.wait(300);
      }
      if (misses >= 2) plates[right].classList.add('glow');
      setPrompt(prompt);
    }

    monster.classList.add('open');
    for (const f of plates[right].querySelectorAll('.pf')) {
      flyTo(f, mouth(), { duration: 420, scale: 0.4 });
      await ctx.wait(110);
    }
    await ctx.wait(450);
    monster.classList.remove('open');
    sfx.chomp();
    mood('chew', 600);
    recordAnswer(`cmp:${ask}`, misses === 0);
    await ctx.wait(say(`Yes! ${counts[right]} is ${ask} than ${counts[1 - right]}. Yum!`));
    return misses === 0;
  }

  // Tiny story problems, acted out so he can count the answer.
  async function storyQuestion() {
    const food = pick(FOODS);
    const add = Math.random() < 0.5;
    let a;
    let b;
    if (add) { a = rand(1, 4); b = rand(1, Math.min(3, 6 - a)); } else { a = rand(2, 6); b = rand(1, Math.min(3, a - 1)); }
    const answer = add ? a + b : a - b;
    side.innerHTML = `<div class="basket"><div class="basket-items">${range(1, a)
      .map(() => `<span class="bf">${food.pic}</span>`).join('')}</div></div><div class="choices"></div>`;
    tummy.innerHTML = '';
    const items = side.querySelector('.basket-items');
    const choices = side.querySelector('.choices');

    await ctx.wait(say(`I have ${a} ${noun(food, a)} in my basket.`));
    if (add) {
      await ctx.wait(say(`Here come ${b} more!`));
      for (let i = 0; i < b; i++) {
        items.append(html(`<span class="bf drop">${food.pic}</span>`));
        sfx.pop();
        await ctx.wait(550);
      }
    } else {
      await ctx.wait(say(`I eat ${b}. Chomp!`));
      monster.classList.add('open');
      for (const it of [...items.children].slice(-b)) {
        await ctx.wait(flyTo(it, mouth(), { duration: 420, scale: 0.4 }));
        it.remove();
        sfx.chomp();
      }
      monster.classList.remove('open');
      mood('chew', 500);
    }

    const opts = shuffle([answer, ...sampleExcept(range(Math.max(0, answer - 2), answer + 2), 2, [answer])]);
    choices.innerHTML = opts.map(o => `<button class="choice">${o}</button>`).join('');
    const btns = [...choices.children];
    const prompt = add ? `How many ${food.many} are in my basket now?` : `How many ${food.many} are left?`;
    setPrompt(prompt);

    let misses = 0;
    for (;;) {
      const i = await ctx.wait(waitAny(btns));
      clearPrompt();
      if (opts[i] === answer) {
        btns[i].classList.add('right');
        break;
      }
      misses++;
      sfx.oops();
      btns[i].classList.add('wrong');
      await ctx.wait(say("Let's count them together!"));
      await countAlong(ctx, [...items.children]);
      if (misses >= 2) btns[opts.indexOf(answer)].classList.add('glow');
      setPrompt(prompt);
    }
    sfx.chime();
    mood('happy', 1400);
    recordAnswer(`story:${add ? 'add' : 'sub'}`, misses === 0);
    await ctx.wait(say(add
      ? `${answer}! ${a} and ${b} more makes ${answer}. ${praise()}`
      : `${answer}! ${a} take away ${b} is ${answer}. ${praise()}`));
    return misses === 0;
  }

  ctx.run(async () => {
    mood('happy', 1200);
    await ctx.wait(say("Monster munch! I'm so hungry!"));
    let firstTries = 0;
    for (let q = 0; q < QUESTIONS; q++) {
      const kind = level === 1 ? 'feed'
        : level === 2 ? (q % 2 ? 'compare' : 'feed')
        : pick(['story', 'story', 'compare', 'feed']);
      const ok = kind === 'feed' ? await feedQuestion()
        : kind === 'compare' ? await compareQuestion()
        : await storyQuestion();
      if (ok) firstTries++;
      await ctx.wait(300);
    }
    finishRound('monster', firstTries / QUESTIONS);
  });
}
