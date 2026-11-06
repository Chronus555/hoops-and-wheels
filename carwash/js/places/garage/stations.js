// The five garage stations. Each one returns a wall panel (the room behind the car),
// a tray of tools, and optional enter/leave/hint/carDown hooks.

import { div, rand, pick, wait, frames, dist } from '../../core/stage.js';
import { makeTool, dragThing } from '../../core/tools.js';
import { sfx, loop, HORNS, toggleMusic } from '../../core/sound.js';
import { TOOLS, WHEELS, WHEEL_TYPES, TOPPERS, TOPPER_TYPES, STICKERS, SHEET_STICKERS, BIG_STICKERS, COLORS, COLOR_NAMES, RAINBOW, NUMBER_WORDS } from './art.js';
import { CAR_X, CAR_W, CAR_Y, FLOOR_Y } from './layout.js';

const throttle = ms => {
  let last = 0;
  return () => {
    const now = performance.now();
    if (now - last < ms) return false;
    last = now;
    return true;
  };
};
const at = (node, x, y) => {
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  return node;
};
const rainbowDefs = '<defs><linearGradient id="rbt" x1="0" x2="1">' + RAINBOW.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('') + '</linearGradient></defs>';
const hexOf = name => (name === 'rainbow' ? 'url(#rbt)' : COLORS[name]);
const withDefs = svg => svg.replace(/(<svg[^>]*>)/, `$1${rainbowDefs}`);

// ---- 1. wash ----------------------------------------------------------------------

