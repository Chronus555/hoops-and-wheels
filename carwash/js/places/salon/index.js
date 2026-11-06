// Salon & Dress-up: a friend sits in the salon chair next to a mirror.
//  - Hair: the grow spray makes hair longer, the scissors snip it shorter (all the
//    way to bald, which is funny), the comb changes the style, and colour sprays
//    dye it (the friend names the colour).
//  - Dress-up: hats, glasses, a silly mustache, new outfits and a photo.
// The bell sends this friend home happy and brings in the next one.

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, HAIR_COLORS } from './lines.js';

const NS = 'http://www.w3.org/2000/svg';
const C = { x: 300, y: 270, w: 280 }; // the customer (friend 280 wide)
const K = C.w / 130;
const headStage = { x: C.x + 65 * K, y: C.y + (238 - 170) * K };
const STYLES = ['fluffy', 'spiky', 'curly'];
const sounds = {
  snip: () => { noise(0.05, { freq: 6000, q: 2, vol: 0.4 }); tone(2400, 0.04, { type: 'square', vol: 0.04 }); },
  spray: () => noise(0.3, { freq: 6000, q: 0.7, vol: 0.25 }),
  bell: () => { tone(1568, 0.6, { vol: 0.2 }); tone(2093, 0.8, { vol: 0.12, at: 0.15 }); },
};

function hairSVG(h) {
  if (!h.len) return '';
  const c = h.color;
  const out = [];
  if (h.style === 'fluffy') {
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      out.push(`<circle cx="${(Math.cos(a) * 34).toFixed(1)}" cy="${(-172 + Math.sin(a) * 30).toFixed(1)}" r="${12 + h.len}" fill="${c}"/>`);
    }
    for (let j = 1; j <= Math.round(h.len * 2); j++) {
      out.push(`<circle cx="-36" cy="${-172 + j * 12}" r="11" fill="${c}"/><circle cx="36" cy="${-172 + j * 12}" r="11" fill="${c}"/>`);
    }
  } else if (h.style === 'spiky') {
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + 0.25 + (i / 6) * (Math.PI - 0.5);
      const x = Math.cos(a) * 32;
      const y = -172 + Math.sin(a) * 30;
      const tall = 10 + h.len * 9;
      const ang = (a * 180) / Math.PI + 90;
      out.push(`<path d="M-9,0 L0,${-tall} L9,0 Z" fill="${c}" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`);
    }
    out.push(`<path d="M-30,-182 Q0,-206 30,-182 Q0,-196 -30,-182 Z" fill="${c}"/>`);
  } else {
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        const rr = 30 + row * 8;
        out.push(`<circle cx="${(Math.cos(a) * rr).toFixed(1)}" cy="${(-172 + Math.sin(a) * rr * 0.85).toFixed(1)}" r="7" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>`);
      }
    }
    for (let j = 1; j <= Math.round(h.len * 2.5); j++) {
      out.push(`<circle cx="${-38 + (j % 2) * 4}" cy="${-168 + j * 9}" r="6" fill="${c}"/><circle cx="${38 - (j % 2) * 4}" cy="${-168 + j * 9}" r="6" fill="${c}"/>`);
    }
  }
  return out.join('');
}

