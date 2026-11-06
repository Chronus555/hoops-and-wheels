// One vehicle with its driver, built from stacked layers so each can change on its
// own: body colour, spray paint, windows and faces, stickers, wheels, mud, foam and
// roof topper. Mud, foam and spray paint are canvases; the rest is SVG.

import { VEHICLES, DRIVERS, WHEELS, TOPPERS, STICKERS, COLORS, RAINBOW } from './art.js';
import { div, mulberry32, rand } from './stage.js';

const NS = 'http://www.w3.org/2000/svg';
const MUD = ['#7a5230', '#8b5e34', '#6b4423', '#94673d', '#5e3b1d'];
const probe = document.createElement('canvas').getContext('2d');
const small = document.createElement('canvas');
small.width = 60;
small.height = 32;
const sctx = small.getContext('2d', { willReadFrequently: true });
const silCounts = {};
let uid = 0;

const circle = (x, y, r) => `M${x + r},${y} A${r},${r} 0 1 0 ${x - r},${y} A${r},${r} 0 1 0 ${x + r},${y} Z`;

function svgLayer(cls) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 600 320');
  s.setAttribute('class', cls);
  return s;
}

function canvasLayer(cls, res) {
  const c = document.createElement('canvas');
  c.className = cls;
  c.width = Math.round(600 * res);
  c.height = Math.round(320 * res);
  const ctx = c.getContext('2d');
  ctx.setTransform(res, 0, 0, res, 0, 0);
  return [c, ctx];
}