export function washStation(g) {
  const { car, fx } = g;
  const panel = div('panel p-wash', `<div class="wall"></div><div class="floor"></div><div class="drain"></div>
    <div class="window"><div class="cloud"></div></div><div class="shelf"></div>`);
  const lever = at(div('lever', `<svg viewBox="0 0 170 320">
    <g class="arm"><rect x="78" y="34" width="14" height="110" rx="7" fill="#6c757d"/><circle cx="85" cy="34" r="26" fill="#ef476f"/><circle cx="77" cy="26" r="8" fill="#fff" opacity=".6"/></g>
    <rect x="12" y="130" width="146" height="180" rx="22" fill="#457b9d"/><rect x="30" y="150" width="110" height="80" rx="12" fill="#a8dadc"/>
    <g fill="#fff"><circle cx="58" cy="190" r="16"/><circle cx="86" cy="178" r="12"/><circle cx="108" cy="198" r="14"/></g>
    <rect x="60" y="250" width="50" height="30" rx="8" fill="#1d3557"/></svg>`, panel), 70, 300);
  const duck = at(div('duck', `<svg viewBox="0 0 120 100"><ellipse cx="58" cy="70" rx="46" ry="26" fill="#ffd166"/><circle cx="84" cy="36" r="24" fill="#ffd166"/>
    <path d="M104,38 L122,44 L104,50 Z" fill="#f8961e"/><circle cx="90" cy="30" r="4.5" fill="#222"/><path d="M26,62 Q44,50 60,64" stroke="#e9b949" stroke-width="5" fill="none"/></svg>`, panel), 1170, 392);
  duck.addEventListener('pointerdown', e => {
    e.stopPropagation();
    sfx.squeak();
    setTimeout(sfx.squeak, 120);
    duck.classList.remove('jump');
    void duck.offsetWidth;
    duck.classList.add('jump');
    fx.bubbles(1230, 420, 6);
  });
  lever.addEventListener('pointerdown', e => {
    e.stopPropagation();
    autoWash();
  });

  const squish = throttle(150);
  const pops = throttle(90);
  const squeak = throttle(220);
  const splats = throttle(170);

  const sponge = makeTool(g, {
    art: TOOLS.sponge, w: 120, h: 90, grab: [0, -36], auto: true,
    apply(cp, sp, on, { moving, auto }) {
      if (!on) return;
      car.scrub(cp, auto ? 46 : 30, 0.5);
      if (moving && Math.random() < 0.45) car.addFoam(cp, 24, 1);
      if (squish()) sfx.squish();
      if (car.onDriver(cp)) {
        car.mood('giggle', 900);
        g.talk('tickle', { chatty: true });
      } else g.talk('scrub', { chatty: true });
      g.checkClean();
    },
  });
  const soap = makeTool(g, {
    art: TOOLS.soap, w: 90, h: 126, grab: [0, -50], hot: [0, -40], auto: true,
    apply(cp, sp, on, { moving }) {
      if (Math.random() < 0.08) fx.bubbles(sp.x, sp.y, 1);
      if (!on || (!moving && Math.random() < 0.7)) return;
      car.addFoam(cp, 40, 3);
      car.scrub(cp, 30, 0.12);
      if (pops()) sfx.bubble();
      g.talk('bubbles', { chatty: true });
      g.checkClean();
    },
  });
  const hose = makeTool(g, {
    art: TOOLS.hose, w: 100, h: 128, grab: [0, -70], hot: [14, 100], sound: 'water', auto: true,
    apply(cp, sp, on, { first, center, auto }) {
      if (first) fx.water({ x: center.x + 16, y: center.y + 56 }, sp, 3);
      if (!on) {
        if (first && Math.random() < 0.1) fx.splash(sp.x, sp.y, undefined, 3);
        return;
      }
      car.rinse(cp, auto ? 60 : 46);
      car.mood('squint', 700);
      g.talk('splash', { chatty: true });
      if (first && Math.random() < 0.12) sfx.drip();
      g.checkClean();
    },
  });
  const towel = makeTool(g, {
    art: TOOLS.towel, w: 120, h: 90, grab: [0, -36], auto: true,
    apply(cp, sp, on, { auto }) {
      if (!on) return;
      car.wipe(cp, auto ? 58 : 42);
      if (squeak()) {
        sfx.squeak();
        fx.sparkles(sp.x, sp.y, 30, 1);
      }
      g.talk('dry', { chatty: true });
      g.checkClean();
    },
  });
  const mud = makeTool(g, {
    art: TOOLS.mud, w: 110, h: 110, grab: [0, -50], hot: [0, -10], tilt: 25,
    apply(cp, sp, on) {
      if (!on || !splats()) return;
      car.splatMud(cp);
      sfx.splat();
      fx.blobs(sp.x, sp.y, '#7a5230', 4);
      car.mood('wow', 900);
      car.dirty = true;
      g.talk('mud', { chatty: true });
    },
    tap() {
      car.mood('wow', 1500);
      g.talk('mud');
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const cp = car.randomBodyPoint();
          car.splatMud(cp);
          const sp = g.toStage(cp);
          fx.blobs(sp.x, sp.y, '#7a5230', 5);
          sfx.splat();
        }, i * 110);
      }
      car.dirty = true;
    },
  });
  const tray = div('tray-row');
  tray.append(sponge, soap, hose, towel, mud);

  // The automatic wash: brushes, then a water curtain, then the dryer.
  function band(stageX, fn) {
    const c = g.toCar({ x: stageX, y: CAR_Y + 170 });
    for (let y = 26; y <= 314; y += 12) {
      const p = { x: c.x + rand(-12, 12), y };
      if (car.onCar(p)) fn(p);
    }
  }
  function pass(kind, from, to, dur, fn, sound) {
    return new Promise(res => {
      const arch = div(`arch ${kind}`, '<div class="a-top"></div><div class="a-body"></div>', g.layer);
      const stop = sound ? loop(sound) : null;
      const t0 = performance.now();
      const dir = Math.sign(to - from);
      let lastX = from;
      frames((dt, now) => {
        const t = Math.min(1, (now - t0) / dur);
        const x = from + (to - from) * t;
        arch.style.transform = `translateX(${x - 70}px)`;
        // Cover every spot passed since the last frame, even if frames were dropped.
        for (let xx = lastX; dir * (x - xx) > 0; xx += dir * 14) fn(xx);
        fn(x);
        lastX = x;
        if (kind === 'water') {
          for (let i = 0; i < 2; i++) fx.add({ kind: 'drop', x: x + rand(-50, 50), y: 250, vy: rand(250, 450), g: 900, r: rand(3, 6), life: 0.9, color: 'rgba(120,200,255,.85)' });
        }
        if (kind === 'dryer' && Math.random() < 0.35) fx.sparkles(x, rand(CAR_Y + 40, FLOOR_Y - 40), 30, 1);
        if (t >= 1) {
          arch.remove();
          stop?.();
          res();
          return false;
        }
        return true;
      });
    });
  }
  async function autoWash() {
    if (g.busy()) return;
    g.setBusy(true);
    lever.classList.remove('pulled');
    void lever.offsetWidth;
    lever.classList.add('pulled');
    sfx.clank();
    await wait(350);
    const left = CAR_X - 160;
    const right = CAR_X + CAR_W + 160;
    car.mood('squint', 0);
    g.talk('splash');
    await pass('brush', left, right, 2300, x => band(x, p => {
      car.scrub(p, 34, 0.5);
      if (Math.random() < 0.5) car.addFoam(p, 22, 1);
    }), 'brush');
    g.talk('bubbles');
    await pass('water', right, left, 2000, x => band(x, p => car.rinse(p, 42)), 'water');
    sfx.whoosh();
    await pass('dryer', left, right, 1500, x => band(x, p => car.wipe(p, 42)));
    car.mood('', 1);
    g.setBusy(false);
    lever.classList.remove('pulled');
    g.checkClean(true);
  }

  return {
    id: 'wash',
    icon: '🧽',
    panel,
    tray,
    hint: () => (car.coverage().mud > 0.05 ? sponge : hose),
  };
}

