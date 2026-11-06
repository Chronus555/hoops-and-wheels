// Dinosaur Dig, two stations:
//  - Dig: brush the sand away to find five buried bones; each one found flies into
//    the crate and is counted. The magnifying glass makes hidden bones glow.
//  - Museum: drag (or tap) the bones onto the outline to build the skeleton. When
//    it's complete the dinosaur is named and roars. There's also an egg: tap it
//    three times and a baby dinosaur hatches. Then dig up the next dinosaur.

import { div, rand, pick, wait, toStage, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText, say } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget, dragThing } from '../../core/tools.js';
import { Friend, FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, DINO_NAMES, COUNT } from './lines.js';

const bone = 'fill="#f8f9fa" stroke="#adb5bd" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
const vert = (pts, r) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r * (1 - i * 0.07)}" ${bone}/>`).join('');
// Bone pieces drawn in their own little boxes [w, h, art].
const PIECES = {
  skullT: [190, 130, `<path d="M10,40 Q20,6 90,8 Q170,10 182,50 L182,80 L120,84 L130,110 Q80,126 30,104 Q4,80 10,40 Z" ${bone}/><circle cx="130" cy="38" r="14" fill="#6c757d"/><path d="M60,84 l8,14 l8,-14 M84,84 l8,14 l8,-14 M108,84 l8,14 l8,-14" ${bone}/>`],
  skullTri: [180, 140, `<path d="M20,20 Q60,0 90,30 L170,70 Q178,100 150,118 L60,126 Q24,110 20,80 Z" ${bone}/><path d="M120,58 L172,30 L150,70 Z M100,46 L130,6 L124,54 Z M160,92 L178,84 L170,104 Z" ${bone}/><circle cx="110" cy="80" r="12" fill="#6c757d"/>`],
  skullLong: [100, 70, `<ellipse cx="50" cy="34" rx="44" ry="28" ${bone}/><circle cx="62" cy="26" r="8" fill="#6c757d"/>`],
  neckShort: [100, 60, vert([[18, 30], [50, 30], [82, 30]], 18)],
  neckLong: [180, 230, vert([[30, 210], [58, 176], [82, 140], [104, 104], [126, 70], [150, 36]], 22)],
  ribs: [240, 140, `<path d="M10,30 Q120,0 230,30" ${bone} fill="none" stroke-width="14"/>${[40, 80, 120, 160, 200].map(x => `<path d="M${x},28 Q${x - 18},90 ${x + 4},130" fill="none" stroke="#f8f9fa" stroke-width="12" stroke-linecap="round"/><path d="M${x},28 Q${x - 18},90 ${x + 4},130" fill="none" stroke="#adb5bd" stroke-width="2"/>`).join('')}`],
  legs2: [170, 170, `<path d="M40,10 L50,120 L20,160 L80,160" fill="none" stroke="#f8f9fa" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M120,10 L130,120 L100,160 L160,160" fill="none" stroke="#f8f9fa" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`],
  legs4: [270, 120, [20, 80, 170, 230].map(x => `<path d="M${x},10 L${x + 6},100 L${x + 30},110" fill="none" stroke="#f8f9fa" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`).join('')],
  tailLong: [270, 90, vert([[255, 20], [222, 30], [188, 40], [152, 50], [116, 58], [80, 66], [44, 72], [12, 76]], 18)],
  tailShort: [190, 70, vert([[175, 20], [140, 30], [104, 40], [68, 50], [32, 58]], 16)],
};
// Where each piece goes in the museum (800 x 440 box).
const DINOS = {
  trex: [['skullT', 560, 70], ['neckShort', 490, 140], ['ribs', 280, 150], ['legs2', 320, 260], ['tailLong', 20, 150]],
  tri: [['skullTri', 590, 160], ['neckShort', 520, 200], ['ribs', 290, 170], ['legs4', 270, 310], ['tailShort', 100, 190]],
  longneck: [['skullLong', 640, 10], ['neckLong', 500, 60], ['ribs', 280, 200], ['legs4', 270, 330], ['tailLong', 20, 220]],
};
const ORDER = ['trex', 'tri', 'longneck'];
const SAND = { x: 140, y: 150, w: 1120, h: 620 };
const MUSEUM = { x: 300, y: 200, k: 1 }; // museum box at stage (300,200), 800 x 440
const pieceSVG = k => `<svg viewBox="0 0 ${PIECES[k][0]} ${PIECES[k][1]}" overflow="visible">${PIECES[k][2]}</svg>`;
const sounds = {
  brush: () => noise(0.12, { freq: 2200, q: 0.8, vol: 0.18 }),
  found: () => { tone(880, 0.12, { vol: 0.2 }); tone(1320, 0.3, { vol: 0.2, at: 0.1 }); },
  click: () => { tone(300, 0.1, { to: 180, vol: 0.35 }); noise(0.05, { freq: 1200, vol: 0.3 }); },
  roar: () => { tone(110, 1.2, { type: 'sawtooth', vol: 0.18, to: 70 }); noise(1.2, { freq: 300, q: 0.5, vol: 0.5, to: 120 }); },
  crack: () => noise(0.12, { freq: 3500, q: 2, vol: 0.5 }),
  squeak: () => tone(1200, 0.25, { to: 1800, type: 'triangle', vol: 0.15 }),
};

