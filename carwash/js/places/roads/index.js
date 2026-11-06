// Busy Town Roads: drive the bus along a street with the pedals. Stop at red lights
// (tap a light to change it), pick up friends at bus stops (each shows where they
// want to go) and drop them at the shop, park, home or ice cream stand. A puddle
// splashes the bus with mud and the drive-through wash cleans it.

import { div, rand, pick, frames, wait, useStyle } from '../../core/stage.js';
import { sfx, HORNS, tone } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { Car } from '../garage/car.js';
import { LINES, EXTRA as COUNT } from './lines.js';

const L = 4200; // length of the street
const ROAD = 790; // where the bus's wheels touch
const BUS_W = 520;
const PLACES = {
  home: { x: 250, icon: '🏠' },
  shop: { x: 1900, icon: '🛒' },
  park: { x: 3050, icon: '🌳' },
  ice: { x: 3850, icon: '🍦' },
};
const STOPS = [750, 2350];
const LIGHTS = [1150, 2700];
const PUDDLE = 1500;
const WASH = 3400;
const GREEN = 7;
const YELLOW = 2;
const RED = 5;

export default {
  id: 'roads',
  open(ctx) {
    useStyle('js/places/roads/style.css');
    document.body.dataset.screen = 'roads';
    const g = makeScene({ cls: 'roads', onHome: leave });
    const { fx } = g;

    const panel = div('panel p-roads', `<div class="sky"><div class="cloud c1"></div><div class="cloud c2"></div></div><div class="far"></div>`);
    const back = div('strip back', '<div class="sidewalk"></div><div class="road"><div class="dash"></div></div><div class="grass"></div>', panel);
    const busLayer = div('buslayer', '', panel);
    const front = div('strip front', '', panel);
    back.style.width = front.style.width = `${L}px`;

    // ---- places along the street ---------------------------------------------------
    const placeEls = {};
    for (const [id, p] of Object.entries(PLACES)) {
      const el = div(`spot spot-${id}`, `<div class="art"></div><div class="sign">${p.icon}</div>`, back);
      el.style.left = `${p.x - 160}px`;
      placeEls[id] = el;
    }
    div('fence fl', '', back);
    div('fence fr', '', back).style.left = `${L - 60}px`;
    const stopEls = STOPS.map(x => {
      const el = div('busstop', '<div class="pole"></div><div class="disc">🚌</div><div class="bench"></div>', back);
      el.style.left = `${x - 60}px`;
      return el;
    });
    const puddle = div('puddle', '', back);
    puddle.style.left = `${PUDDLE - 110}px`;
    const washBack = div('wash back', '<div class="sign">🧽</div>', back);
    const washFront = div('wash front', '<div class="brush b1"></div><div class="brush b2"></div>', front);
    washBack.style.left = washFront.style.left = `${WASH - 110}px`;

    // Traffic lights: tap one to change it.
    const lights = LIGHTS.map(x => {
      const el = div('light', '<div class="pole"></div><div class="box"><i class="r"></i><i class="y"></i><i class="g"></i></div><div class="line l"></div><div class="line r2"></div>', back);
      el.style.left = `${x - 40}px`;
      const l = { x, el, color: 'green', t: rand(0, GREEN) };
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        sfx.tap();
        setLight(l, l.color === 'green' ? 'yellow' : l.color === 'yellow' ? 'red' : 'green');
      });
      setLight(l, Math.random() < 0.5 ? 'green' : 'red');
      return l;
    });
    function setLight(l, color) {
      l.color = color;
      l.t = 0;
      l.el.dataset.color = color;
    }

    // ---- the bus -------------------------------------------------------------------
    const driver = pick(FRIEND_KINDS);
    const bus = new Car({
      id: 'roadbus', type: 'bus', driver, passengers: [null, null, null, null], color: 'yellow', wheels: ['classic', 'classic'], pump: [1, 1],
      topper: null, horn: 'honk', stickers: [], paintURL: null, mudSeed: 0,
    }, { width: BUS_W, res: 0.9 });
    const busWrap = div('buswrap', '', busLayer);
    busWrap.appendChild(bus.el);
    const BUS_H = (BUS_W * 320) / 600;
    const busTop = ROAD - (302 / 320) * BUS_H;
    const riders = [null, null, null, null]; // where each passenger wants to go
    const bubbles = riders.map(() => div('wantbubble', '', busLayer));
    let x = 560;
    let v = 0;
    let dir = 1;
    let throttle = 0;
    let cam = 0;
    let waitingAtRed = null;

    // ---- friends waiting at the stops ------------------------------------------------
    const waiting = STOPS.map(() => []);
    function addWaiter(si) {
      if (waiting[si].length >= 2) return;
      const used = new Set([driver, ...riders.filter(Boolean).map(r => r.kind), ...waiting.flat().map(w => w.kind)]);
      const kind = pick(FRIEND_KINDS.filter(k => !used.has(k))) || pick(FRIEND_KINDS);
      const want = pick(Object.keys(PLACES).filter(p => Math.abs(PLACES[p].x - STOPS[si]) > 400));
      const f = new Friend(kind, { outfit: pick(OUTFITS), width: 86, parent: back });
      f.el.classList.add('waiter');
      const wx = STOPS[si] + 70 + waiting[si].length * 70;
      f.el.style.left = `${wx - 43}px`;
      const bub = div('wantbubble on', PLACES[want].icon, f.el);
      void bub;
      const w = { kind, want, f, x: wx };
      f.el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        f.play('wave', 1200);
        talk(kind, LINES[want]);
      });
      waiting[si].push(w);
    }
    STOPS.forEach((_, i) => { addWaiter(i); addWaiter(i); });

    // ---- controls ------------------------------------------------------------------
    const tray = div('tray-row');
    const pedal = (cls, icon, d) => {
      const b = div(`tool pedal ${cls}`, `<span>${icon}</span>`, tray);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        throttle = d;
        b.classList.add('down');
        if (d !== dir && Math.abs(v) < 40) {
          dir = d;
          busWrap.classList.toggle('left', dir < 0);
        }
        sfx.vroom();
      });
      const up = () => {
        if (throttle === d) throttle = 0;
        b.classList.remove('down');
      };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
      return b;
    };
    pedal('back', '⬅️', -1);
    const horn = div('tool hornbtn', '<span>📯</span>', tray);
    horn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      HORNS.honk();
      bus.play('honk', 400);
      bus.mood('happy', 800);
      waiting.flat().forEach(w => {
        if (Math.abs(w.x - x) < 700) w.f.play('wave', 1200);
      });
    });
    const goPedal = pedal('go', '➡️', 1);
    bus.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      HORNS.honk();
      bus.mood('giggle', 900);
    });

    // ---- the drive loop ---------------------------------------------------------------
    let busy = false; // boarding or dropping off
    let stillFor = 0;
    let lastMud = 0;
    let lastWash = 0;
    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      // lights cycle by themselves
      for (const l of lights) {
        l.t += dt;
        if (l.color === 'green' && l.t > GREEN) setLight(l, 'yellow');
        else if (l.color === 'yellow' && l.t > YELLOW) setLight(l, 'red');
        else if (l.color === 'red' && l.t > RED) {
          setLight(l, 'green');
          if (waitingAtRed === l) {
            talk(driver, LINES.green);
            waitingAtRed = null;
          }
        }
      }
      // speed: pedal toward a top speed, coast to a stop without it
      const max = 430;
      let target = busy ? 0 : throttle === dir ? max : 0;
      const frontX = x + dir * (BUS_W / 2 - 20);
      for (const l of lights) {
        if (l.color === 'green') continue;
        const line = l.x - dir * 70;
        const dist = (line - frontX) * dir;
        if (dist >= -4 && dist < 260) {
          target = Math.min(target, Math.max(0, (dist / 260) * max));
          if (dist < 6 && Math.abs(v) < 30 && throttle === dir && waitingAtRed !== l) {
            waitingAtRed = l;
            talk(driver, LINES.red);
          }
        }
      }
      const acc = target > Math.abs(v) ? 520 : 760;
      const speed = Math.abs(v);
      const ns = speed < target ? Math.min(target, speed + acc * dt) : Math.max(target, speed - acc * dt);
      v = ns * dir;
      x = Math.max(BUS_W / 2 + 40, Math.min(L - BUS_W / 2 - 40, x + v * dt));
      if (x <= BUS_W / 2 + 40 || x >= L - BUS_W / 2 - 40) v = 0;
      bus.driving(Math.abs(v) > 20);

      // camera follows, looking a little ahead
      const want = Math.max(0, Math.min(L - 1400, x - 700 + dir * 180));
      cam += (want - cam) * Math.min(1, dt * 3);
      back.style.transform = front.style.transform = `translateX(${-cam}px)`;
      panel.querySelector('.far').style.transform = `translateX(${-cam * 0.3}px)`;
      busWrap.style.transform = `translate(${x - cam - BUS_W / 2}px,${busTop}px)`;

      // passenger bubbles follow their windows
      bus.v.seats.slice(0, 4).forEach((seat, i) => {
        const b = bubbles[i];
        if (!riders[i]) { b.classList.remove('on'); return; }
        const sx = x - cam + (dir > 0 ? seat.x - 300 : 300 - seat.x) * (BUS_W / 600);
        b.classList.add('on');
        b.textContent = PLACES[riders[i].want].icon;
        b.style.transform = `translate(${sx - 32}px,${busTop - 60}px)`;
      });

      // puddle and wash
      const now = performance.now();
      if (Math.abs(x - PUDDLE) < 120 && Math.abs(v) > 80 && now - lastMud > 1500) {
        lastMud = now;
        for (let i = 0; i < 6; i++) bus.splatMud(bus.randomBodyPoint());
        sfx.splat();
        fx.blobs(PUDDLE - cam, ROAD - 10, '#7a5230', 14);
        bus.mood('wow', 1200);
        talk(driver, LINES.mud, { chatty: true });
      }
      if (Math.abs(x - WASH) < 60 && Math.abs(v) > 20 && now - lastWash > 3000) {
        lastWash = now;
        if (bus.s.mudSeed) {
          bus.clearMud();
          sfx.ta_da();
          for (let i = 0; i < 20; i++) fx.sparkles(x - cam + rand(-250, 250), busTop + rand(20, 240), 10, 1);
          talk(driver, LINES.clean);
        } else fx.bubbles(x - cam, busTop + 100, 10);
        sfx.whoosh();
      }

      // stopped: let friends on or off
      stillFor = Math.abs(v) < 8 ? stillFor + dt : 0;
      if (stillFor > 0.5 && !busy) checkStop();
      return true;
    });

    const doorX = () => x + dir * (BUS_W / 2 - 70);

    async function checkStop() {
      // Drop off anyone who wants this place.
      const here = Object.entries(PLACES).find(([, p]) => Math.abs(p.x - x) < 200);
      if (here && riders.some(r => r && r.want === here[0])) {
        busy = true;
        for (let i = 0; i < 4; i++) {
          const r = riders[i];
          if (!r || r.want !== here[0]) continue;
          riders[i] = null;
          bus.setPassenger(i, null);
          const f = new Friend(r.kind, { outfit: r.outfit, width: 86, parent: back });
          f.el.classList.add('waiter', 'walking');
          f.el.style.left = `${doorX() - 43}px`;
          f.el.animate([{ transform: 'none' }, { transform: `translateX(${PLACES[here[0]].x - doorX()}px)`, opacity: 1, offset: 0.8 }, { transform: `translateX(${PLACES[here[0]].x - doorX()}px) scale(.6)`, opacity: 0 }], { duration: 1400, fill: 'forwards' });
          setTimeout(() => f.el.remove(), 1400);
          f.play('wave', 1400);
          talk(r.kind, LINES.arrive);
          sfx.sparkle();
          wiggle(placeEls[here[0]], 'jump');
          fx.sparkles(PLACES[here[0]].x - cam, 520, 80, 8);
          await wait(900);
          const si = Math.floor(Math.random() * STOPS.length);
          setTimeout(() => addWaiter(si), 4000);
        }
        busy = false;
        return;
      }
      // Pick up friends at a stop.
      const si = STOPS.findIndex(s => Math.abs(s + 100 - doorX()) < 220);
      if (si < 0 || !waiting[si].length) return;
      if (!riders.includes(null)) {
        if (waiting[si].length && performance.now() - (checkStop.lastFull || 0) > 6000) {
          checkStop.lastFull = performance.now();
          talk(driver, LINES.full);
        }
        return;
      }
      busy = true;
      while (waiting[si].length && riders.includes(null)) {
        const w = waiting[si].shift();
        const seat = riders.indexOf(null);
        w.f.el.classList.add('walking');
        w.f.el.querySelector('.wantbubble')?.remove();
        w.f.el.animate([{ transform: 'none' }, { transform: `translateX(${doorX() - w.x}px) scale(.8)`, opacity: 0 }], { duration: 700, fill: 'forwards' });
        talk(w.kind, LINES[w.want]);
        await wait(750);
        w.f.el.remove();
        riders[seat] = { kind: w.kind, want: w.want, outfit: w.f.outfit };
        bus.setPassenger(seat, w.kind);
        sfx.pop();
        bus.play('honk', 300);
        await wait(900);
        talkText(driver, COUNT[riders.filter(Boolean).length - 1]);
        await wait(700);
      }
      // the others shuffle up the stop
      waiting[si].forEach((w, i) => {
        w.x = STOPS[si] + 70 + i * 70;
        w.f.el.style.left = `${w.x - 43}px`;
      });
      busy = false;
    }

    g.setStations([{ id: 'roads', icon: '🚌', panel, tray, hint: () => goPedal }]);

    function leave() {
      stop();
      g.close();
      ctx.exit();
    }

    if (['localhost', '127.0.0.1'].includes(location.hostname)) {
      window.__roads = { get x() { return x; }, set x(n) { x = n; }, get v() { return v; }, riders, waiting, lights, setLight, setThrottle: t => { throttle = t; if (t) { dir = t; busWrap.classList.toggle('left', t < 0); } }, bus };
    }
    setTimeout(() => talk(driver, LINES.hello), 400);
  },
};