// ---- 2. fix-it ------------------------------------------------------------------

// How much room each topper needs on the shelf, so small ones aren't tiny.
const TOPPER_BOX = {
  siren: '-75 -80 150 92',
  hoop: '-90 -198 180 208',
  crown: '-80 -100 160 112',
  propeller: '-86 -92 172 104',
  rocket: '-160 -100 280 112',
  cone: '-75 -148 150 160',
};

export function fixStation(g) {
  const { car, fx } = g;
  const panel = div('panel p-fix', `<div class="wall"></div><div class="floor"></div>
    <div class="board rack"></div><div class="board shelves"><i></i><i></i><i></i></div>`);
  const lift = at(div('lift', '<div class="scissor"></div><div class="plate"></div>', panel), CAR_X - 30, FLOOR_Y - 6);
  lift.style.width = `${CAR_W + 60}px`;
  let lifted = false;

  // Wheels hang on the rack: drag one onto a wheel, or tap to change both.
  const rolls = throttle(200);
  function rollAway(i, type) {
    const w = car.v.wheels[i];
    const p = g.toStage(w);
    const size = 2 * w.r * (CAR_W / 600) * (WHEELS[type].size || 1) + 12;
    const el = div('rolling', `<svg viewBox="-62 -62 124 124">${WHEELS[type].draw(54)}</svg>`, g.layer);
    el.style.width = el.style.height = `${size}px`;
    el.animate([
      { transform: `translate(${p.x - size / 2}px,${p.y - size / 2}px) rotate(0deg)` },
      { transform: `translate(${p.x - size / 2 - 1100}px,${FLOOR_Y - size}px) rotate(-1000deg)` },
    ], { duration: 1500, easing: 'ease-in' });
    setTimeout(() => el.remove(), 1500);
  }
  function setWheel(i, type) {
    if (car.s.wheels[i] === type && car.s.pump[i] === 1) {
      car.play('hop', 600);
      return;
    }
    rollAway(i, car.s.wheels[i]);
    car.s.wheels[i] = type;
    car.s.pump[i] = 1;
    car.renderWheels();
    sfx.clank();
    car.play('hop', 600);
    car.mood('wow', 900);
    const p = g.toStage(car.v.wheels[i]);
    fx.sparkles(p.x, p.y, 40, 5);
  }
  function wheelLine(type) {
    g.talk(type === 'square' ? 'bumpy' : type === 'monster' ? 'pump' : 'wheels', { chatty: true });
  }
  const rack = WHEEL_TYPES.map((type, n) => {
    const t = makeTool(g, {
      art: `<svg viewBox="-62 -62 124 124">${WHEELS[type].draw(52)}</svg>`, w: 112, h: 112, grab: [0, 0],
      drop(cp, sp, on) {
        const ws = car.v.wheels;
        const d = ws.map(w => dist(cp, w));
        const i = d[0] < d[1] ? 0 : 1;
        if (!on && d[i] > ws[i].r * 2.4) return false;
        setWheel(i, type);
        wheelLine(type);
        return true;
      },
      tap() {
        if (!rolls()) return;
        setWheel(0, type);
        setTimeout(() => setWheel(1, type), 200);
        wheelLine(type);
      },
    });
    t.classList.add('rack-wheel');
    at(t, 62 + (n % 2) * 150, 150 + Math.floor(n / 2) * 150);
    panel.appendChild(t);
    return t;
  });

  // Roof toppers sit on the shelves: tap to put one on, tap again to take it off.
  TOPPER_TYPES.forEach((type, n) => {
    const item = at(div('topper-item', `<svg viewBox="${TOPPER_BOX[type]}">${TOPPERS[type]}</svg>`, panel), 1082 + (n % 2) * 140, 176 + Math.floor(n / 2) * 196);
    item.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (g.busy()) return;
      item.classList.remove('jump');
      void item.offsetWidth;
      item.classList.add('jump');
      if (car.s.topper === type) {
        car.s.topper = null;
        car.renderTopper();
        sfx.peel();
        return;
      }
      car.s.topper = type;
      car.renderTopper();
      sfx.clank();
      setTimeout(() => g.topperAction(), 250);
    });
  });

  const radio = at(div('radio', `<svg viewBox="0 0 150 100"><rect x="10" y="22" width="130" height="74" rx="16" fill="#e76f51"/><path d="M40,22 L100,2" stroke="#495057" stroke-width="5" stroke-linecap="round"/>
    <circle cx="48" cy="60" r="24" fill="#264653"/><circle cx="48" cy="60" r="10" fill="#2a9d8f"/><rect x="84" y="40" width="44" height="14" rx="5" fill="#f4a261"/><circle cx="96" cy="74" r="7" fill="#264653"/><circle cx="118" cy="74" r="7" fill="#264653"/></svg><div class="notes">♪ ♫ ♪</div>`, panel), 600, 140);
  radio.addEventListener('pointerdown', e => {
    e.stopPropagation();
    const on = toggleMusic();
    radio.classList.toggle('on', on);
    car.el.classList.toggle('dance', on);
    if (on) g.talk('dance');
  });

  // Tray: lift, tyre pump, horns, wrench.
  const liftBtn = makeTool(g, {
    art: TOOLS.lift, w: 110, h: 110,
    tap() { setLift(!lifted); },
  });
  async function setLift(up) {
    if (lifted === up) return;
    lifted = up;
    lift.classList.toggle('up', up);
    g.carwrap.style.transition = 'transform 1.1s ease-in-out';
    g.carwrap.style.transform = up ? 'translateY(-150px)' : '';
    sfx.lift();
    car.mood('wow', 1200);
    g.talk(up ? 'up' : 'down');
    await wait(1100);
  }
  const pump = makeTool(g, {
    art: TOOLS.pump, w: 80, h: 128,
    tap(node) {
      node.classList.remove('press');
      void node.offsetWidth;
      node.classList.add('press');
      if (car.s.pump[0] >= 1.45) {
        car.s.pump = [1, 1];
        car.renderWheels();
        sfx.deflate();
        car.mood('wow', 1500);
        car.play('hop', 600);
        g.talk('pop');
        return;
      }
      car.s.pump = car.s.pump.map(p => Math.round((p + 0.15) * 100) / 100);
      car.renderWheels();
      sfx.pump();
      car.play('hop', 500);
      g.talk('pump', { chatty: true });
    },
  });
  const horns = Object.entries({ honk: '📯', quack: '🦆', moo: '🐮', toot: '🎺' }).map(([k, icon]) => {
    const b = div(`horn${car.s.horn === k ? ' on' : ''}`, `<span>${icon}</span>`);
    b.addEventListener('pointerdown', e => {
      e.stopPropagation();
      car.s.horn = k;
      horns.forEach(h => h.classList.toggle('on', h === b));
      HORNS[k]();
      car.play('honk', 400);
      car.mood('happy', 900);
    });
    return b;
  });
  const clanks = throttle(260);
  const wrench = makeTool(g, {
    art: TOOLS.wrench, w: 100, h: 100, grab: [0, -40], hot: [24, -26],
    apply(cp, sp, on) {
      if (!on || !clanks()) return;
      sfx.clank();
      fx.sparkles(sp.x, sp.y, 16, 3);
      car.play('honk', 300);
      g.talk('fix', { chatty: true });
    },
    tap() {
      sfx.clank();
      setTimeout(sfx.clank, 180);
      const p = g.toStage(car.randomBodyPoint());
      fx.sparkles(p.x, p.y, 30, 6);
      car.play('honk', 300);
      g.talk('fix');
    },
  });
  const tray = div('tray-row');
  const hornBox = div('horn-box');
  hornBox.append(...horns);
  tray.append(liftBtn, pump, hornBox, wrench);

  return {
    id: 'fix',
    icon: '🔧',
    panel,
    tray,
    hint: () => pick(rack),
    async leave() {
      if (lifted) await setLift(false);
    },
  };
}

