// Ocean Dive: touch anywhere and the submarine swims there. The deeper it goes the
// darker the sea gets; the headlight (💡) lights the way. Sea creatures are named the
// first time the sub swims by (and every time they're tapped): a pufferfish puffs
// up, the octopus squirts ink, the whale sings. On the seabed three treasure chests
// open to count out gems.

import { div, rand, pick, frames, toStage, track, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, CREATURES, COUNT } from './lines.js';

const DEPTH = 3200; // height of the sea, in stage units
const VIEW_TOP = 112;
const VIEW_H = 716;
const sounds = {
  ping: () => { tone(1200, 0.6, { vol: 0.12 }); tone(1200, 0.4, { vol: 0.04, at: 0.4 }); },
  blub: () => tone(300 + Math.random() * 300, 0.12, { to: 900, vol: 0.12 }),
  whale: () => { tone(180, 1.4, { type: 'triangle', vol: 0.15, to: 420 }); tone(420, 1.2, { type: 'triangle', vol: 0.12, to: 160, at: 1.2 }); },
  puff: () => tone(200, 0.4, { to: 600, vol: 0.2 }),
  creak: () => { tone(160, 0.5, { type: 'sawtooth', vol: 0.06, to: 260 }); sfx.sparkle(); },
  ink: () => noise(0.5, { freq: 400, q: 0.6, vol: 0.4 }),
};