const HATS = {
  cap: '<path d="M-36,-196 A36,30 0 0 1 36,-196 Z" fill="#ef476f"/><path d="M20,-198 Q56,-200 60,-190 L30,-192 Z" fill="#c9184a"/><circle cy="-226" r="4" fill="#c9184a"/>',
  cowboy: '<ellipse cy="-198" rx="58" ry="10" fill="#8d5a3b"/><path d="M-28,-198 Q-30,-240 -10,-236 Q0,-226 10,-236 Q30,-240 28,-198 Z" fill="#a0673c"/><rect x="-28" y="-208" width="56" height="8" fill="#5e3b1d"/>',
  crown: '<path d="M-34,-198 L-38,-236 L-18,-216 L0,-244 L18,-216 L38,-236 L34,-198 Z" fill="#ffd166" stroke="#e09f3e" stroke-width="3" stroke-linejoin="round"/><circle cy="-208" r="5" fill="#ef476f"/>',
  bow: '<g transform="translate(26,-204) rotate(20)"><path d="M0,0 L-22,-14 L-22,14 Z M0,0 L22,-14 L22,14 Z" fill="#ff8fc7"/><circle r="6" fill="#e5689e"/></g>',
  flower: '<g transform="translate(-26,-200)">' + [0, 72, 144, 216, 288].map(a => `<circle cx="0" cy="-10" r="8" fill="#ffd166" transform="rotate(${a})"/>`).join('') + '<circle r="6" fill="#f8961e"/></g>',
  party: '<path d="M-22,-200 L0,-262 L22,-200 Z" fill="#4895ef"/><path d="M-15,-220 L15,-220 M-8,-240 L8,-240" stroke="#ffd166" stroke-width="5"/><circle cy="-264" r="7" fill="#ef476f"/>',
  chef: '<rect x="-26" y="-214" width="52" height="18" fill="#fff" stroke="#dee2e6" stroke-width="2"/><circle cx="-16" cy="-226" r="16" fill="#fff"/><circle cx="16" cy="-226" r="16" fill="#fff"/><circle cy="-236" r="18" fill="#fff"/>',
};
const GLASSES = '<g fill="rgba(144,224,239,.45)" stroke="#2b2d42" stroke-width="3.5"><circle cx="-14" cy="-176" r="11"/><circle cx="14" cy="-176" r="11"/><path d="M-3,-176 H3" /></g>';
const MUSTACHE = '<path d="M0,-153 C-8,-162 -24,-160 -28,-148 C-20,-152 -10,-150 0,-147 C10,-150 20,-152 28,-148 C24,-160 8,-162 0,-153 Z" fill="#3b2416"/>';

