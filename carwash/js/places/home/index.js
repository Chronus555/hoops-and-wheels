// Home & Bedtime, a calm way to end a play session. Two stations:
//  - Bath: soap makes bubbles on the friend in the tub, the shower rinses them off,
//    rubber ducks float in (counted), the toothbrush brushes for a count of ten,
//    and the towel dries off.
//  - Bedroom: pajamas, a teddy, a picture-book bedtime story read aloud page by page,
//    then lights out: the ceiling stars glow, a soft lullaby plays and the friend
//    falls asleep. Tap the lamp again for "Good morning!".

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { LINES, STORIES, COUNT } from './lines.js';

const LULLABY = [523, 523, 784, 784, 880, 880, 784, 0, 698, 698, 659, 659, 587, 587, 523, 0];
const sounds = {
  squeak: () => tone(1500, 0.12, { to: 2200, type: 'triangle', vol: 0.1 }),
  brush: () => noise(0.15, { freq: 4000, q: 1, vol: 0.2 }),
  shower: () => noise(1.2, { freq: 3000, q: 0.4, vol: 0.3 }),
  page: () => noise(0.25, { freq: 3500, q: 0.6, vol: 0.25, to: 1500 }),
  click: () => tone(1200, 0.05, { type: 'square', vol: 0.05 }),
};

