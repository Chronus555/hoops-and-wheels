// The town map: a street of buildings, one per play place. Swipe to look along the
// street, tap a building to go in. Friends stroll on the sidewalk, and the sun,
// clouds, trees and hydrant all do something when tapped.

import { div, stage, track, frames, rand, pick, wait, W } from '../core/stage.js';
import { FX } from '../core/fx.js';
import { sfx } from '../core/sound.js';
import { talk, stopVoice } from '../core/voice.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../core/friends.js';
import { PLACES } from './places.js';
import { BUILDINGS } from './buildings.js';
import { LINES } from './lines.js';

const STEP = 620; // distance between buildings
const FIRST = 300;
const GROUND = 700; // where buildings meet the sidewalk

let lastScroll = 0;

export function openTown({ focusId, onEnter, onGrownups }) {
  document.body.dataset.screen = 'town';
  const screen = div('screen town', `
    <div class="sky"><div class="sun"><i></i></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div></div>
    <div class="far"></div>
    <div class="strip"><div class="sidewalk"></div><div class="street"><div class="dash"></div></div><div class="curb"></div></div>`, stage);
  const strip = screen.querySelector('.strip');
  const far = screen.querySelector('.far');
  const fx = new FX(screen);
  const width = Math.max(W, FIRST + PLACES.length * STEP + 300);
  strip.style.width = `${width}px`;
  far.style.width = `${width}px`;
  let leaving = false;
  let swiped = false; // the current touch moved the street, so it isn't a tap

  // ---- buildings -------------------------------------------------------------------
  const buildings = PLACES.map((p, i) => {
    const art = BUILDINGS[p.id];
    const b = div(`building tb tb-${p.id}`, art.html, strip);
    const x = FIRST + i * STEP;
    b.style.left = `${x}px`;
    b.style.top = `${GROUND - 464}px`;
    b.addEventListener('pointerup', e => {
      if (swiped || leaving) return;
      go(p.id, b, x + art.width / 2);
    });
    return { id: p.id, el: b, cx: x + art.width / 2 };
  });

  async function go(id, b, cx) {
    leaving = true;
    sfx.pop();
    b.classList.add('open');
    stopVoice();
    await wait(450);
    sfx.whoosh();
    strip.style.transformOrigin = `${cx}px ${GROUND - 150}px`;
    strip.style.transition = 'transform .6s ease-in, opacity .6s';
    strip.style.transform = `translateX(${-scroll}px) scale(2.4)`;
    screen.classList.add('fade');
    await wait(550);
    lastScroll = scroll;
    stopFriends();
    screen.remove();
    onEnter(id);
  }

  // ---- trees, lamps and the hydrant between buildings --------------------------------
  const deco = [];
  // Trees stand in the gaps between buildings (and one at each end).
  const gaps = [40, ...PLACES.map((_, i) => FIRST + i * STEP + 450 + (STEP - 450) / 2 - 90)];
  for (const x of gaps) {
    if (x > width - 100) continue;
    deco.push(div('tree', '<i></i><b></b>', strip));
    deco[deco.length - 1].style.left = `${x}px`;
  }
  for (let x = FIRST + 450 + 20; x < width - 200; x += STEP * 2) {
    const h = div('hydrant', '<i></i>', strip);
    h.style.left = `${x}px`;
    deco.push(h);
  }
  strip.querySelectorAll('.tree').forEach(t => t.addEventListener('pointerup', e => {
    if (swiped) return;
    sfx.boing();
    t.classList.remove('shake');
    void t.offsetWidth;
    t.classList.add('shake');
    // Apples drop.
    const x = parseFloat(t.style.left) - scroll + 90;
    for (let i = 0; i < 3; i++) fx.add({ kind: 'drop', x: x + rand(-50, 50), y: 420 + rand(-30, 30), vx: rand(-40, 40), vy: rand(-80, 0), g: 1200, r: 12, life: 1, color: '#ef476f' });
  }));
  strip.querySelectorAll('.hydrant').forEach(h => h.addEventListener('pointerup', e => {
    if (swiped) return;
    const x = parseFloat(h.style.left) - scroll + 25;
    sfx.splat();
    fx.splash(x, GROUND - 10, 'rgba(120,200,255,.9)', 22);
    friends.forEach(f => {
      if (Math.abs(f.x - parseFloat(h.style.left)) < 250) {
        f.friend.mood('squint', 900);
        talk(f.kind, LINES.giggle, { chatty: true });
      }
    });
  }));

  // ---- sky surprises -----------------------------------------------------------------
  const sun = screen.querySelector('.sun');
  sun.addEventListener('pointerdown', () => {
    sun.classList.remove('spin');
    void sun.offsetWidth;
    sun.classList.add('spin');
    sfx.sparkle();
    fx.sparkles(150, 130, 90, 12);
  });
  screen.querySelectorAll('.cloud').forEach(c => c.addEventListener('pointerdown', () => {
    const r = c.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const k = W / sr.width;
    const cx = (r.left + r.width / 2 - sr.left) * k;
    const cy = (r.top + r.height - sr.top) * k;
    sfx.drip();
    for (let i = 0; i < 26; i++) fx.add({ kind: 'drop', x: cx + rand(-70, 70), y: cy + rand(-10, 10), vy: rand(150, 300), g: 900, r: rand(3, 5), life: rand(0.8, 1.3), color: 'rgba(120,200,255,.9)' });
    const near = friends.find(f => Math.abs(f.x - scroll - cx) < 200);
    if (near) talk(near.kind, LINES.rain, { chatty: true });
  }));

  // ---- friends strolling on the sidewalk ---------------------------------------------
  const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5).slice(0, 3);
  const friends = kinds.map((kind, i) => {
    const friend = new Friend(kind, { outfit: pick(OUTFITS), width: 96, parent: strip });
    const f = { kind, friend, x: 200 + i * (width / 3) + rand(0, 100), dir: Math.random() < 0.5 ? -1 : 1, pause: 0 };
    friend.el.classList.add('walker');
    friend.el.addEventListener('pointerup', e => {
      if (swiped) return;
      f.pause = 2.2;
      friend.mood('happy', 1500);
      friend.play('wave', 1400);
      sfx.boing();
      talk(kind, LINES.hello);
    });
    return f;
  });
  const placeFriend = f => {
    f.friend.el.style.transform = `translate(${f.x - 48}px, ${GROUND + 58 - 177}px) scaleX(${f.dir})`;
  };
  friends.forEach(placeFriend);
  const stopFriends = frames(dt => {
    for (const f of friends) {
      if (f.pause > 0) {
        f.pause -= dt;
        f.friend.el.classList.remove('walking');
        continue;
      }
      f.friend.el.classList.add('walking');
      f.x += f.dir * 60 * dt;
      if (f.x < 80 || f.x > width - 80 || Math.random() < 0.002) f.dir *= -1;
      if (Math.random() < 0.002) f.pause = rand(1, 3);
      placeFriend(f);
    }
    return screen.isConnected;
  });

  // ---- swiping along the street ------------------------------------------------------
  const maxScroll = width - W;
  let scroll = 0;
  const setScroll = x => {
    scroll = Math.max(0, Math.min(maxScroll, x));
    strip.style.transform = `translateX(${-scroll}px)`;
    far.style.transform = `translateX(${-scroll * 0.4}px)`;
  };
  const focus = buildings.find(b => b.id === focusId);
  setScroll(focus ? focus.cx - W / 2 : lastScroll);

  let fling = null;
  strip.addEventListener('pointerdown', e => {
    if (leaving) return;
    fling?.();
    swiped = false;
    const start = scroll;
    let x0 = null;
    let last = null;
    let v = 0;
    track(e, {
      move: (p, ev) => {
        if (x0 == null) { x0 = p.x; last = { x: p.x, t: ev.timeStamp }; }
        if (Math.abs(p.x - x0) > 12) swiped = true;
        if (swiped) setScroll(start - (p.x - x0));
        const dt = Math.max(1, ev.timeStamp - last.t);
        v = (p.x - last.x) / dt;
        last = { x: p.x, t: ev.timeStamp };
      },
      end: () => {
        if (!swiped) return;
        let vel = -v * 1000;
        fling = frames(dt => {
          vel *= Math.pow(0.04, dt);
          setScroll(scroll + vel * dt);
          return Math.abs(vel) > 20;
        });
      },
    });
  });

  // ---- grown-up corner: press and hold the lock ----------------------------------
  const lock = div('lock', '🔒', screen);
  let holdTimer = 0;
  lock.addEventListener('pointerdown', e => {
    e.stopPropagation();
    lock.classList.add('holding');
    holdTimer = setTimeout(() => {
      lock.classList.remove('holding');
      onGrownups();
    }, 1500);
  });
  const release = () => {
    clearTimeout(holdTimer);
    lock.classList.remove('holding');
  };
  lock.addEventListener('pointerup', release);
  lock.addEventListener('pointerleave', release);

  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__town = { go: id => { const b = buildings.find(x => x.id === id); go(id, b.el, b.cx); }, setScroll, friends };
  return { close: () => { stopFriends(); screen.remove(); } };
}