// ---- 3. paint -------------------------------------------------------------------

export function paintStation(g) {
  const { car, fx } = g;
  const panel = div('panel p-paint', `<div class="wall"></div><div class="floor"></div>
    <div class="splat s1"></div><div class="splat s2"></div><div class="splat s3"></div><div class="splat s4"></div><div class="splat s5"></div>
    <div class="lamp l1"></div><div class="lamp l2"></div>`);

  async function pour(color) {
    if (g.busy()) return;
    g.setBusy(true);
    const hex = color === 'rainbow' ? RAINBOW : [COLORS[color]];
    sfx.gloop();
    for (let i = 0; i < 16; i++) {
      const p = g.toStage({ x: 50 + i * 33, y: 70 });
      fx.add({ kind: 'drop', x: p.x + rand(-10, 10), y: p.y - 140 - rand(0, 80), vx: rand(-15, 15), vy: rand(250, 450), g: 1500, r: rand(12, 22), life: 0.42, color: hex[i % hex.length] });
    }
    await wait(330);
    car.clearPaint();
    car.setColor(color);
    sfx.splat();
    car.play('honk', 400);
    car.mood('happy', 1800);
    const l = g.toStage({ x: 40, y: 220 });
    const r = g.toStage({ x: 570, y: 220 });
    fx.blobs(l.x, l.y, hex[0], 5);
    fx.blobs(r.x, r.y, hex[hex.length - 1], 5);
    g.setBusy(false);
    await g.talk(color);
    if (Math.random() < 0.45) g.talk('paint');
  }

  const buckets = COLOR_NAMES.map(name => {
    const t = makeTool(g, {
      art: withDefs(TOOLS.bucket(hexOf(name))), w: 96, h: 106, grab: [0, -40], tilt: -20,
      tap: () => pour(name),
      drop(cp, sp, on) {
        if (!on) return false;
        pour(name);
        return true;
      },
    });
    t.dataset.color = name;
    return t;
  });

  let canColor = 0;
  const canHex = () => {
    const name = COLOR_NAMES[canColor];
    return name === 'rainbow' ? `hsl(${(performance.now() / 4) % 360},90%,60%)` : COLORS[name];
  };
  const hiss = throttle(400);
  const can = makeTool(g, {
    art: withDefs(TOOLS.can(hexOf(COLOR_NAMES[0]))), w: 76, h: 132, grab: [0, -16], hot: [52, -112], tilt: 25, sound: 'spray',
    apply(cp, sp, on, { first, center }) {
      const color = canHex();
      if (first) fx.mist({ x: center.x + 26, y: center.y - 56 }, sp, color, 3);
      if (car.inBody(cp)) {
        car.sprayPaint(cp, color);
        if (hiss()) car.mood('happy', 800);
      }
    },
    tap(node) {
      canColor = (canColor + 1) % COLOR_NAMES.length;
      node.innerHTML = withDefs(TOOLS.can(hexOf(COLOR_NAMES[canColor])));
      sfx.tap();
      g.talk(COLOR_NAMES[canColor]);
    },
  });
  const tray = div('tray-row');
  tray.append(...buckets, can);

  return {
    id: 'paint',
    icon: '🎨',
    panel,
    tray,
    hint: () => pick(buckets),
  };
}