export default {
  id: 'dino',
  open(ctx) {
    useStyle('js/places/dino/style.css');
    document.body.dataset.screen = 'dino';
    const g = makeScene({ cls: 'dino', onHome: leave });
    const { fx } = g;
    const guide = pick(FRIEND_KINDS);
    const sayG = (l, o) => talk(guide, l, o);
    const saved = loadData('dino', { n: 0 });
    let dino;
    let buried = [];
    let found = [];
    let placed = [];

    // ================= dig ==================================================================
    const dig = div('panel p-dig2', '<div class="sky"></div><div class="cliff"></div><div class="crate"><b></b></div>');
    const bonesLayer = div('buried', '', dig);
    const sand = document.createElement('canvas');
    sand.className = 'sand';
    sand.width = SAND.w;
    sand.height = SAND.h;
    dig.appendChild(sand);
    const sctx = sand.getContext('2d', { willReadFrequently: true });
    const f = new Friend(guide, { outfit: '#e9c46a', width: 120, parent: dig });
    f.el.classList.add('guide');
    f.el.insertAdjacentHTML('beforeend', '<div class="safarihat"></div>');
    f.el.addEventListener('pointerdown', e => { e.stopPropagation(); f.play('wave', 1200); sayG(LINES.hello, { chatty: true }); });
    const crate = dig.querySelector('.crate');

    function fillSand() {
      sctx.globalCompositeOperation = 'source-over';
      const grad = sctx.createLinearGradient(0, 0, 0, SAND.h);
      grad.addColorStop(0, '#e9c46a');
      grad.addColorStop(1, '#d4a373');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, SAND.w, SAND.h);
      for (let i = 0; i < 500; i++) {
        sctx.fillStyle = pick(['#dda15e', '#f4d58d', '#bc6c25', '#e9c46a']);
        sctx.beginPath();
        sctx.arc(rand(0, SAND.w), rand(0, SAND.h), rand(2, 7), 0, Math.PI * 2);
        sctx.fill();
      }
    }
    function newDig() {
      dino = ORDER[saved.n % ORDER.length];
      found = [];
      placed = [];
      bonesLayer.innerHTML = '';
      // Bury the five pieces in a grid of spots so they don't overlap.
      const spots = [[160, 120], [520, 100], [880, 140], [300, 400], [760, 420]].sort(() => Math.random() - 0.5);
      buried = DINOS[dino].map(([k], i) => {
        const [w, h] = PIECES[k];
        const sc = Math.min(1, 220 / Math.max(w, h));
        const el = div('bone', pieceSVG(k), bonesLayer);
        const x = spots[i][0] + rand(-30, 30);
        const y = spots[i][1] + rand(-20, 20);
        el.style.cssText = `left:${x}px;top:${y}px;width:${w * sc}px;height:${h * sc}px;transform:rotate(${rand(-20, 20)}deg)`;
        return { i, k, el, cx: x + (w * sc) / 2, cy: y + (h * sc) / 2, rx: (w * sc) / 2, ry: (h * sc) / 2, got: false };
      });
      fillSand();
      drawCrate();
      buildMuseum();
    }
    function drawCrate() { crate.querySelector('b').textContent = found.length ? '🦴'.repeat(found.length) : ''; }
    function uncovered(b) {
      // Share of sample points around the bone's middle that are clear of sand.
      let clear = 0;
      let n = 0;
      // Sample an oval matching the bone's own shape (long tails, round skulls).
      for (let a = 0; a < 6.28; a += 0.9) {
        for (const f of [0, 0.3, 0.55]) {
          const x = Math.round(b.cx + Math.cos(a) * b.rx * f);
          const y = Math.round(b.cy + Math.sin(a) * b.ry * f);
          n++;
          if (x < 0 || y < 0 || x >= SAND.w || y >= SAND.h || sctx.getImageData(x, y, 1, 1).data[3] < 40) clear++;
        }
      }
      return clear / n;
    }
    let checkT = 0;
    let trailing = 0;
    function brushAt(p, r) {
      const x = p.x - SAND.x;
      const y = p.y - SAND.y;
      sctx.globalCompositeOperation = 'destination-out';
      const gr = sctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,.5)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = gr;
      sctx.beginPath();
      sctx.arc(x, y, r, 0, Math.PI * 2);
      sctx.fill();
      if (Math.random() < 0.15) fx.blobs(p.x, p.y, '#e9c46a', 2);
      const now = performance.now();
      if (now - checkT > 200) {
        checkT = now;
        checkBones();
      }
      // Check once more when brushing stops, so the last strokes count too.
      clearTimeout(trailing);
      trailing = setTimeout(checkBones, 250);
    }
    function checkBones() {
      for (const b of buried) if (!b.got && uncovered(b) > 0.5) collect(b);
    }
    async function collect(b) {
      b.got = true;
      found.push(b.i);
      sounds.found();
      b.el.classList.add('glow');
      const cx = SAND.x + b.cx;
      const cy = SAND.y + b.cy;
      fx.sparkles(cx, cy, 60, 10);
      await wait(700);
      b.el.animate([{ transform: b.el.style.transform }, { transform: `translate(${1180 - cx}px,${700 - cy}px) scale(.3)`, opacity: 0.4 }], { duration: 600, fill: 'forwards', easing: 'ease-in' });
      drawCrate();
      wiggle(crate, 'jump');
      talkText(guide, COUNT[found.length - 1]);
      buildMuseum();
      if (found.length === 5) { await wait(900); sfx.ta_da(); sayG(LINES.all); }
    }
    g.target = areaTarget(SAND);
    let brushed = 0;
    const brush = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-8" y="-46" width="16" height="50" rx="6" fill="#8d5a3b"/><path d="M-26,4 H26 L22,44 H-22 Z" fill="#e9c46a"/><path d="M-18,8 V40 M-6,8 V42 M6,8 V42 M18,8 V40" stroke="#bc6c25" stroke-width="3"/></svg>',
      w: 100, h: 100, grab: [0, -40], hot: [0, 40], auto: true,
      apply(p, sp, on) { if (!on) return; brushAt(p, 44); if (++brushed % 10 === 0) sounds.brush(); },
    });
    const shovel = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-6" y="-48" width="12" height="56" rx="5" fill="#8d5a3b"/><path d="M-24,8 H24 L18,40 Q0,50 -18,40 Z" fill="#adb5bd"/></svg>',
      w: 100, h: 100, grab: [0, -40], hot: [0, 40], auto: true,
      apply(p, sp, on) { if (!on) return; brushAt(p, 70); if (++brushed % 6 === 0) sounds.brush(); },
    });
    const glass = div('tool roundbtn', '<span>🔍</span>', null);
    glass.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(glass, 'press');
      sayG(LINES.look);
      buried.filter(b => !b.got).forEach(b => {
        const hint = div('bonehint', '', dig);
        hint.style.cssText = `left:${SAND.x + b.cx - 60}px;top:${SAND.y + b.cy - 60}px`;
        setTimeout(() => hint.remove(), 2200);
      });
    });
    const digTray = div('tray-row');
    digTray.append(brush, shovel, glass);

    // ================= museum ==============================================================
    const museum = div('panel p-museum', '<div class="wall"></div><div class="floor"></div><div class="plinth"></div><div class="nest"></div><div class="plaque"></div>');
    const frame = div('frame', '', museum);
    const shelf = div('tray-row shelf');
    function buildMuseum() {
      frame.innerHTML = '';
      museum.querySelector('.plaque').textContent = placed.length === 5 ? '🦖' : '';
      DINOS[dino].forEach(([k, x, y], i) => {
        const [w, h] = PIECES[k];
        const el = div(`slot${placed.includes(i) ? ' filled' : ''}`, pieceSVG(k), frame);
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      });
      shelf.innerHTML = '';
      found.filter(i => !placed.includes(i)).forEach(i => {
        const [k] = DINOS[dino][i];
        const item = div('tool shelfbone', pieceSVG(k), shelf);
        item.addEventListener('pointerdown', e => {
          e.stopPropagation();
          const p0 = toStage(e.clientX, e.clientY);
          const ghost = div('ghost boneghost', pieceSVG(k), g.dragLayer);
          const [w, h] = PIECES[k];
          ghost.style.width = `${w}px`;
          ghost.style.height = `${h}px`;
          ghost.style.transform = `translate(${p0.x - w / 2}px,${p0.y - h / 2}px)`;
          item.classList.add('out');
          dragThing(e, {
            move: p => { ghost.style.transform = `translate(${p.x - w / 2}px,${p.y - h / 2}px)`; },
            end: (p, moved) => {
              ghost.remove();
              item.classList.remove('out');
              const [, x, y] = DINOS[dino][i];
              const cx = MUSEUM.x + x + w / 2;
              const cy = MUSEUM.y + y + h / 2;
              if (!moved || Math.hypot(p.x - cx, p.y - cy) < 160) place(i);
              else sfx.boing();
            },
          });
        });
      });
      if (!found.length) div('emptyshelf', '⛏️', shelf);
    }
    async function place(i) {
      placed.push(i);
      sounds.click();
      buildMuseum();
      const [, x, y] = DINOS[dino][i];
      fx.sparkles(MUSEUM.x + x + 60, MUSEUM.y + y + 40, 60, 8);
      if (placed.length < 5) return;
      await wait(500);
      sfx.ta_da();
      fx.confetti(700, 400, 70);
      frame.classList.add('alive');
      await talkText(guide, DINO_NAMES[dino]);
      sounds.roar();
      say(LINES.roar[0], 0.7);
      await wait(2200);
      frame.classList.remove('alive');
      saved.n++;
      saveData('dino', saved);
      await sayG(LINES.next);
      newDig();
    }

    // The egg in the nest hatches after three taps.
    let eggTaps = 0;
    const egg = div('dinoegg', '🥚', museum);
    egg.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      eggTaps++;
      wiggle(egg, 'jump');
      sounds.crack();
      if (eggTaps < 3) { sayG(LINES.egg, { chatty: true }); return; }
      egg.textContent = pick(['🦕', '🦖']);
      egg.classList.add('hatched');
      sounds.squeak();
      fx.sparkles(1180, 640, 60, 12);
      await sayG(LINES.hatch);
      setTimeout(() => { egg.textContent = '🥚'; egg.classList.remove('hatched'); eggTaps = 0; }, 6000);
    });

    newDig();
    g.setStations([
      { id: 'dig', icon: '⛏️', panel: dig, tray: digTray, hint: () => (found.length === 5 ? null : brush) },
      { id: 'museum', icon: '🦕', panel: museum, tray: shelf, enter: () => { if (found.length > placed.length) sayG(LINES.museum); }, hint: () => shelf.querySelector('.shelfbone') || egg },
    ]);
    setTimeout(() => sayG(LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__dino = { get dino() { return dino; }, get found() { return found.length; }, get placed() { return placed.length; }, brushAt, buried, place, SAND };
  },
};