export default {
  id: 'ocean',
  open(ctx) {
    useStyle('js/places/ocean/style.css');
    document.body.dataset.screen = 'ocean';
    const g = makeScene({ cls: 'ocean', onHome: leave });
    const { fx } = g;
    const pilot = pick(FRIEND_KINDS);
    const sayP = (l, o) => talk(pilot, l, o);
    const saved = loadData('ocean', { gems: 0 });

    const panel = div('panel p-ocean', '');
    const world = div('sea', '<div class="sunlight"></div><div class="seabed"></div>', panel);
    world.style.height = `${DEPTH}px`;
    // Seaweed, coral and rocks.
    for (let i = 0; i < 14; i++) {
      const w = div('weed', '', world);
      w.style.left = `${rand(20, 1360)}px`;
      w.style.top = `${DEPTH - rand(150, 260)}px`;
      w.style.animationDelay = `${-rand(0, 3)}s`;
      w.style.background = pick(['#2d6a4f', '#40916c', '#52b788']);
    }
    ['🪸', '🪸', '🪨', '🪸', '🪨'].forEach((e, i) => { const c = div('coral', e, world); c.style.left = `${120 + i * 270}px`; c.style.top = `${DEPTH - 200}px`; });

    // ---- creatures ------------------------------------------------------------------
    const critters = [];
    function critter(kind, emo, x, y, opts = {}) {
      const el = div(`critter c-${kind}`, emo, world);
      const c = { kind, el, x, y, vx: opts.vx || 0, size: opts.size || 90, seen: false, flip: opts.vx > 0, home: x, ...opts };
      el.style.fontSize = `${c.size}px`;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); poke(c); });
      critters.push(c);
      return c;
    }
    [[300, 'fish', '🐠'], [420, 'fish', '🐟'], [560, 'fish', '🐠'], [700, 'fish', '🐟'], [860, 'fish', '🐠']].forEach(([y, k, e], i) => critter(k, e, rand(100, 1300), y, { vx: (i % 2 ? -1 : 1) * rand(60, 120), size: 70 }));
    critter('puffer', '🐡', 950, 1050, { size: 90 });
    critter('turtle', '🐢', 300, 1350, { vx: 50, size: 110 });
    critter('whale', '🐋', 700, 1700, { vx: -30, size: 240 });
    critter('octopus', '🐙', 1100, 2120, { size: 120 });
    critter('jelly', '🪼', 380, 2250, { size: 100, bob: true });
    critter('jelly', '🪼', 920, 2550, { size: 80, bob: true });
    critter('squid', '🦑', 240, 2750, { vx: 40, size: 110 });
    critter('crab', '🦀', 520, DEPTH - 130, { vx: 70, size: 80, floor: true });
    critter('star', '⭐', 960, DEPTH - 110, { size: 70 });

    async function poke(c) {
      wiggle(c.el, 'jump');
      if (c.kind === 'puffer') { sounds.puff(); c.el.classList.add('puffed'); setTimeout(() => c.el.classList.remove('puffed'), 2000); talk(pilot, LINES.puff, { chatty: true }); }
      if (c.kind === 'octopus') { sounds.ink(); const p = screenPos(c); for (let i = 0; i < 18; i++) fx.add({ kind: 'dot', x: p.x + rand(-60, 60), y: p.y + rand(-40, 40), vx: rand(-60, 60), vy: rand(-60, 60), r: rand(10, 24), life: rand(1, 1.8), color: 'rgba(30,20,40,.7)' }); talk(pilot, LINES.ink, { chatty: true }); }
      if (c.kind === 'whale') { sounds.whale(); fx.bubbles(screenPos(c).x - 60, screenPos(c).y - 80, 12); talk(pilot, LINES.song, { chatty: true }); }
      if (c.kind === 'fish') { c.vx *= 2.5; setTimeout(() => { c.vx /= 2.5; }, 1500); sounds.blub(); }
      c.seen = true;
      await wait(c.kind === 'fish' ? 0 : 900);
      talkText(pilot, CREATURES[c.kind]);
    }

    // ---- treasure chests ------------------------------------------------------------
    const chests = [200, 700, 1200].map((x, i) => {
      const el = div('chest', '<div class="lid"></div><div class="box"></div><div class="glow"></div>', world);
      el.style.left = `${x - 70}px`;
      el.style.top = `${DEPTH - 170 - (i % 2) * 20}px`;
      const ch = { x, y: DEPTH - 130, el, open: false };
      el.addEventListener('pointerdown', e => { e.stopPropagation(); openChest(ch); });
      return ch;
    });
    const gemCount = div('gemcount', '💎 <b></b>', panel);
    const drawGems = () => { gemCount.querySelector('b').textContent = String(saved.gems); };
    drawGems();
    async function openChest(ch) {
      if (ch.open) { wiggle(ch.el, 'jump'); return; }
      ch.open = true;
      ch.el.classList.add('open');
      sounds.creak();
      await talk(pilot, LINES.treasure);
      for (let i = 0; i < 3; i++) {
        const p = screenPos(ch);
        const gem = div('gem', pick(['💎', '💰', '🪙']), panel);
        gem.animate([{ transform: `translate(${p.x - 30}px,${p.y - 60}px)` }, { transform: `translate(${p.x - 30 + rand(-60, 60)}px,${p.y - 200}px)`, offset: 0.4 }, { transform: 'translate(1250px,130px) scale(.5)' }], { duration: 900, fill: 'forwards' });
        setTimeout(() => gem.remove(), 900);
        sfx.ding();
        saved.gems++;
        drawGems();
        await talkText(pilot, COUNT[i]);
      }
      saveData('ocean', saved);
      // Chests close again after a while, ready to find more.
      setTimeout(() => { ch.open = false; ch.el.classList.remove('open'); }, 25000);
    }

    // ---- the submarine ----------------------------------------------------------------
    const sub = div('sub', `<svg viewBox="0 0 220 140"><ellipse cx="110" cy="80" rx="96" ry="52" fill="#ffd166"/><rect x="88" y="10" width="44" height="40" rx="10" fill="#ffd166"/>
      <rect x="104" y="0" width="8" height="18" fill="#adb5bd"/><circle cx="140" cy="78" r="30" fill="#c3e8ff" stroke="#e09f3e" stroke-width="6"/>
      <g transform="translate(140,82) scale(.6)"><g class="head">${FRIENDS[pilot].svg}</g></g>
      <circle cx="70" cy="80" r="12" fill="#c3e8ff" stroke="#e09f3e" stroke-width="4"/><g class="prop"><rect x="0" y="66" width="18" height="28" rx="6" fill="#adb5bd"/></g>
      <circle class="lamp" cx="204" cy="86" r="10" fill="#fff6a8"/></svg>`, panel);
    const dark = div('dark', '', panel);
    let sx = 300;
    let sy = 260;
    let target = { x: 300, y: 260 };
    let face = 1;
    let cam = 0;
    let light = false;
    let toldDark = false;
    let toldBottom = false;
    const screenPos = c => ({ x: c.x, y: c.y - cam + VIEW_TOP });
    panel.addEventListener('pointerdown', e => {
      const p = toStage(e.clientX, e.clientY);
      target = { x: p.x, y: p.y - VIEW_TOP + cam };
      track(e, { move: q => { target = { x: q.x, y: q.y - VIEW_TOP + cam }; } });
    });
    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      // Sub swims toward the finger.
      const dx = target.x - sx;
      const dy = target.y - sy;
      const d = Math.hypot(dx, dy);
      const speed = Math.min(520, d * 3);
      if (d > 2) {
        sx += (dx / d) * speed * dt;
        sy += (dy / d) * speed * dt;
        if (Math.abs(dx) > 8) face = dx > 0 ? 1 : -1;
        if (Math.random() < 0.25) fx.bubbles(sx - face * 100, sy - cam + VIEW_TOP, 1);
      }
      sx = Math.max(110, Math.min(1290, sx));
      sy = Math.max(90, Math.min(DEPTH - 120, sy));
      cam += (Math.max(0, Math.min(DEPTH - VIEW_H, sy - VIEW_H / 2)) - cam) * Math.min(1, dt * 3);
      world.style.transform = `translateY(${-cam}px)`;
      sub.style.transform = `translate(${sx - 110}px,${sy - cam + VIEW_TOP - 70}px) scaleX(${face})`;
      // Darkness grows with depth; the headlight makes a bigger bright circle.
      const depth = Math.max(0, Math.min(1, (sy - 800) / 1700));
      const r = light ? 300 : 150;
      dark.style.background = `radial-gradient(circle at ${sx}px ${sy - cam}px, transparent 0 ${r * 0.6}px, rgba(3,4,40,${(depth * 0.88).toFixed(2)}) ${r}px)`;
      if (depth > 0.4 && !toldDark) { toldDark = true; sayP(LINES.dark); }
      if (sy > DEPTH - 260 && !toldBottom) { toldBottom = true; sayP(LINES.bottom); }
      // Creatures swim; the first time the sub comes near one, it's named.
      for (const c of critters) {
        if (c.vx) {
          c.x += c.vx * dt;
          if (c.floor) { if (Math.abs(c.x - c.home) > 200) c.vx *= -1; } else if (c.x < -150) c.x = 1550; else if (c.x > 1550) c.x = -150;
        }
        const bob = c.bob ? Math.sin(performance.now() / 600 + c.home) * 30 : 0;
        c.el.style.transform = `translate(${c.x - c.size / 2}px,${c.y - c.size / 2 + bob}px) scaleX(${c.vx > 0 && c.kind !== 'crab' ? -1 : 1})`;
        if (!c.seen && Math.hypot(c.x - sx, c.y - sy) < 220) {
          c.seen = true;
          talkText(pilot, CREATURES[c.kind]);
        }
      }
      for (const ch of chests) if (!ch.open && Math.hypot(ch.x - sx, ch.y - sy) < 150) openChest(ch);
      return true;
    });

    const tray = div('tray-row');
    const btn = (icon, fn) => { const b = div('tool roundbtn', `<span>${icon}</span>`, tray); b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); fn(b); }); return b; };
    const lightBtn = btn('💡', b => { light = !light; b.classList.toggle('on', light); sfx.tap(); if (light) sayP(LINES.light); });
    btn('⬇️', () => { target = { x: sx, y: Math.min(DEPTH - 140, sy + 600) }; sounds.blub(); });
    btn('📡', () => { sounds.ping(); const near = critters.filter(c => Math.abs(c.y - sy) < 700).sort((a, b) => Math.hypot(a.x - sx, a.y - sy) - Math.hypot(b.x - sx, b.y - sy))[0]; if (near) { wiggle(near.el, 'jump'); talkText(pilot, CREATURES[near.kind]); } });
    btn('⬆️', () => { target = { x: sx, y: 200 }; sounds.blub(); sayP(LINES.surface); });

    g.setStations([{ id: 'ocean', icon: '🌊', panel, tray, hint: () => (sy > 1500 && !light ? lightBtn : tray.children[1]) }]);
    setTimeout(() => sayP(LINES.hello), 400);

    function leave() {
      stop();
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ocean = { go: (x, y) => { target = { x, y }; }, get sub() { return { x: sx, y: sy }; }, critters, chests, saved };
  },
};
