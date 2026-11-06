// Construction Site, two stations:
//  - Dig: touch anywhere and the digger's arm reaches there. Scoop dirt from the pile
//    and drop it in the dump truck, which counts each scoop. Five scoops fill it up
//    and it drives off to empty.
//  - Build: drag blocks (big, small, long, tall, a roof) from the tray; the crane
//    lowers them onto the stack, and the friends count the blocks. The wrecking ball
//    knocks it all down.

import { div, rand, pick, frames, toStage, track, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, EXTRA as COUNT } from './lines.js';

const FLOOR = 800;
const NS = 'http://www.w3.org/2000/svg';
const sounds = {
  scrape: () => noise(0.25, { freq: 500, q: 1.2, vol: 0.45, to: 250 }),
  pour: () => { noise(0.7, { freq: 300, q: 0.6, vol: 0.5 }); tone(90, 0.5, { to: 60, vol: 0.15 }); },
  engine: () => { tone(60, 1.2, { type: 'sawtooth', vol: 0.12, to: 110 }); noise(1.2, { freq: 200, vol: 0.2 }); },
  beepBack: () => [0, 0.4, 0.8, 1.2].forEach(at => tone(1050, 0.2, { type: 'square', vol: 0.05, at })),
  thud: (big = 1) => { tone(120 / big, 0.18, { to: 60, vol: 0.4 }); noise(0.08, { freq: 400, vol: 0.3 }); },
  crash: () => { noise(1.2, { freq: 900, q: 0.4, vol: 0.7, to: 200 }); [0, 0.15, 0.3, 0.5].forEach(at => tone(200 + Math.random() * 300, 0.2, { type: 'square', vol: 0.06, at })); },
  whirr: () => noise(0.5, { freq: 1200, q: 2, vol: 0.15 }),
};

const BLOCKS = {
  big: { w: 150, h: 150, color: '#ef476f' },
  small: { w: 80, h: 80, color: '#ffd166' },
  long: { w: 240, h: 56, color: '#4895ef' },
  tall: { w: 60, h: 180, color: '#06d6a0' },
  roof: { w: 170, h: 100, color: '#f8961e', roof: true },
};
const blockArt = (k, w, h) => {
  const b = BLOCKS[k];
  return b.roof
    ? `<svg viewBox="0 0 ${w} ${h}"><path d="M4,${h - 4} L${w / 2},6 L${w - 4},${h - 4} Z" fill="${b.color}" stroke="rgba(0,0,0,.18)" stroke-width="6" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 ${w} ${h}"><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="10" fill="${b.color}" stroke="rgba(0,0,0,.18)" stroke-width="6"/><rect x="12" y="10" width="${Math.max(8, w - 40)}" height="8" rx="4" fill="rgba(255,255,255,.4)"/></svg>`;
};