export default {
  id: 'home',
  open(ctx) {
    useStyle('js/places/home/style.css');
    document.body.dataset.screen = 'home';
    const g = makeScene({ cls: 'home', onHome: leave });
    const { fx } = g;
    const kid = pick(FRIEND_KINDS);
    const sayK = (l, o) => talk(kid, l, o);

    // ================= bath =================================================================
    const bath = div('panel p-bath', '<div class="tiles"></div><div class="floor"></div><div class="mirror"></div><div class="sink"></div>');
    const bather = new Friend(kid, { outfit: '#90e0ef', width: 220, parent: bath });
    bather.el.classList.add('bather');
    const foam = div('foam', '', bath);
    div('tub', '<div class="water"></div><div class="tubfront"></div>', bath);
    const ducks = div('ducks', '', bath);
    const BODY = { x: 560, y: 300, w: 280, h: 300 };
    let suds = 0;
    function addFoam(p) {
      if (foam.children.length > 40) return;
      const b = div('sud', '', foam);
      const s = rand(30, 60);
      b.style.cssText = `left:${p.x - s / 2}px;top:${p.y - s / 2}px;width:${s}px;height:${s}px`;
    }
    g.target = areaTarget(BODY);
    const soap = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-38" y="-24" width="76" height="48" rx="20" fill="#ff8fc7"/><circle cx="-10" cy="-30" r="10" fill="#fff" opacity=".8"/><circle cx="12" cy="-38" r="7" fill="#fff" opacity=".8"/></svg>',
      w: 100, h: 100, grab: [0, -30], auto: true,
      apply(p, sp, on, { moving }) {
        if (!on || !moving || Math.random() < 0.6) return;
        addFoam(p);
        if (++suds % 8 === 0) { sfx.bubble(); bather.mood('giggle', 900); sayK(LINES.soap, { chatty: true }); }
      },
    });
    const shower = div('tool roundbtn', '<span>🚿</span>');
    shower.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      wiggle(shower, 'press');
      sounds.shower();
      bather.mood('squint', 1400);
      for (let i = 0; i < 30; i++) fx.add({ kind: 'drop', x: rand(560, 840), y: 160, vy: rand(300, 500), g: 900, r: rand(3, 6), life: 0.9, color: 'rgba(120,200,255,.85)' });
      [...foam.children].forEach((b, i) => setTimeout(() => b.remove(), 200 + i * 20));
      sayK(LINES.rinse, { chatty: true });
    });
    let duckCount = 0;
    const duckBtn = div('tool roundbtn', '<span>🦆</span>');
    duckBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(duckBtn, 'press');
      if (duckCount >= 5) { [...ducks.children].forEach(d => d.remove()); duckCount = 0; }
      duckCount++;
      const d = div('duck', '🦆', ducks);
      d.style.left = `${480 + duckCount * 70}px`;
      d.addEventListener('pointerdown', ev => { ev.stopPropagation(); sounds.squeak(); wiggle(d, 'jump'); sayK(LINES.duck, { chatty: true }); });
      sounds.squeak();
      talkText(kid, COUNT[duckCount - 1]);
    });
    const brushBtn = div('tool roundbtn', '<span>🪥</span>');
    let brushing = false;
    brushBtn.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (brushing) return;
      brushing = true;
      wiggle(brushBtn, 'press');
      const brush = div('toothbrush', '🪥', bath);
      await sayK(LINES.teeth);
      for (let i = 0; i < 10; i++) {
        sounds.brush();
        await talkText(kid, COUNT[i]);
      }
      brush.remove();
      bather.mood('happy', 2000);
      sfx.sparkle();
      fx.sparkles(700, 400, 40, 12);
      sayK(LINES.sparkly);
      brushing = false;
    });
    const towelBtn = div('tool roundbtn', '<span>🧺</span>');
    towelBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(towelBtn, 'press');
      [...foam.children].forEach(b => b.remove());
      sfx.whoosh();
      bather.play('hop', 600);
      sayK(LINES.dry);
    });
    const bathTray = div('tray-row');
    bathTray.append(soap, shower, duckBtn, brushBtn, towelBtn);

    // ================= bedroom ===========================================================
    const bed = div('panel p-bed', `<div class="wall"></div><div class="floor"></div><div class="window"><div class="moon"></div></div>
      <div class="ceiling">${'<i>⭐</i>'.repeat(10)}</div><div class="bedframe"><div class="pillow"></div><div class="blanket"></div></div>
      <div class="lamp"><i class="shade"></i><i class="glow"></i></div><div class="dark"></div><div class="zzz"><b>z</b><b>z</b><b>z</b></div>`);
    bed.querySelectorAll('.ceiling i').forEach(s => { s.style.left = `${rand(80, 1300)}px`; s.style.top = `${rand(120, 300)}px`; });
    const sleeper = new Friend(kid, { outfit: '#ffd166', width: 160, parent: bed });
    sleeper.el.classList.add('sleeper');
    // When asleep, the friend's head rests on the pillow under the blanket.
    const sleepHead = div('sleephead', `<svg viewBox="-60 -60 120 120"><g class="head">${FRIENDS[kid].svg}</g></svg>`, bed);
    sleepHead.dataset.mood = 'squint';
    const teddy = div('teddy', '🧸', bed);
    teddy.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(teddy, 'jump'); sleeper.mood('happy', 1500); sayK(LINES.teddy); });
    const book = div('book', '<div class="pagepic"></div><div class="pagenum"></div>', bed);
    let story = 0;
    let page = -1;
    async function readPage() {
      if (page < 0) story = (story + 1) % STORIES.length;
      page++;
      if (page >= STORIES[story].length) { page = -1; book.classList.remove('open'); return; }
      const [emo, line] = STORIES[story][page];
      book.classList.add('open');
      book.querySelector('.pagepic').textContent = emo;
      book.querySelector('.pagenum').textContent = String(page + 1);
      sounds.page();
      await talkText(kid, line);
    }
    book.addEventListener('pointerdown', e => { e.stopPropagation(); readPage(); });
    let asleep = false;
    let lull = null;
    function lightsOut() {
      asleep = !asleep;
      bed.classList.toggle('night', asleep);
      sounds.click();
      if (asleep) {
        sleeper.el.classList.add('inbed');
        sleeper.mood('squint', 0);
        sayK(LINES.night);
        let i = 0;
        lull = setInterval(() => {
          if (!g.screen.isConnected) return clearInterval(lull);
          const f = LULLABY[i++ % LULLABY.length];
          if (f) tone(f / 2, 0.9, { vol: 0.06 });
        }, 700);
      } else {
        clearInterval(lull);
        sleeper.el.classList.remove('inbed');
        sleeper.el.dataset.mood = '';
        sleeper.play('cheer', 1000);
        sfx.ding();
        sayK(LINES.morning);
      }
    }
    bed.querySelector('.lamp').addEventListener('pointerdown', e => { e.stopPropagation(); lightsOut(); });
    const bedTray = div('tray-row');
    const pjBtn = div('tool roundbtn', '<span>👕</span>', bedTray);
    let pj = false;
    pjBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(pjBtn, 'press');
      pj = !pj;
      sleeper.dress({ outfit: pj ? '#a0c4ff' : '#ffd166' });
      sleeper.el.classList.toggle('pj', pj);
      sfx.whoosh();
      if (pj) sayK(LINES.pajamas);
    });
    const bookBtn = div('tool roundbtn', '<span>📖</span>', bedTray);
    bookBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(bookBtn, 'press'); readPage(); });
    const yawnBtn = div('tool roundbtn', '<span>🥱</span>', bedTray);
    yawnBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(yawnBtn, 'press'); sleeper.mood('wow', 1500); sayK(LINES.yawn); });
    const lampBtn = div('tool roundbtn go', '<span>💡</span>', bedTray);
    lampBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(lampBtn, 'press'); lightsOut(); });

    g.setStations([
      { id: 'bath', icon: '🛁', panel: bath, tray: bathTray, hint: () => (foam.children.length ? shower : soap) },
      { id: 'bed', icon: '🛏️', panel: bed, tray: bedTray, enter: () => sayK(LINES.yawn), hint: () => (page < 0 && !asleep ? bookBtn : lampBtn) },
    ]);
    setTimeout(() => sayK(LINES.hello), 400);

    function leave() {
      clearInterval(lull);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__homeplace = { readPage, lightsOut, get state() { return { foam: foam.children.length, ducks: duckCount, page, asleep, brushing }; } };
  },
};
