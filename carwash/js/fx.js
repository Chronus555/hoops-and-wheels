// Particles drawn on one canvas over the whole stage: water, bubbles, sparkles,
// paint mist, mud and confetti.

import { W, H, rand } from './stage.js';

export class FX {
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fx';
    this.canvas.width = W;
    this.canvas.height = H;
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.parts = [];
    this.running = false;
  }

  add(p) {
    this.parts.push({ life: 1, age: 0, vx: 0, vy: 0, g: 0, r: 6, rot: 0, vr: 0, ...p });
    if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700);
    if (!this.running) this.start();
  }

  water(from, to, n = 3) {
    for (let i = 0; i < n; i++) {
      const tx = to.x + rand(-26, 26);
      const ty = to.y + rand(-20, 20);
      const t = rand(0.16, 0.24);
      this.add({ kind: 'drop', x: from.x + rand(-4, 4), y: from.y, vx: (tx - from.x) / t, vy: (ty - from.y) / t - 200 * t, g: 400, r: rand(3, 6), life: t + 0.1, color: 'rgba(120,200,255,.85)' });
    }
  }

  mist(from, to, color, n = 4) {
    for (let i = 0; i < n; i++) {
      const tx = to.x + rand(-22, 22);
      const ty = to.y + rand(-22, 22);
      const t = rand(0.12, 0.2);
      this.add({ kind: 'dot', x: from.x, y: from.y, vx: (tx - from.x) / t, vy: (ty - from.y) / t, r: rand(2, 4), life: t, color });
    }
  }

  splash(x, y, color = 'rgba(120,200,255,.9)', n = 10) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'drop', x, y, vx: rand(-260, 260), vy: rand(-420, -120), g: 1300, r: rand(3, 7), life: rand(0.5, 0.8), color });
    }
  }

  bubbles(x, y, n = 3) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'bubble', x: x + rand(-30, 30), y: y + rand(-20, 20), vx: rand(-30, 30), vy: rand(-140, -60), r: rand(6, 16), life: rand(1, 1.8) });
    }
  }

  sparkles(x, y, spread = 60, n = 6) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'sparkle', x: x + rand(-spread, spread), y: y + rand(-spread * 0.6, spread * 0.6), vy: rand(-40, 0), r: rand(8, 18), life: rand(0.6, 1.2), rot: rand(0, 3), vr: rand(-3, 3) });
    }
  }

  confetti(x, y, n = 40) {
    const colors = ['#ef476f', '#ffd166', '#06d6a0', '#4895ef', '#9b5de5', '#f8961e'];
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'confetti', x, y, vx: rand(-420, 420), vy: rand(-700, -250), g: 900, r: rand(6, 11), life: rand(1.2, 2), rot: rand(0, 6), vr: rand(-10, 10), color: colors[i % colors.length] });
    }
  }

  blobs(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'drop', x: x + rand(-40, 40), y: y + rand(-20, 10), vx: rand(-160, 160), vy: rand(-260, -60), g: 1400, r: rand(7, 14), life: rand(0.5, 0.8), color });
    }
  }

  start() {
    this.running = true;
    let last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt);
      if (this.parts.length) requestAnimationFrame(step);
      else {
        this.running = false;
        this.ctx.clearRect(0, 0, W, H);
      }
    };
    requestAnimationFrame(step);
  }

  update(dt) {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    this.parts = this.parts.filter(p => (p.age += dt) < p.life);
    for (const p of this.parts) {
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = 1 - p.age / p.life;
      c.globalAlpha = Math.min(1, k * 2);
      if (p.kind === 'drop' || p.kind === 'dot') {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      } else if (p.kind === 'bubble') {
        c.strokeStyle = 'rgba(140,200,240,.9)';
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.beginPath();
        c.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, Math.PI * 2);
        c.fill();
      } else if (p.kind === 'sparkle') {
        const s = p.r * (0.6 + 0.4 * Math.sin(p.age * 12));
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = '#fff6a8';
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const d = i % 2 ? s * 0.28 : s;
          c.lineTo(Math.cos(a) * d, Math.sin(a) * d);
        }
        c.fill();
        c.restore();
      } else if (p.kind === 'confetti') {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }
}
