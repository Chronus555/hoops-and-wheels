// Farm & Garden, two stations:
//  - Garden: six plots. Plant a seed from the tray, then water it: each watering
//    makes it grow a step (seed, sprout, leaves, ready). Plants also grow a step
//    every few minutes by themselves. Tap a ready plant to pick it into the basket,
//    which counts what's been picked. The garden is remembered.
//  - Barnyard: tap animals to hear them ("The cow says moo!"), feed them, and the
//    hen lays an egg that hatches into a chick. The tractor drives by.

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, CROPS, ANIMALS, COUNT } from './lines.js';

const PLOTS = [[330, 520], [560, 520], [790, 520], [330, 690], [560, 690], [790, 690]];
const GROW_MS = 3 * 60 * 1000; // a plant grows a step on its own every 3 minutes
const STAGE_ART = ['', '🟤', '🌱', '🌿'];
const sounds = {
  moo: () => sfx.moo(),
  oink: () => [0, 0.25].forEach(at => { tone(260, 0.18, { type: 'sawtooth', vol: 0.1, to: 180, at }); noise(0.15, { freq: 500, q: 2, vol: 0.2, at }); }),
  baa: () => { for (let i = 0; i < 6; i++) tone(420 + (i % 2) * 30, 0.12, { type: 'sawtooth', vol: 0.08, at: i * 0.1 }); },
  cluck: () => [0, 0.15, 0.3].forEach(at => { tone(900, 0.07, { type: 'square', vol: 0.06, at }); noise(0.05, { freq: 1500, vol: 0.2, at }); }),
  neigh: () => { for (let i = 0; i < 10; i++) tone(700 - i * 30 + (i % 2) * 120, 0.08, { type: 'sawtooth', vol: 0.07, at: i * 0.07 }); },
  quack: () => sfx.quack(),
  dig: () => noise(0.2, { freq: 400, q: 1.5, vol: 0.4 }),
  pop: () => tone(500, 0.15, { to: 1100, vol: 0.25 }),
  crunch: () => [0, 0.15, 0.3].forEach(at => noise(0.07, { freq: 900, q: 1.5, vol: 0.4, at })),
  peep: () => [0, 0.2].forEach(at => tone(2400, 0.08, { to: 3000, vol: 0.12, at })),
};
const ANIMAL_SOUND = { cow: 'moo', pig: 'oink', sheep: 'baa', hen: 'cluck', horse: 'neigh', duck: 'quack' };

