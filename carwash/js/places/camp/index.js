// Campground, two stations:
//  - Day: tap the bundle to pitch the tent in three counted steps, and drag logs
//    onto the fire pit until a cozy (cartoon) campfire starts.
//  - Night: toast marshmallows by holding them over the fire (golden is yummy,
//    too long is crunchy) and hand them to friends; shine the flashlight into the
//    dark to find night animals; and connect numbered stars to make a picture.

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, CRITTERS, PICTURES, COUNT } from './lines.js';

const FIRE = { x: 700, y: 660 };
const HIDING = { owl: [180, 300], raccoon: [1200, 560], bunny: [110, 660], hedgehog: [1050, 680], deer: [1260, 330], fireflies: [520, 330] };
const SHAPES = {
  car: [[420, 260], [520, 200], [680, 200], [780, 260], [780, 330], [420, 330]],
  fish: [[450, 260], [620, 190], [800, 260], [900, 200], [900, 330], [800, 270]],
  rocket: [[640, 150], [710, 230], [710, 340], [640, 380], [570, 340], [570, 230]],
  bear: [[520, 180], [580, 230], [700, 230], [760, 180], [740, 330], [540, 330]],
};
const sounds = {
  crackle: () => { for (let i = 0; i < 6; i++) noise(0.04, { freq: 2000 + Math.random() * 3000, q: 2, vol: 0.12, at: i * 0.08 + Math.random() * 0.05 }); },
  zip: () => noise(0.4, { freq: 3000, q: 3, vol: 0.3, to: 6000 }),
  thunk: () => { tone(140, 0.15, { to: 80, vol: 0.35 }); noise(0.08, { freq: 500, vol: 0.3 }); },
  hoot: () => [0, 0.35].forEach(at => tone(420, 0.25, { type: 'triangle', vol: 0.15, at, to: 380 })),
  twinkle: i => tone(1047 * 2 ** (i / 12), 0.3, { vol: 0.15 }),
  munch: () => [0, 0.18, 0.36].forEach(at => noise(0.07, { freq: 500, q: 1.5, vol: 0.4, at })),
  chirp: () => { for (let i = 0; i < 4; i++) tone(3500, 0.03, { vol: 0.05, at: i * 0.06 }); },
};

