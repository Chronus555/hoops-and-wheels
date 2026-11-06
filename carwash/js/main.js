// Sudsy Garage: an open-ended car wash and garage to play in. No rules, no scores,
// nothing to lose. Title screen -> parking lot -> garage -> back to the lot.

import { stage, div } from './stage.js';
import { unlockAudio } from './sound.js';
import { openLot } from './lot.js';
import { openGarage } from './garage.js';
import { Car } from './car.js';
import { takeCar, parkCar, newCar } from './store.js';

function title() {
  document.body.dataset.screen = 'title';
  const s = div('screen title', `<div class="bubbles">${'<i></i>'.repeat(14)}</div>
    <h1><span>Sudsy</span><span>Garage</span></h1><div class="titlecar"></div><div class="play"><svg viewBox="0 0 100 100"><path d="M36,24 L80,50 L36,76 Z" fill="#fff"/></svg></div>`, stage);
  const demo = newCar();
  demo.mudSeed = 0;
  demo.color = 'blue';
  demo.type = 'bubble';
  demo.topper = 'crown';
  const car = new Car(demo, { width: 420, res: 0.6 });
  s.querySelector('.titlecar').appendChild(car.el);
  const blink = setInterval(() => car.mood('happy', 900), 3000);
  s.addEventListener('pointerdown', () => {
    clearInterval(blink);
    unlockAudio();
    s.classList.add('fade');
    setTimeout(() => {
      s.remove();
      lot();
    }, 350);
  }, { once: true });
}

function lot(arrivingId) {
  openLot({
    arrivingId,
    onPick(id) {
      const car = takeCar(id);
      if (!car) return lot();
      document.body.dataset.screen = 'garage';
      openGarage(car, saved => {
        parkCar(saved);
        lot(saved.id);
      });
    },
  });
}

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
title();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
