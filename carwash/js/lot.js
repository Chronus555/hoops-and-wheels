// The parking lot: muddy cars wait on the road, finished cars park in the lot.
// Tap a waiting car to drive it into the garage. Tap a parked car to say hi, then
// tap it again (or its bubble) to bring it back in.

import { div, stage, wait, rand, pick } from './stage.js';
import { Car } from './car.js';
import { FX } from './fx.js';
import { sfx, HORNS } from './sound.js';
import { talk } from './voice.js';
import { state, MAX_PARKED } from './store.js';

const CAR_W = 270;
const CAR_H = (CAR_W * 320) / 600;
const BOTTOM = (302 / 320) * CAR_H;
const DOOR = { x: 1150, y: 470 };
const WAIT_X = [30, 330, 630];
const ROAD_Y = 508;
const spotOf = i => ({ x: 28 + (i % 4) * 340, y: 560 + Math.floor(i / 4) * 222 });

export function openLot({ arrivingId, onPick }) {
  const screen = div('screen lot', `
    <div class="sky"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div></div>
    <div class="hills"></div>
    <div class="road"><div class="dash"></div></div>
    <div class="building"><div class="roof"></div><div class="wallb"></div>
      <div class="sign">Sudsy Garage</div>
      <div class="bubbles"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="door"><div class="brushes"></div></div></div>
    <div class="lotarea"></div>`, stage);
  document.body.dataset.screen = 'lot';
  const area = screen.querySelector('.lotarea');
  const fx = new FX(screen);
  let leaving = false;

  for (let i = 0; i < MAX_PARKED; i++) {
    const s = spotOf(i);
    const spot = div('spot', '<b>P</b>', screen);
    spot.style.left = `${s.x}px`;
    spot.style.top = `${s.y}px`;
  }
  area.style.pointerEvents = 'none';

  function addCar(carState, x, y, kind) {
    const car = new Car(carState, { width: CAR_W, res: 0.5 });
    const wrap = div(`lotcar ${kind}`, '', screen);
    wrap.style.left = `${x}px`;
    wrap.style.top = `${y - BOTTOM}px`;
    wrap.appendChild(car.el);
    wrap.car = car;
    return wrap;
  }

  async function driveIn(wrap) {
    if (leaving) return;
    leaving = true;
    const car = wrap.car;
    talk(car.driver, 'hello');
    car.driving(true);
    sfx.vroom();
    const x0 = parseFloat(wrap.style.left);
    const y0 = parseFloat(wrap.style.top) + BOTTOM;
    const parked = wrap.classList.contains('parked');
    const frames = parked
      ? [{ transform: 'none' }, { transform: `translate(0px,${ROAD_Y - y0}px)`, offset: 0.35 }, { transform: `translate(${DOOR.x - x0 - CAR_W / 2}px,${ROAD_Y - y0}px) scale(.85)`, opacity: 1, offset: 0.9 }, { transform: `translate(${DOOR.x - x0 - CAR_W / 2 + 60}px,${ROAD_Y - y0}px) scale(.8)`, opacity: 0 }]
      : [{ transform: 'none' }, { transform: `translate(${DOOR.x - x0 - CAR_W / 2}px,0) scale(.85)`, opacity: 1, offset: 0.88 }, { transform: `translate(${DOOR.x - x0 - CAR_W / 2 + 60}px,0) scale(.8)`, opacity: 0 }];
    wrap.style.zIndex = 5;
    wrap.animate(frames, { duration: parked ? 1700 : 1300, easing: 'ease-in-out', fill: 'forwards' });
    await wait(parked ? 1600 : 1200);
    screen.classList.add('fade');
    await wait(300);
    screen.remove();
    onPick(car.s.id);
  }

  // Waiting cars on the road.
  const waiting = state.waiting.map((c, i) => {
    const w = addCar(c, WAIT_X[i], ROAD_Y, 'waiting');
    w.addEventListener('pointerdown', () => driveIn(w));
    return w;
  });

  // Finished cars in their spots.
  state.parked.forEach((c, i) => {
    const s = spotOf(i);
    const w = addCar(c, s.x + 30, s.y + 205, 'parked');
    let bubble = null;
    let armed = 0;
    const go = () => driveIn(w);
    w.addEventListener('pointerdown', () => {
      if (leaving) return;
      if (performance.now() - armed < 5000) return go();
      armed = performance.now();
      (HORNS[c.horn] || sfx.honk)();
      w.car.play('honk', 400);
      w.car.mood('happy', 1200);
      talk(c.driver, 'pick');
      bubble?.remove();
      bubble = div('gobubble', '🧽', screen);
      bubble.style.left = `${s.x + 120}px`;
      bubble.style.top = `${s.y - 40}px`;
      bubble.addEventListener('pointerdown', e => {
        e.stopPropagation();
        go();
      });
      setTimeout(() => {
        bubble?.remove();
        bubble = null;
      }, 5000);
    });
    if (c.id === arrivingId) {
      w.animate([
        { transform: `translate(${DOOR.x - s.x - 30 - CAR_W / 2}px,${ROAD_Y - s.y - 205}px) scale(.8)`, opacity: 0 },
        { transform: `translate(${DOOR.x - s.x - 30 - CAR_W / 2 - 80}px,${ROAD_Y - s.y - 205}px) scale(.85)`, opacity: 1, offset: 0.25 },
        { transform: 'none' },
      ], { duration: 1500, easing: 'ease-out' });
      w.car.driving(true);
      setTimeout(() => {
        w.car.driving(false);
        w.car.play('hop', 600);
        fx.sparkles(s.x + 165, s.y + 120, 120, 16);
        sfx.sparkle();
      }, 1500);
    }
  });

  // Waiting cars wiggle now and then, asking to be picked.
  const timer = setInterval(() => {
    if (!screen.isConnected) return clearInterval(timer);
    const w = pick(waiting);
    w.car.play('hop', 600);
    w.car.mood('happy', 900);
    sfx.beep(Math.floor(rand(0, 3)));
  }, 5000);
}
