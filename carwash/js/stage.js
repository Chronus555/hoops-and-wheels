// The whole game is laid out on a fixed 1400 x 1000 stage that is scaled to fit the
// screen, so every position in the code is in stage units.

export const W = 1400;
export const H = 1000;
export const stage = document.getElementById('stage');

let scale = 1;
let ox = 0;
let oy = 0;

export function fit() {
  scale = Math.min(innerWidth / W, innerHeight / H);
  ox = (innerWidth - W * scale) / 2;
  oy = (innerHeight - H * scale) / 2;
  stage.style.transform = `translate(${ox}px,${oy}px) scale(${scale})`;
  // Lets the page background line up with the stage's bands (see styles.css).
  document.body.style.setProperty('--oy', `${oy}px`);
  document.body.style.setProperty('--s', scale);
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 300));
fit();

export const toStage = (cx, cy) => ({ x: (cx - ox) / scale, y: (cy - oy) / scale });
export const toClient = (x, y) => ({ x: ox + x * scale, y: oy + y * scale });

export function rectInStage(node) {
  const r = node.getBoundingClientRect();
  const a = toStage(r.left, r.top);
  const b = toStage(r.right, r.bottom);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
}

export function div(cls, html = '', parent = null) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (html) d.innerHTML = html;
  if (parent) parent.appendChild(d);
  return d;
}

export function place(node, x, y) {
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  return node;
}

// Follows one finger until it lifts; positions are in stage units.
export function track(e, { move, end }) {
  const id = e.pointerId;
  const mv = ev => {
    if (ev.pointerId === id) move?.(toStage(ev.clientX, ev.clientY), ev);
  };
  const up = ev => {
    if (ev.pointerId !== id) return;
    stop();
    end?.(toStage(ev.clientX, ev.clientY), ev, ev.type === 'pointercancel');
  };
  const stop = () => {
    removeEventListener('pointermove', mv);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
  };
  addEventListener('pointermove', mv);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  return stop;
}

export const wait = ms => new Promise(r => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = list => list[Math.floor(Math.random() * list.length)];
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Calls fn every frame until it returns false.
export function frames(fn) {
  let last = performance.now();
  let on = true;
  const step = now => {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (fn(dt, now) === false) on = false;
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return () => { on = false; };
}