// ---- 4. stickers -------------------------------------------------------------------

export function stickerStation(g) {
  const { car, fx } = g;
  const panel = div('panel p-stickers', `<div class="wall"></div><div class="floor"></div>
    <div class="cork left"></div><div class="cork right"></div><div class="bunting"></div>`);
  const scale = (CAR_W / 600) * 0.78;
  const art = k => {
    const big = STICKERS[k].big;
    return `<svg viewBox="${big ? '-115 -40 230 80' : '-45 -45 90 90'}">${STICKERS[k].svg}</svg>`;
  };
  const sizeOf = k => (STICKERS[k].big ? [230 * (CAR_W / 600), 80 * (CAR_W / 600)] : [90 * scale, 90 * scale]);

  function addSticker(k, cp) {
    car.s.stickers.push({ k, x: cp.x, y: cp.y, rot: STICKERS[k].big ? rand(-4, 4) : rand(-14, 14) });
    if (car.s.stickers.length > 30) car.s.stickers.shift();
    car.renderStickers();
    car.wiggleSticker(car.s.stickers.length - 1);
    sfx.sticker();
    const sp = g.toStage(cp);
    fx.sparkles(sp.x, sp.y, 30, 4);
    car.mood('happy', 1000);
    g.talkText(STICKERS[k].say);
  }

  function stickerTool(k, w, h) {
    return makeTool(g, {
      art: art(k), w, h, grab: [0, -30],
      drop(cp) {
        if (!car.inBody(cp)) return false;
        addSticker(k, cp);
        return true;
      },
      tap() {
        let cp = car.randomBodyPoint();
        if (STICKERS[k].big) cp = { x: rand(170, 430), y: rand(190, 225) };
        addSticker(k, cp);
      },
    });
  }

  for (let n = 0; n <= 9; n++) {
    const t = stickerTool(`n${n}`, 92, 92);
    at(t, 70 + (n % 2) * 120, 150 + Math.floor(n / 2) * 118);
    panel.appendChild(t);
  }
  BIG_STICKERS.forEach((k, n) => {
    const t = stickerTool(k, 250, 87);
    t.classList.add('big-sticker');
    at(t, 1100, 170 + n * 140);
    panel.appendChild(t);
  });
  const sheet = SHEET_STICKERS.map(k => stickerTool(k, 96, 96));
  const tray = div('tray-row stickers-row');
  tray.append(...sheet);

  // Stickers already on the car can be moved, or pulled off and dropped away.
  function carDown(e, p) {
    const i = car.stickerAt(p);
    if (i < 0 || !car.inBody(p)) return false;
    const st = car.s.stickers[i];
    let ghost = null;
    const [w, h] = sizeOf(st.k);
    dragThing(e, {
      move: sp => {
        if (!ghost) {
          car.s.stickers.splice(car.s.stickers.indexOf(st), 1);
          car.renderStickers();
          ghost = div('ghost', art(st.k), g.dragLayer);
          ghost.style.width = `${w}px`;
          ghost.style.height = `${h}px`;
          sfx.peel();
        }
        ghost.style.transform = `translate(${sp.x - w / 2}px,${sp.y - h / 2}px) rotate(${st.rot}deg)`;
      },
      end: (sp, moved) => {
        if (!moved) {
          car.wiggleSticker(i);
          sfx.pop();
          g.talkText(STICKERS[st.k].say);
          return;
        }
        const cp = g.toCar(sp);
        if (car.inBody(cp)) {
          ghost.remove();
          addSticker(st.k, cp);
          car.s.stickers[car.s.stickers.length - 1].rot = st.rot;
          car.renderStickers();
        } else {
          sfx.peel();
          const from = ghost.style.transform;
          ghost.animate([{ transform: from, opacity: 1 }, { transform: `${from} translateY(420px) rotate(80deg)`, opacity: 0 }], { duration: 700, easing: 'ease-in' });
          setTimeout(() => ghost.remove(), 680);
        }
      },
    });
    return true;
  }

  return {
    id: 'stickers',
    icon: '⭐',
    panel,
    tray,
    carDown,
    hint: () => sheet[0],
  };
}

