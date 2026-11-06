// Fire Station, two stations:
//  - Station: a friend slides down the pole, the bell rings, the truck's siren and
//    lights go, and there's a helmet to put on.
//  - Fire: cartoon flames in a house's windows. Spray them with the hose until each
//    goes out (counted out loud). Raise the ladder to bring a kitten down from the
//    tree. When it's all done the family says thank you, and the flames can come
//    back for another go.

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText, say } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIEND_KINDS } from '../../core/friends.js';
import { LINES, EXTRA as COUNT } from './lines.js';

const FIRES = [[860, 330], [1060, 330], [860, 520], [1060, 520], [960, 190]];
const KITTEN = { x: 300, y: 300 };
const sounds = {
  bell: () => [0, 0.3, 0.6].forEach(at => { tone(1320, 0.4, { vol: 0.2, at }); tone(2640, 0.2, { vol: 0.06, at }); }),
  crackle: () => { for (let i = 0; i < 5; i++) noise(0.04, { freq: 2500 + Math.random() * 2000, q: 2, vol: 0.12, at: i * 0.07 }); },
  hiss: () => noise(0.5, { freq: 4000, q: 0.5, vol: 0.3, to: 1500 }),
  slide: () => tone(900, 0.8, { type: 'triangle', vol: 0.1, to: 300 }),
  meow: () => { tone(700, 0.15, { type: 'triangle', vol: 0.15, to: 1000 }); tone(1000, 0.3, { type: 'triangle', vol: 0.15, to: 600, at: 0.15 }); },
};

