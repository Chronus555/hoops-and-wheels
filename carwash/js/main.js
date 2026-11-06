// Sudsy Town: a town full of open-ended play places (car wash, basketball court,
// and more). No rules, no scores, nothing to lose.
// Title screen -> town map -> a place -> back to the town.

import { stage, div, pick } from './core/stage.js';
import { unlockAudio, toggleMusic, musicOn } from './core/sound.js';
import { stopVoice } from './core/voice.js';
import { Friend, FRIEND_KINDS, OUTFITS } from './core/friends.js';
import { playTime, savePlayTime } from './core/store.js';
import { openTown } from './town/town.js';
import { openGrownups, openRest, minutesLeft } from './town/grownups.js';
import { PLACES } from './town/places.js';

export const APP_NAME = 'Sudsy Town';
let where = 'title'; // 'title' | 'town' | 'rest' | a place id

function title() {
  document.body.dataset.screen = 'title';
  const [first, second] = APP_NAME.split(' ');
  const s = div('screen title', `<div class="bubbles">${'<i></i>'.repeat(14)}</div>
    <h1><span>${first}</span><span>${second}</span></h1><div class="titlefriends"></div>
    <div class="play"><svg viewBox="0 0 100 100"><path d="M36,24 L80,50 L36,76 Z" fill="#fff"/></svg></div>`, stage);
  const row = s.querySelector('.titlefriends');
  const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5).slice(0, 3);
  const friends = kinds.map(k => new Friend(k, { outfit: pick(OUTFITS), width: 130, parent: row }));
  const wave = setInterval(() => {
    const f = pick(friends);
    f.play('wave', 1400);
    f.mood('happy', 1400);
  }, 1600);
  s.addEventListener('pointerdown', () => {
    clearInterval(wave);
    unlockAudio();
    s.classList.add('fade');
    setTimeout(() => {
      s.remove();
      town();
    }, 350);
  }, { once: true });
}

function town(focusId) {
  if (minutesLeft() <= 0) return rest();
  where = 'town';
  openTown({
    focusId,
    onEnter: enter,
    onGrownups: () => openGrownups({ onClose: () => {} }),
  });
}

async function enter(id) {
  const place = PLACES.find(p => p.id === id);
  const mod = await place.load();
  where = id;
  mod.default.open({ exit: () => town(id) });
}

function rest() {
  where = 'rest';
  stopVoice();
  if (musicOn()) toggleMusic();
  stage.innerHTML = '';
  openRest({
    onGrownups: restScreen => openGrownups({
      onClose: () => {
        if (minutesLeft() > 0) {
          restScreen.remove();
          town();
        }
      },
    }),
  });
}

// Daily play time: counted while the app is on screen. When it runs out, the town
// goes to sleep. A place that's open gets two extra minutes to finish up.
setInterval(() => {
  if (document.visibilityState !== 'visible' || where === 'title' || where === 'rest') return;
  const t = playTime();
  t.seconds += 5;
  savePlayTime(t);
  const left = minutesLeft();
  if (left <= 0 && (where === 'town' || left <= -2)) rest();
}, 5000);

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
title();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
