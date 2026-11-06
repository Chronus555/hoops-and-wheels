// Art Studio, three stations:
//  - Paint: finger-paint on the easel. Paint pots on the left (each colour is named),
//    and tools in the tray: big/little brush, rainbow brush, glitter, stamps, eraser,
//    a new page, and "put it on the fridge".
//  - Color: coloring pages (car, house, fish, rocket); tap a part to fill it.
//  - Fridge: the last six pictures, held up with magnets.

import { div, rand, pick, toStage, track, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, PAINTS, STAMPS } from './lines.js';

const EASEL = { x: 260, y: 140, w: 900, h: 600 };
const RES = 1.5;
const ink = '#2b2d42';
const o = 'stroke="#2b2d42" stroke-width="6" stroke-linejoin="round"';
// Coloring pages: every region is its own path with a data-r name.
const PAGES = {
  car: `<rect data-r="sky" x="0" y="0" width="600" height="300" fill="#fff" ${o}/><rect data-r="road" x="0" y="300" width="600" height="120" fill="#fff" ${o}/>
    <circle data-r="sun" cx="510" cy="80" r="50" fill="#fff" ${o}/>
    <path data-r="body" d="M90,300 L90,230 Q90,210 110,206 L200,196 L250,140 Q260,128 280,128 L390,128 Q410,128 420,142 L460,196 L500,206 Q520,212 520,236 L520,300 Z" fill="#fff" ${o}/>
    <path data-r="window" d="M270,146 L390,146 L420,196 L240,196 Z" fill="#fff" ${o}/>
    <circle data-r="wheel1" cx="180" cy="310" r="46" fill="#fff" ${o}/><circle data-r="wheel2" cx="430" cy="310" r="46" fill="#fff" ${o}/>`,
  house: `<rect data-r="sky" x="0" y="0" width="600" height="330" fill="#fff" ${o}/><rect data-r="grass" x="0" y="330" width="600" height="90" fill="#fff" ${o}/>
    <circle data-r="sun" cx="90" cy="80" r="46" fill="#fff" ${o}/><rect data-r="chimney" x="380" y="70" width="44" height="80" fill="#fff" ${o}/>
    <path data-r="roof" d="M160,180 L320,60 L480,180 Z" fill="#fff" ${o}/><rect data-r="wall" x="180" y="180" width="280" height="150" fill="#fff" ${o}/>
    <rect data-r="door" x="290" y="240" width="60" height="90" rx="8" fill="#fff" ${o}/><rect data-r="win1" x="205" y="205" width="60" height="50" fill="#fff" ${o}/><rect data-r="win2" x="375" y="205" width="60" height="50" fill="#fff" ${o}/>`,
  fish: `<rect data-r="water" x="0" y="0" width="600" height="420" fill="#fff" ${o}/>
    <path data-r="tail" d="M420,210 L540,130 L520,210 L540,290 Z" fill="#fff" ${o}/>
    <ellipse data-r="body" cx="290" cy="210" rx="160" ry="100" fill="#fff" ${o}/>
    <path data-r="fin" d="M260,112 Q300,40 350,118 Z" fill="#fff" ${o}/>
    <circle data-r="eye" cx="200" cy="190" r="22" fill="#fff" ${o}/><circle cx="200" cy="190" r="8" fill="${ink}"/>
    <circle data-r="b1" cx="90" cy="110" r="22" fill="#fff" ${o}/><circle data-r="b2" cx="60" cy="60" r="14" fill="#fff" ${o}/>`,
  rocket: `<rect data-r="space" x="0" y="0" width="600" height="420" fill="#fff" ${o}/>
    <path data-r="flame" d="M260,330 Q300,420 340,330 Z" fill="#fff" ${o}/>
    <path data-r="fin1" d="M240,250 L190,330 L250,320 Z" fill="#fff" ${o}/><path data-r="fin2" d="M360,250 L410,330 L350,320 Z" fill="#fff" ${o}/>
    <path data-r="body" d="M240,320 L240,140 Q240,80 300,40 Q360,80 360,140 L360,320 Z" fill="#fff" ${o}/>
    <circle data-r="window" cx="300" cy="170" r="34" fill="#fff" ${o}/>
    <path data-r="star" d="M500,60 l14,30 32,4 -24,22 6,32 -28,-16 -28,16 6,-32 -24,-22 32,-4 Z" fill="#fff" ${o}/><circle data-r="planet" cx="100" cy="300" r="56" fill="#fff" ${o}/>`,
};
const PAGE_ORDER = Object.keys(PAGES);
const sounds = {
  dab: () => tone(500 + Math.random() * 300, 0.06, { type: 'triangle', vol: 0.06 }),
  stamp: () => { noise(0.08, { freq: 500, q: 1, vol: 0.4 }); tone(200, 0.1, { vol: 0.1 }); },
  fill: () => tone(600, 0.25, { to: 1200, vol: 0.12 }),
  swoosh: () => noise(0.4, { freq: 3000, q: 0.5, vol: 0.25, to: 800 }),
};

