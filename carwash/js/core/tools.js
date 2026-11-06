// Tools the child drags onto something: sponge, hose, spray can, stickers, wheels...
// They act on a *target*: { toLocal(stagePt), toStage(localPt), hit(localPt), autoPath }
// (the scene's g.target unless the tool gives its own). autoPath is a list of [x, y]
// local points a tapped tool sweeps along.
// A drag shows a copy of the tool under the finger and calls `apply` every frame at
// its hotspot. A quick tap calls `tap`, or for scrubbing tools runs the tool over the
// car by itself, so tapping alone always does something.

import { div, track, toStage, dist, frames, rectInStage, rand } from './stage.js';
import { loop } from './sound.js';


function interp(a, b, step) {
  const d = dist(a, b);
  const n = Math.max(1, Math.ceil(d / step));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n }));
}

export function flyBack(ghost, node, onDone) {
  const r = rectInStage(node);
  ghost.style.transition = 'transform .3s ease-out';
  ghost.style.transform = `translate(${r.x}px,${r.y}px)`;
  setTimeout(() => {
    ghost.remove();
    node.classList.remove('out');
    onDone?.();
  }, 300);
}

// g: the scene. o: { art, w, h, grab:[dx,dy], hot:[dx,dy], tilt, sound, target,
//   start(ghost), apply(cp, sp, onCar, info), drop(cp, sp, onCar, ghost) -> true if used,
//   tap(node), auto: run over the car when tapped, cls }
export function makeTool(g, o) {
  const node = div(`tool ${o.cls || ''}`, o.art);
  node.style.width = `${o.w}px`;
  node.style.height = `${o.h}px`;
  const grab = o.grab || [0, -30];
  const tgt = () => o.target || g.target;
  const hot = o.hot || [0, 0];

  function ghostAt(c, ghost) {
    ghost.style.transform = `translate(${c.x - o.w / 2}px,${c.y - o.h / 2}px) rotate(${o.tilt || 0}deg)`;
  }

  function newGhost() {
    const ghost = div('ghost', node.innerHTML, g.dragLayer);
    ghost.style.width = `${o.w}px`;
    ghost.style.height = `${o.h}px`;
    node.classList.add('out');
    return ghost;
  }

  // Applies the tool at its hotspot. Runs on every finger move and every frame,
  // so holding still keeps working (the hose keeps spraying).
  function run(ghost, centerAt, auto = false) {
    let lastHot = null;
    let stopped = false;
    const stopSound = o.sound ? loop(o.sound) : null;
    o.start?.(ghost);
    const tick = (now, dt = 0.016) => {
      const c = centerAt(now);
      if (!c) return false;
      ghostAt(c, ghost);
      const h = { x: c.x + hot[0], y: c.y + hot[1] };
      if (o.apply) {
        const moving = !!lastHot && dist(lastHot, h) > 1.5;
        const pts = lastHot && moving ? interp(lastHot, h, 9) : [h];
        pts.forEach((sp, i) => {
          const cp = tgt().toLocal(sp);
          o.apply(cp, sp, tgt().hit(cp), { moving, first: i === 0, center: c, dt, auto });
        });
      }
      lastHot = h;
      return true;
    };
    const stopFrames = frames((dt, now) => !stopped && tick(now, dt));
    return {
      tick: () => !stopped && tick(performance.now()),
      stop: () => {
        if (stopped) return;
        stopped = true;
        stopFrames();
        stopSound?.();
        o.end?.();
      },
    };
  }

  function autoPass() {
    const ghost = newGhost();
    // Shifted a little each time, so repeated taps reach new spots.
    const dy = rand(-30, 30);
    const pts = tgt().autoPath.map(([x, y]) => tgt().toStage({ x: x + rand(-25, 25), y: y + dy + rand(-20, 20) }));
    const start = performance.now();
    const dur = 2400;
    g.setBusy(true);
    const runner = run(ghost, now => {
      const t = (now - start) / dur;
      if (t >= 1) {
        runner.stop();
        g.setBusy(false);
        flyBack(ghost, node);
        return null;
      }
      const f = t * (pts.length - 1);
      const i = Math.floor(f);
      const a = pts[i];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      return { x: a.x + (b.x - a.x) * (f - i) - hot[0], y: a.y + (b.y - a.y) * (f - i) - hot[1] };
    }, true);
  }

  node.addEventListener('pointerdown', e => {
    if (g.busy()) return;
    e.preventDefault();
    e.stopPropagation();
    const p0 = toStage(e.clientX, e.clientY);
    let cur = p0;
    let runner = null;
    let ghost = null;
    track(e, {
      move: p => {
        cur = p;
        if (!ghost && dist(p, p0) > 12) {
          ghost = newGhost();
          runner = run(ghost, () => ({ x: cur.x + grab[0], y: cur.y + grab[1] }));
        }
        runner?.tick();
      },
      end: () => {
        if (!ghost) {
          if (o.tap) o.tap(node);
          else if (o.auto) autoPass();
          return;
        }
        runner.stop();
        const c = { x: cur.x + grab[0], y: cur.y + grab[1] };
        const h = { x: c.x + hot[0], y: c.y + hot[1] };
        const cp = tgt().toLocal(h);
        if (o.drop && o.drop(cp, h, tgt().hit(cp), ghost)) {
          ghost.remove();
          node.classList.remove('out');
        } else flyBack(ghost, node);
      },
    });
  });
  return node;
}

// For things dragged by hand that aren't tray tools (stickers on the car, the fuel nozzle).
export function dragThing(e, { move, end }) {
  const p0 = toStage(e.clientX, e.clientY);
  let moved = false;
  track(e, {
    move: p => {
      if (!moved && dist(p, p0) > 10) moved = true;
      if (moved) move(p);
    },
    end: p => end(p, moved),
  });
}

// A target that is just an area of the stage (a patient, a bowl, a cart). `rect` is
// { x, y, w, h } or a function returning one; points stay in stage units.
export function areaTarget(rect) {
  const r = () => (typeof rect === 'function' ? rect() : rect);
  return {
    toLocal: p => p,
    toStage: p => p,
    hit: p => {
      const a = r();
      return p.x > a.x && p.x < a.x + a.w && p.y > a.y && p.y < a.y + a.h;
    },
    get autoPath() {
      const a = r();
      return [[0.2, 0.5], [0.4, 0.3], [0.6, 0.6], [0.8, 0.4], [0.5, 0.7]].map(([fx, fy]) => [a.x + a.w * fx, a.y + a.h * fy]);
    },
  };
}
