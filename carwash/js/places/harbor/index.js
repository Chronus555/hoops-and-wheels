// Harbor: drag the little tugboat to push the big ship to the dock. Once it's there
// the crane lifts off four containers (counted), then the ship toots and sails away
// and a new one arrives. The fishing rod catches something different each time
// (sometimes a silly boot), the lighthouse shines, and seagulls squawk.

import { div, rand, pick, frames, toStage, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { dragThing } from '../../core/tools.js';
import { FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { LINES, CATCHES, COUNT } from './lines.js';

const WATER_TOP = 520;
const DOCK_X = 930; // the ship's front reaches the dock here
const CONTAINER_COLORS = ['#ef476f', '#4895ef', '#06d6a0', '#ffd166'];
const sounds = {
  horn: () => { tone(110, 1.1, { type: 'sawtooth', vol: 0.14 }); tone(165, 1.1, { type: 'sawtooth', vol: 0.08 }); },
  toot: () => [0, 0.35].forEach(at => tone(330, 0.25, { type: 'square', vol: 0.07, at })),
  splash: () => noise(0.4, { freq: 1200, q: 0.6, vol: 0.4, to: 400 }),
  reel: () => { for (let i = 0; i < 8; i++) tone(1800, 0.03, { type: 'square', vol: 0.04, at: i * 0.07 }); },
  squawk: () => { tone(900, 0.15, { type: 'sawtooth', vol: 0.08, to: 600 }); tone(950, 0.2, { type: 'sawtooth', vol: 0.08, to: 500, at: 0.2 }); },
  clunk: () => { tone(140, 0.2, { to: 70, vol: 0.4 }); noise(0.1, { freq: 400, vol: 0.3 }); },
};

export default {
  id: 'harbor',
  open(ctx) {
    useStyle('js/places/harbor/style.css');
    document.body.dataset.screen = 'harbor';
    const g = makeScene({ cls: 'harbor', onHome: leave });
    const { fx } = g;
    const captain = pick(FRIEND_KINDS);
    const sayC = (l, o) => talk(captain, l, o);

    const panel = div('panel p-harbor', `<div class="sky"><div class="sun"></div></div><div class="sea"><i></i><i></i></div>
      <div class="dock"><div class="posts"><i></i><i></i><i></i></div></div><div class="crane"><i class="mast"></i><i class="arm"></i><i class="rope"></i></div>
      <div class="rock"></div><div class="lighthouse"><div class="beam"></div><div class="top"></div></div>`);
    const stack = div('stack', '', panel);
    const ship = div('ship', `<svg viewBox="0 0 520 220"><path d="M10,120 L500,120 L460,200 L60,200 Z" fill="#1d3557"/><rect x="10" y="112" width="490" height="16" fill="#e63946"/>
      <rect x="360" y="40" width="110" height="74" rx="8" fill="#f8f9fa"/><rect x="376" y="54" width="80" height="22" rx="6" fill="#90e0ef"/><rect x="410" y="10" width="26" height="34" fill="#e63946"/>
      <g class="boxes">${CONTAINER_COLORS.map((c, i) => `<rect class="box b${i}" x="${40 + i * 78}" y="62" width="72" height="50" rx="4" fill="${c}"/>`).join('')}</g></svg>`, panel);
    const tug = div('tug', `<svg viewBox="0 0 200 130"><path d="M10,70 L190,70 L170,120 L30,120 Z" fill="#e63946"/><rect x="60" y="30" width="80" height="44" rx="8" fill="#ffd166"/>
      <rect x="74" y="40" width="52" height="22" rx="5" fill="#c3e8ff"/><g transform="translate(100,62) scale(.4)"><g class="head">${FRIENDS[captain].svg}</g></g>
      <rect x="120" y="6" width="18" height="28" fill="#343a40"/><circle cx="186" cy="94" r="12" fill="none" stroke="#343a40" stroke-width="6"/></svg>`, panel);
    const gull = div('gull', '🕊️', panel);

    let shipX = 120;
    let tugX = 40;
    let tugY = 620;
    let docked = false;
    let away = false;
    let pushTalk = 0;
    function draw() {
      ship.style.transform = `translate(${shipX}px, ${WATER_TOP - 110}px)`;
      tug.style.transform = `translate(${tugX}px, ${tugY - 90}px)`;
    }
    draw();

    // Drag the tug around the water; touching the back of the ship pushes it along.
    tug.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const p0 = toStage(e.clientX, e.clientY);
      const off = { x: tugX - p0.x, y: tugY - p0.y };
      sounds.toot();
      dragThing(e, {
        move: p => {
          const nx = Math.max(0, Math.min(1220, p.x + off.x));
          tugY = Math.max(WATER_TOP + 40, Math.min(800, p.y + off.y));
          const front = nx + 190;
          if (!docked && !away && nx > tugX && front > shipX && tugX < shipX + 40 && tugY < WATER_TOP + 220) {
            // Pushing: the ship moves with the tug.
            shipX = Math.min(DOCK_X - 520 + 520, Math.max(shipX, front - 4));
            if (performance.now() - pushTalk > 4000) { pushTalk = performance.now(); sayC(LINES.push); }
            if (Math.random() < 0.3) fx.splash(shipX, WATER_TOP + 80, 'rgba(255,255,255,.8)', 2);
            if (shipX + 520 >= DOCK_X + 420) dock();
          }
          tugX = nx;
          draw();
        },
        end: (p, moved) => { if (!moved) { sounds.toot(); wiggle(tug, 'jump'); } },
      });
    });
    function autoPush() {
      if (docked || away || g.busy()) return;
      g.setBusy(true);
      tugY = WATER_TOP + 100;
      tugX = shipX - 190;
      sayC(LINES.push);
      const stop = frames(dt => {
        shipX += 220 * dt;
        tugX = shipX - 186;
        draw();
        if (shipX + 520 >= DOCK_X + 420) { stop(); g.setBusy(false); dock(); return false; }
        return true;
      });
    }
    async function dock() {
      if (docked) return;
      docked = true;
      shipX = DOCK_X - 100;
      draw();
      sounds.horn();
      sfx.ta_da();
      fx.confetti(1100, 450, 40);
      await sayC(LINES.docked);
      // The crane lifts off the four containers.
      const boxes = ship.querySelectorAll('.box');
      for (let i = 0; i < 4; i++) {
        await wait(500);
        boxes[i].style.opacity = 0;
        sounds.clunk();
        const c = div('container', '', stack);
        c.style.background = CONTAINER_COLORS[i];
        wiggle(panel.querySelector('.crane'), 'jump');
        await talkText(captain, COUNT[i]);
      }
      await wait(1200);
      sounds.horn();
      await sayC(LINES.bye);
      away = true;
      const leaveStop = frames(dt => {
        shipX -= 260 * dt;
        draw();
        if (shipX < -620) {
          leaveStop();
          setTimeout(newShip, 1500);
          return false;
        }
        return true;
      });
    }
    function newShip() {
      if (!g.screen.isConnected) return;
      ship.querySelectorAll('.box').forEach(b => { b.style.opacity = 1; });
      stack.innerHTML = '';
      shipX = -560;
      docked = false;
      const arrive = frames(dt => {
        shipX += 300 * dt;
        draw();
        if (shipX >= 120) { shipX = 120; draw(); away = false; sayC(LINES.back); arrive(); return false; }
        return true;
      });
    }

    // Fishing from the pier.
    const rod = div('rod', '<i class="pole"></i><i class="line"></i><i class="bob"></i>', panel);
    const catchEl = div('catch', '', panel);
    let fishing = false;
    async function fish() {
      if (fishing) return;
      fishing = true;
      rod.classList.add('cast');
      sayC(LINES.cast, { chatty: true });
      await wait(500);
      sounds.splash();
      fx.splash(1240, 640, 'rgba(255,255,255,.8)', 8);
      await wait(1400 + rand(0, 800));
      wiggle(rod, 'bite');
      sounds.reel();
      await wait(600);
      const [emo, line] = pick(CATCHES);
      catchEl.textContent = emo;
      catchEl.classList.remove('show');
      void catchEl.offsetWidth;
      catchEl.classList.add('show');
      rod.classList.remove('cast');
      sfx.pop();
      fx.splash(1240, 600, 'rgba(255,255,255,.8)', 10);
      await talkText(captain, line);
      fishing = false;
    }
    rod.addEventListener('pointerdown', e => { e.stopPropagation(); fish(); });

    const lighthouse = panel.querySelector('.lighthouse');
    lighthouse.addEventListener('pointerdown', e => {
      e.stopPropagation();
      lighthouse.classList.remove('shine');
      void lighthouse.offsetWidth;
      lighthouse.classList.add('shine');
      sounds.horn();
      sayC(LINES.light, { chatty: true });
    });
    gull.addEventListener('pointerdown', e => { e.stopPropagation(); sounds.squawk(); wiggle(gull, 'jump'); talkText(captain, pick(LINES.gull)); });
    ship.addEventListener('pointerdown', e => { e.stopPropagation(); sounds.horn(); });

    const tray = div('tray-row');
    const btn = (icon, fn, cls = '') => { const b = div(`tool roundbtn ${cls}`, `<span>${icon}</span>`, tray); b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); fn(); }); return b; };
    const pushBtn = btn('🚤', autoPush, 'go');
    btn('🎣', fish);
    btn('📯', () => { sounds.horn(); sayC(LINES.horn, { chatty: true }); });
    btn('💡', () => lighthouse.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));

    g.setStations([{ id: 'harbor', icon: '⚓', panel, tray, hint: () => (docked ? tray.children[1] : pushBtn) }]);
    setTimeout(() => sayC(LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__harbor = { autoPush, fish, get state() { return { shipX, docked, away, containers: stack.children.length }; } };
  },
};
