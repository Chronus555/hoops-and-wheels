// Grown-up corner (reached by holding the 🔒 on the town map) and the bedtime-style
// rest screen shown when the daily play time is used up.

import { div, stage, pick, rand } from '../core/stage.js';
import { sfx } from '../core/sound.js';
import { talk } from '../core/voice.js';
import { Friend, FRIEND_KINDS } from '../core/friends.js';
import { settings, saveSettings, playTime, savePlayTime, clearAll } from '../core/store.js';
import { LINES } from './lines.js';

const LIMITS = [0, 15, 30, 45, 60];

export function minutesLeft() {
  if (!settings.limit) return Infinity;
  const t = playTime();
  return settings.limit + (t.extra || 0) - t.seconds / 60;
}

export function openGrownups({ onClose }) {
  const box = div('screen grownups', '', stage);

  // A sum a pre-reader can't answer: the gate.
  const a = Math.floor(rand(4, 9));
  const b = Math.floor(rand(4, 9));
  const answers = [a + b, a + b + 1, a + b - 2, a + b + 3].sort(() => Math.random() - 0.5);
  box.innerHTML = `<div class="gu-card"><h2>Grown-ups</h2><p>What is ${a} + ${b}?</p>
    <div class="gu-row">${answers.map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
    <button class="gu-close">Back to the town</button></div>`;
  box.querySelector('.gu-close').onclick = close;
  box.querySelectorAll('[data-n]').forEach(btn => {
    btn.onclick = () => (Number(btn.dataset.n) === a + b ? panel() : close());
  });

  function panel() {
    const t = playTime();
    const used = Math.round(t.seconds / 60);
    box.innerHTML = `<div class="gu-card"><h2>Grown-ups</h2>
      <p>Played today: <b>${used} min</b></p>
      <p>Daily play time</p>
      <div class="gu-row">${LIMITS.map(m => `<button data-limit="${m}" class="${settings.limit === m ? 'on' : ''}">${m ? `${m} min` : 'No limit'}</button>`).join('')}</div>
      <div class="gu-row"><button class="gu-more">+10 minutes today</button></div>
      <div class="gu-row"><button class="gu-fresh">Start the town fresh (hold)</button></div>
      <button class="gu-close">Back to the town</button></div>`;
    box.querySelectorAll('[data-limit]').forEach(btn => {
      btn.onclick = () => {
        settings.limit = Number(btn.dataset.limit);
        saveSettings();
        panel();
      };
    });
    box.querySelector('.gu-more').onclick = () => {
      const tt = playTime();
      tt.extra = (tt.extra || 0) + 10;
      savePlayTime(tt);
      sfx.ding();
    };
    const fresh = box.querySelector('.gu-fresh');
    let hold = 0;
    fresh.onpointerdown = () => {
      fresh.classList.add('holding');
      hold = setTimeout(() => {
        clearAll();
        location.reload();
      }, 2000);
    };
    fresh.onpointerup = fresh.onpointerleave = () => {
      clearTimeout(hold);
      fresh.classList.remove('holding');
    };
    box.querySelector('.gu-close').onclick = close;
  }

  function close() {
    box.remove();
    onClose();
  }
}

export function openRest({ onGrownups }) {
  document.body.dataset.screen = 'rest';
  const screen = div('screen rest', `<div class="moon"></div><div class="stars">${'<i></i>'.repeat(18)}</div>
    <div class="hill"></div><div class="zzz"><b>z</b><b>z</b><b>z</b></div>`, stage);
  screen.querySelectorAll('.stars i').forEach(s => {
    s.style.left = `${rand(2, 98)}%`;
    s.style.top = `${rand(3, 50)}%`;
    s.style.animationDelay = `${rand(0, 3)}s`;
  });
  const kind = pick(FRIEND_KINDS);
  const friend = new Friend(kind, { outfit: '#9b5de5', width: 200, parent: screen });
  friend.el.classList.add('sleeper');
  friend.mood('squint', 0);
  setTimeout(() => talk(kind, LINES.rest), 500);
  friend.el.addEventListener('pointerdown', () => {
    sfx.boing();
    talk(kind, LINES.rest, { chatty: true });
  });
  const lock = div('lock', '🔒', screen);
  let hold = 0;
  lock.addEventListener('pointerdown', () => {
    lock.classList.add('holding');
    hold = setTimeout(() => {
      lock.classList.remove('holding');
      onGrownups(screen);
    }, 1500);
  });
  lock.addEventListener('pointerup', () => {
    clearTimeout(hold);
    lock.classList.remove('holding');
  });
  return screen;
}
