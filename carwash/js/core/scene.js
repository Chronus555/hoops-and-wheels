// The frame every play place is built in: a home button, an optional row of station
// buttons, a strip of wall panels that scrolls between stations, a tool tray, layers
// for effects and dragged tools, a busy flag and idle hints.
//
// A place makes a scene, puts its own things on scene.screen, then calls
// scene.setStations([...]). Each station is { id, icon, panel, tray, enter, leave,
// hint }. A place with one station gets no station buttons.

import { div, stage, wait } from './stage.js';
import { FX } from './fx.js';
import { sfx } from './sound.js';

export const HOME_ICON = '<svg viewBox="0 0 60 60"><path d="M8,28 L30,10 L52,28 V52 H8 Z" fill="#fff"/><rect x="22" y="34" width="16" height="18" rx="3" fill="#e76f51"/><circle cx="34" cy="43" r="1.8" fill="#fff"/></svg>';

export function makeScene({ cls = '', onHome } = {}) {
  const screen = div(`screen scene ${cls}`, '', stage);
  const world = div('world', '', screen);
  const layer = div('layer', '', screen);
  const fx = new FX(screen);
  const nav = div('nav', '', screen);
  const tray = div('tray', '', screen);
  const dragLayer = div('drag', '', screen);
  const flashEl = div('flash', '', screen);

  let busy = false;
  let cur = 0;
  let stations = [];
  let navBtns = [];

  const g = {
    screen,
    world,
    layer,
    fx,
    nav,
    tray,
    dragLayer,
    target: null,
    onTravel: null, // (moving: boolean) => void, e.g. spin the car's wheels
    busy: () => busy,
    setBusy: b => { busy = b; },
    station: () => stations[cur],
    flash() {
      flashEl.classList.remove('go');
      void flashEl.offsetWidth;
      flashEl.classList.add('go');
    },
    setStations,
    goTo,
    close,
  };

  const home = div('navbtn home', HOME_ICON, nav);
  home.addEventListener('pointerdown', e => {
    e.stopPropagation();
    if (!busy) onHome?.();
  });

  function setStations(list) {
    stations = list;
    stations.forEach((s, i) => {
      s.panel.style.left = `${i * 1400}px`;
      world.appendChild(s.panel);
      s.tray.classList.add('tray-page');
      tray.appendChild(s.tray);
    });
    world.style.width = `${stations.length * 1400}px`;
    navBtns = stations.length > 1 ? stations.map((s, i) => {
      const b = div('navbtn', `<span>${s.icon}</span>`, nav);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        goTo(i);
      });
      return b;
    }) : [];
    show(0);
  }

  function show(i) {
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
    g.onTravel?.(true);
    world.style.transform = `translateX(${-i * 1400}px)`;
    navBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    await wait(1100);
    g.onTravel?.(false);
    cur = i;
    show(i);
    busy = false;
    stations[i].enter?.();
  }

  // ---- idle hints: the most useful thing in the station wiggles --------------------

  let idle = 0;
  screen.addEventListener('pointerdown', () => { idle = 0; }, true);
  const idleTimer = setInterval(() => {
    if (!screen.isConnected) return clearInterval(idleTimer);
    idle += 1;
    if (idle % 10 === 0 && !busy) {
      const el = stations[cur]?.hint?.();
      if (el) {
        el.classList.remove('hint');
        void el.offsetWidth;
        el.classList.add('hint');
        setTimeout(() => el.classList.remove('hint'), 2200);
      }
    }
  }, 1000);

  function close() {
    clearInterval(idleTimer);
    screen.remove();
  }

  return g;
}

// Every place's tap-to-hear-again helper: wiggles an element.
export function wiggle(el, cls = 'jump') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