function erase(ctx, p, r, a) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.65, `rgba(0,0,0,${a * 0.85})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function countAlpha(source, threshold = 70) {
  sctx.clearRect(0, 0, 60, 32);
  sctx.drawImage(source, 0, 0, 60, 32);
  const d = sctx.getImageData(0, 0, 60, 32).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > threshold) n++;
  return n;
}

export class Car {
  constructor(state, { width = 640, res = 1.5 } = {}) {
    this.s = state;
    this.v = VEHICLES[state.type];
    this.uid = ++uid;
    this.width = width;
    this.dirty = false;
    this.painted = false;
    const v = this.v;

    this.bodyPath = new Path2D(v.body);
    this.winPaths = v.windows.map(w => new Path2D(w));
    this.silPath = new Path2D(`${v.body} ${v.wheels.map(w => circle(w.x, w.y, w.r + 2)).join(' ')}`);

    this.el = div('car');
    this.el.style.width = `${width}px`;
    this.el.style.height = `${(width * 320) / 600}px`;
    this.bob = div('bob', '', this.el);
    this.inner = div('inner', '', this.bob);

    this.bodySvg = svgLayer('l-body');
    [this.paint, this.pctx] = canvasLayer('l-paint', res);
    this.over = svgLayer('l-over');
    this.stk = svgLayer('l-stk');
    this.whl = svgLayer('l-whl');
    [this.mud, this.mctx] = canvasLayer('l-mud', res);
    [this.foam, this.fctx] = canvasLayer('l-foam', res);
    this.top = svgLayer('l-top');
    this.inner.append(this.bodySvg, this.paint, this.over, this.stk, this.whl, this.mud, this.foam, this.top);

    this.renderBody();
    this.renderWheels();
    this.renderTopper();
    this.renderStickers();
    if (state.mudSeed) this.makeMud(state.mudSeed);
    if (state.paintURL) {
      const img = new Image();
      img.onload = () => {
        this.pctx.drawImage(img, 0, 0, 600, 320);
        this.painted = true;
      };
      img.src = state.paintURL;
    }
  }

  get driver() { return this.s.driver; }

  // ---- drawing ------------------------------------------------------------------

  renderBody() {
    const { v, s, uid: id } = this;
    const fill = s.color === 'rainbow' ? `url(#rb${id})` : COLORS[s.color] || s.color;
    this.bodySvg.innerHTML = `<defs>
      <linearGradient id="rb${id}" x1="0" x2="1">${RAINBOW.map((c, i) => `<stop offset="${i / (RAINBOW.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>
      <linearGradient id="sh${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
      <clipPath id="wc${id}"><path d="${v.windows.join(' ')}"/></clipPath>
      <clipPath id="bc${id}"><path d="${v.body}"/></clipPath></defs>
      <path class="paintjob" d="${v.body}" fill="${fill}"/>`;
    const last = v.seats.length - 1;
    const heads = v.seats.map((seat, i) => {
      const kind = i === last ? s.driver : s.passengers?.[i] || s.driver;
      return `<g transform="translate(${seat.x},${seat.y}) scale(${seat.s})"><g class="head${i === last ? ' driver' : ''}">${DRIVERS[kind].svg}</g></g>`;
    }).join('');
    this.over.innerHTML = `<path d="${v.body}" fill="url(#sh${id})"/>${v.details}
      <g transform="translate(${v.fuel.x},${v.fuel.y})"><circle r="15" fill="rgba(0,0,0,.25)"/><circle r="10.5" fill="#dee2e6"/><circle r="4" fill="#adb5bd"/></g>
      <path d="${v.windows.join(' ')}" fill="#c3e8ff"/>
      <g clip-path="url(#wc${id})">${heads}</g>
      <path d="${v.windows.join(' ')}" fill="rgba(255,255,255,.14)" stroke="rgba(0,0,0,.2)" stroke-width="5" stroke-linejoin="round"/>`;
  }

  setColor(color) {
    this.s.color = color;
    const fill = color === 'rainbow' ? `url(#rb${this.uid})` : COLORS[color] || color;
    this.bodySvg.querySelector('.paintjob').setAttribute('fill', fill);
  }

  wheelInfo(i) {
    const type = WHEELS[this.s.wheels[i]] || WHEELS.classic;
    const k = type.size * (this.s.pump[i] || 1);
    return { type, k, rise: this.v.wheels[i].r * (k * (type.square ? 0.92 : 1) - 1) };
  }

  renderWheels() {
    const v = this.v;
    const info = v.wheels.map((_, i) => this.wheelInfo(i));
    this.whl.innerHTML = v.wheels.map((w, i) => `<g class="wheel" transform="translate(${w.x},${w.y}) scale(${info[i].k})"><g class="spin">${info[i].type.draw(w.r)}</g></g>`).join('');
    const [a, b] = info.map(x => x.rise);
    const dx = v.wheels[1].x - v.wheels[0].x;
    const ang = (-Math.atan2(b - a, dx) * 180) / Math.PI;
    const mid = (v.wheels[0].x + v.wheels[1].x) / 2;
    this.inner.style.transformOrigin = `${mid / 6}% ${v.wheels[0].y / 3.2}%`;
    this.inner.style.transform = `translateY(${(-(a + b) / 2 / 3.2).toFixed(2)}%) rotate(${ang.toFixed(2)}deg)`;
    this.el.classList.toggle('bumpy', this.s.wheels.includes('square'));
  }

  renderTopper() {
    const { roof } = this.v;
    const t = this.s.topper;
    this.top.innerHTML = t ? `<g transform="translate(${roof.x},${roof.y})"><g class="topper t-${t}">${TOPPERS[t]}</g></g>` : '';
  }

  renderStickers() {
    this.stk.innerHTML = `<g clip-path="url(#bc${this.uid})">${this.s.stickers.map((st, i) => {
      const def = STICKERS[st.k];
      return `<g transform="translate(${st.x.toFixed(1)},${st.y.toFixed(1)}) rotate(${st.rot.toFixed(1)}) scale(${def.big ? 1 : 0.78})"><g class="stk" data-i="${i}">${def.svg}</g></g>`;
    }).join('')}</g>`;
  }

  wiggleSticker(i) {
    const g = this.stk.querySelector(`.stk[data-i="${i}"]`);
    if (!g) return;
    g.classList.remove('wiggle');
    void g.getBoundingClientRect();
    g.classList.add('wiggle');
  }

  // ---- hit tests (car units) ------------------------------------------------------

  inBody(p) {
    return probe.isPointInPath(this.bodyPath, p.x, p.y) && !this.winPaths.some(w => probe.isPointInPath(w, p.x, p.y));
  }

  onCar(p) { return probe.isPointInPath(this.silPath, p.x, p.y); }

  onDriver(p) { return probe.isPointInPath(this.winPaths[this.winPaths.length - 1], p.x, p.y); }

  onWindow(p) { return this.winPaths.some(w => probe.isPointInPath(w, p.x, p.y)); }

  onTopper(p) {
    const { roof } = this.v;
    return !!this.s.topper && Math.abs(p.x - roof.x) < 110 && p.y < roof.y + 8 && p.y > roof.y - 200;
  }

  stickerAt(p) {
    for (let i = this.s.stickers.length - 1; i >= 0; i--) {
      const st = this.s.stickers[i];
      const big = STICKERS[st.k].big;
      if (big ? Math.abs(p.x - st.x) < 100 && Math.abs(p.y - st.y) < 32 : Math.hypot(p.x - st.x, p.y - st.y) < 30) return i;
    }
    return -1;
  }

  randomBodyPoint() {
    for (let i = 0; i < 200; i++) {
      const p = { x: rand(60, 560), y: rand(60, 250) };
      if (this.inBody(p) && this.inBody({ x: p.x - 26, y: p.y }) && this.inBody({ x: p.x + 26, y: p.y })) return p;
    }
    return { x: 300, y: 200 };
  }

  // ---- coordinates -------------------------------------------------------------

  toCar(cx, cy) {
    const m = this.bodySvg.getScreenCTM();
    if (!m) return { x: -1e4, y: -1e4 };
    const pt = this.bodySvg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  }

  fromCar(x, y) {
    const m = this.bodySvg.getScreenCTM();
    const pt = this.bodySvg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const r = pt.matrixTransform(m);
    return { x: r.x, y: r.y };
  }

  // ---- mud, foam and water -------------------------------------------------------

  makeMud(seed = Math.floor(Math.random() * 1e9)) {
    this.s.mudSeed = seed;
    const r = mulberry32(seed);
    const c = this.mctx;
    const inside = () => {
      for (let i = 0; i < 100; i++) {
        const p = { x: 30 + r() * 550, y: 30 + r() * 285 };
        if (probe.isPointInPath(this.silPath, p.x, p.y)) return p;
      }
      return { x: 300, y: 200 };
    };
    c.save();
    c.clip(this.silPath);
    for (let b = 0; b < 16; b++) {
      const p = inside();
      const size = 14 + r() * 24;
      c.fillStyle = MUD[Math.floor(r() * MUD.length)];
      for (let k = 0; k < 5; k++) {
        c.beginPath();
        c.arc(p.x + (r() - 0.5) * size * 1.6, p.y + (r() - 0.5) * size * 1.2, size * (0.4 + r() * 0.45), 0, Math.PI * 2);
        c.fill();
      }
    }
    for (let d = 0; d < 10; d++) {
      const p = inside();
      c.fillStyle = MUD[d % MUD.length];
      const w = 6 + r() * 8;
      const h = 18 + r() * 40;
      c.beginPath();
      c.roundRect ? c.roundRect(p.x - w / 2, p.y, w, h, w / 2) : c.rect(p.x - w / 2, p.y, w, h);
      c.fill();
    }
    for (let k = 0; k < 90; k++) {
      const p = inside();
      c.fillStyle = MUD[k % MUD.length];
      c.beginPath();
      c.arc(p.x, p.y, 1.5 + r() * 4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    this.dirty = true;
  }

  splatMud(p) {
    const c = this.mctx;
    c.save();
    c.clip(this.silPath);
    const size = rand(16, 30);
    c.fillStyle = MUD[Math.floor(rand(0, MUD.length))];
    for (let k = 0; k < 7; k++) {
      c.beginPath();
      c.arc(p.x + rand(-1, 1) * size, p.y + rand(-0.8, 0.8) * size, size * rand(0.35, 0.8), 0, Math.PI * 2);
      c.fill();
    }
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.arc(p.x + rand(-2.4, 2.4) * size, p.y + rand(-2, 2) * size, rand(2, 6), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    if (!this.s.mudSeed) this.s.mudSeed = Math.floor(Math.random() * 1e9);
  }

  scrub(p, r = 30, a = 0.6) { erase(this.mctx, p, r, a); }

  addFoam(p, r = 26, n = 2) {
    const c = this.fctx;
    c.save();
    c.clip(this.silPath);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const d = rand(0, r);
      const x = p.x + Math.cos(a) * d;
      const y = p.y + Math.sin(a) * d;
      const br = rand(5, 14);
      c.fillStyle = 'rgba(255,255,255,.93)';
      c.strokeStyle = 'rgba(150,200,235,.95)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(x, y, br, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(190,230,255,.9)';
      c.beginPath();
      c.arc(x - br * 0.35, y - br * 0.35, br * 0.22, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  rinse(p, r = 44) {
    erase(this.fctx, p, r, 0.9);
    erase(this.mctx, p, r * 0.8, 0.1);
    if (Math.random() < 0.25) {
      const c = this.fctx;
      c.save();
      c.clip(this.silPath);
      const x = p.x + rand(-r, r);
      const y = p.y + rand(-r, r);
      const dr = rand(2.5, 4.5);
      c.fillStyle = 'rgba(225,245,255,.8)';
      c.strokeStyle = 'rgba(120,180,220,.6)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(x, y, dr, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    }
  }

  wipe(p, r = 40) { erase(this.fctx, p, r, 1); }

  sprayPaint(p, color) {
    const c = this.pctx;
    c.save();
    c.clip(this.bodyPath);
    c.fillStyle = color;
    c.globalAlpha = 0.35;
    c.beginPath();
    c.arc(p.x, p.y, 16, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.9;
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      const d = Math.abs(rand(-1, 1) + rand(-1, 1)) * 13;
      c.beginPath();
      c.arc(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, rand(1.5, 3.5), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    this.painted = true;
  }

  clearPaint() {
    this.pctx.clearRect(0, 0, 600, 320);
    this.painted = false;
  }

  clearMud() {
    this.mctx.clearRect(0, 0, 600, 320);
    this.fctx.clearRect(0, 0, 600, 320);
    this.s.mudSeed = 0;
  }

  // Share of the car covered in mud and in foam/water, 0..1.
  coverage() {
    const type = this.s.type;
    if (!silCounts[type]) {
      sctx.clearRect(0, 0, 60, 32);
      sctx.save();
      sctx.scale(0.1, 0.1);
      sctx.fill(this.silPath);
      sctx.restore();
      const d = sctx.getImageData(0, 0, 60, 32).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 70) n++;
      silCounts[type] = n || 1;
    }
    return { mud: countAlpha(this.mud) / silCounts[type], foam: countAlpha(this.foam, 110) / silCounts[type] };
  }

  // ---- moods and motion ------------------------------------------------------------

  mood(m, ms = 1400) {
    this.el.dataset.mood = m;
    clearTimeout(this.moodTimer);
    if (ms) this.moodTimer = setTimeout(() => { this.el.dataset.mood = ''; }, ms);
  }

  play(cls, ms = 700) {
    this.bob.classList.remove(cls);
    void this.bob.offsetWidth;
    this.bob.classList.add(cls);
    clearTimeout(this[`t_${cls}`]);
    this[`t_${cls}`] = setTimeout(() => this.bob.classList.remove(cls), ms);
  }

  driving(on) { this.el.classList.toggle('driving', on); }

  // ---- saving ------------------------------------------------------------------------

  serialize() {
    const s = { ...this.s, stickers: this.s.stickers.map(x => ({ ...x })), wheels: [...this.s.wheels], pump: [...this.s.pump] };
    s.mudSeed = this.coverage().mud > 0.12 ? this.s.mudSeed || Math.floor(Math.random() * 1e9) : 0;
    if (this.painted) {
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 320;
      c.getContext('2d').drawImage(this.paint, 0, 0, 600, 320);
      s.paintURL = c.toDataURL('image/png');
    } else s.paintURL = null;
    return s;
  }
}
