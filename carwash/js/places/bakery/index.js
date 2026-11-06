// Bakery, three stations:
//  - Mix: drop ingredients in the bowl (a pickle and a sock are there for laughs),
//    then stir with the whisk. The batter turns the colour of what went in.
//  - Bake & decorate: tap the oven (3-2-1, ding!), then frost, sprinkle, add fruit
//    and candles (counted out loud).
//  - Party: blow out the candles, cut slices and hand them to the friends, who say
//    "Yum!" (or "Yuck!" if a pickle or sock went in), and sometimes burp.

import { div, rand, pick, wait, toStage, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget, dragThing } from '../../core/tools.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, INGREDIENTS } from './lines.js';

const SEATS = [110, 320, 1080]; // where the party guests sit
const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
const FROSTINGS = { pink: '#ff8fc7', chocolate: '#6f4518', white: '#fffaf0', blue: '#90e0ef', green: '#95d5b2' };
const SPRINKLE = ['#ef476f', '#ffd166', '#06d6a0', '#4895ef', '#9b5de5', '#fff'];
const sounds = {
  plop: () => { tone(300, 0.15, { to: 120, vol: 0.3 }); noise(0.1, { freq: 600, vol: 0.2 }); },
  crack: () => { noise(0.06, { freq: 3000, q: 2, vol: 0.5 }); tone(200, 0.15, { to: 100, vol: 0.2, at: 0.05 }); },
  whisk: () => noise(0.25, { freq: 2200, q: 2, vol: 0.25 }),
  tick: () => tone(1400, 0.05, { type: 'square', vol: 0.05 }),
  shake: () => [0, 0.08, 0.16].forEach(at => noise(0.05, { freq: 5000, vol: 0.2, at })),
  chomp: () => [0, 0.2, 0.4].forEach(at => noise(0.08, { freq: 400, q: 1.5, vol: 0.5, at })),
  burp: () => { tone(110, 0.5, { type: 'sawtooth', vol: 0.15, to: 70 }); noise(0.4, { freq: 200, vol: 0.25 }); },
  blow: () => noise(0.7, { freq: 1500, q: 0.4, vol: 0.4, to: 500 }),
};

function mixColors(list) {
  if (!list.length) return '#f3e0b5';
  let r = 0;
  let gg = 0;
  let b = 0;
  for (const c of list) {
    r += parseInt(c.slice(1, 3), 16);
    gg += parseInt(c.slice(3, 5), 16);
    b += parseInt(c.slice(5, 7), 16);
  }
  const n = list.length;
  return `rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})`;
}