export default {
  id: 'camp',
  open(ctx) {
    useStyle('js/places/camp/style.css');
    document.body.dataset.screen = 'camp';
    const g = makeScene({ cls: 'camp', onHome: leave });
    const { fx } = g;
    const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5).slice(0, 2);
    const sayA = (l, o) => talk(kinds[0], l, o);
    let tentStep = 0;
    let logs = 0;

    function campfire(panel) {
      const pit = div('pit', '<div class="stones"></div><div class="logs"></div><div class="flames"><i></i><i></i><i></i></div>', panel);
      return pit;
    }
    function drawFire() {
      document.querySelectorAll('.camp .pit').forEach(p => {
        p.querySelector('.logs').innerHTML = '<i></i>'.repeat(Math.min(logs, 3));
        p.classList.toggle('lit', logs >= 3);
      });
    }
    function drawTent() {
      document.querySelectorAll('.camp .tent').forEach(t => { t.dataset.step = tentStep; });
    }

    // ================= day ===============================================================
    const day = div('panel p-day', '<div class="sky"><div class="sun"></div><div class="cloud c1"></div></div><div class="hills"></div><div class="ground"></div><div class="lake"></div><div class="pine p1"></div><div class="pine p2"></div><div class="pine p3"></div>');
    const tent = div('tent', '<div class="bundle">🎒</div><div class="poles"></div><div class="cloth"></div><div class="door"></div><div class="flag">🚩</div>', day);
    campfire(day);
    kinds.forEach((k, i) => {
      const f = new Friend(k, { outfit: pick(OUTFITS), width: 120, parent: day });
      f.el.classList.add('camper', `cm${i}`);
      f.el.addEventListener('pointerdown', e => { e.stopPropagation(); f.play('wave', 1200); f.mood('happy', 1200); talk(k, LINES.hello, { chatty: true }); });
    });
    tent.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (tentStep < 3) {
        tentStep++;
        drawTent();
        sounds.thunk();
        wiggle(tent, 'jump');
        await talkText(kinds[0], COUNT[tentStep - 1]);
        if (tentStep === 3) { sfx.ta_da(); fx.sparkles(320, 480, 140, 16); sayA(LINES.tent); }
      } else {
        sounds.zip();
        tent.classList.toggle('open');
        if (tent.classList.contains('open')) talk(kinds[1], LINES.peek);
      }
    });
    g.target = areaTarget({ x: FIRE.x - 160, y: FIRE.y - 160, w: 320, h: 260 });
    function addLog() {
      if (logs >= 3) { sounds.crackle(); wiggle(document.querySelector('.p-day .pit'), 'jump'); return; }
      logs++;
      sounds.thunk();
      drawFire();
      if (logs < 3) sayA(LINES.logs, { chatty: true });
      else { sounds.crackle(); fx.sparkles(FIRE.x, FIRE.y - 60, 60, 12); sayA(LINES.fire); }
    }
    const dayTray = div('tray-row');
    dayTray.appendChild(makeTool(g, {
      art: '<svg viewBox="-60 -30 120 60"><rect x="-54" y="-18" width="108" height="36" rx="18" fill="#8d5a3b"/><ellipse cx="50" cy="0" rx="10" ry="16" fill="#d4a373"/><path d="M-30,-6 h40 M-20,6 h40" stroke="#6d4128" stroke-width="4"/></svg>',
      w: 120, h: 60, grab: [0, -30],
      drop(p, sp, on) { if (!on) return false; addLog(); return true; },
      tap() { addLog(); },
    }));
    const tentBtn = div('tool roundbtn', '<span>⛺</span>', dayTray);
    tentBtn.addEventListener('pointerdown', e => { e.stopPropagation(); tent.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
    const toNight = div('tool roundbtn', '<span>🌙</span>', dayTray);
    toNight.addEventListener('pointerdown', e => { e.stopPropagation(); g.goTo(1); });

    // ================= night ==============================================================
    const night = div('panel p-night', `<div class="sky"><div class="moon"></div>${'<i class="star"></i>'.repeat(30)}</div><div class="hills"></div><div class="ground"></div><div class="pine p1"></div><div class="pine p2"></div><div class="pine p3"></div>`);
    night.querySelectorAll('.star').forEach(s => { s.style.left = `${rand(0, 1400)}px`; s.style.top = `${rand(120, 420)}px`; s.style.animationDelay = `${-rand(0, 3)}s`; });
    div('tent glow', '<div class="bundle">🎒</div><div class="poles"></div><div class="cloth"></div><div class="door"></div><div class="flag">🚩</div>', night);
    campfire(night);
    const guests = kinds.map((k, i) => {
      const f = new Friend(k, { outfit: pick(OUTFITS), width: 120, parent: night });
      f.el.classList.add('camper', `cm${i}`);
      return f;
    });
    // Hidden night animals, found with the flashlight.
    const critters = Object.entries(CRITTERS).map(([k, [emo, line]]) => {
      const el = div(`nightcritter n-${k}`, emo, night);
      el.style.left = `${HIDING[k][0] - 50}px`;
      el.style.top = `${HIDING[k][1] - 50}px`;
      const c = { k, el, line, found: false };
      el.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(el, 'jump'); if (k === 'owl') sounds.hoot(); if (k === 'fireflies') sounds.chirp(); talkText(kinds[0], line); });
      return c;
    });
    const darkness = div('nightdark', '', night);
    let beam = null;
    function drawDark() {
      darkness.style.background = beam
        ? `radial-gradient(circle at ${beam.x}px ${beam.y - 112}px, transparent 0 110px, rgba(5,8,30,.86) 180px)`
        : 'rgba(5,8,30,.6)';
    }
    drawDark();
    const nightTarget = areaTarget({ x: 0, y: 112, w: 1400, h: 716 });
    const flashlight = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-14" y="0" width="28" height="48" rx="8" fill="#495057"/><path d="M-22,0 L-14,-26 H14 L22,0 Z" fill="#adb5bd"/><ellipse cy="-26" rx="16" ry="5" fill="#fff6a8"/></svg>',
      w: 90, h: 90, grab: [0, 40], hot: [0, -170], target: nightTarget, auto: true,
      start() { beam = null; },
      apply(p) {
        beam = p;
        drawDark();
        for (const c of critters) {
          const [x, y] = HIDING[c.k];
          if (!c.found && Math.hypot(p.x - x, p.y - y) < 110) {
            c.found = true;
            c.el.classList.add('found');
            wiggle(c.el, 'jump');
            if (c.k === 'owl') sounds.hoot();
            if (c.k === 'fireflies') sounds.chirp();
            talkText(kinds[0], c.line);
          }
        }
      },
      end() { beam = null; drawDark(); },
    });

    // Marshmallow on a stick: hold it over the fire to toast it, then give it to a friend.
    let toast = 0;
    const mallowColor = () => (toast < 0.4 ? '#fff' : toast < 1 ? '#f4c27a' : toast < 1.5 ? '#a0673c' : '#2b2d42');
    const mallowArt = () => `<svg viewBox="-60 -40 120 80"><rect x="-56" y="-3" width="80" height="6" rx="3" fill="#8d5a3b"/><rect x="18" y="-18" width="34" height="36" rx="10" fill="${mallowColor()}" stroke="#dee2e6" stroke-width="2"/></svg>`;
    const fireTarget = areaTarget({ x: FIRE.x - 140, y: FIRE.y - 220, w: 280, h: 260 });
    const mallow = makeTool(g, {
      art: mallowArt(), w: 120, h: 80, grab: [-30, -40], hot: [35, 0], target: fireTarget,
      start() { toast = 0; },
      apply(p, sp, on, { dt, center }) {
        if (!on) return;
        toast += dt * 0.5;
        if (Math.random() < 0.05) sounds.crackle();
        const ghost = g.dragLayer.querySelector('.ghost');
        if (ghost) ghost.innerHTML = mallowArt();
        if (Math.random() < 0.1) fx.sparkles(center.x + 35, center.y - 10, 10, 1);
      },
      drop(p, sp) {
        const who = guests.find(f => { const r = f.el.getBoundingClientRect(); const s = g.screen.getBoundingClientRect(); const k = 1400 / s.width; const x = (r.left - s.left) * k; return sp.x > x - 40 && sp.x < x + 160; });
        if (!who || toast < 0.1) return false;
        eatMallow(who);
        return true;
      },
      tap() { toast = 0.7; eatMallow(pick(guests)); },
    });
    async function eatMallow(f) {
      sounds.munch();
      f.play('hop', 600);
      if (toast >= 1.5) { f.mood('wow', 1400); await talk(f.kind, LINES.burnt); } else if (toast < 0.4) { f.mood('happy', 1400); await talk(f.kind, LINES.raw); } else { f.mood('happy', 1600); fx.sparkles(700, 500, 60, 8); await talk(f.kind, LINES.toast); }
      toast = 0;
    }

    // Connect the stars: tap them in number order to make a picture.
    let shape = null;
    let next = 0;
    const skyLayer = div('constellation', '<svg viewBox="0 0 1400 1000"><path class="lines" d=""/></svg>', night);
    function startStars() {
      shape = pick(Object.keys(SHAPES).filter(s => s !== shape));
      next = 0;
      skyLayer.querySelectorAll('.cstar, .picture').forEach(e => e.remove());
      skyLayer.querySelector('.lines').setAttribute('d', '');
      SHAPES[shape].forEach(([x, y], i) => {
        const s = div('cstar', `<b>${i + 1}</b>`, skyLayer);
        s.style.left = `${x - 34}px`;
        s.style.top = `${y - 34}px`;
        s.addEventListener('pointerdown', e => { e.stopPropagation(); tapStar(i); });
      });
      skyLayer.querySelectorAll('.cstar')[0].classList.add('next');
      sayA(LINES.stars);
    }
    async function tapStar(i) {
      const stars = skyLayer.querySelectorAll('.cstar');
      if (i !== next) { wiggle(stars[next], 'jump'); return; }
      sounds.twinkle(i * 2);
      stars[i].classList.add('lit');
      stars[i].classList.remove('next');
      talkText(kinds[0], COUNT[i]);
      next++;
      const pts = SHAPES[shape].slice(0, next);
      skyLayer.querySelector('.lines').setAttribute('d', `M${pts.map(p => p.join(',')).join(' L')}${next === pts.length && next === SHAPES[shape].length ? ' Z' : ''}`);
      if (next < SHAPES[shape].length) { stars[next].classList.add('next'); return; }
      await wait(700);
      const [emo, line] = PICTURES[shape];
      const pic = div('picture', emo, skyLayer);
      const cx = SHAPES[shape].reduce((a, p) => a + p[0], 0) / SHAPES[shape].length;
      const cy = SHAPES[shape].reduce((a, p) => a + p[1], 0) / SHAPES[shape].length;
      pic.style.left = `${cx - 70}px`;
      pic.style.top = `${cy - 70}px`;
      sfx.ta_da();
      fx.sparkles(cx, cy, 160, 20);
      talkText(kinds[0], line);
    }
    const nightTray = div('tray-row');
    nightTray.append(mallow, flashlight);
    const starBtn = div('tool roundbtn', '<span>⭐</span>', nightTray);
    starBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(starBtn, 'press'); startStars(); });
    const logBtn = div('tool roundbtn', '<span>🪵</span>', nightTray);
    logBtn.addEventListener('pointerdown', e => { e.stopPropagation(); addLog(); });

    const crackle = setInterval(() => { if (!g.screen.isConnected) return clearInterval(crackle); if (logs >= 3 && Math.random() < 0.5) sounds.crackle(); }, 1500);
    drawFire();
    drawTent();
    g.setStations([
      { id: 'day', icon: '🏕️', panel: day, tray: dayTray, hint: () => (tentStep < 3 ? tent : logs < 3 ? dayTray.firstChild : toNight) },
      { id: 'night', icon: '🌙', panel: night, tray: nightTray, enter: () => sayA(LINES.night), hint: () => (logs < 3 ? logBtn : pick([mallow, flashlight, starBtn])) },
    ]);
    setTimeout(() => sayA(LINES.hello), 400);

    function leave() {
      clearInterval(crackle);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__camp = { get tentStep() { return tentStep; }, get logs() { return logs; }, addLog, startStars, tapStar, get next() { return next; }, critters, eatMallow, setToast: t => { toast = t; } };
  },
};