export default {
  id: 'salon',
  open(ctx) {
    useStyle('js/places/salon/style.css');
    document.body.dataset.screen = 'salon';
    const g = makeScene({ cls: 'salon', onHome: leave });
    const { fx, screen } = g;

    // The customer and the mirror stay put while the walls scroll between stations.
    const chair = div('chair', '', screen);
    const custBox = div('customer', '', screen);
    custBox.style.cssText = `left:${C.x}px;top:${C.y}px;width:${C.w}px;height:${C.w * 240 / 130}px`;
    const mirror = div('mirror', '<div class="reflect"></div><div class="shine"></div>', screen);
    const reflect = mirror.querySelector('.reflect');
    let cust = null;
    let look = null;
    let mirrorFriend = null;
    let lastKind = null;
    const overlays = [];

    function drawLook() {
      const art = `${hairSVG(look.hair)}${look.glasses ? GLASSES : ''}${look.mustache ? MUSTACHE : ''}${look.hat ? `<g transform="translate(0,${-look.hair.len * 3})">${HATS[look.hat]}</g>` : ''}`;
      overlays.forEach(o => { o.innerHTML = art; });
      if (mirrorFriend && mirrorFriend.outfit !== look.outfit) mirrorFriend.dress({ outfit: look.outfit });
    }
    function makeOverlay(parent) {
      const o = document.createElementNS(NS, 'svg');
      o.setAttribute('viewBox', '-65 -238 130 240');
      o.setAttribute('class', 'looklayer');
      parent.appendChild(o);
      return o;
    }
    async function nextCustomer() {
      const kind = pick(FRIEND_KINDS.filter(k => k !== lastKind));
      lastKind = kind;
      look = { outfit: pick(OUTFITS), hair: { len: Math.floor(rand(1, 3)), style: pick(STYLES), color: pick(Object.values(HAIR_COLORS))[0] }, hat: null, glasses: false, mustache: false };
      custBox.innerHTML = '';
      reflect.innerHTML = '';
      overlays.length = 0;
      cust = new Friend(kind, { outfit: look.outfit, width: C.w, parent: custBox });
      overlays.push(makeOverlay(custBox));
      mirrorFriend = new Friend(kind, { outfit: look.outfit, width: 220, parent: reflect });
      overlays.push(makeOverlay(reflect));
      drawLook();
      custBox.animate([{ transform: 'translateX(-600px)' }, { transform: 'none' }], { duration: 800, easing: 'ease-out' });
      await wait(800);
      talk(kind, LINES.hello);
    }
    const sayC = (l, o) => cust && talk(cust.kind, l, o);
    function react(mood = 'happy') {
      cust.mood(mood, 1200);
      mirrorFriend.mood(mood, 1200);
    }
    custBox.addEventListener('pointerdown', e => {
      e.stopPropagation();
      cust.mood('giggle', 900);
      mirrorFriend.mood('giggle', 900);
      sfx.boing();
    });
    mirror.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(mirror, 'jump');
      react('wow');
      sayC(LINES.mirror);
    });

    // ---- hair station ------------------------------------------------------------
    const hairPanel = div('panel p-hair', '<div class="wall"></div><div class="floor"></div><div class="poster p1">✂️</div><div class="poster p2">💈</div>');
    g.target = areaTarget({ x: headStage.x - 120, y: headStage.y - 140, w: 240, h: 230 });
    const grow = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><rect x="-20" y="-20" width="40" height="64" rx="10" fill="#06d6a0"/><rect x="-8" y="-40" width="16" height="22" fill="#adb5bd"/><path d="M8,-36 h16" stroke="#adb5bd" stroke-width="6"/><text y="20" text-anchor="middle" font-size="26">🌱</text></svg>',
      w: 90, h: 90, grab: [0, -40], hot: [20, -40], auto: true,
      apply(p, sp, on, { first }) {
        if (first) fx.mist({ x: sp.x - 20, y: sp.y + 20 }, sp, '#b7e4c7', 2);
        if (!on || look.hair.len >= 4) return;
        look.hair.len = Math.min(4, look.hair.len + 0.03);
        if (!grow.t || performance.now() - grow.t > 250) {
          grow.t = performance.now();
          sounds.spray();
          drawLook();
          sayC(LINES.grow, { chatty: true });
        }
      },
      end() { look.hair.len = Math.round(look.hair.len * 2) / 2; drawLook(); react(); },
    });
    const scissors = makeTool(g, {
      art: '<svg viewBox="-50 -50 100 100"><circle cx="-18" cy="26" r="13" fill="none" stroke="#ef476f" stroke-width="7"/><circle cx="18" cy="26" r="13" fill="none" stroke="#ef476f" stroke-width="7"/><path d="M-10,16 L12,-44 M10,16 L-12,-44" stroke="#adb5bd" stroke-width="8" stroke-linecap="round"/></svg>',
      w: 90, h: 90, grab: [0, -30], hot: [0, -40], auto: true,
      apply(p, sp, on, { moving }) {
        if (!on || !moving || look.hair.len <= 0) return;
        if (!scissors.t || performance.now() - scissors.t > 180) {
          scissors.t = performance.now();
          sounds.snip();
          look.hair.len = Math.max(0, look.hair.len - 0.25);
          fx.blobs(sp.x, sp.y, look.hair.color, 3);
          drawLook();
          if (look.hair.len <= 0) { react('wow'); sayC(LINES.bald); } else sayC(LINES.snip, { chatty: true });
        }
      },
    });
    const comb = div('tool combbtn', '<svg viewBox="-50 -50 100 100"><rect x="-40" y="-16" width="80" height="18" rx="6" fill="#9b5de5"/>' + Array.from({ length: 9 }, (_, i) => `<rect x="${-36 + i * 9}" y="0" width="4" height="26" rx="2" fill="#9b5de5"/>`).join('') + '</svg>');
    comb.addEventListener('pointerdown', e => {
      e.stopPropagation();
      look.hair.style = STYLES[(STYLES.indexOf(look.hair.style) + 1) % STYLES.length];
      if (!look.hair.len) look.hair.len = 1;
      sfx.whoosh();
      wiggle(comb, 'press');
      drawLook();
      react();
      sayC(LINES[look.hair.style]);
    });
    const hairTray = div('tray-row');
    hairTray.append(grow, scissors, comb);
    Object.values(HAIR_COLORS).forEach(([c, name]) => {
      const b = div('tool dye', `<svg viewBox="-50 -50 100 100"><rect x="-18" y="-16" width="36" height="58" rx="10" fill="${c}"/><rect x="-8" y="-34" width="16" height="20" fill="#dee2e6"/></svg>`, hairTray);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (!look.hair.len) look.hair.len = 1;
        look.hair.color = c;
        sounds.spray();
        fx.mist({ x: headStage.x + 140, y: headStage.y - 40 }, { x: headStage.x, y: headStage.y - 70 }, c, 14);
        drawLook();
        react();
        talkText(cust.kind, name);
      });
    });

    // ---- dress-up station ----------------------------------------------------------
    const dressPanel = div('panel p-dress', '<div class="wall"></div><div class="floor"></div><div class="rack"><i></i><i></i><i></i><i></i><i></i></div>');
    const dressTray = div('tray-row');
    Object.keys(HATS).forEach(h => {
      const b = div('tool hatbtn', `<svg viewBox="-65 -270 130 90">${HATS[h]}</svg>`, dressTray);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        look.hat = look.hat === h ? null : h;
        sfx.pop();
        drawLook();
        react();
        if (look.hat) sayC(LINES.hat, { chatty: true });
      });
    });
    const glassesBtn = div('tool hatbtn', `<svg viewBox="-35 -195 70 40">${GLASSES}</svg>`, dressTray);
    glassesBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      look.glasses = !look.glasses;
      sfx.pop();
      drawLook();
      if (look.glasses) sayC(LINES.glasses);
    });
    const mustacheBtn = div('tool hatbtn', `<svg viewBox="-35 -170 70 30">${MUSTACHE}</svg>`, dressTray);
    mustacheBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      look.mustache = !look.mustache;
      sfx.boing();
      drawLook();
      react('giggle');
      if (look.mustache) sayC(LINES.mustache);
    });
    const outfitBtn = div('tool outfitbtn', '<span>👕</span>', dressTray);
    outfitBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      look.outfit = OUTFITS[(OUTFITS.indexOf(look.outfit) + 1) % OUTFITS.length];
      cust.dress({ outfit: look.outfit });
      drawLook();
      sfx.whoosh();
      cust.play('hop', 600);
      sayC(LINES.outfit, { chatty: true });
    });
    const camera = div('tool camerabtn', '<span>📷</span>', dressTray);
    camera.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      g.setBusy(true);
      cust.play('cheer', 1500);
      react('happy');
      await sayC(LINES.photo);
      sfx.shutter();
      g.flash();
      fx.sparkles(headStage.x, headStage.y, 120, 14);
      g.setBusy(false);
    });
    const bell = div('tool bellbtn', '<span>🛎️</span>', dressTray);
    bell.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      g.setBusy(true);
      sounds.bell();
      cust.play('wave', 1400);
      await sayC(LINES.bye);
      custBox.animate([{ transform: 'none' }, { transform: 'translateX(1500px)' }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
      await wait(900);
      custBox.getAnimations().forEach(a => a.cancel());
      g.setBusy(false);
      if (g.screen.isConnected) nextCustomer();
    });

    g.setStations([
      { id: 'hair', icon: '✂️', panel: hairPanel, tray: hairTray, hint: () => (look.hair.len > 1 ? scissors : grow) },
      { id: 'dress', icon: '👒', panel: dressPanel, tray: dressTray, hint: () => dressTray.firstChild },
    ]);
    void chair;
    nextCustomer();

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__salon = { get look() { return look; }, drawLook, headStage };
  },
};