export default {
  id: 'construction',
  open(ctx) {
    useStyle('js/places/construction/style.css');
    document.body.dataset.screen = 'construction';
    const g = makeScene({ cls: 'construction', onHome: leave });
    const { fx } = g;
    const saved = loadData('construction', { blocks: [] });
    const driver = pick(FRIEND_KINDS);
    const say = (lines, o) => talk(driver, lines, o);
    const stops = [];

    // ================= dig station ======================================================
    const dig = div('panel p-dig', '<div class="sky"></div><div class="ground"></div>');
    const mound = document.createElement('canvas');
    mound.className = 'mound';
    mound.width = 520;
    mound.height = 420;
    dig.appendChild(mound);
    const mctx = mound.getContext('2d', { willReadFrequently: true });
    function fillMound() {
      mctx.clearRect(0, 0, 520, 420);
      mctx.fillStyle = '#9c6644';
      mctx.beginPath();
      mctx.moveTo(0, 420);
      mctx.bezierCurveTo(60, 60, 420, 40, 520, 420);
      mctx.fill();
      mctx.fillStyle = '#7f5539';
      for (let i = 0; i < 160; i++) {
        const x = rand(40, 480);
        const y = rand(120, 410);
        if (mctx.getImageData(x, y, 1, 1).data[3]) {
          mctx.beginPath();
          mctx.arc(x, y, rand(3, 9), 0, Math.PI * 2);
          mctx.fill();
        }
      }
    }
    fillMound();
    const MOUND = { x: 20, y: 380 };
    function moundLeft() {
      const d = mctx.getImageData(0, 0, 520, 420).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] > 0) n++;
      return n / (d.length / 64) / 0.55;
    }

    // The digger: tracks, a cab with a friend inside, and a two-part arm.
    const B = { x: 640, y: 620 };
    const L1 = 270;
    const L2 = 230;
    const art = document.createElementNS(NS, 'svg');
    art.setAttribute('class', 'digart');
    art.setAttribute('viewBox', '0 0 1400 1000');
    art.innerHTML = `
      <g class="digger">
        <rect x="540" y="742" width="290" height="58" rx="29" fill="#343a40"/>${[575, 635, 695, 755, 800].map(x => `<circle cx="${x}" cy="771" r="18" fill="#6c757d"/>`).join('')}
        <rect x="580" y="610" width="220" height="140" rx="18" fill="#ffd166"/><rect x="580" y="700" width="220" height="50" fill="#e09f3e"/>
        <rect x="680" y="626" width="100" height="78" rx="12" fill="#c3e8ff"/>
        <g transform="translate(730,690) scale(.62)"><g class="head driver">${FRIENDS[driver].svg}</g></g>
        <rect x="680" y="626" width="100" height="78" rx="12" fill="rgba(255,255,255,.15)" stroke="#e09f3e" stroke-width="6"/>
        <line class="boom" stroke="#f8961e" stroke-width="40" stroke-linecap="round"/>
        <line class="stick" stroke="#ffd166" stroke-width="30" stroke-linecap="round"/>
        <circle class="elbow" r="16" fill="#495057"/><circle cx="${B.x}" cy="${B.y}" r="18" fill="#495057"/>
        <g class="bucket"><path d="M-40,-20 L40,-20 L46,10 Q30,46 -10,46 Q-44,40 -40,-20 Z" fill="#6c757d"/><path class="load" d="M-34,-14 L34,-14 Q20,-40 -10,-38 Q-30,-34 -34,-14 Z" fill="#7f5539"/>
          <path d="M-30,46 l6,12 l6,-12 M-10,48 l6,12 l6,-12 M10,46 l6,12 l6,-12" fill="#495057"/></g>
      </g>
      <g class="truck">
        <path class="bedfill" fill="#7f5539"/>
        <path d="M940,590 L1200,590 L1190,730 L950,730 Z" fill="none" stroke="#e76f51" stroke-width="18" stroke-linejoin="round"/>
        <rect x="940" y="720" width="400" height="44" rx="12" fill="#495057"/>
        <path d="M1210,620 L1290,620 Q1336,620 1340,670 L1342,740 L1210,740 Z" fill="#e76f51"/>
        <rect x="1230" y="636" width="70" height="56" rx="10" fill="#c3e8ff"/>
        <g transform="translate(1265,672) scale(.5)"><g class="head">${FRIENDS[pick(FRIEND_KINDS)].svg}</g></g>
        ${[1000, 1130, 1290].map(x => `<g transform="translate(${x},770)"><circle r="40" fill="#2f3640"/><circle r="18" fill="#dfe6ee"/></g>`).join('')}
      </g>`;
    dig.appendChild(art);
    const boom = art.querySelector('.boom');
    const stick = art.querySelector('.stick');
    const elbow = art.querySelector('.elbow');
    const bucket = art.querySelector('.bucket');
    const loadPath = art.querySelector('.load');
    const truck = art.querySelector('.truck');
    const bedfill = art.querySelector('.bedfill');
    let tip = { x: 380, y: 560 };
    let load = 0;
    let truckLevel = 0;
    let truckAway = false;

    function drawArm() {
      let dx = tip.x - B.x;
      let dy = tip.y - B.y;
      let d = Math.hypot(dx, dy);
      const max = L1 + L2 - 2;
      const min = 90;
      if (d > max || d < min) {
        const k = (d > max ? max : min) / (d || 1);
        dx *= k;
        dy *= k;
        tip = { x: B.x + dx, y: B.y + dy };
        d = Math.hypot(dx, dy);
      }
      const a = Math.atan2(dy, dx);
      const alpha = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
      const e1 = { x: B.x + L1 * Math.cos(a - alpha), y: B.y + L1 * Math.sin(a - alpha) };
      const e2 = { x: B.x + L1 * Math.cos(a + alpha), y: B.y + L1 * Math.sin(a + alpha) };
      const E = e1.y < e2.y ? e1 : e2; // elbow up, like a real digger
      boom.setAttribute('x1', B.x); boom.setAttribute('y1', B.y); boom.setAttribute('x2', E.x); boom.setAttribute('y2', E.y);
      stick.setAttribute('x1', E.x); stick.setAttribute('y1', E.y); stick.setAttribute('x2', tip.x); stick.setAttribute('y2', tip.y);
      elbow.setAttribute('cx', E.x); elbow.setAttribute('cy', E.y);
      const tilt = tip.x > 900 && load > 0 ? 70 : 0;
      bucket.setAttribute('transform', `translate(${tip.x},${tip.y}) rotate(${tilt})`);
      loadPath.style.opacity = load > 0.1 ? Math.min(1, load + 0.2) : 0;
    }
    function drawBed() {
      const h = (truckLevel / 5) * 120;
      bedfill.setAttribute('d', truckLevel ? `M952,${728 - h} Q1075,${700 - h - 20} 1196,${728 - h} L1190,728 L952,728 Z` : '');
    }
    drawArm();
    drawBed();

    let lastDig = 0;
    // Is there dirt anywhere around the bucket (so digging into a hole still works)?
    function dirtNear(mx, my) {
      for (let a = 0; a < 8; a++) {
        for (const r of [0, 22, 44]) {
          const x = Math.round(mx + Math.cos(a) * r);
          const y = Math.round(my + Math.sin(a) * r);
          if (x >= 0 && x < 520 && y >= 0 && y < 420 && mctx.getImageData(x, y, 1, 1).data[3]) return true;
        }
      }
      return false;
    }
    function reach(p) {
      tip = { x: Math.max(80, Math.min(1360, p.x)), y: Math.max(260, Math.min(FLOOR - 30, p.y)) };
      drawArm();
      const now = performance.now();
      // Digging: the bucket's teeth are in the dirt.
      const mx = tip.x - MOUND.x;
      const my = tip.y + 50 - MOUND.y;
      if (load < 1 && now - lastDig > 220 && dirtNear(mx, my)) {
        lastDig = now;
        mctx.save();
        mctx.globalCompositeOperation = 'destination-out';
        mctx.beginPath();
        mctx.arc(mx, my, 56, 0, Math.PI * 2);
        mctx.fill();
        mctx.restore();
        load = Math.min(1, load + 0.5);
        sounds.scrape();
        fx.blobs(tip.x, tip.y + 40, '#9c6644', 6);
        if (load >= 1) say(LINES.dig, { chatty: true });
        drawArm();
      }
      // Dumping: a full bucket over the truck bed.
      if (load > 0.4 && !truckAway && tip.x > 930 && tip.x < 1210 && tip.y < 640) {
        load = 0;
        drawArm();
        sounds.pour();
        for (let i = 0; i < 4; i++) setTimeout(() => fx.blobs(tip.x, tip.y + 30, '#7f5539', 6), i * 90);
        truckLevel++;
        drawBed();
        talkText(driver, COUNT[truckLevel - 1]);
        if (truckLevel >= 5) setTimeout(driveTruck, 900);
      }
    }
    dig.addEventListener('pointerdown', e => {
      if (g.busy() || e.target.closest('.truckhit')) return;
      reach(toStage(e.clientX, e.clientY));
      track(e, { move: p => reach(p) });
    });

    async function driveTruck() {
      if (truckAway) return;
      truckAway = true;
      say(LINES.full);
      sounds.engine();
      truck.style.transition = 'transform 1.6s ease-in';
      truck.style.transform = 'translateX(700px)';
      await wait(2600);
      truckLevel = 0;
      drawBed();
      sounds.beepBack();
      truck.style.transition = 'transform 1.8s ease-out';
      truck.style.transform = 'none';
      await wait(1800);
      truckAway = false;
      say(LINES.back, { chatty: true });
      if (moundLeft() < 0.35) refill();
    }
    async function refill() {
      say(LINES.refill, { chatty: true });
      sounds.pour();
      for (let i = 0; i < 8; i++) setTimeout(() => fx.blobs(rand(80, 460), 360, '#9c6644', 8), i * 80);
      await wait(500);
      fillMound();
    }
    const truckHit = div('truckhit', '', dig);
    truckHit.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sfx.honk();
      if (truckLevel > 0) driveTruck();
    });

    const digTray = div('tray-row');
    const horn = div('tool horn-btn', '<span>📯</span>', digTray);
    horn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sfx.honk();
      say(LINES.tickle, { chatty: true });
    });
    const goBtn = div('tool go-btn', '<span>🚚</span>', digTray);
    goBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(goBtn, 'press');
      if (truckLevel > 0) driveTruck();
      else sfx.honk();
    });
    const more = div('tool more-btn', '<span>⛰️</span>', digTray);
    more.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(more, 'press');
      refill();
    });

    // ================= build station ====================================================
    const build = div('panel p-build', `<div class="sky"></div><div class="ground"></div>
      <div class="crane"><i class="mast"></i><i class="jib"></i><i class="counter"></i><i class="cab"></i></div>`);
    const trolley = div('trolley', '<i class="cable"></i><i class="hook"></i>', build);
    const worker = new Friend(pick(FRIEND_KINDS.filter(k => k !== driver)), { outfit: '#f8961e', width: 120, parent: build });
    worker.el.classList.add('worker');
    worker.el.insertAdjacentHTML('beforeend', '<div class="hardhat"></div>');
    worker.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      worker.play('wave', 1200);
      worker.mood('giggle', 1000);
      talk(worker.kind, LINES.tickle, { chatty: true });
    });
    const yard = div('yard', '', build);
    const blocks = [];

    function makeBlock(k, x, y) {
      const def = BLOCKS[k];
      const el = div(`block blk-${k}`, blockArt(k, def.w, def.h), yard);
      el.style.width = `${def.w}px`;
      el.style.height = `${def.h}px`;
      const b = { k, x, y, w: def.w, h: def.h, vx: 0, vy: 0, rot: 0, vr: 0, state: 'held', el };
      blocks.push(b);
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (g.busy()) return;
        pickUp(e, b);
      });
      if (blocks.length > 24) removeBlock(blocks.find(o => o.state === 'rest'));
      place(b);
      return b;
    }
    function removeBlock(b) {
      if (!b) return;
      blocks.splice(blocks.indexOf(b), 1);
      b.el.remove();
    }
    function place(b) {
      b.el.style.transform = `translate(${b.x - b.w / 2}px,${b.y - b.h}px) rotate(${b.rot}deg)`;
    }
    // Where a block dropped at x would come to rest: on the highest block below it.
    function supportY(b) {
      let y = FLOOR;
      for (const o of blocks) {
        if (o === b || o.state !== 'rest') continue;
        const overlap = Math.min(b.x + b.w / 2, o.x + o.w / 2) - Math.max(b.x - b.w / 2, o.x - o.w / 2);
        if (overlap > 12) y = Math.min(y, o.y - o.h);
      }
      return y;
    }
    function hookTo(b) {
      trolley.style.transform = `translateX(${b ? b.x : 760}px)`;
      trolley.querySelector('.cable').style.height = `${b ? Math.max(20, b.y - b.h - 170) : 120}px`;
    }
    function pickUp(e, b) {
      const p0 = toStage(e.clientX, e.clientY);
      const off = { x: b.x - p0.x, y: b.y - p0.y };
      b.state = 'held';
      b.rot = 0;
      sounds.whirr();
      track(e, {
        move: p => {
          b.x = Math.max(b.w / 2, Math.min(1400 - b.w / 2, p.x + off.x));
          b.y = Math.min(FLOOR, p.y + off.y);
          place(b);
          hookTo(b);
        },
        end: () => drop(b),
      });
      hookTo(b);
    }
    function drop(b) {
      b.state = 'fall';
      b.vy = 0;
      hookTo(null);
    }
    function standing() {
      return blocks.filter(o => o.state === 'rest' && !o.loose);
    }

    // Tray: one of each block. Drag it out, or tap to have the crane drop it on the stack.
    const buildTray = div('tray-row');
    Object.keys(BLOCKS).forEach(k => {
      const def = BLOCKS[k];
      const sc = Math.min(1, 110 / Math.max(def.w, def.h));
      const item = div('tool trayblock', blockArt(k, def.w, def.h), buildTray);
      item.style.width = `${def.w * sc}px`;
      item.style.height = `${def.h * sc}px`;
      item.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (g.busy()) return;
        const p = toStage(e.clientX, e.clientY);
        talk(worker.kind, LINES[k], { chatty: true });
        const b = makeBlock(k, p.x, p.y);
        let moved = false;
        track(e, {
          move: q => {
            moved = true;
            b.x = Math.max(b.w / 2, Math.min(1400 - b.w / 2, q.x));
            b.y = Math.min(FLOOR, q.y - 20);
            place(b);
            hookTo(b);
          },
          end: () => {
            if (!moved) {
              // Tap: the crane lowers it onto the middle of the yard.
              const top = standing().filter(o => Math.abs(o.x - 700) < 120);
              b.x = top.length ? top[top.length - 1].x + rand(-20, 20) : 700;
              b.y = 260;
              place(b);
              hookTo(b);
              setTimeout(() => drop(b), 350);
              return;
            }
            drop(b);
          },
        });
      });
    });
    const wreck = div('tool wreck-btn', '<svg viewBox="-50 -50 100 100"><line x1="0" y1="-48" x2="0" y2="0" stroke="#343a40" stroke-width="5"/><circle cy="14" r="30" fill="#343a40"/><circle cx="-10" cy="4" r="8" fill="#6c757d"/></svg>', buildTray);
    wreck.addEventListener('pointerdown', e => {
      e.stopPropagation();
      wiggle(wreck, 'press');
      wreckIt();
    });

    // Physics for falling and knocked-over blocks.
    let landedCount = 0;
    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      for (const b of blocks) {
        if (b.state === 'fall') {
          b.vy += 2400 * dt;
          b.y += b.vy * dt;
          const s = supportY(b);
          if (b.y >= s) {
            b.y = s;
            b.state = 'rest';
            b.loose = false;
            sounds.thud(b.w > 120 ? 1.4 : 1);
            fx.blobs(b.x, b.y, 'rgba(173,181,189,.8)', 3);
            const n = standing().length;
            landedCount++;
            if (n <= 10) talkText(worker.kind, COUNT[n - 1]);
            if (n === 6) setTimeout(() => talk(worker.kind, LINES.tower), 900);
            saveYard();
          }
          place(b);
        } else if (b.state === 'fly') {
          b.vy += 2000 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vr * dt;
          if (b.x < b.w / 2 || b.x > 1400 - b.w / 2) b.vx *= -0.5;
          b.x = Math.max(b.w / 2, Math.min(1400 - b.w / 2, b.x));
          if (b.y >= FLOOR && b.vy > 0) {
            b.y = FLOOR;
            if (b.vy > 500) {
              b.vy *= -0.3;
              b.vx *= 0.6;
              sounds.thud();
            } else {
              b.state = 'rest';
              b.loose = true;
              b.rot = Math.round(b.rot / 90) * 90;
              saveYard();
            }
          }
          place(b);
        }
      }
      return true;
    });

    async function wreckIt() {
      const tower = standing();
      if (!tower.length || g.busy()) {
        sfx.boing();
        return;
      }
      g.setBusy(true);
      const ball = div('wrecking', '<i class="chain"></i><i class="ball"></i>', build);
      const minX = Math.min(...tower.map(b => b.x - b.w / 2));
      ball.style.left = `${minX - 40}px`;
      wiggle(ball, 'swing');
      await wait(650);
      sounds.crash();
      fx.confetti(minX + 60, 600, 20);
      tower.forEach(b => {
        b.state = 'fly';
        b.vx = rand(250, 750);
        b.vy = rand(-900, -300);
        b.vr = rand(-400, 400);
      });
      worker.mood('wow', 1500);
      talk(worker.kind, LINES.crash);
      await wait(900);
      ball.remove();
      g.setBusy(false);
    }

    function saveYard() {
      saved.blocks = blocks.filter(b => b.state === 'rest').map(b => ({ k: b.k, x: Math.round(b.x), y: Math.round(b.y), rot: b.rot, loose: !!b.loose }));
      saveData('construction', saved);
    }
    // Rebuild what was there last time.
    saved.blocks.forEach(s => {
      const b = makeBlock(s.k, s.x, s.y);
      Object.assign(b, { rot: s.rot, loose: s.loose, state: 'rest' });
      place(b);
    });
    hookTo(null);

    g.setStations([
      { id: 'dig', icon: '🚜', panel: dig, tray: digTray, hint: () => truckLevel ? goBtn : more },
      { id: 'build', icon: '🏗️', panel: build, tray: buildTray, hint: () => buildTray.firstChild },
    ]);

    function leave() {
      stop();
      stops.forEach(s => s());
      g.close();
      ctx.exit();
    }

    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__cons = { reach, blocks, get load() { return load; }, get truck() { return truckLevel; }, moundLeft, wreckIt };
    setTimeout(() => say(LINES.hello), 400);
  },
};