export default {
  id: 'art',
  open(ctx) {
    useStyle('js/places/art/style.css');
    document.body.dataset.screen = 'art';
    const g = makeScene({ cls: 'art', onHome: leave });
    const { fx } = g;
    const artist = pick(FRIEND_KINDS);
    const saved = loadData('art', { pics: [] });
    let color = 'blue';
    let mode = 'brush';
    let big = true;
    let stampKey = 'star';

    function palette(parent) {
      const p = div('palette', '', parent);
      Object.entries(PAINTS).forEach(([k, [c]]) => {
        const pot = div(`pot${k === color ? ' on' : ''}`, `<i style="background:${c}"></i>`, p);
        pot.dataset.k = k;
        pot.addEventListener('pointerdown', e => {
          e.stopPropagation();
          color = k;
          if (mode === 'eraser' || mode === 'rainbow') mode = 'brush';
          document.querySelectorAll('.art .pot').forEach(x => x.classList.toggle('on', x.dataset.k === k));
          sfx.pop();
          wiggle(pot, 'jump');
          talkText(artist, PAINTS[k][1]);
          markTools();
        });
      });
      return p;
    }

    // ================= paint ==============================================================
    const paint = div('panel p-paint2', '<div class="wall"></div><div class="floor"></div><div class="easelleg l"></div><div class="easelleg r"></div>');
    palette(paint);
    const canvas = document.createElement('canvas');
    canvas.className = 'paper';
    canvas.width = EASEL.w * RES;
    canvas.height = EASEL.h * RES;
    paint.appendChild(canvas);
    const c2 = canvas.getContext('2d');
    c2.setTransform(RES, 0, 0, RES, 0, 0);
    function clearPaper() {
      c2.fillStyle = '#fff';
      c2.fillRect(0, 0, EASEL.w, EASEL.h);
    }
    clearPaper();
    let strokes = 0;
    let hue = 0;
    const local = p => ({ x: p.x - EASEL.x, y: p.y - EASEL.y });
    function dab(a, b) {
      c2.lineCap = 'round';
      c2.lineJoin = 'round';
      if (mode === 'eraser') {
        c2.strokeStyle = '#fff';
        c2.lineWidth = 60;
      } else if (mode === 'rainbow') {
        hue = (hue + 4) % 360;
        c2.strokeStyle = `hsl(${hue},90%,60%)`;
        c2.lineWidth = big ? 36 : 14;
      } else {
        c2.strokeStyle = PAINTS[color][0];
        c2.lineWidth = big ? 36 : 14;
      }
      c2.beginPath();
      c2.moveTo(a.x, a.y);
      c2.lineTo(b.x, b.y);
      c2.stroke();
    }
    function glitterAt(p, sp) {
      for (let i = 0; i < 3; i++) {
        const x = p.x + rand(-26, 26);
        const y = p.y + rand(-26, 26);
        const s = rand(4, 9);
        c2.fillStyle = pick(['#ffd166', '#fff6a8', '#ff8fc7', '#90e0ef', '#c0c0c0']);
        c2.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const d = k % 2 ? s * 0.35 : s;
          c2.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
        }
        c2.fill();
      }
      if (Math.random() < 0.3) fx.sparkles(sp.x, sp.y, 20, 1);
    }
    function stampAt(p) {
      c2.font = `${big ? 110 : 64}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
      c2.textAlign = 'center';
      c2.textBaseline = 'middle';
      c2.fillText(STAMPS[stampKey][0], p.x, p.y);
      sounds.stamp();
    }
    canvas.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const sp = toStage(e.clientX, e.clientY);
      let last = local(sp);
      if (mode === 'stamp') {
        stampAt(last);
        if (Math.random() < 0.4) talkText(artist, STAMPS[stampKey][1]);
        return;
      }
      if (mode === 'glitter') glitterAt(last, sp);
      else dab(last, { x: last.x + 0.1, y: last.y });
      sounds.dab();
      track(e, {
        move: p => {
          const l = local(p);
          if (mode === 'glitter') glitterAt(l, p);
          else dab(last, l);
          last = l;
          if (++strokes % 14 === 0) sounds.dab();
        },
        end: () => {
          if (strokes > 300) {
            strokes = 0;
            talk(artist, LINES.wow, { chatty: true });
          }
        },
      });
    });

    const paintTray = div('tray-row');
    const tools = {};
    const tool = (key, icon, fn) => {
      const b = div(`tool roundbtn t-${key}`, `<span>${icon}</span>`, paintTray);
      b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); fn(b); markTools(); });
      tools[key] = b;
      return b;
    };
    function markTools() {
      Object.entries(tools).forEach(([k, b]) => b.classList.toggle('on', k === mode));
      tools.size.querySelector('span').textContent = big ? '🖌️' : '✏️';
      tools.stamp.querySelector('span').textContent = STAMPS[stampKey][0];
    }
    tool('size', '🖌️', () => {
      if (mode !== 'brush' && mode !== 'rainbow') mode = 'brush';
      else big = !big;
      talk(artist, big ? LINES.big : LINES.small, { chatty: true });
      sfx.tap();
    });
    tool('rainbow', '🌈', () => { mode = 'rainbow'; talk(artist, LINES.rainbow); sfx.sparkle(); });
    tool('glitter', '✨', () => { mode = 'glitter'; talk(artist, LINES.glitter); sfx.sparkle(); });
    tool('stamp', '⭐', () => {
      if (mode === 'stamp') {
        const keys = Object.keys(STAMPS);
        stampKey = keys[(keys.indexOf(stampKey) + 1) % keys.length];
      }
      mode = 'stamp';
      sounds.stamp();
      talkText(artist, STAMPS[stampKey][1]);
    });
    tool('eraser', '🧽', () => { mode = 'eraser'; talk(artist, LINES.eraser, { chatty: true }); sfx.squish(); });
    tool('clear', '📄', () => {
      sounds.swoosh();
      clearPaper();
      talk(artist, LINES.clear);
    });
    tool('save', '🧲', () => saveToFridge());
    markTools();

    // ================= coloring pages =======================================================
    const color2 = div('panel p-color', '<div class="wall"></div><div class="floor"></div>');
    palette(color2);
    const page = div('page', '', color2);
    let pageKey = PAGE_ORDER[0];
    function showPage(k) {
      pageKey = k;
      page.innerHTML = `<svg viewBox="0 0 600 420">${PAGES[k]}</svg>`;
      page.querySelectorAll('[data-r]').forEach(r => r.addEventListener('pointerdown', e => {
        e.stopPropagation();
        r.setAttribute('fill', PAINTS[color][0]);
        sounds.fill();
        const sp = toStage(e.clientX, e.clientY);
        fx.sparkles(sp.x, sp.y, 30, 5);
        if (page.querySelectorAll('[data-r][fill="#fff"]').length === 0) {
          sfx.ta_da();
          talk(artist, LINES.wow);
        }
      }));
    }
    showPage(pageKey);
    const colorTray = div('tray-row');
    PAGE_ORDER.forEach(k => {
      const b = div('tool pagebtn', `<svg viewBox="0 0 600 420">${PAGES[k]}</svg>`, colorTray);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        sounds.swoosh();
        showPage(k);
        talk(artist, LINES.page, { chatty: true });
      });
    });
    const savePage = div('tool roundbtn', '<span>🧲</span>', colorTray);
    savePage.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(savePage, 'press'); saveToFridge(); });

    // ================= fridge ==============================================================
    const fridgePanel = div('panel p-fridge', '<div class="wall"></div><div class="floor"></div><div class="fridge"><div class="door1"></div><div class="door2"></div><i></i><i></i></div>');
    const board = div('board', '', fridgePanel);
    const MAGNETS = ['#ef476f', '#ffd166', '#06d6a0', '#4895ef', '#9b5de5', '#f8961e'];
    function drawFridge() {
      board.innerHTML = '';
      saved.pics.forEach((pic, i) => {
        const card = div('pic', pic.img ? `<img src="${pic.img}" alt="">` : `<svg viewBox="0 0 600 420">${pic.svg}</svg>`, board);
        card.style.transform = `rotate(${[-4, 3, -2, 5, -3, 2][i % 6]}deg)`;
        div('magnet', '', card).style.background = MAGNETS[i % 6];
        card.addEventListener('pointerdown', e => {
          e.stopPropagation();
          wiggle(card, 'jump');
          talk(artist, LINES.wow, { chatty: true });
        });
      });
      if (!saved.pics.length) div('empty', '🎨', board);
    }
    function saveToFridge() {
      let pic;
      if (g.station().id === 'color') pic = { svg: page.querySelector('svg').innerHTML };
      else {
        const small = document.createElement('canvas');
        small.width = 300;
        small.height = 200;
        small.getContext('2d').drawImage(canvas, 0, 0, 300, 200);
        pic = { img: small.toDataURL('image/jpeg', 0.7) };
      }
      saved.pics.unshift(pic);
      saved.pics.length = Math.min(saved.pics.length, 6);
      saveData('art', saved, () => { if (saved.pics.length > 1) { saved.pics.pop(); return true; } return false; });
      g.flash();
      sfx.shutter();
      drawFridge();
      talk(artist, LINES.save);
    }
    drawFridge();

    g.setStations([
      { id: 'paint', icon: '🖌️', panel: paint, tray: paintTray, hint: () => document.querySelector('.p-paint2 .pot:not(.on)') },
      { id: 'color', icon: '🖍️', panel: color2, tray: colorTray, hint: () => colorTray.children[1] },
      { id: 'fridge', icon: '🧲', panel: fridgePanel, tray: div('tray-row'), enter: drawFridge, hint: () => board.firstChild },
    ]);
    setTimeout(() => talk(artist, LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__art = { get mode() { return mode; }, saved, saveToFridge, showPage, get pageKey() { return pageKey; } };
  },
};