// ---- 5. fuel and goodbye -----------------------------------------------------------

export function fuelStation(g) {
  const { car, fx } = g;
  const panel = div('panel p-fuel', `<div class="wall"></div><div class="floor"></div>
    <div class="door"><div class="sky"></div><div class="hill"></div><div class="road"></div></div>
    <svg class="hose" viewBox="0 0 1400 1000"><path d=""/></svg>
    <div class="pump"><div class="pump-top">⛽</div><div class="screen"><b>0</b></div><div class="gauge"><i></i></div><div class="hook"></div></div>`);
  const hosePath = panel.querySelector('.hose path');
  const display = panel.querySelector('.screen b');
  const gauge = panel.querySelector('.gauge i');
  const nozzle = div('nozzle', `<svg viewBox="0 0 110 80"><path d="M10,30 Q10,14 26,14 H70 Q80,14 80,24 V40 H26 L22,74 H8 Z" fill="#2b2d42"/>
    <rect x="70" y="22" width="40" height="12" rx="5" fill="#adb5bd"/><path d="M30,40 Q34,58 48,56" stroke="#ef476f" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`, g.layer);
  const HOME = { x: 330, y: 470 };
  let pos = { ...HOME };
  let counting = null;
  let n = 0;

  function setNozzle(p, smooth = false) {
    pos = p;
    nozzle.style.transition = smooth ? 'transform .4s ease-out' : '';
    nozzle.style.transform = `translate(${p.x - 55}px,${p.y - 40}px)`;
    const a = { x: 250, y: 650 };
    const b = { x: p.x - 50, y: p.y + 20 };
    const sag = Math.max(a.y, b.y) + 90;
    if (smooth) {
      const start = performance.now();
      const from = { ...b };
      frames((dt, now) => {
        const t = Math.min(1, (now - start) / 400);
        drawHose(a, from, sag);
        return t < 1;
      });
    }
    drawHose(a, b, sag);
  }
  function drawHose(a, b, sag) {
    hosePath.setAttribute('d', `M${a.x},${a.y} Q${(a.x + b.x) / 2},${sag} ${b.x},${b.y}`);
  }
  setNozzle(HOME);

  function stopCount() {
    clearInterval(counting);
    counting = null;
  }
  function goHome() {
    stopCount();
    setNozzle(HOME, true);
  }
  function startCount() {
    stopCount();
    n = 0;
    display.textContent = '0';
    gauge.style.width = '0%';
    counting = setInterval(() => {
      n++;
      display.textContent = String(n);
      gauge.style.width = `${n * 10}%`;
      sfx.glug();
      g.talkText(NUMBER_WORDS[n]);
      fx.bubbles(pos.x + 50, pos.y, 1);
      if (n >= 10) {
        stopCount();
        setTimeout(() => {
          sfx.ding();
          car.mood('happy', 2000);
          car.play('hop', 700);
          g.sparkleCar(16);
          g.talk('full');
        }, 700);
        setTimeout(goHome, 2200);
      }
    }, 850);
  }

  nozzle.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if (g.busy()) return;
    stopCount();
    display.textContent = '0';
    gauge.style.width = '0%';
    sfx.clank();
    dragThing(e, {
      move: p => {
        setNozzle({ x: p.x, y: p.y - 30 });
        const fuel = g.toStage(car.v.fuel);
        nozzle.classList.toggle('near', dist({ x: pos.x + 50, y: pos.y - 12 }, fuel) < 90);
      },
      end: (p, moved) => {
        nozzle.classList.remove('near');
        const fuel = g.toStage(car.v.fuel);
        if (moved && dist({ x: pos.x + 50, y: pos.y - 12 }, fuel) < 90) {
          setNozzle({ x: fuel.x - 50, y: fuel.y + 12 }, true);
          sfx.clank();
          startCount();
        } else if (!moved) {
          // A tap on the nozzle puts it in the car by itself.
          const f = g.toStage(car.v.fuel);
          setNozzle({ x: f.x - 50, y: f.y + 12 }, true);
          setTimeout(startCount, 400);
        } else goHome();
      },
    });
  });

  const camera = makeTool(g, {
    art: TOOLS.camera, w: 130, h: 108,
    async tap() {
      if (g.busy()) return;
      g.setBusy(true);
      car.mood('happy', 2500);
      await g.talk('cheese');
      sfx.shutter();
      g.flash();
      g.sparkleCar(12);
      g.setBusy(false);
    },
  });
  const go = makeTool(g, {
    art: TOOLS.go, w: 70, h: 140, cls: 'golight',
    async tap(node) {
      if (g.busy()) return;
      g.setBusy(true);
      goHome();
      for (const [cls, i] of [['r', 0], ['y', 1], ['g', 2]]) {
        node.dataset.light = cls;
        sfx.beep(i);
        await wait(450);
      }
      delete node.dataset.light;
      g.exit('go');
    },
  });
  const tray = div('tray-row');
  tray.append(camera, go);

  return {
    id: 'fuel',
    icon: '⛽',
    panel,
    tray,
    hint: () => nozzle.firstElementChild,
    // The nozzle sits above the car (so it can plug into it), outside the scrolling
    // room, so it's only shown while this station is on screen.
    enter() {
      display.textContent = '0';
      gauge.style.width = '0%';
      nozzle.classList.add('show');
    },
    leave() {
      goHome();
      nozzle.classList.remove('show');
    },
  };
}