export default {
  id: 'farm',
  open(ctx) {
    useStyle('js/places/farm/style.css');
    document.body.dataset.screen = 'farm';
    const g = makeScene({ cls: 'farm', onHome: leave });
    const { fx } = g;
    const farmer = pick(FRIEND_KINDS);
    const sayF = (l, o) => talk(farmer, l, o);
    const saved = loadData('farm', { plots: PLOTS.map(() => null), basket: 0 });

    // ================= garden =============================================================
    const garden = div('panel p-garden', '<div class="sky"><div class="sun"></div></div><div class="field"></div><div class="fence"></div><div class="butterfly">🦋</div>');
    const f = new Friend(farmer, { outfit: '#2d6a4f', width: 140, parent: garden });
    f.el.classList.add('farmer');
    f.el.insertAdjacentHTML('beforeend', '<div class="strawhat"></div>');
    f.el.addEventListener('pointerdown', e => { e.stopPropagation(); f.play('wave', 1200); sayF(LINES.hello, { chatty: true }); });
    const basket = div('basket', '<span class="n"></span><div class="pile"></div>', garden);
    const plotEls = PLOTS.map(([x, y], i) => {
      const el = div('plot', '<div class="dirt"></div><div class="plant"></div><div class="drop">💧</div>', garden);
      el.style.left = `${x - 90}px`;
      el.style.top = `${y - 70}px`;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); tapPlot(i); });
      return el;
    });
    // Catch up on growing that happened while the app was closed.
    const now0 = Date.now();
    saved.plots.forEach(p => {
      if (p && p.stage < 4) {
        const steps = Math.floor((now0 - p.t) / GROW_MS);
        if (steps > 0) { p.stage = Math.min(4, p.stage + steps); p.t = now0; }
      }
    });
    function drawPlot(i) {
      const p = saved.plots[i];
      const el = plotEls[i];
      el.querySelector('.plant').textContent = !p ? '' : p.stage >= 4 ? CROPS[p.crop][0] : STAGE_ART[p.stage];
      el.classList.toggle('ready', !!p && p.stage >= 4);
      el.dataset.stage = p ? p.stage : 0;
    }
    function drawBasket() {
      basket.querySelector('.n').textContent = saved.basket ? String(saved.basket) : '';
      basket.querySelector('.pile').textContent = (saved.pile || []).slice(-8).join('');
    }
    PLOTS.forEach((_, i) => drawPlot(i));
    drawBasket();
    const save = () => saveData('farm', saved);

    function plant(i, crop) {
      if (saved.plots[i]) { wiggle(plotEls[i], 'jump'); return false; }
      saved.plots[i] = { crop, stage: 1, t: Date.now() };
      sounds.dig();
      fx.blobs(PLOTS[i][0], PLOTS[i][1], '#7f5539', 5);
      drawPlot(i);
      save();
      talkText(farmer, CROPS[crop][1]);
      return true;
    }
    function water(i) {
      const p = saved.plots[i];
      const el = plotEls[i];
      wiggle(el.querySelector('.drop'), 'show');
      if (!p || p.stage >= 4) return;
      p.stage++;
      p.t = Date.now();
      sounds.pop();
      fx.sparkles(PLOTS[i][0], PLOTS[i][1] - 40, 40, 6);
      drawPlot(i);
      wiggle(el, 'jump');
      save();
      if (p.stage >= 4) sayF(LINES.grown, { chatty: true });
    }
    async function tapPlot(i) {
      const p = saved.plots[i];
      if (!p) { wiggle(plotEls[i], 'jump'); sayF(LINES.plant, { chatty: true }); return; }
      if (p.stage < 4) { wiggle(plotEls[i], 'jump'); return; }
      // Pick it!
      saved.plots[i] = null;
      drawPlot(i);
      sounds.pop();
      const fly = div('flyfood', CROPS[p.crop][0], garden);
      fly.animate([{ transform: `translate(${PLOTS[i][0] - 40}px,${PLOTS[i][1] - 80}px)` }, { transform: 'translate(1180px,560px) scale(.6)' }], { duration: 600, fill: 'forwards', easing: 'ease-in' });
      setTimeout(() => fly.remove(), 600);
      saved.basket++;
      saved.pile = [...(saved.pile || []), CROPS[p.crop][0]].slice(-8);
      save();
      await wait(600);
      drawBasket();
      wiggle(basket, 'jump');
      await talkText(farmer, CROPS[p.crop][1]);
      talkText(farmer, COUNT[(saved.basket - 1) % 10]);
      if (saved.basket % 10 === 0) { sfx.ta_da(); fx.confetti(1180, 560, 40); sayF(LINES.basket); }
    }
    basket.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(basket, 'jump'); sayF(LINES.basket); });

    const nearest = p => {
      let best = -1;
      let bd = 140;
      PLOTS.forEach(([x, y], i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    g.target = areaTarget({ x: 220, y: 420, w: 690, h: 380 });
    const gardenTray = div('tray-row');
    Object.entries(CROPS).forEach(([k, [emo]]) => {
      gardenTray.appendChild(makeTool(g, {
        art: `<div class="packet"><span>${emo}</span></div>`, w: 84, h: 100, grab: [0, -30],
        drop(p) { const i = nearest(p); if (i < 0) return false; plant(i, k); return true; },
        tap() { const i = saved.plots.findIndex(x => !x); if (i < 0) { sfx.boing(); return; } plant(i, k); },
      }));
    });
    let watered = 0;
    const can = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><path d="M-30,-10 h44 v44 a6,6 0 0 1 -6,6 h-32 a6,6 0 0 1 -6,-6 Z" fill="#4895ef"/><path d="M14,0 L44,-26 L48,-20 L20,8 Z" fill="#4895ef"/><path d="M-30,-10 Q-8,-36 14,-10" fill="none" stroke="#4895ef" stroke-width="6"/></svg>',
      w: 110, h: 110, grab: [0, -50], hot: [50, 40], sound: 'water', auto: true,
      apply(p, sp, on, { first, center }) {
        if (first) fx.water({ x: center.x + 44, y: center.y - 22 }, sp, 2);
        const i = nearest(p);
        if (i < 0) return;
        watered++;
        if (watered % 40 === 0) { water(i); sayF(LINES.water, { chatty: true }); }
      },
    });
    gardenTray.prepend(can);

    // ================= barnyard ===========================================================
    const barn = div('panel p-barn', '<div class="sky"></div><div class="field"></div><div class="barnhouse"><i></i></div><div class="fence"></div><div class="hay"></div>');
    const SPOTS = { cow: [260, 560], pig: [520, 640], sheep: [760, 560], hen: [980, 650], horse: [1180, 560], duck: [640, 760] };
    const animals = {};
    for (const [k, [emo, line]] of Object.entries(ANIMALS)) {
      const el = div(`animal a-${k}`, emo, barn);
      el.style.left = `${SPOTS[k][0] - 70}px`;
      el.style.top = `${SPOTS[k][1] - 140}px`;
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        sounds[ANIMAL_SOUND[k]]();
        wiggle(el, 'jump');
        talkText(farmer, line);
      });
      animals[k] = el;
    }
    const eggs = [];
    async function feed(k) {
      const el = animals[k];
      sounds.crunch();
      wiggle(el, 'munch');
      sayF(LINES.eat, { chatty: true });
      if (k === 'hen' && eggs.length < 3) {
        await wait(900);
        sounds.cluck();
        const egg = div('egg', '🥚', barn);
        egg.style.left = `${SPOTS.hen[0] - 20 + eggs.length * 50}px`;
        egg.style.top = `${SPOTS.hen[1] - 10}px`;
        eggs.push(egg);
        talk(farmer, LINES.egg);
        let taps = 0;
        egg.addEventListener('pointerdown', e => {
          e.stopPropagation();
          taps++;
          wiggle(egg, 'jump');
          sfx.tap();
          if (taps === 2) egg.textContent = '🐣';
          if (taps >= 3) {
            egg.textContent = '🐥';
            egg.classList.add('chick');
            sounds.peep();
            fx.sparkles(parseFloat(egg.style.left) + 30, parseFloat(egg.style.top) + 20, 40, 8);
            talk(farmer, LINES.chick);
            setTimeout(() => { egg.remove(); eggs.splice(eggs.indexOf(egg), 1); }, 4000);
          }
        });
      }
    }
    g.barnTarget = areaTarget({ x: 120, y: 380, w: 1200, h: 420 });
    const nearestAnimal = p => {
      let best = null;
      let bd = 160;
      for (const [k, [x, y]] of Object.entries(SPOTS)) { const d = Math.hypot(p.x - x, p.y - y + 60); if (d < bd) { bd = d; best = k; } }
      return best;
    };
    const barnTray = div('tray-row');
    ['🌾', '🌽', '🥕', '🍎'].forEach(food => {
      barnTray.appendChild(makeTool(g, {
        art: `<span class="emo">${food}</span>`, w: 90, h: 90, grab: [0, -30], target: g.barnTarget,
        drop(p) { const k = nearestAnimal(p); if (!k) return false; feed(k); return true; },
        tap() { feed(pick(Object.keys(ANIMALS))); },
      }));
    });
    const tractor = div('tool roundbtn', '<span>🚜</span>', barnTray);
    tractor.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const t = div('tractorride', '🚜', barn);
      t.animate([{ transform: 'translateX(-200px) scaleX(-1)' }, { transform: 'translateX(1600px) scaleX(-1)' }], { duration: 3500, easing: 'linear' });
      setTimeout(() => t.remove(), 3500);
      sfx.vroom();
      setTimeout(sfx.vroom, 900);
      sayF(LINES.tractor);
    });

    // Plants grow by themselves while the garden is open, too.
    const grower = setInterval(() => {
      if (!g.screen.isConnected) return clearInterval(grower);
      const now = Date.now();
      saved.plots.forEach((p, i) => {
        if (p && p.stage < 4 && now - p.t > GROW_MS) { p.stage++; p.t = now; drawPlot(i); save(); }
      });
    }, 10000);

    g.setStations([
      { id: 'garden', icon: '🌱', panel: garden, tray: gardenTray, hint: () => (saved.plots.some(p => p && p.stage >= 4) ? plotEls.find(e => e.classList.contains('ready')) : saved.plots.some(p => p) ? can : gardenTray.children[1]) },
      { id: 'barn', icon: '🐮', panel: barn, tray: barnTray, hint: () => animals.cow },
    ]);
    setTimeout(() => sayF(LINES.hello), 400);

    function leave() {
      clearInterval(grower);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__farm = { saved, plant, water, tapPlot, feed, get eggs() { return eggs.length; } };
  },
};