export default {
  id: 'fire',
  open(ctx) {
    useStyle('js/places/fire/style.css');
    document.body.dataset.screen = 'fire';
    const g = makeScene({ cls: 'fire', onHome: leave });
    const { fx } = g;
    const chief = pick(FRIEND_KINDS);
    const sayC = (l, o) => talk(chief, l, o);

    // ================= the station ==========================================================
    const station = div('panel p-station', `<div class="wall"></div><div class="floor"></div><div class="door"></div>
      <div class="loft"></div><div class="pole"></div><div class="bell"></div><div class="hooks"><i></i><i></i><i></i></div>`);
    const truckArt = (cls = '') => `<div class="firetruck ${cls}"><div class="body"></div><div class="cab"><i></i></div><div class="lights"><b></b><b></b></div>
      <div class="ladderrack"></div><div class="hosereel"></div><span class="w w1"></span><span class="w w2"></span><span class="w w3"></span></div>`;
    station.insertAdjacentHTML('beforeend', truckArt());
    const truck = station.querySelector('.firetruck');
    const ff = new Friend(chief, { outfit: '#e63946', width: 130, parent: station });
    ff.el.classList.add('firefighter', 'up');
    const helmet = div('helmet', '', ff.el);
    helmet.style.display = 'none';
    let onFloor = false;
    async function slideDown() {
      if (onFloor) { ff.play('hop', 600); sayC(LINES.hello, { chatty: true }); return; }
      onFloor = true;
      sounds.slide();
      ff.el.classList.remove('up');
      await sayC(LINES.slide);
    }
    ff.el.addEventListener('pointerdown', e => { e.stopPropagation(); slideDown(); });
    station.querySelector('.pole').addEventListener('pointerdown', e => { e.stopPropagation(); slideDown(); });
    const ringBell = () => {
      sounds.bell();
      wiggle(station.querySelector('.bell'), 'jump');
      sayC(LINES.bell, { chatty: true });
    };
    station.querySelector('.bell').addEventListener('pointerdown', e => { e.stopPropagation(); ringBell(); });
    const siren = () => {
      sfx.siren();
      document.querySelectorAll('.fire .firetruck').forEach(t => wiggle(t, 'flashing'));
      sayC(LINES.siren, { chatty: true });
    };
    truck.addEventListener('pointerdown', e => { e.stopPropagation(); siren(); });

    const stationTray = div('tray-row');
    const bellBtn = div('tool roundbtn', '<span>🔔</span>', stationTray);
    bellBtn.addEventListener('pointerdown', e => { e.stopPropagation(); ringBell(); });
    const helmetBtn = div('tool roundbtn', '<span>⛑️</span>', stationTray);
    helmetBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const on = helmet.style.display === 'none';
      helmet.style.display = on ? '' : 'none';
      sfx.pop();
      if (on) sayC(LINES.helmet);
    });
    const sirenBtn = div('tool roundbtn', '<span>🚨</span>', stationTray);
    sirenBtn.addEventListener('pointerdown', e => { e.stopPropagation(); siren(); });
    const goBtn = div('tool roundbtn go', '<span>🚒</span>', stationTray);
    goBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sayC(LINES.go);
      sfx.siren();
      g.goTo(1);
    });

    // ================= the fire ===========================================================
    const scene = div('panel p-blaze', `<div class="sky"></div><div class="grass"></div><div class="house"><div class="roof"></div>
      <i class="win w1"></i><i class="win w2"></i><i class="win w3"></i><i class="win w4"></i><i class="housedoor"></i></div>
      <div class="tree"><i></i><b></b></div>`);
    scene.insertAdjacentHTML('beforeend', truckArt('parked'));
    const ladder = div('ladder', '<i></i>', scene);
    const kitten = div('kitten', '🐱', scene);
    const family = div('family', '', scene);
    let fires = [];
    let out = 0;
    let rescued = false;
    let ladderUp = 0; // 0..1

    function lightFires() {
      scene.querySelectorAll('.flame').forEach(f => f.remove());
      out = 0;
      fires = FIRES.map(([x, y]) => {
        const el = div('flame', '<span>🔥</span>', scene);
        el.style.left = `${x - 50}px`;
        el.style.top = `${y - 60}px`;
        return { x, y, hp: 1, el };
      });
      rescued = false;
      kitten.classList.remove('safe');
      kitten.style.transform = '';
      ladderUp = 0;
      drawLadder();
      family.innerHTML = '';
      scene.querySelector('.house').classList.remove('saved');
    }
    function drawLadder() {
      ladder.style.height = `${120 + ladderUp * 300}px`;
    }
    g.target = areaTarget({ x: 760, y: 120, w: 440, h: 520 });
    let sprayTalk = 0;
    const hose = makeTool(g, {
      art: `<svg viewBox="-55 -70 110 140"><path d="M-40,-60 C-40,-20 -30,0 -14,10" stroke="#e63946" stroke-width="14" fill="none" stroke-linecap="round"/>
        <rect x="-24" y="-6" width="40" height="50" rx="10" fill="#ffd166" transform="rotate(-20)"/><rect x="-6" y="26" width="26" height="40" rx="6" fill="#adb5bd" transform="rotate(-20)"/></svg>`,
      w: 100, h: 128, grab: [0, -50], hot: [80, -100], sound: 'water', auto: true,
      apply(p, sp, on, { first, center }) {
        if (first) fx.water({ x: center.x + 30, y: center.y - 20 }, sp, 3);
        for (const f of fires) {
          if (f.hp <= 0) continue;
          if (Math.hypot(sp.x - f.x, sp.y - f.y) < 85) {
            f.hp -= 0.035;
            f.el.style.transform = `scale(${0.35 + 0.65 * Math.max(0, f.hp)})`;
            if (Math.random() < 0.15) fx.add({ kind: 'bubble', x: f.x + rand(-30, 30), y: f.y - 40, vy: -120, r: rand(10, 20), life: 1.2 });
            if (f.hp <= 0) putOut(f);
          }
        }
        if (performance.now() - sprayTalk > 5000) {
          sprayTalk = performance.now();
          sayC(LINES.spray, { chatty: true });
        }
      },
    });
    async function putOut(f) {
      f.el.classList.add('out');
      sounds.hiss();
      setTimeout(() => f.el.remove(), 600);
      out++;
      talkText(chief, COUNT[out - 1]);
      if (out === fires.length) {
        await wait(900);
        sfx.ta_da();
        fx.confetti(960, 300, 60);
        scene.querySelector('.house').classList.add('saved');
        await sayC(LINES.allout);
        const kinds = FRIEND_KINDS.filter(k => k !== chief).sort(() => Math.random() - 0.5).slice(0, 2);
        kinds.forEach((k, i) => {
          const f2 = new Friend(k, { outfit: pick(['#06d6a0', '#ffd166', '#9b5de5']), width: 110, parent: family });
          f2.el.style.left = `${i * 100}px`;
          setTimeout(() => { f2.play('cheer', 1200); f2.mood('happy', 2000); }, 300 + i * 200);
        });
        await wait(600);
        talk(kinds[0], LINES.thanks);
        againBtn.classList.add('on');
      }
    }
    async function raiseLadder() {
      if (rescued || g.busy()) return;
      g.setBusy(true);
      sayC(LINES.ladder);
      for (let t = 0; t <= 1.001; t += 0.05) {
        ladderUp = t;
        drawLadder();
        await wait(40);
      }
      sounds.meow();
      say(pick(LINES.meow), 1.4);
      kitten.classList.add('safe');
      await wait(1200);
      rescued = true;
      for (let t = 1; t >= 0; t -= 0.05) {
        ladderUp = t;
        drawLadder();
        await wait(30);
      }
      fx.sparkles(KITTEN.x + 200, 560, 60, 10);
      sfx.ta_da();
      g.setBusy(false);
      sayC(LINES.safe);
    }
    kitten.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sounds.meow();
      if (!rescued) say(pick(LINES.stuck), 1.4);
      else say(pick(LINES.meow), 1.4);
    });
    ladder.addEventListener('pointerdown', e => { e.stopPropagation(); raiseLadder(); });
    const fireTray = div('tray-row');
    fireTray.appendChild(hose);
    const ladderBtn = div('tool roundbtn', '<span>🪜</span>', fireTray);
    ladderBtn.addEventListener('pointerdown', e => { e.stopPropagation(); raiseLadder(); });
    const sirenBtn2 = div('tool roundbtn', '<span>🚨</span>', fireTray);
    sirenBtn2.addEventListener('pointerdown', e => { e.stopPropagation(); siren(); });
    const againBtn = div('tool roundbtn againfire', '<span>🔥</span>', fireTray);
    againBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (out < fires.length) return sfx.boing();
      againBtn.classList.remove('on');
      sounds.crackle();
      lightFires();
      sayC(LINES.again);
    });
    lightFires();
    const crackle = setInterval(() => {
      if (!g.screen.isConnected) return clearInterval(crackle);
      if (g.station()?.id === 'blaze' && fires.some(f => f.hp > 0)) sounds.crackle();
    }, 1800);

    g.setStations([
      { id: 'station', icon: '🚒', panel: station, tray: stationTray, hint: () => (onFloor ? goBtn : ff.el.firstChild) },
      { id: 'blaze', icon: '🔥', panel: scene, tray: fireTray, hint: () => (fires.some(f => f.hp > 0) ? hose : rescued ? againBtn : ladderBtn) },
    ]);
    setTimeout(() => sayC(LINES.hello), 400);

    function leave() {
      clearInterval(crackle);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__fire = { get fires() { return fires; }, get out() { return out; }, get rescued() { return rescued; }, raiseLadder, slideDown, putOut, hose };
  },
};
