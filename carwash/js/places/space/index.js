// Space Station, two stations:
//  - Launch pad: add the rocket's engine, fuel tank and capsule (counted), put the
//    astronaut in, then the big button counts down from ten and the rocket blasts
//    off into space.
//  - Space: tap a planet to fly there and hear its name (on the Moon, a flag gets
//    planted). The astronaut can float out on a spacewalk and be dragged around in
//    zero gravity. Comets zoom by.

import { div, rand, pick, frames, toStage, track, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { LINES, PARTS, PLANETS, COUNTDOWN } from './lines.js';

const COUNT = ['One!', 'Two!', 'Three!'];
const PLANET_SPOTS = { earth: [180, 640, 150], moon: [430, 260, 90], mars: [760, 560, 110], jupiter: [1060, 300, 190], saturn: [1220, 640, 160] };
const sounds = {
  clank: () => { tone(800, 0.08, { type: 'square', vol: 0.06 }); noise(0.06, { freq: 3000, vol: 0.25 }); },
  beep: hi => tone(hi ? 1320 : 880, 0.2, { type: 'square', vol: 0.06 }),
  launch: () => { noise(3, { freq: 300, q: 0.4, vol: 0.8, to: 1500 }); tone(60, 3, { type: 'sawtooth', vol: 0.15, to: 240 }); },
  zoom: () => noise(0.8, { freq: 1000, q: 0.6, vol: 0.4, to: 4000 }),
  boop: () => tone(520, 0.4, { to: 1040, type: 'triangle', vol: 0.15 }),
  float: () => tone(300, 1.2, { to: 600, type: 'triangle', vol: 0.08 }),
};
const rocketSVG = n => `<svg viewBox="0 0 160 400" overflow="visible">
  ${n >= 1 ? `<g class="r-engine"><path d="M40,320 L120,320 L136,380 L24,380 Z" fill="#6c757d"/><path d="M30,300 L10,370 L44,330 Z M130,300 L150,370 L116,330 Z" fill="#e63946"/><g class="exhaust"><path d="M50,380 L80,470 L110,380 Z" fill="#f8961e"/><path d="M62,380 L80,440 L98,380 Z" fill="#ffd166"/></g></g>` : ''}
  ${n >= 2 ? '<g class="r-tank"><rect x="40" y="170" width="80" height="150" rx="10" fill="#f8f9fa" stroke="#adb5bd" stroke-width="4"/><rect x="40" y="230" width="80" height="16" fill="#4895ef"/></g>' : ''}
  ${n >= 3 ? '<g class="r-capsule"><path d="M40,170 L40,110 Q80,20 120,110 L120,170 Z" fill="#e63946"/><circle class="porthole" cx="80" cy="128" r="22" fill="#c3e8ff" stroke="#adb5bd" stroke-width="5"/></g>' : ''}
</svg>`;

export default {
  id: 'space',
  open(ctx) {
    useStyle('js/places/space/style.css');
    document.body.dataset.screen = 'space';
    const g = makeScene({ cls: 'space', onHome: leave });
    const { fx } = g;
    const astro = pick(FRIEND_KINDS);
    const sayA = (l, o) => talk(astro, l, o);
    let parts = 0;
    let aboard = false;
    let launched = false;

    // ================= launch pad ==========================================================
    const pad = div('panel p-pad', '<div class="sky"></div><div class="ground"></div><div class="tower"><i></i><i></i><i></i></div><div class="padbase"></div>');
    const rocket = div('rocket', rocketSVG(0), pad);
    const outline = div('rocketoutline', '', pad);
    const friend = new Friend(astro, { outfit: '#f8f9fa', width: 120, parent: pad });
    friend.el.classList.add('astronaut');
    friend.el.insertAdjacentHTML('beforeend', '<div class="helmet"></div>');
    const countEl = div('countdown', '', pad);
    function drawRocket() {
      rocket.innerHTML = rocketSVG(parts);
      if (aboard && parts >= 3) rocket.querySelector('.porthole').insertAdjacentHTML('afterend', `<g transform="translate(80,132) scale(.42)"><g class="head">${FRIENDS[astro].svg}</g></g>`);
      outline.style.opacity = parts >= 3 ? 0 : 1;
    }
    drawRocket();
    async function addPart(i) {
      if (parts >= 3 || g.busy()) { sfx.boing(); return; }
      parts++;
      sounds.clank();
      drawRocket();
      wiggle(rocket, 'jump');
      fx.sparkles(700, 640 - parts * 120, 80, 8);
      await talkText(astro, PARTS[parts - 1][1]);
      talkText(astro, COUNT[parts - 1]);
      void i;
    }
    async function climbIn() {
      if (aboard) return;
      if (parts < 3) { sayA(LINES.need); return; }
      aboard = true;
      friend.el.classList.add('climbing');
      sounds.boop();
      await sayA(LINES.astro);
      friend.el.style.visibility = 'hidden';
      drawRocket();
    }
    friend.el.addEventListener('pointerdown', e => { e.stopPropagation(); climbIn(); });
    async function countdown() {
      if (launched || g.busy()) return;
      if (parts < 3) { sayA(LINES.need); wiggle(partsRow, 'hint'); return; }
      if (!aboard) await climbIn();
      g.setBusy(true);
      launched = true;
      for (let i = 0; i < 10; i++) {
        countEl.textContent = String(10 - i);
        wiggle(countEl, 'jump');
        sounds.beep(false);
        await talkText(astro, COUNTDOWN[i]);
        await wait(250);
      }
      countEl.textContent = '🚀';
      sounds.beep(true);
      sounds.launch();
      rocket.classList.add('lift');
      sayA(LINES.blast);
      for (let i = 0; i < 12; i++) setTimeout(() => fx.add({ kind: 'bubble', x: 700 + rand(-120, 120), y: 760, vx: rand(-80, 80), vy: rand(-60, -10), r: rand(20, 40), life: 2 }), i * 120);
      await wait(2600);
      countEl.textContent = '';
      g.setBusy(false);
      g.goTo(1);
    }
    const padTray = div('tray-row');
    const partsRow = div('partsrow', '', padTray);
    PARTS.forEach(([emo], i) => {
      const b = div('tool roundbtn', `<span>${emo}</span>`, partsRow);
      b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); addPart(i); });
    });
    const astroBtn = div('tool roundbtn', '<span>🧑‍🚀</span>', padTray);
    astroBtn.addEventListener('pointerdown', e => { e.stopPropagation(); climbIn(); });
    const launchBtn = div('tool roundbtn launch', '<span>🔴</span>', padTray);
    launchBtn.addEventListener('pointerdown', e => { e.stopPropagation(); countdown(); });

    // ================= space ==============================================================
    const space = div('panel p-space', `<div class="starfield">${'<i></i>'.repeat(60)}</div>`);
    space.querySelectorAll('.starfield i').forEach(s => { s.style.left = `${rand(0, 1400)}px`; s.style.top = `${rand(112, 828)}px`; s.style.animationDelay = `${-rand(0, 3)}s`; });
    const ship = div('spaceship', rocketSVG(3), space);
    let shipPos = { x: 600, y: 470 };
    function placeShip(p, ms = 1400) {
      const dx = p.x - shipPos.x;
      const dy = p.y - shipPos.y;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      ship.style.transition = `transform ${ms}ms ease-in-out`;
      ship.style.transform = `translate(${p.x - 40}px,${p.y - 100}px) rotate(${Math.abs(dx) + Math.abs(dy) > 10 ? ang : 0}deg) scale(.5)`;
      shipPos = p;
    }
    placeShip(shipPos, 0);
    const flags = {};
    Object.entries(PLANETS).forEach(([k, [emo, line]]) => {
      const [x, y, size] = PLANET_SPOTS[k];
      const el = div(`planet pl-${k}`, emo, space);
      el.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;font-size:${size * 0.9}px`;
      el.addEventListener('pointerdown', async e => {
        e.stopPropagation();
        if (g.busy()) return;
        g.setBusy(true);
        sounds.zoom();
        placeShip({ x: x + size * 0.6, y: y - size * 0.3 });
        await wait(1400);
        wiggle(el, 'jump');
        fx.sparkles(x, y, size, 10);
        g.setBusy(false);
        await talkText(astro, line);
        if (k === 'moon' && !flags.moon) {
          flags.moon = div('flag', '🚩', space);
          flags.moon.style.cssText = `left:${x - 10}px;top:${y - size / 2 - 50}px`;
          sounds.boop();
          sayA(LINES.flag);
        }
        if (k === 'mars') { const alien = div('alien', '👽', space); alien.style.cssText = `left:${x + 30}px;top:${y - 90}px`; setTimeout(() => alien.remove(), 3000); }
      });
    });
    // Spacewalk: the astronaut floats out and drifts wherever it's flung.
    const walker = new Friend(astro, { outfit: '#f8f9fa', width: 110, parent: space });
    walker.el.classList.add('spacewalker');
    walker.el.insertAdjacentHTML('beforeend', '<div class="helmet"></div><div class="tether"></div>');
    let w = { x: -300, y: 400, vx: 0, vy: 0, rot: 0, out: false };
    walker.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const hist = [];
      track(e, {
        move: (p, ev) => { w.x = p.x; w.y = p.y; hist.push({ ...p, t: ev.timeStamp }); if (hist.length > 6) hist.shift(); },
        end: () => {
          if (hist.length > 1) { const a = hist[0]; const b = hist[hist.length - 1]; const dt = Math.max(16, b.t - a.t) / 1000; w.vx = (b.x - a.x) / dt / 3; w.vy = (b.y - a.y) / dt / 3; }
          sounds.float();
          walker.mood('giggle', 1200);
        },
      });
    });
    const drift = frames(dt => {
      if (!g.screen.isConnected) return false;
      if (!w.out) return true;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.rot += (w.vx * dt) / 4;
      if (w.x < 60 || w.x > 1340) { w.vx *= -1; w.x = Math.max(60, Math.min(1340, w.x)); }
      if (w.y < 200 || w.y > 760) { w.vy *= -1; w.y = Math.max(200, Math.min(760, w.y)); }
      walker.el.style.transform = `translate(${w.x - 55}px,${w.y - 100}px) rotate(${w.rot}deg)`;
      return true;
    });
    function spacewalk() {
      w = { x: shipPos.x, y: shipPos.y, vx: rand(-80, 80), vy: rand(-60, 60), rot: 0, out: true };
      walker.el.classList.add('out');
      sounds.float();
      sayA(LINES.float);
    }
    function comet() {
      const c = div('comet', '☄️', space);
      c.style.top = `${rand(150, 400)}px`;
      setTimeout(() => c.remove(), 2200);
      sounds.zoom();
      sayA(LINES.comet, { chatty: true });
    }
    const spaceTray = div('tray-row');
    const walkBtn = div('tool roundbtn', '<span>🧑‍🚀</span>', spaceTray);
    walkBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(walkBtn, 'press'); spacewalk(); });
    const cometBtn = div('tool roundbtn', '<span>☄️</span>', spaceTray);
    cometBtn.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(cometBtn, 'press'); comet(); });
    const homeBtn = div('tool roundbtn go', '<span>🌍</span>', spaceTray);
    homeBtn.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      // Fly home: back on the launch pad, ready to go again.
      parts = 0;
      aboard = false;
      launched = false;
      rocket.classList.remove('lift');
      friend.el.classList.remove('climbing');
      friend.el.style.visibility = '';
      walker.el.classList.remove('out');
      w.out = false;
      drawRocket();
      g.goTo(0);
    });
    const cometTimer = setInterval(() => { if (!g.screen.isConnected) clearInterval(cometTimer); else if (g.station()?.id === 'space' && Math.random() < 0.3) comet(); }, 8000);

    g.setStations([
      { id: 'pad', icon: '🚀', panel: pad, tray: padTray, hint: () => (parts < 3 ? partsRow.children[parts] : !aboard ? astroBtn : launchBtn) },
      { id: 'space', icon: '🪐', panel: space, tray: spaceTray, enter: () => sayA(LINES.float), hint: () => space.querySelector('.pl-saturn') },
    ]);
    setTimeout(() => sayA(LINES.hello), 400);

    function leave() {
      clearInterval(cometTimer);
      drift();
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__space = { addPart, climbIn, countdown, spacewalk, get state() { return { parts, aboard, launched, walker: w.out }; } };
  },
};
