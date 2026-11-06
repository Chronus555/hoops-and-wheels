// Just enough 2D physics for balls: gravity, bouncing off the floor, walls, fixed
// points (like a hoop's rim) and line segments (like a backboard), and off each
// other. Positions are in stage units.
//
// A ball is { x, y, vx, vy, r, bounce, grav, drag, rot, held }. `held` balls are
// moved by a finger and skip the physics.

const G = 1900;

export function stepBalls(balls, dt, world, onHit) {
  const steps = 4;
  const h = dt / steps;
  for (let s = 0; s < steps; s++) {
    for (const b of balls) {
      if (b.held) continue;
      b.vy += G * (b.grav ?? 1) * h;
      const k = Math.max(0, 1 - (b.drag ?? 0.05) * h);
      b.vx *= k;
      b.vy *= k;
      b.x += b.vx * h;
      b.y += b.vy * h;
      b.rot = (b.rot || 0) + (b.vx * h) / b.r;
      const e = b.bounce ?? 0.7;
      if (b.y + b.r > world.floor) {
        b.y = world.floor - b.r;
        if (b.vy > 0) {
          if (b.vy > 120) onHit?.(b, b.vy, 'floor');
          b.vy = b.vy < 90 ? 0 : -b.vy * e;
          b.vx *= 0.93;
        }
      }
      if (world.ceiling != null && b.y - b.r < world.ceiling && b.vy < 0) {
        b.y = world.ceiling + b.r;
        b.vy = -b.vy * e;
      }
      if (b.x - b.r < world.left && b.vx < 0) {
        b.x = world.left + b.r;
        onHit?.(b, -b.vx, 'wall');
        b.vx = -b.vx * e;
      }
      if (b.x + b.r > world.right && b.vx > 0) {
        b.x = world.right - b.r;
        onHit?.(b, b.vx, 'wall');
        b.vx = -b.vx * e;
      }
      for (const p of world.points || []) bounceOff(b, p.x, p.y, p.r, e, onHit, p.kind);
      for (const sg of world.segments || []) {
        const c = closest(sg, b);
        bounceOff(b, c.x, c.y, sg.r || 4, e, onHit, sg.kind);
      }
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) collide(balls[i], balls[j], onHit);
    }
  }
}

function closest(sg, p) {
  const dx = sg.x2 - sg.x1;
  const dy = sg.y2 - sg.y1;
  const t = Math.max(0, Math.min(1, ((p.x - sg.x1) * dx + (p.y - sg.y1) * dy) / (dx * dx + dy * dy || 1)));
  return { x: sg.x1 + dx * t, y: sg.y1 + dy * t };
}

function bounceOff(b, px, py, pr, e, onHit, kind) {
  const dx = b.x - px;
  const dy = b.y - py;
  const d = Math.hypot(dx, dy);
  const min = b.r + pr;
  if (d >= min || d === 0) return;
  const nx = dx / d;
  const ny = dy / d;
  b.x = px + nx * min;
  b.y = py + ny * min;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    if (-vn > 120) onHit?.(b, -vn, kind || 'point');
    b.vx -= (1 + e) * vn * nx;
    b.vy -= (1 + e) * vn * ny;
  }
}

function collide(a, b, onHit) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const min = a.r + b.r;
  if (d >= min || d === 0) return;
  const nx = dx / d;
  const ny = dy / d;
  const ma = a.held ? 1e6 : a.r * a.r;
  const mb = b.held ? 1e6 : b.r * b.r;
  const push = (min - d) / (ma + mb);
  if (!a.held) { a.x -= nx * push * mb; a.y -= ny * push * mb; }
  if (!b.held) { b.x += nx * push * ma; b.y += ny * push * ma; }
  const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv >= 0) return;
  const j = (-(1 + 0.8) * rv) / (1 / ma + 1 / mb);
  if (!a.held) { a.vx -= (j * nx) / ma; a.vy -= (j * ny) / ma; }
  if (!b.held) { b.vx += (j * nx) / mb; b.vy += (j * ny) / mb; }
  if (-rv > 150) onHit?.(a, -rv, 'ball');
}

// Starting velocity that carries a ball from `from` to `to` in `t` seconds.
export function aim(from, to, t, grav = 1) {
  return { vx: (to.x - from.x) / t, vy: (to.y - from.y) / t - 0.5 * G * grav * t };
}

// Release velocity of a flick from the last ~100 ms of finger positions.
export function flickVelocity(history) {
  const now = history[history.length - 1];
  const old = history.find(p => now.t - p.t < 110) || history[0];
  const dt = Math.max(16, now.t - old.t) / 1000;
  const vx = (now.x - old.x) / dt;
  const vy = (now.y - old.y) / dt;
  const m = Math.hypot(vx, vy);
  const max = 3200;
  return m > max ? { vx: (vx / m) * max, vy: (vy / m) * max } : { vx, vy };
}
