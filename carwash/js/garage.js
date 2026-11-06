// The garage: one long room with five stations (wash, fix, paint, stickers, fuel).
// The car stays in the middle of the screen and the room scrolls past it.

import { div, stage, toClient, toStage, wait } from './stage.js';
import { Car } from './car.js';
import { FX } from './fx.js';
import { sfx, HORNS, toggleMusic, musicOn } from './sound.js';
import { talk, talkText, stopVoice } from './voice.js';
import { STICKERS } from './art.js';
import { state as saved, save } from './store.js';
import { washStation, fixStation, paintStation, stickerStation, fuelStation } from './stations.js';

import { CAR_W, CAR_X, CAR_Y } from './layout.js';

export function openGarage(state, onExit) {
  const screen = div('screen garage', '', stage);
  const world = div('world', '', screen);
  const carwrap = div('carwrap', '', screen);
  carwrap.style.left = `${CAR_X}px`;
  carwrap.style.top = `${CAR_Y}px`;
  const car = new Car(state, { width: CAR_W, res: 1.5 });
  carwrap.appendChild(car.el);
  const layer = div('layer', '', screen);
  const fx = new FX(screen);
  const nav = div('nav', '', screen);
  const tray = div('tray', '', screen);
  const dragLayer = div('drag', '', screen);
  const flash = div('flash', '', screen);

  let busy = false;
  let cur = 0;
  let lastCheck = 0;

  const g = {
    car,
    fx,
    layer,
    dragLayer,
    carwrap,
    busy: () => busy,
    setBusy: b => { busy = b; },
    toCar: sp => {
      const c = toClient(sp.x, sp.y);
      return car.toCar(c.x, c.y);
    },
    toStage: cp => {
      const c = car.fromCar(cp.x, cp.y);
      return toStage(c.x, c.y);
    },
    talk: (group, opts) => talk(car.driver, group, opts),
    talkText: text => talkText(car.driver, text),
    checkClean(force = false) {
      const now = performance.now();
      if (!force && now - lastCheck < 300) return;
      lastCheck = now;
      const { mud, foam } = car.coverage();
      if (mud > 0.08) car.dirty = true;
      if (car.dirty && mud < 0.025 && foam < 0.05) celebrateClean();
    },
    sparkleCar(n = 30) {
      for (let i = 0; i < n; i++) {
        const p = g.toStage(car.randomBodyPoint());
        fx.sparkles(p.x, p.y, 10, 1);
      }
    },
    flash() {
      flash.classList.remove('go');
      void flash.offsetWidth;
      flash.classList.add('go');
    },
    topperAction,
    exit,
  };

  function celebrateClean() {
    car.dirty = false;
    sfx.ta_da();
    g.sparkleCar(40);
    car.mood('happy', 2200);
    car.play('hop', 700);
    g.talk('clean');
  }

  function topperAction() {
    const t = car.s.topper;
    if (!t) return;
    const roof = g.toStage(car.v.roof);
    car.el.classList.remove(`act-${t}`);
    void car.el.offsetWidth;
    car.el.classList.add(`act-${t}`);
    setTimeout(() => car.el.classList.remove(`act-${t}`), 1600);
    car.mood('happy', 1500);
    if (t === 'siren') sfx.siren();
    if (t === 'crown') {
      sfx.sparkle();
      fx.sparkles(roof.x, roof.y - 60, 60, 10);
    }
    if (t === 'propeller') {
      sfx.whirr();
      car.play('float', 1500);
    }
    if (t === 'rocket') {
      sfx.rocket();
      car.play('blast', 1500);
    }
    if (t === 'cone') {
      sfx.gloop();
      fx.sparkles(roof.x, roof.y - 90, 40, 6);
    }
    if (t === 'hoop') shootHoop(roof);
    g.talk(t);
  }

  function shootHoop(roof) {
    const rim = { x: roof.x, y: roof.y - 128 * (CAR_W / 600) };
    const ball = div('flyball', '<svg viewBox="-32 -32 64 64"><circle r="30" fill="#f28c28"/><g fill="none" stroke="#3a2412" stroke-width="2.5"><path d="M0,-30 V30 M-30,0 H30"/><path d="M-21,-21 Q-8,0 -21,21"/><path d="M21,-21 Q8,0 21,21"/></g></svg>', layer);
    const from = { x: rim.x - 420, y: 700 };
    ball.animate([
      { transform: `translate(${from.x - 30}px,${from.y - 30}px) rotate(0deg)` },
      { transform: `translate(${(from.x + rim.x) / 2 - 30}px,${rim.y - 260}px) rotate(300deg)`, offset: 0.5 },
      { transform: `translate(${rim.x - 30}px,${rim.y - 40}px) rotate(540deg)`, offset: 0.82 },
      { transform: `translate(${rim.x - 30}px,${rim.y + 60}px) rotate(600deg)`, opacity: 1, offset: 0.95 },
      { transform: `translate(${rim.x - 30}px,${rim.y + 90}px) rotate(620deg)`, opacity: 0 },
    ], { duration: 1100, easing: 'linear' });
    setTimeout(() => {
      sfx.swish();
      fx.confetti(rim.x, rim.y, 24);
    }, 900);
    setTimeout(() => ball.remove(), 1100);
  }

  // ---- stations ----------------------------------------------------------------------

  const stations = [washStation(g), fixStation(g), paintStation(g), stickerStation(g), fuelStation(g)];
  stations.forEach((s, i) => {
    s.panel.style.left = `${i * 1400}px`;
    world.appendChild(s.panel);
    s.tray.classList.add('tray-page');
    tray.appendChild(s.tray);
  });

  const home = div('navbtn home', '<svg viewBox="0 0 60 60"><path d="M8,28 L30,10 L52,28 V52 H8 Z" fill="#fff"/><rect x="20" y="32" width="20" height="20" fill="#457b9d"/><path d="M20,38 H40 M20,44 H40" stroke="#fff" stroke-width="2"/></svg>', nav);
  home.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if (!busy) exit('home');
  });
  const navBtns = stations.map((s, i) => {
    const b = div('navbtn', `<span>${s.icon}</span>`, nav);
    b.addEventListener('pointerdown', e => {
      e.stopPropagation();
      goTo(i);
    });
    return b;
  });

  function showStation(i) {
    navBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    stations.forEach((s, k) => s.tray.classList.toggle('on', k === i));
    screen.dataset.station = stations[i].id;
  }

  async function goTo(i) {
    if (busy || i === cur) return;
    busy = true;
    sfx.tap();
    await stations[cur].leave?.();
    stations.forEach(s => s.tray.classList.remove('on'));
    car.driving(true);
    sfx.vroom();
    world.style.transform = `translateX(${-i * 1400}px)`;
    navBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    await wait(1100);
    car.driving(false);
    cur = i;
    showStation(i);
    busy = false;
    stations[i].enter?.();
  }

  async function exit(mode) {
    busy = true;
    stopVoice();
    if (musicOn()) toggleMusic();
    await stations[cur].leave?.();
    if (mode === 'go') {
      g.talk('bye');
      car.driving(true);
      sfx.vroom();
      carwrap.style.transition = 'transform 1.6s cubic-bezier(.5,0,.8,.6)';
      carwrap.style.transform = 'translateX(1200px)';
      await wait(1500);
    } else {
      screen.classList.add('fade');
      await wait(400);
    }
    const result = car.serialize();
    clearInterval(idleTimer);
    document.removeEventListener('visibilitychange', keep);
    screen.remove();
    onExit(result);
  }

  // ---- touching the car ------------------------------------------------------------

  car.el.addEventListener('pointerdown', e => {
    if (busy) return;
    const p = car.toCar(e.clientX, e.clientY);
    if (stations[cur].carDown?.(e, p)) return;
    if (car.onTopper(p)) return topperAction();
    if (!car.onCar(p)) return;
    const si = car.stickerAt(p);
    if (si >= 0 && car.inBody(p)) {
      car.wiggleSticker(si);
      sfx.pop();
      g.talkText(STICKERS[car.s.stickers[si].k].say);
      return;
    }
    if (car.onDriver(p)) {
      car.mood('giggle', 1300);
      sfx.boing();
      g.talk('tickle');
      return;
    }
    (HORNS[car.s.horn] || sfx.honk)();
    car.play('honk', 400);
    car.mood('happy', 800);
  });

  // ---- idle hints: the most useful thing in the station wiggles --------------------

  let idle = 0;
  screen.addEventListener('pointerdown', () => { idle = 0; }, true);
  const idleTimer = setInterval(() => {
    if (!screen.isConnected) return clearInterval(idleTimer);
    idle += 1;
    if (idle % 10 === 0 && !busy) {
      const el = stations[cur].hint?.();
      if (el) {
        el.classList.remove('hint');
        void el.offsetWidth;
        el.classList.add('hint');
        setTimeout(() => el.classList.remove('hint'), 2200);
      }
    }
  }, 1000);

  // ---- arrival -------------------------------------------------------------------

  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__garage = g; // for testing

  // If the iPad app is closed mid-play, keep what was done to the car.
  const keep = () => {
    if (document.visibilityState !== 'hidden' || !screen.isConnected) return;
    saved.current = car.serialize();
    save();
  };
  document.addEventListener('visibilitychange', keep);

  showStation(0);
  (async () => {
    busy = true;
    carwrap.style.transform = 'translateX(-1100px)';
    void carwrap.offsetWidth;
    car.driving(true);
    sfx.vroom();
    carwrap.style.transition = 'transform 1.3s cubic-bezier(.2,.7,.3,1)';
    carwrap.style.transform = 'translateX(0)';
    await wait(1300);
    car.driving(false);
    carwrap.style.transition = '';
    carwrap.style.transform = '';
    busy = false;
    car.mood('happy', 1500);
    g.talk(car.s.mudSeed ? 'muddy' : 'hello');
    stations[0].enter?.();
  })();

  return g;
}
