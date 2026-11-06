// Train Yard: the track has three gaps. Drag (or tap) track pieces into them, counted
// out loud. Tap the red, blue and yellow cars to load logs, teddy bears and apples
// (the colours are named). Then blow the whistle: the train chugs through the
// tunnel, over the bridge and around back to the station. With a gap left, it stops
// at the gap and asks for more track.

import { div, pick, frames, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { LINES, CARS, COUNT } from './lines.js';

const RAIL_Y = 660;
const GAPS = [700, 1180, 1320];
const HOME_X = 20; // where the back of the train waits at the station
const sounds = {
  whistle: () => { tone(880, 0.7, { type: 'triangle', vol: 0.15 }); tone(1100, 0.7, { type: 'triangle', vol: 0.1 }); },
  chug: () => noise(0.12, { freq: 700, q: 0.8, vol: 0.3 }),
  clack: () => { tone(500, 0.06, { type: 'square', vol: 0.05 }); noise(0.05, { freq: 2000, vol: 0.2 }); },
  load: () => { tone(260, 0.12, { to: 160, vol: 0.3 }); noise(0.08, { freq: 600, vol: 0.25 }); },
  brake: () => noise(0.6, { freq: 4000, q: 2, vol: 0.2, to: 2000 }),
};

export default {
  id: 'train',
  open(ctx) {
    useStyle('js/places/train/style.css');
    document.body.dataset.screen = 'train';
    const g = makeScene({ cls: 'train', onHome: leave });
    const { fx } = g;
    const driver = pick(FRIEND_KINDS);
    const sayD = (l, o) => talk(driver, l, o);
    let filled = [false, false, false];
    let loads = [false, false, false];

    const panel = div('panel p-train', `<div class="sky"></div><div class="hills"></div><div class="mountain back"></div>
      <div class="river"></div><div class="grass"></div><div class="platform"><div class="roof"></div><div class="sign">🚉</div></div>`);
    div('rails', '', panel);
    const gapEls = GAPS.map((x, i) => {
      const el = div('gap', '<div class="piece"></div>', panel);
      el.style.left = `${x - 60}px`;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); fill(i); });
      return el;
    });
    div('bridge', '', panel);
    const train = div('trainset', `<div class="engine"><svg viewBox="0 0 220 170"><rect x="10" y="60" width="150" height="80" rx="12" fill="#2b2d42"/><rect x="110" y="20" width="80" height="120" rx="12" fill="#e63946"/>
      <rect x="124" y="34" width="52" height="40" rx="8" fill="#c3e8ff"/><g transform="translate(150,60) scale(.5)"><g class="head">${FRIENDS[driver].svg}</g></g>
      <rect x="30" y="20" width="30" height="44" rx="6" fill="#495057"/><path d="M190,130 L216,150 L190,150 Z" fill="#ffd166"/>
      ${[50, 110, 170].map(x => `<g class="wheel" transform="translate(${x},145)"><circle r="22" fill="#343a40"/><circle r="8" fill="#adb5bd"/></g>`).join('')}</svg></div>
      ${CARS.map(([c], i) => `<div class="car c${i}" data-i="${i}"><svg viewBox="0 0 170 130"><rect x="8" y="40" width="154" height="66" rx="10" fill="${c}"/><rect x="8" y="40" width="154" height="12" fill="rgba(0,0,0,.15)"/>
        ${[40, 130].map(x => `<g class="wheel" transform="translate(${x},110)"><circle r="18" fill="#343a40"/><circle r="6" fill="#adb5bd"/></g>`).join('')}</svg><div class="cargo"></div></div>`).join('')}`, panel);
    div('mountain front', '<div class="tunnel"></div>', panel);
    const smoke = div('smokelayer', '', panel);
    const cars = [...train.querySelectorAll('.car')];
    // The train is laid out right to left: engine at the front (right).
    const TRAIN_W = 170 + 3 * 135;
    let tx = HOME_X;
    let moving = false;

    function fill(i) {
      if (filled[i]) { sfx.boing(); return; }
      filled[i] = true;
      gapEls[i].classList.add('filled');
      sounds.clack();
      fx.sparkles(GAPS[i], RAIL_Y, 40, 6);
      const n = filled.filter(Boolean).length;
      talkText(driver, COUNT[n - 1]);
      if (n === 3) setTimeout(() => sayD(LINES.track), 900);
    }
    function load(i) {
      if (moving) return;
      const [, colorLine, emo, cargoLine] = CARS[i];
      wiggle(cars[i], 'jump');
      sounds.load();
      if (!loads[i]) {
        loads[i] = true;
        cars[i].querySelector('.cargo').textContent = emo.repeat(3);
        talkText(driver, colorLine).then(() => talkText(driver, cargoLine));
        if (loads.every(Boolean)) setTimeout(() => sayD(LINES.full), 2200);
      } else talkText(driver, colorLine);
    }
    cars.forEach((c, i) => c.addEventListener('pointerdown', e => { e.stopPropagation(); load(i); }));
    train.querySelector('.engine').addEventListener('pointerdown', e => { e.stopPropagation(); sounds.whistle(); });

    async function go() {
      if (moving) return;
      moving = true;
      sounds.whistle();
      await sayD(LINES.go);
      train.classList.add('moving');
      const firstGap = filled.indexOf(false);
      const stopAt = firstGap >= 0 ? GAPS[firstGap] - 70 - TRAIN_W : null;
      let said = { tunnel: false, bridge: false };
      let chugT = 0;
      await new Promise(resolve => {
        frames((dt, now) => {
          tx += 260 * dt;
          const front = tx + TRAIN_W;
          if (now - chugT > 350) { chugT = now; sounds.chug(); smoke.appendChild(puff(front - 140)); }
          if (stopAt != null && tx >= stopAt) { tx = stopAt; place(); resolve(); return false; }
          if (!said.tunnel && front > 780) { said.tunnel = true; sayD(LINES.tunnel); }
          if (!said.bridge && front > 1130) { said.bridge = true; sayD(LINES.bridge); }
          if (tx > 1450) tx = -TRAIN_W - 40;
          if (said.bridge && tx >= HOME_X - 4 && tx < HOME_X + 300 && front < 1100) { tx = HOME_X; place(); resolve(); return false; }
          place();
          return g.screen.isConnected;
        });
      });
      train.classList.remove('moving');
      sounds.brake();
      if (stopAt != null) {
        wiggle(gapEls[firstGap], 'hint');
        await sayD(LINES.gap);
        // Back up to the station.
        tx = HOME_X;
        place();
      } else {
        fx.confetti(400, 400, 40);
        sfx.ta_da();
        sayD(LINES.back);
        // Deliveries made: the cars are empty again.
        loads = [false, false, false];
        cars.forEach(c => { c.querySelector('.cargo').textContent = ''; });
      }
      moving = false;
    }
    function puff(x) {
      const p = div('puff', '', null);
      p.style.left = `${x}px`;
      p.style.top = `${RAIL_Y - 200}px`;
      setTimeout(() => p.remove(), 1600);
      return p;
    }
    function place() { train.style.transform = `translateX(${tx}px)`; }
    place();

    g.target = areaTarget({ x: 300, y: RAIL_Y - 120, w: 1050, h: 200 });
    const tray = div('tray-row');
    tray.appendChild(makeTool(g, {
      art: '<svg viewBox="0 0 130 60"><rect x="0" y="14" width="130" height="10" fill="#6c757d"/><rect x="0" y="40" width="130" height="10" fill="#6c757d"/>' + [10, 50, 90].map(x => `<rect x="${x}" y="6" width="22" height="52" rx="4" fill="#8d5a3b"/>`).join('') + '</svg>',
      w: 130, h: 60, grab: [0, -30],
      drop(p) {
        const i = GAPS.findIndex((x, k) => !filled[k] && Math.abs(p.x - x) < 120);
        if (i < 0) return false;
        fill(i);
        return true;
      },
      tap() { const i = filled.indexOf(false); if (i < 0) { sfx.boing(); return; } fill(i); },
    }));
    const loadBtn = div('tool roundbtn', '<span>📦</span>', tray);
    loadBtn.addEventListener('pointerdown', e => { e.stopPropagation(); const i = loads.indexOf(false); load(i < 0 ? 0 : i); });
    const goBtn = div('tool roundbtn go', '<span>🚂</span>', tray);
    goBtn.addEventListener('pointerdown', e => { e.stopPropagation(); go(); });

    g.setStations([{ id: 'train', icon: '🚂', panel, tray, hint: () => (filled.includes(false) ? tray.firstChild : loads.includes(false) ? loadBtn : goBtn) }]);
    setTimeout(() => sayD(LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__train = { fill, load, go, get state() { return { filled, loads, tx, moving }; } };
  },
};
