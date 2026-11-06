// The garage: one long room with five stations (wash, fix, paint, stickers, fuel).
// The car stays in the middle of the screen and the room scrolls past it.

import { div, toClient, toStage, wait } from '../../core/stage.js';
import { sfx, HORNS, toggleMusic, musicOn } from '../../core/sound.js';
import { talk, talkText, stopVoice } from '../../core/voice.js';
import { makeScene } from '../../core/scene.js';
import { Car, CAR_PATH } from './car.js';
import { STICKERS } from './art.js';
import { LINES } from './lines.js';
import { state as saved, save } from './store.js';
import { washStation, fixStation, paintStation, stickerStation, fuelStation } from './stations.js';

import { CAR_W, CAR_X, CAR_Y } from './layout.js';

export function openGarage(state, onExit) {
  const g = makeScene({ cls: 'garage', onHome: () => exit('home') });
  const { screen, fx, layer } = g;
  const carwrap = div('carwrap', '', screen);
  carwrap.style.left = `${CAR_X}px`;
  carwrap.style.top = `${CAR_Y}px`;
  const car = new Car(state, { width: CAR_W, res: 1.5 });
  carwrap.appendChild(car.el);
  let lastCheck = 0;

  const toCar = sp => {
    const c = toClient(sp.x, sp.y);
    return car.toCar(c.x, c.y);
  };
  const toStageFromCar = cp => {
    const c = car.fromCar(cp.x, cp.y);
    return toStage(c.x, c.y);
  };
  Object.assign(g, {
    car,
    carwrap,
    toCar,
    toStage: toStageFromCar,
    target: { toLocal: toCar, toStage: toStageFromCar, hit: p => car.onCar(p), autoPath: CAR_PATH },
    onTravel: moving => {
      car.driving(moving);
      if (moving) sfx.vroom();
    },
    talk: (group, opts) => talk(car.driver, LINES[group] || [group], opts),
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
        const p = toStageFromCar(car.randomBodyPoint());
        fx.sparkles(p.x, p.y, 10, 1);
      }
    },
    topperAction,
    exit,
  });

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
  g.setStations(stations);

  async function exit(mode) {
    g.setBusy(true);
    stopVoice();
    if (musicOn()) toggleMusic();
    await g.station().leave?.();
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
    document.removeEventListener('visibilitychange', keep);
    g.close();
    onExit(result);
  }

  // ---- touching the car ------------------------------------------------------------

  car.el.addEventListener('pointerdown', e => {
    if (g.busy()) return;
    const p = car.toCar(e.clientX, e.clientY);
    if (g.station().carDown?.(e, p)) return;
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

  // ---- arrival -------------------------------------------------------------------

  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__garage = g; // for testing

  // If the iPad app is closed mid-play, keep what was done to the car.
  const keep = () => {
    if (document.visibilityState !== 'hidden' || !screen.isConnected) return;
    saved.current = car.serialize();
    save();
  };
  document.addEventListener('visibilitychange', keep);

  (async () => {
    g.setBusy(true);
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
    g.setBusy(false);
    car.mood('happy', 1500);
    g.talk(car.s.mudSeed ? 'muddy' : 'hello');
    stations[0].enter?.();
  })();

  return g;
}
