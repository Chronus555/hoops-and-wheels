// Monster Maker, two stations:
//  - Build: choose the monster's shape, colour, how many eyes (1 to 5, counted out
//    loud), mouth, horns and pattern.
//  - Feed: give it cookies, cupcakes, fish... it says "Yum!" (or "Yucky!" to
//    broccoli) and loves socks most of all. It grows a little with each bite, then
//    burps. Tickle its tummy to make it giggle.

import { div, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { say } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, EYES, PART_NAMES, COLOR_SAY } from './lines.js';

const VOICE = 0.78; // deep monster voice
const COLORS = Object.keys(COLOR_SAY);
const ink = '#2b2d42';
const SHAPES = {
  round: { top: 96, d: 'M200,90 C320,90 370,180 360,270 C352,350 300,410 200,410 C100,410 48,350 40,270 C30,180 80,90 200,90 Z' },
  tall: { top: 50, d: 'M200,46 C280,46 300,110 300,180 L300,360 C300,400 260,412 200,412 C140,412 100,400 100,360 L100,180 C100,110 120,46 200,46 Z' },
  wide: { top: 170, d: 'M200,166 C330,166 392,220 392,300 C392,380 320,412 200,412 C80,412 8,380 8,300 C8,220 70,166 200,166 Z' },
  wiggly: { top: 80, d: 'M200,78 C250,60 300,110 330,120 C380,140 360,200 368,250 C380,320 350,400 280,408 C240,414 220,400 200,410 C170,420 120,416 90,400 C40,370 30,320 40,270 C46,220 20,160 70,120 C110,90 150,96 200,78 Z' },
};
const MOUTHS = {
  smile: y => `<path d="M140,${y} Q200,${y + 60} 260,${y}" fill="#7a2335" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/>`,
  fangs: y => `<path d="M140,${y} Q200,${y + 56} 260,${y} Z" fill="#7a2335" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/><path d="M160,${y + 4} l10,20 l10,-18 Z M220,${y + 4} l10,18 l10,-20 Z" fill="#fff"/>`,
  tongue: y => `<path d="M145,${y} Q200,${y + 56} 255,${y} Z" fill="#7a2335" stroke="${ink}" stroke-width="6"/><path d="M188,${y + 20} q12,44 26,0 Z" fill="#ff8fab" stroke="${ink}" stroke-width="4"/>`,
  oh: y => `<ellipse cx="200" cy="${y + 18}" rx="26" ry="30" fill="#7a2335" stroke="${ink}" stroke-width="6"/>`,
};
const TOPS = {
  horns: t => `<path d="M120,${t + 30} Q100,${t - 50} 150,${t - 40} Q140,${t} 160,${t + 20} Z M280,${t + 30} Q300,${t - 50} 250,${t - 40} Q260,${t} 240,${t + 20} Z" fill="#fff3d6" stroke="${ink}" stroke-width="5"/>`,
  antennae: t => `<path d="M160,${t + 10} Q140,${t - 50} 120,${t - 70} M240,${t + 10} Q260,${t - 50} 280,${t - 70}" fill="none" stroke="${ink}" stroke-width="6"/><circle cx="120" cy="${t - 72}" r="16" fill="#ffd166" stroke="${ink}" stroke-width="5"/><circle cx="280" cy="${t - 72}" r="16" fill="#ffd166" stroke="${ink}" stroke-width="5"/>`,
  ears: (t, c) => `<path d="M100,${t + 60} L90,${t - 40} L160,${t + 20} Z M300,${t + 60} L310,${t - 40} L240,${t + 20} Z" fill="${c}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>`,
  none: () => '',
};
const PATTERNS = {
  plain: () => '',
  spots: () => [[110, 300], [280, 330], [240, 220], [150, 380], [320, 250], [90, 220]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${14 + (i % 3) * 8}" fill="rgba(255,255,255,.35)"/>`).join(''),
  stripes: () => [200, 250, 300, 350, 400].map(y => `<rect x="0" y="${y}" width="400" height="18" fill="rgba(0,0,0,.14)"/>`).join(''),
  stars: () => [[110, 320], [290, 300], [200, 390], [320, 380], [80, 250]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="34" text-anchor="middle" fill="rgba(255,255,255,.6)">★</text>`).join(''),
};
const FOODS = { cookie: '🍪', cupcake: '🧁', fish: '🐟', apple: '🍎', pizza: '🍕', broccoli: '🥦', sock: '🧦' };
const TABS = { shape: '🫧', color: '🎨', eyes: '👀', mouth: '👄', top: '🦄', pattern: '🌟' };
const sounds = {
  chomp: () => [0, 0.18, 0.36].forEach(at => { noise(0.08, { freq: 350, q: 1.5, vol: 0.5, at }); tone(120, 0.08, { to: 80, vol: 0.2, at }); }),
  burp: () => { tone(90, 0.7, { type: 'sawtooth', vol: 0.18, to: 55 }); noise(0.6, { freq: 160, vol: 0.3 }); },
  spit: () => { noise(0.2, { freq: 2500, q: 1, vol: 0.4 }); tone(400, 0.3, { to: 900, vol: 0.15 }); },
  roar: () => { tone(110, 0.6, { type: 'sawtooth', vol: 0.12, to: 160 }); noise(0.6, { freq: 300, q: 0.7, vol: 0.3 }); },
};

function monsterSVG(m, mouthOpen = false, id = 'big') {
  const s = SHAPES[m.shape];
  const t = s.top;
  const eyeY = t + (m.shape === 'wide' ? 50 : 80);
  const n = m.eyes;
  const r = n === 1 ? 46 : n <= 3 ? 30 : 24;
  const span = n === 1 ? 0 : Math.min(200, 70 * (n - 1));
  const eyes = Array.from({ length: n }, (_, i) => {
    const x = 200 - span / 2 + (n === 1 ? 0 : (span * i) / (n - 1));
    const y = eyeY - (n > 2 ? Math.sin((i / (n - 1)) * Math.PI) * 18 : 0);
    return `<g class="eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${ink}" stroke-width="5"/><circle class="pupil" cx="${x + 4}" cy="${y + 4}" r="${r * 0.45}" fill="${ink}"/><circle cx="${x + 10}" cy="${y - 4}" r="${r * 0.15}" fill="#fff"/></g>`;
  }).join('');
  const mouthY = eyeY + r + 30;
  return `<svg viewBox="0 -60 400 500" overflow="visible">
    <defs><clipPath id="mclip-${id}"><path d="${s.d}"/></clipPath></defs>
    <ellipse cx="130" cy="418" rx="54" ry="22" fill="${m.color}" stroke="${ink}" stroke-width="5"/><ellipse cx="270" cy="418" rx="54" ry="22" fill="${m.color}" stroke="${ink}" stroke-width="5"/>
    ${TOPS[m.top](t, m.color)}
    <path d="${s.d}" fill="${m.color}" stroke="${ink}" stroke-width="6"/>
    <g clip-path="url(#mclip-${id})">${PATTERNS[m.pattern]()}<ellipse cx="200" cy="${(t + 412) / 2 + 60}" rx="90" ry="70" fill="rgba(255,255,255,.25)"/></g>
    ${eyes}
    <g class="mouth">${mouthOpen ? MOUTHS.oh(mouthY) : MOUTHS[m.mouth](mouthY)}</g></svg>`;
}

export default {
  id: 'monster',
  open(ctx) {
    useStyle('js/places/monster/style.css');
    document.body.dataset.screen = 'monster';
    const g = makeScene({ cls: 'monster', onHome: leave });
    const { fx, screen } = g;
    const m = loadData('monster', { shape: 'round', color: '#06d6a0', eyes: 2, mouth: 'smile', top: 'horns', pattern: 'spots' });
    let size = 1;
    let bites = 0;

    const mon = div('mon', '', screen);
    const MON = { x: 470, y: 180, w: 460, h: 575 };
    function draw(open = false) {
      mon.innerHTML = monsterSVG(m, open);
      mon.style.transform = `scale(${size})`;
      saveData('monster', m);
    }
    draw();
    const roar = (lines, o) => say(pick(lines), VOICE, o);
    mon.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const r = mon.getBoundingClientRect();
      const belly = (e.clientY - r.top) / r.height > 0.5;
      wiggle(mon, 'wobble');
      if (belly) {
        sfx.boing();
        roar(LINES.tickle);
      } else {
        sounds.roar();
        roar(LINES.rawr);
      }
    });

    // ================= build ===============================================================
    const build = div('panel p-mbuild', '<div class="wall"></div><div class="floor"></div><div class="lamp"></div>');
    let tab = 'shape';
    const tabs = div('mtabs', '', build);
    const tabBtns = Object.entries(TABS).map(([k, icon]) => {
      const b = div(`mtab${k === tab ? ' on' : ''}`, `<span>${icon}</span>`, tabs);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        tab = k;
        tabBtns.forEach(x => x.classList.toggle('on', x === b));
        sfx.tap();
        fill();
      });
      return b;
    });
    const buildTray = div('tray-row');
    const opts = div('options', '', buildTray);
    function choose(key, value, words) {
      m[key] = value;
      sfx.pop();
      draw();
      fill();
      wiggle(mon, 'wobble');
      fx.sparkles(700, 420, 160, 10);
      say(words, VOICE);
    }
    function fill() {
      opts.innerHTML = '';
      const add = (html, on, fn) => {
        const b = div(`tool mopt${on ? ' on' : ''}`, html, opts);
        b.addEventListener('pointerdown', e => { e.stopPropagation(); fn(); });
      };
      const mini = (patch, id) => `<div class="minimon">${monsterSVG({ ...m, ...patch }, false, id)}</div>`;
      if (tab === 'shape') Object.keys(SHAPES).forEach(k => add(mini({ shape: k }, `s-${k}`), m.shape === k, () => choose('shape', k, PART_NAMES[k])));
      if (tab === 'color') COLORS.forEach(c => add(`<span class="swatch" style="background:${c}"></span>`, m.color === c, () => choose('color', c, COLOR_SAY[c])));
      if (tab === 'eyes') [1, 2, 3, 4, 5].forEach(n => add(`<span class="eyecount">${'👁️'.repeat(n)}</span>`, m.eyes === n, () => choose('eyes', n, EYES[n - 1])));
      if (tab === 'mouth') Object.keys(MOUTHS).forEach(k => add(`<svg viewBox="120 ${150} 160 110">${MOUTHS[k](180)}</svg>`, m.mouth === k, () => choose('mouth', k, PART_NAMES[k])));
      if (tab === 'top') Object.keys(TOPS).forEach(k => add(k === 'none' ? '<span class="none">✖️</span>' : `<svg viewBox="70 -20 260 160">${TOPS[k](80, m.color)}</svg>`, m.top === k, () => choose('top', k, PART_NAMES[k])));
      if (tab === 'pattern') Object.keys(PATTERNS).forEach(k => add(mini({ pattern: k }, `p-${k}`), m.pattern === k, () => choose('pattern', k, PART_NAMES[k])));
    }
    fill();

    // ================= feed ================================================================
    const feed = div('panel p-mfeed', '<div class="wall"></div><div class="floor"></div><div class="table"></div>');
    g.target = areaTarget(MON);
    async function eat(k) {
      if (g.busy()) return;
      g.setBusy(true);
      draw(true);
      await wait(250);
      sounds.chomp();
      draw(false);
      wiggle(mon, 'wobble');
      if (k === 'broccoli') {
        sounds.spit();
        fx.blobs(700, 460, '#52b788', 6);
        await roar(LINES.yuck);
        g.setBusy(false);
        return;
      }
      bites++;
      size = Math.min(1.25, size + 0.05);
      draw();
      fx.sparkles(700, 460, 100, 8);
      await roar(k === 'sock' ? LINES.socks : LINES.yum);
      if (bites % 3 === 0) {
        sounds.burp();
        wiggle(mon, 'wobble');
        await wait(600);
        await roar(LINES.burp);
        size = 1;
        draw();
      } else if (size >= 1.2) roar(LINES.big);
      g.setBusy(false);
    }
    const feedTray = div('tray-row');
    Object.entries(FOODS).forEach(([k, emo]) => {
      feedTray.appendChild(makeTool(g, {
        art: `<span class="emo">${emo}</span>`, w: 96, h: 96, grab: [0, -30],
        drop(p, sp, on) { if (!on) return false; eat(k); return true; },
        tap() { eat(k); },
      }));
    });

    g.setStations([
      { id: 'mbuild', icon: '👾', panel: build, tray: buildTray, hint: () => opts.firstChild },
      { id: 'mfeed', icon: '🍪', panel: feed, tray: feedTray, enter: () => roar(LINES.yum), hint: () => feedTray.firstChild },
    ]);
    setTimeout(() => { sounds.roar(); roar(LINES.hello); }, 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__monster = { m, eat, get size() { return size; }, get bites() { return bites; } };
  },
};