export default {
  id: 'bakery',
  open(ctx) {
    useStyle('js/places/bakery/style.css');
    document.body.dataset.screen = 'bakery';
    const g = makeScene({ cls: 'bakery', onHome: leave });
    const { fx } = g;
    const chef = pick(FRIEND_KINDS);
    const say = (l, o) => talk(chef, l, o);

    // The cake being made, shared by all three stations.
    let cake;
    function newCake() {
      cake = { added: [], colors: [], silly: null, stirred: 0, baked: false, frosting: null, sprinkles: [], toppings: [], candles: 0, lit: false, slices: 0 };
    }
    newCake();

    function cakeSVG(withPlate = true) {
      const body = mixColors(cake.colors);
      const fr = cake.frosting;
      const drips = fr ? [60, 100, 145, 190, 230].map((x, i) => `<path d="M${x - 12},128 v${16 + (i % 2) * 14} a12,12 0 0 0 24,0 v-${16 + (i % 2) * 14} Z" fill="${fr}"/>`).join('') : '';
      const candles = Array.from({ length: cake.candles }, (_, i) => {
        const x = 150 + (i - (cake.candles - 1) / 2) * 22;
        return `<rect x="${x - 4}" y="64" width="8" height="40" rx="3" fill="${SPRINKLE[i % 6]}"/>${cake.lit ? `<path class="flame" d="M${x},46 q8,10 0,18 q-8,-8 0,-18" fill="#f8961e"/>` : ''}`;
      }).join('');
      const sprinkles = cake.sprinkles.map(s => `<rect x="${s.x - 4}" y="${s.y - 1.5}" width="8" height="3" rx="1.5" fill="${s.c}" transform="rotate(${s.r} ${s.x} ${s.y})"/>`).join('');
      const tops = cake.toppings.map(t => `<text x="${t.x}" y="${t.y}" font-size="34" text-anchor="middle">${t.e}</text>`).join('');
      const cut = cake.slices ? `<path d="M150,170 L${150 + 120},120 L${150 + 120},240 L150,240 Z" fill="#fff8f0" opacity="${Math.min(1, cake.slices * 0.34)}"/>` : '';
      return `<svg viewBox="0 0 300 270">
        ${withPlate ? '<ellipse cx="150" cy="246" rx="140" ry="20" fill="#e9ecef"/><rect x="140" y="246" width="20" height="22" fill="#ced4da"/>' : ''}
        <rect x="40" y="110" width="220" height="130" rx="18" fill="${cake.baked ? body : '#e9ecef'}"/>
        ${cake.baked ? `<rect x="40" y="170" width="220" height="12" fill="rgba(255,255,255,.5)"/>` : ''}
        ${fr ? `<rect x="36" y="102" width="228" height="34" rx="16" fill="${fr}"/>${drips}` : ''}
        ${sprinkles}${tops}${candles}${cut}
      </svg>`;
    }

    // ================= mix ==========================================================
    const mix = div('panel p-mix', `<div class="wall"></div><div class="counter"></div><div class="shelf s1">🧁 🍪 🥐</div><div class="shelf s2">🎂 🍩 🥧</div>`);
    const chefF = new Friend(chef, { outfit: '#fff', width: 150, parent: mix });
    chefF.el.classList.add('chef');
    chefF.el.insertAdjacentHTML('beforeend', '<div class="chefhat"></div>');
    chefF.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      chefF.play('wave', 1200);
      say(LINES.hello, { chatty: true });
    });
    const bowl = div('bowl', '<svg viewBox="0 0 400 260"><ellipse class="batter" cx="200" cy="70" rx="0" ry="0" fill="#f3e0b5"/><path d="M10,60 Q20,250 200,250 Q380,250 390,60 Z" fill="#90e0ef"/><path d="M10,60 Q200,90 390,60" fill="none" stroke="#48cae4" stroke-width="10"/><g class="swirl" opacity="0"><path d="M120,80 q80,-30 160,0 M140,95 q60,-20 120,0" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="8" stroke-linecap="round"/></g></svg><div class="bits"></div>', mix);
    const BOWL = { x: 500, y: 470, w: 400, h: 260 };
    const batter = bowl.querySelector('.batter');
    const bits = bowl.querySelector('.bits');
    function drawBowl() {
      const n = cake.added.length;
      batter.setAttribute('rx', n ? 180 : 0);
      batter.setAttribute('ry', n ? 26 + Math.min(n, 8) * 3 : 0);
      batter.setAttribute('cy', 80 - Math.min(n, 8) * 3);
      batter.setAttribute('fill', cake.stirred > 0.99 ? mixColors(cake.colors) : '#f3e0b5');
      bits.innerHTML = cake.stirred > 0.99 ? '' : cake.added.slice(-6).map((k, i) => `<span style="left:${60 + i * 46}px">${INGREDIENTS[k].emoji}</span>`).join('');
    }
    function addIngredient(k) {
      if (cake.baked) { say(LINES.again); newCake(); drawAll(); }
      const ing = INGREDIENTS[k];
      cake.added.push(k);
      cake.colors.push(ing.color);
      if (ing.silly) cake.silly = ing.silly;
      cake.stirred = 0;
      if (k === 'egg') sounds.crack(); else sounds.plop();
      fx.blobs(700, 520, ing.color, 6);
      wiggle(bowl, 'jump');
      drawBowl();
      talkText(chef, ing.say);
      if (ing.silly) chefF.mood('wow', 1500);
    }
    g.target = areaTarget(BOWL);
    const mixTray = div('tray-row');
    Object.entries(INGREDIENTS).forEach(([k, ing]) => {
      mixTray.appendChild(makeTool(g, {
        art: `<span class="emo">${ing.emoji}</span>`, w: 86, h: 86, grab: [0, -30],
        drop(p, sp, on) { if (!on) return false; addIngredient(k); return true; },
        tap() { addIngredient(k); },
      }));
    });
    let whisked = 0;
    const whisk = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-6" y="10" width="12" height="40" rx="6" fill="#8d5a3b"/><path d="M0,10 C-30,-10 -24,-48 0,-48 C24,-48 30,-10 0,10 Z M0,10 C-14,-10 -12,-44 0,-46 C12,-44 14,-10 0,10" fill="none" stroke="#adb5bd" stroke-width="5"/></svg>',
      w: 100, h: 100, grab: [0, -40], hot: [0, 40], auto: true, cls: 'whisk',
      apply(p, sp, on, { moving }) {
        if (!on || !moving || !cake.added.length) return;
        whisked++;
        cake.stirred = Math.min(1, cake.stirred + 0.02);
        if (whisked % 8 === 0) sounds.whisk();
        bowl.querySelector('.swirl').setAttribute('opacity', 1);
        bowl.querySelector('.swirl').setAttribute('transform', `rotate(${(whisked * 7) % 360} 200 80)`);
        if (whisked % 30 === 0) say(LINES.mix, { chatty: true });
        if (cake.stirred >= 1 && !cake.readyTold) {
          cake.readyTold = true;
          bowl.querySelector('.swirl').setAttribute('opacity', 0);
          drawBowl();
          sfx.ta_da();
          say(LINES.ready);
          fx.sparkles(700, 540, 120, 12);
        }
      },
      end() { drawBowl(); },
    });
    mixTray.prepend(whisk);

    // ================= bake & decorate ==============================================
    const deco = div('panel p-deco', `<div class="wall"></div><div class="counter"></div>`);
    const oven = div('oven', '<div class="top"><i></i><i></i><i></i></div><div class="door"><div class="glass"><div class="tin"></div></div></div><div class="timer"></div>', deco);
    const stand = div('stand', '', deco);
    const STAND = { x: 600, y: 380, w: 420, h: 380 };
    function drawStand() { stand.innerHTML = cake.baked ? cakeSVG() : ''; }
    async function bake() {
      if (cake.baked || g.busy()) return;
      if (!cake.added.length) { cake.added = ['flour', 'egg', 'milk']; cake.colors = cake.added.map(k => INGREDIENTS[k].color); }
      cake.stirred = 1;
      g.setBusy(true);
      oven.classList.add('on');
      say(LINES.bake);
      await wait(900);
      for (const n of ['Three!', 'Two!', 'One!']) {
        talkText(chef, n);
        sounds.tick();
        oven.querySelector('.timer').textContent = n.replace('!', '');
        await wait(900);
      }
      oven.querySelector('.timer').textContent = '';
      sfx.ding();
      oven.classList.remove('on');
      cake.baked = true;
      drawAll();
      fx.sparkles(810, 560, 150, 16);
      g.setBusy(false);
      say(LINES.done);
    }
    oven.addEventListener('pointerdown', e => { e.stopPropagation(); bake(); });
    const needCake = () => {
      if (cake.baked) return true;
      wiggle(oven, 'hint');
      sfx.boing();
      return false;
    };
    const decoTray = div('tray-row');
    Object.entries(FROSTINGS).forEach(([name, c]) => {
      const b = div('tool frost', `<svg viewBox="-50 -50 100 100"><path d="M-30,-10 L-24,40 H24 L30,-10 Z" fill="#dee2e6"/><ellipse cy="-12" rx="32" ry="12" fill="${c}"/><path d="M-6,-20 q6,-24 14,-4" fill="${c}"/></svg>`, decoTray);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (!needCake()) return;
        cake.frosting = c;
        sfx.gloop();
        fx.blobs(810, 470, c, 10);
        drawAll();
        say(LINES.frosting, { chatty: true });
      });
    });
    g.decoTarget = areaTarget(STAND);
    const toCake = p => ({ x: ((p.x - STAND.x) / STAND.w) * 300, y: ((p.y - STAND.y) / STAND.h) * 270 });
    const shaker = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-22" y="-20" width="44" height="64" rx="10" fill="#ff8fc7"/><path d="M-22,-20 Q0,-50 22,-20 Z" fill="#dee2e6"/><circle cx="-6" cy="-30" r="3" fill="#495057"/><circle cx="6" cy="-30" r="3" fill="#495057"/></svg>',
      w: 90, h: 90, grab: [0, -40], hot: [0, 50], target: g.decoTarget, auto: true,
      apply(p, sp, on, { moving }) {
        if (!on || !cake.baked || (!moving && Math.random() < 0.7)) return;
        const c = toCake(p);
        if (c.y < 96 || c.y > 236 || c.x < 40 || c.x > 260) return;
        cake.sprinkles.push({ x: c.x + rand(-10, 10), y: c.y + rand(-8, 8), c: pick(SPRINKLE), r: rand(0, 180) });
        if (cake.sprinkles.length > 140) cake.sprinkles.shift();
        if (cake.sprinkles.length % 6 === 0) { sounds.shake(); drawAll(); }
        if (cake.sprinkles.length % 40 === 0) say(LINES.sprinkles, { chatty: true });
      },
      end() { drawAll(); },
    });
    shaker.addEventListener('pointerdown', () => needCake(), true);
    const candle = div('tool candlebtn', '<svg viewBox="-50 -50 100 100"><rect x="-8" y="-20" width="16" height="60" rx="5" fill="#ffd166"/><path d="M0,-44 q10,12 0,22 q-10,-10 0,-22" fill="#f8961e"/></svg>', decoTray);
    candle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (!needCake()) return;
      if (cake.candles >= 10) { sfx.boing(); return; }
      cake.candles++;
      cake.lit = true;
      sfx.pop();
      drawAll();
      talkText(chef, COUNT[cake.candles - 1]);
    });
    ['🍓', '🍒', '⭐'].forEach(emo => {
      decoTray.appendChild(makeTool(g, {
        art: `<span class="emo">${emo}</span>`, w: 80, h: 80, grab: [0, -30], target: g.decoTarget,
        drop(p, sp, on) {
          if (!on || !cake.baked) return false;
          const c = toCake(p);
          cake.toppings.push({ e: emo, x: Math.max(50, Math.min(250, c.x)), y: Math.max(96, Math.min(226, c.y + 12)) });
          if (cake.toppings.length > 12) cake.toppings.shift();
          sfx.sticker();
          drawAll();
          return true;
        },
        tap() {
          if (!needCake()) return;
          cake.toppings.push({ e: emo, x: rand(60, 240), y: rand(104, 126) });
          sfx.sticker();
          drawAll();
        },
      }));
    });
    decoTray.prepend(shaker);

    // ================= party ===========================================================
    const party = div('panel p-party', '<div class="wall"></div><div class="bunting"></div><div class="balloons"><i></i><i></i><i></i></div>');
    const kinds = FRIEND_KINDS.filter(k => k !== chef).sort(() => Math.random() - 0.5).slice(0, 3);
    const guests = kinds.map((kind, i) => {
      const f = new Friend(kind, { outfit: pick(OUTFITS), width: 150, parent: party });
      f.el.classList.add('guest');
      f.el.style.left = `${SEATS[i]}px`;
      f.eaten = 0;
      f.el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        f.play('wave', 1000);
        f.mood('giggle', 900);
      });
      return f;
    });
    div('table', '', party);
    guests.forEach((f, i) => { div('plate', '', party).style.left = `${SEATS[i] - 10}px`; });
    const partyCake = div('partycake', '', party);
    partyCake.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (!cake.baked) { wiggle(partyCake, 'hint'); return; }
      if (cake.lit && cake.candles) {
        // Everyone blows out the candles.
        talk(chef, LINES.wish);
        await wait(1400);
        sounds.blow();
        guests.forEach(f => f.mood('squint', 900));
        cake.lit = false;
        drawAll();
        fx.confetti(700, 450, 60);
        sfx.ta_da();
        guests.forEach((f, i) => setTimeout(() => f.play('cheer', 1000), i * 120));
        talk(guests[0].kind, LINES.hooray);
        return;
      }
      cutSlice(e);
    });
    function cutSlice(e) {
      if (cake.slices >= 3) { sfx.boing(); return; }
      cake.slices++;
      drawAll();
      sfx.whoosh();
      const slice = div('slice', `<svg viewBox="0 0 120 100"><path d="M10,90 L110,90 L110,30 Z" fill="${mixColors(cake.colors)}"/><path d="M10,90 L110,30 L110,20 L4,84 Z" fill="${cake.frosting || '#fff8f0'}"/></svg>`, party);
      const p0 = toStage(e.clientX, e.clientY);
      slice.style.transform = `translate(${p0.x - 60}px,${p0.y - 50}px)`;
      dragThing(e, {
        move: p => { slice.style.transform = `translate(${p.x - 60}px,${p.y - 50}px)`; },
        end: (p, moved) => {
          const gi = moved ? guests.findIndex((f, i) => Math.abs(p.x - (SEATS[i] + 75)) < 140 && p.y > 380) : guests.findIndex(f => f.eaten === Math.min(...guests.map(o => o.eaten)));
          slice.remove();
          if (gi < 0) { cake.slices--; drawAll(); return; }
          feed(guests[gi]);
        },
      });
    }
    async function feed(f) {
      sounds.chomp();
      f.play('hop', 600);
      f.eaten++;
      if (cake.silly) {
        f.mood('wow', 1500);
        await talk(f.kind, LINES[cake.silly]);
      } else {
        f.mood('happy', 1500);
        await talk(f.kind, LINES.yum);
      }
      if (f.eaten % 2 === 0) {
        sounds.burp();
        f.mood('giggle', 1200);
        await wait(500);
        talk(f.kind, LINES.burp);
        guests.forEach(o => { if (o !== f) o.mood('giggle', 1200); });
      }
      if (cake.slices >= 3) {
        await wait(1200);
        say(LINES.again);
        newCake();
        drawAll();
      }
    }
    const partyTray = div('tray-row');
    const knife = div('tool knifebtn', '<svg viewBox="-50 -50 100 100"><path d="M-40,10 L30,-30 Q44,-30 38,-16 L-30,20 Z" fill="#dee2e6" stroke="#adb5bd" stroke-width="3"/><rect x="-48" y="6" width="26" height="14" rx="6" fill="#8d5a3b" transform="rotate(-30 -35 13)"/></svg>', partyTray);
    knife.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (!cake.baked) { sfx.boing(); return; }
      cutSlice(e);
    });
    const again = div('tool againbtn', '<span class="emo">🥣</span>', partyTray);
    again.addEventListener('pointerdown', e => {
      e.stopPropagation();
      say(LINES.again);
      newCake();
      drawAll();
      g.goTo(0);
    });

    function drawAll() {
      drawBowl();
      drawStand();
      partyCake.innerHTML = cake.baked ? cakeSVG() : '';
      oven.querySelector('.tin').style.opacity = cake.baked ? 0 : 1;
    }
    drawAll();

    g.setStations([
      { id: 'mix', icon: '🥣', panel: mix, tray: mixTray, enter: () => { g.target = areaTarget(BOWL); }, hint: () => (cake.added.length >= 2 ? whisk : mixTray.children[1]) },
      { id: 'deco', icon: '🎂', panel: deco, tray: decoTray, hint: () => (cake.baked ? candle : oven) },
      { id: 'party', icon: '🎉', panel: party, tray: partyTray, hint: () => (cake.baked ? partyCake : again) },
    ]);
    setTimeout(() => say(LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__bake = { get cake() { return cake; }, addIngredient, bake, feed, guests, cutSlice };
  },
};
