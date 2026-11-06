// Airport, two stations:
//  - Gate: load five suitcases into the plane's hold (counted), fuel it, and board
//    the friends (their faces appear in the windows). Then ✈️ takes off.
//  - Sky: touch to fly the plane up and down through the clouds and catch stars
//    (counted). 🛬 lands back at the gate for another trip.

import { div, rand, pick, frames, toStage, track, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIENDS, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, COUNT } from './lines.js';

const BAG_COLORS = ['#ef476f', '#4895ef', '#ffd166', '#06d6a0', '#9b5de5'];
const WINDOWS = [[640, 420], [710, 420], [780, 420], [850, 420], [920, 420]];
const planeSVG = (heads = []) => `<svg viewBox="300 280 900 360" overflow="visible">
  <path d="M360,470 Q360,400 460,392 L1060,388 Q1180,392 1190,450 Q1180,505 1060,510 L460,510 Q370,505 360,470 Z" fill="#f8f9fa" stroke="#adb5bd" stroke-width="5"/>
  <path d="M380,400 L330,300 L410,300 L480,394 Z" fill="#4895ef"/>
  <path d="M700,470 L600,600 L700,600 L860,470 Z" fill="#dee2e6" stroke="#adb5bd" stroke-width="4"/>
  <path d="M1110,420 Q1170,424 1180,450 L1110,450 Z" fill="#c3e8ff"/>
  ${WINDOWS.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="24" fill="#c3e8ff" stroke="#adb5bd" stroke-width="3"/>${heads[i] ? `<g transform="translate(${x},${y + 6}) scale(.48)"><g class="head">${FRIENDS[heads[i]].svg}</g></g>` : ''}`).join('')}
  <rect x="440" y="455" width="640" height="10" fill="#4895ef"/>
  <rect class="hold" x="500" y="478" width="110" height="30" rx="6" fill="#adb5bd"/></svg>`;
const sounds = {
  thunk: () => { tone(160, 0.12, { to: 90, vol: 0.3 }); noise(0.06, { freq: 500, vol: 0.3 }); },
  glug: () => [0, 0.2, 0.4].forEach(at => tone(220, 0.14, { to: 140, vol: 0.25, at })),
  jet: () => { noise(2.2, { freq: 600, q: 0.4, vol: 0.5, to: 2500 }); tone(80, 2.2, { type: 'sawtooth', vol: 0.08, to: 300 }); },
  ding: () => { tone(988, 0.3, { vol: 0.15 }); tone(1319, 0.4, { vol: 0.12, at: 0.15 }); },
  tweet: () => [0, 0.12].forEach(at => tone(3000, 0.06, { to: 3800, vol: 0.08, at })),
};

export default {
  id: 'airport',
  open(ctx) {
    useStyle('js/places/airport/style.css');
    document.body.dataset.screen = 'airport';
    const g = makeScene({ cls: 'airport', onHome: leave });
    const { fx } = g;
    const pilot = pick(FRIEND_KINDS);
    const sayP = (l, o) => talk(pilot, l, o);
    let bags = 0;
    let fuel = false;
    let heads = [];
    let stars = 0;

    // ================= gate ===============================================================
    const gate = div('panel p-gate', '<div class="sky"></div><div class="tarmac"></div><div class="terminal"><i></i><i></i><i></i></div><div class="tower"></div>');
    const plane = div('plane', planeSVG(), gate);
    const belt = div('belt', '<i></i>', gate);
    const bagEls = BAG_COLORS.map((c, i) => {
      const b = div('bag', `<svg viewBox="0 0 80 70"><rect x="4" y="14" width="72" height="52" rx="10" fill="${c}"/><rect x="28" y="2" width="24" height="16" rx="6" fill="none" stroke="#495057" stroke-width="5"/><rect x="4" y="34" width="72" height="6" fill="rgba(0,0,0,.15)"/></svg>`, belt);
      b.style.left = `${20 + i * 84}px`;
      return b;
    });
    const fuelTruck = div('fueltruck', '⛽', gate);
    const queue = div('queue', '', gate);
    const waiting = FRIEND_KINDS.filter(k => k !== pilot).sort(() => Math.random() - 0.5).slice(0, 3).map(k => {
      const f = new Friend(k, { outfit: pick(OUTFITS), width: 90, parent: queue });
      f.el.addEventListener('pointerdown', e => { e.stopPropagation(); board(f); });
      return f;
    });
    function drawPlane() { plane.innerHTML = planeSVG(heads); }
    drawPlane();

    async function loadBag() {
      if (bags >= 5) { sfx.boing(); return; }
      const el = bagEls[bags];
      bags++;
      el.classList.add('loaded');
      sounds.thunk();
      wiggle(plane, 'jump');
      await talkText(pilot, COUNT[bags - 1]);
      if (bags === 5) sayP(LINES.bags);
      checkReady();
    }
    async function addFuel() {
      if (fuel) { sfx.boing(); return; }
      fuel = true;
      fuelTruck.classList.add('fueling');
      sounds.glug();
      setTimeout(sounds.glug, 700);
      await sayP(LINES.fuel);
      checkReady();
    }
    async function board(f) {
      if (!f || f.boarded) { sfx.boing(); return; }
      f.boarded = true;
      f.el.classList.add('walking', 'boarding');
      sfx.pop();
      await wait(800);
      f.el.style.visibility = 'hidden';
      heads.push(f.kind);
      drawPlane();
      talk(f.kind, LINES.board);
      checkReady();
    }
    function checkReady() {
      if (bags === 5 && fuel && heads.length === 3) {
        sounds.ding();
        sayP(LINES.ready);
        wiggle(takeoffBtn, 'hint');
      }
    }
    g.target = areaTarget({ x: 440, y: 400, w: 700, h: 260 });
    const gateTray = div('tray-row');
    gateTray.appendChild(makeTool(g, {
      art: '<svg viewBox="0 0 80 70"><rect x="4" y="14" width="72" height="52" rx="10" fill="#ef476f"/><rect x="28" y="2" width="24" height="16" rx="6" fill="none" stroke="#495057" stroke-width="5"/></svg>',
      w: 96, h: 84, grab: [0, -30],
      drop(p, sp, on) { if (!on) return false; loadBag(); return true; },
      tap() { loadBag(); },
    }));
    const fuelBtn = div('tool roundbtn', '<span>⛽</span>', gateTray);
    fuelBtn.addEventListener('pointerdown', e => { e.stopPropagation(); addFuel(); });
    const boardBtn = div('tool roundbtn', '<span>🎟️</span>', gateTray);
    boardBtn.addEventListener('pointerdown', e => { e.stopPropagation(); board(waiting.find(f => !f.boarded)); });
    const takeoffBtn = div('tool roundbtn go', '<span>✈️</span>', gateTray);
    takeoffBtn.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      sayP(LINES.takeoff);
      sounds.jet();
      plane.classList.add('takeoff');
      await wait(1400);
      g.goTo(1);
    });

    // ================= sky ================================================================
    const sky = div('panel p-sky', '<div class="skyfill"></div><div class="clouds"><i></i><i></i><i></i><i></i></div><div class="ground"></div>');
    const flyer = div('flyer', '', sky);
    const starLayer = div('starlayer', '', sky);
    const count = div('starcount', '⭐ <b>0</b>', sky);
    let py = 450;
    let target = 450;
    sky.addEventListener('pointerdown', e => {
      target = toStage(e.clientX, e.clientY).y;
      track(e, { move: p => { target = p.y; } });
    });
    const flying = [];
    let spawnT = 0;
    const stop = frames((dt, now) => {
      if (!g.screen.isConnected) return false;
      if (g.station()?.id !== 'sky') return true;
      target = Math.max(180, Math.min(760, target));
      py += (target - py) * Math.min(1, dt * 4);
      flyer.style.transform = `translate(160px,${py - 110}px) rotate(${(target - py) * 0.05}deg)`;
      if (now - spawnT > 1200) {
        spawnT = now;
        const kind = Math.random() < 0.8 ? 'star' : 'bird';
        const el = div(`flyitem ${kind}`, kind === 'star' ? '⭐' : '🐦', starLayer);
        flying.push({ el, kind, x: 1450, y: rand(200, 740) });
      }
      for (let i = flying.length - 1; i >= 0; i--) {
        const s = flying[i];
        s.x -= (s.kind === 'bird' ? 260 : 320) * dt;
        s.el.style.transform = `translate(${s.x - 40}px,${s.y - 40}px)`;
        if (Math.abs(s.x - 400) < 90 && Math.abs(s.y - py) < 90) {
          if (s.kind === 'star') {
            stars++;
            count.querySelector('b').textContent = String(stars);
            sfx.sparkle();
            fx.sparkles(s.x, s.y, 30, 8);
            talkText(pilot, COUNT[(stars - 1) % 10]);
          } else { sounds.tweet(); talk(pilot, LINES.bird, { chatty: true }); }
          s.el.remove();
          flying.splice(i, 1);
        } else if (s.x < -80) { s.el.remove(); flying.splice(i, 1); }
      }
      return true;
    });
    const skyTray = div('tray-row');
    const up = div('tool roundbtn', '<span>⬆️</span>', skyTray);
    up.addEventListener('pointerdown', e => { e.stopPropagation(); target -= 160; });
    const down = div('tool roundbtn', '<span>⬇️</span>', skyTray);
    down.addEventListener('pointerdown', e => { e.stopPropagation(); target += 160; });
    const landBtn = div('tool roundbtn go', '<span>🛬</span>', skyTray);
    landBtn.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      await sayP(LINES.land);
      // Back at the gate: everyone gets off, ready for another trip.
      bags = 0;
      fuel = false;
      heads = [];
      bagEls.forEach(b => b.classList.remove('loaded'));
      fuelTruck.classList.remove('fueling');
      waiting.forEach(f => { f.boarded = false; f.el.style.visibility = ''; f.el.classList.remove('walking', 'boarding'); });
      plane.classList.remove('takeoff');
      drawPlane();
      g.goTo(0);
    });

    g.setStations([
      { id: 'gate', icon: '🧳', panel: gate, tray: gateTray, hint: () => (bags < 5 ? gateTray.firstChild : !fuel ? fuelBtn : heads.length < 3 ? boardBtn : takeoffBtn) },
      { id: 'sky', icon: '☁️', panel: sky, tray: skyTray, enter: () => { flyer.innerHTML = planeSVG(heads); }, hint: () => up },
    ]);
    setTimeout(() => sayP(LINES.hello), 400);

    function leave() {
      stop();
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__air = { loadBag, addFuel, board: () => board(waiting.find(f => !f.boarded)), get state() { return { bags, fuel, heads: heads.length, stars }; }, setTarget: y => { target = y; } };
  },
};
