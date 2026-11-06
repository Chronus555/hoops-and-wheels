// Basketball Court: flick balls at the hoop. The hoop can be dragged higher, lower
// or closer. Four balls bounce differently (a floaty beach ball, a tiny tennis ball,
// a watermelon that splats). The scoreboard counts baskets out loud up to 20.

import { div, rand, pick, frames, toStage, track, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { stepBalls, aim, flickVelocity } from '../../core/physics.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, COUNT } from './lines.js';

const FLOOR = 812;
const seams = r => `<g fill="none" stroke="#3a2412" stroke-width="${r * 0.07}"><path d="M0,${-r} V${r} M${-r},0 H${r}"/><path d="M${-r * 0.7},${-r * 0.7} Q${-r * 0.25},0 ${-r * 0.7},${r * 0.7}"/><path d="M${r * 0.7},${-r * 0.7} Q${r * 0.25},0 ${r * 0.7},${r * 0.7}"/></g>`;
const BALLS = {
  basketball: { r: 30, bounce: 0.72, grav: 1, drag: 0.05, svg: `<circle r="48" fill="#f28c28"/>${seams(48)}` },
  beach: {
    r: 50, bounce: 0.82, grav: 0.45, drag: 0.6,
    svg: `${['#ef476f', '#fff', '#4895ef', '#fff', '#ffd166', '#fff'].map((c, i) => `<path d="M0,0 L${48 * Math.cos((i * Math.PI) / 3)},${48 * Math.sin((i * Math.PI) / 3)} A48,48 0 0 1 ${48 * Math.cos(((i + 1) * Math.PI) / 3)},${48 * Math.sin(((i + 1) * Math.PI) / 3)} Z" fill="${c}"/>`).join('')}<circle r="10" fill="#fff"/><circle r="48" fill="none" stroke="rgba(0,0,0,.1)" stroke-width="3"/>`,
  },
  tennis: { r: 18, bounce: 0.86, grav: 1, drag: 0.05, svg: '<circle r="48" fill="#c7e33c"/><path d="M-34,-34 Q0,0 -34,34 M34,-34 Q0,0 34,34" fill="none" stroke="#fff" stroke-width="7"/>' },
  melon: {
    r: 38, bounce: 0.15, grav: 1.1, drag: 0.05,
    svg: '<ellipse rx="48" ry="44" fill="#2d6a4f"/><path d="M-30,-36 Q-42,0 -30,36 M-10,-44 Q-18,0 -10,44 M10,-44 Q18,0 10,44 M30,-36 Q42,0 30,36" fill="none" stroke="#95d5b2" stroke-width="6"/>',
  },
};
const ballArt = type => `<svg viewBox="-50 -50 100 100"><g class="spinme">${BALLS[type].svg}</g></svg>`;

const bounceSound = {
  basketball: v => { tone(150, 0.14, { to: 80, vol: Math.min(0.5, v / 2500) }); noise(0.05, { freq: 300, vol: Math.min(0.3, v / 3000) }); },
  beach: v => tone(320, 0.16, { to: 200, type: 'triangle', vol: Math.min(0.2, v / 4000) }),
  tennis: v => { tone(950, 0.05, { vol: Math.min(0.15, v / 6000) }); noise(0.03, { freq: 2500, vol: 0.1 }); },
  melon: v => tone(110, 0.2, { to: 60, vol: Math.min(0.4, v / 2500) }),
};
const sounds = {
  rim: () => { tone(1150, 0.35, { type: 'triangle', vol: 0.12 }); tone(1720, 0.25, { vol: 0.06 }); },
  board: () => noise(0.09, { freq: 700, q: 1, vol: 0.4 }),
  whistle: () => { for (let i = 0; i < 6; i++) tone(2600 + (i % 2) * 300, 0.07, { type: 'triangle', vol: 0.12, at: i * 0.07 }); },
  crowd: () => { noise(1.4, { freq: 1400, q: 0.3, vol: 0.3 }); sfx.ta_da(); },
  buzzer: () => tone(190, 0.9, { type: 'sawtooth', vol: 0.12 }),
};

export default {
  id: 'court',
  open(ctx) {
    useStyle('js/places/court/style.css');
    document.body.dataset.screen = 'court';
    const saved = loadData('court', { count: 0, outfit: OUTFITS[4], number: 7 });
    const g = makeScene({ cls: 'court', onHome: leave });
    const { fx, layer } = g;

    const panel = div('panel p-court', `<div class="wall"></div><div class="banner b1"></div><div class="banner b2"></div><div class="banner b3"></div>
      <div class="lights"><i></i><i></i><i></i></div><div class="bleachers"><i></i><i></i><i></i></div><div class="floor"><div class="line"></div></div>
      <div class="scoreboard"><b>0</b></div>`);
    const score = panel.querySelector('.scoreboard b');
    let count = saved.count;
    score.textContent = String(count);

    // ---- friends: fans in the stands, a mascot, and a player in a jersey ----------
    const fanSpots = [[90, 520], [215, 520], [340, 520], [150, 640], [280, 640], [410, 640]];
    const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5);
    const fans = fanSpots.slice(0, 5).map(([x, y], i) => {
      const f = new Friend(kinds[i % kinds.length], { outfit: pick(OUTFITS), width: 84, parent: panel });
      f.el.classList.add('fan');
      f.el.style.left = `${x - 42}px`;
      f.el.style.top = `${y - 155}px`;
      f.el.addEventListener('pointerdown', () => {
        f.play('cheer', 900);
        f.mood('happy', 1000);
        sfx.boing();
        talk(f.kind, LINES.tickle, { chatty: true });
      });
      return f;
    });
    const announcer = fans[0];
    const mascot = new Friend(kinds[5] || 'bear', { outfit: '#f8961e', width: 120, parent: panel });
    mascot.el.classList.add('mascot');
    mascot.el.addEventListener('pointerdown', () => {
      mascot.play('dance', 1800);
      mascot.mood('giggle', 1200);
      talk(mascot.kind, LINES.tickle, { chatty: true });
    });
    const player = new Friend(pick(FRIEND_KINDS), { outfit: saved.outfit, number: saved.number, width: 140, parent: panel });
    player.el.classList.add('player');

    // ---- the hoop ------------------------------------------------------------------
    const hoop = { bx: 1240, by: 430 };
    const hoopEl = div('hoop', `<div class="pole"></div><div class="arm"></div><div class="board"><i></i></div>
      <svg class="net" viewBox="0 0 110 80"><path d="M2,0 L20,72 H90 L108,0 M24,0 L36,72 M55,0 V72 M86,0 L74,72 M8,24 H102 M14,48 H96" fill="none" stroke="#fff" stroke-width="4"/></svg>
      <div class="rim"></div>`, panel);
    const placeHoop = () => {
      hoopEl.style.transform = `translate(${hoop.bx}px,${hoop.by}px)`;
      hoopEl.querySelector('.pole').style.height = `${FLOOR - hoop.by + 60}px`;
    };
    placeHoop();
    const world = () => ({
      floor: FLOOR, left: 0, right: 1400, ceiling: 0,
      points: [{ x: hoop.bx - 132, y: hoop.by, r: 7, kind: 'rim' }, { x: hoop.bx - 8, y: hoop.by, r: 7, kind: 'rim' }],
      segments: [{ x1: hoop.bx + 4, y1: hoop.by - 120, x2: hoop.bx + 4, y2: hoop.by + 24, r: 9, kind: 'board' }],
    });
    let hoopTalk = 0;
    hoopEl.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const p0 = toStage(e.clientX, e.clientY);
      const start = { ...hoop };
      sfx.clank();
      track(e, {
        move: p => {
          hoop.bx = Math.max(950, Math.min(1290, start.bx + p.x - p0.x));
          hoop.by = Math.max(300, Math.min(620, start.by + p.y - p0.y));
          placeHoop();
          if (performance.now() - hoopTalk > 2500 && Math.abs(hoop.by - start.by) > 60) {
            hoopTalk = performance.now();
            talkText(player.kind, hoop.by < start.by ? pick(['Higher!', 'Up high!']) : 'Lower!');
          }
        },
      });
    });

    g.setStations([{ id: 'court', icon: '🏀', panel, tray: div('tray-row'), hint: () => trayBalls[0] }]);
    const tray = g.station().tray;

    // ---- balls -------------------------------------------------------------------
    const balls = [];
    function addBall(type, x, y) {
      const def = BALLS[type];
      const el = div(`ball ball-${type}`, ballArt(type), layer);
      el.style.width = el.style.height = `${def.r * 2}px`;
      const b = { type, x, y, vx: 0, vy: 0, r: def.r, bounce: def.bounce, grav: def.grav, drag: def.drag, rot: 0, el, armed: false };
      balls.push(b);
      if (balls.length > 8) removeBall(balls[0]);
      el.addEventListener('pointerdown', e => grabBall(e, b));
      draw(b);
      return b;
    }
    function removeBall(b) {
      const i = balls.indexOf(b);
      if (i >= 0) balls.splice(i, 1);
      b.el.classList.add('gone');
      setTimeout(() => b.el.remove(), 400);
    }
    function draw(b) {
      b.el.style.transform = `translate(${b.x - b.r}px,${b.y - b.r}px)`;
      b.el.firstChild.firstChild.setAttribute('transform', `rotate(${((b.rot * 180) / Math.PI).toFixed(1)})`);
    }
    function grabBall(e, b) {
      e.stopPropagation();
      const history = [{ ...toStage(e.clientX, e.clientY), t: e.timeStamp }];
      b.held = true;
      let moved = false;
      track(e, {
        move: (p, ev) => {
          moved = true;
          b.x = p.x;
          b.y = Math.min(p.y, FLOOR - b.r);
          history.push({ ...p, t: ev.timeStamp });
          if (history.length > 12) history.shift();
          draw(b);
        },
        end: () => {
          b.held = false;
          if (!moved) {
            b.vy = -1000;
            sfx.boing();
            return;
          }
          const v = flickVelocity(history);
          b.vx = v.vx;
          b.vy = v.vy;
        },
      });
    }
    function shoot(type, from) {
      const b = addBall(type, from.x, from.y);
      const to = { x: hoop.bx - 66, y: hoop.by + 4 };
      // A high arc, so the ball drops steeply into the hoop.
      const t = Math.max(0.9, Math.min(1.35, Math.hypot(to.x - from.x, to.y - from.y) / 720));
      Object.assign(b, aim(from, to, t, b.grav));
      // Aimed shots fly without air drag, so they land where aimed.
      b.drag = 0;
      setTimeout(() => { b.drag = BALLS[type].drag; }, t * 1000 + 300);
      sfx.whoosh();
    }

    // Ball racks in the tray: drag one out to throw it, or tap to shoot it.
    const trayBalls = Object.keys(BALLS).map(type => {
      const item = div(`tool rackball rb-${type}`, ballArt(type), tray);
      item.addEventListener('pointerdown', e => {
        e.stopPropagation();
        const p = toStage(e.clientX, e.clientY);
        let b = null;
        const history = [{ ...p, t: e.timeStamp }];
        track(e, {
          move: (q, ev) => {
            history.push({ ...q, t: ev.timeStamp });
            if (history.length > 12) history.shift();
            if (!b && Math.hypot(q.x - p.x, q.y - p.y) > 12) {
              b = addBall(type, q.x, q.y);
              b.held = true;
            }
            if (b) {
              b.x = q.x;
              b.y = Math.min(q.y, FLOOR - b.r);
              draw(b);
            }
          },
          end: () => {
            if (!b) return shoot(type, { x: 300, y: 640 });
            b.held = false;
            const v = flickVelocity(history);
            b.vx = v.vx;
            b.vy = v.vy;
          },
        });
      });
      return item;
    });

    const jersey = div('tool jersey', `<svg viewBox="-50 -50 100 100"><path d="M-30,-40 L-12,-40 Q0,-28 12,-40 L30,-40 L44,-20 L30,-10 L30,42 L-30,42 L-30,-10 L-44,-20 Z" fill="${saved.outfit}" stroke="#fff" stroke-width="4"/><text y="22" text-anchor="middle" font-size="36" font-weight="900" fill="#fff">#</text></svg>`, tray);
    jersey.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const outfit = OUTFITS[(OUTFITS.indexOf(player.outfit) + 1) % OUTFITS.length];
      const number = Math.floor(rand(1, 21));
      player.dress({ outfit, number });
      jersey.querySelector('path').setAttribute('fill', outfit);
      player.play('hop', 700);
      sfx.pop();
      saved.outfit = outfit;
      saved.number = number;
      saveData('court', saved);
      talkText(player.kind, COUNT[number]).then(() => talk(player.kind, LINES.jersey, { chatty: true }));
    });
    const whistle = div('tool whistle', '<svg viewBox="-50 -50 100 100"><circle cx="-6" cy="8" r="30" fill="#adb5bd"/><rect x="-6" y="-22" width="52" height="24" rx="8" fill="#adb5bd"/><circle cx="-6" cy="8" r="12" fill="#6c757d"/><path d="M-30,-14 Q-46,-40 -20,-44" stroke="#ef476f" stroke-width="5" fill="none"/></svg>', tray);
    whistle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sounds.whistle();
      wiggle(whistle, 'press');
      [...fans, mascot, player].forEach((f, i) => setTimeout(() => f.play('dance', 2200), i * 80));
      talk(mascot.kind, LINES.dance, { chatty: true });
    });

    // Tapping the player makes them shoot.
    player.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      player.play('cheer', 800);
      setTimeout(() => shoot('basketball', { x: 300, y: 620 }), 150);
    });

    // ---- the game loop -------------------------------------------------------------
    let lastClose = 0;
    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      const w = world();
      const hits = [];
      stepBalls(balls, dt, w, (b, v, kind) => hits.push([b, v, kind]));
      for (const [b, v, kind] of hits) {
        if (!balls.includes(b)) continue;
        if (kind === 'floor' && b.type === 'melon' && v > 450) { splat(b); continue; }
        if (kind === 'rim') {
          sounds.rim();
          if (b.type === 'beach') talk(player.kind, LINES.beach, { chatty: true });
          else if (performance.now() - lastClose > 4000 && Math.random() < 0.5) {
            lastClose = performance.now();
            talk(announcer.kind, LINES.close, { chatty: true });
          }
        } else if (kind === 'board') sounds.board();
        else bounceSound[b.type](v);
      }
      for (const b of balls) {
        // A basket: the ball was above the rim, then its middle drops below it between
        // the rim's two ends (checked loosely, so a bounce on the rim still counts).
        if (b.y < hoop.by - 4) b.armed = true;
        const inside = b.x > hoop.bx - 126 && b.x < hoop.bx - 14;
        if (b.armed && inside && b.y > hoop.by + 8 && b.y < hoop.by + 70 && b.vy > 0) {
          b.armed = false;
          basket(b);
        } else if (b.y > hoop.by + 70) b.armed = false;
        draw(b);
      }
      return true;
    });

    function basket(b) {
      count++;
      score.textContent = String(count);
      wiggle(score.parentElement, 'jump');
      wiggle(hoopEl.querySelector('.net'), 'swish');
      sfx.swish();
      fx.confetti(hoop.bx - 70, hoop.by + 20, 26);
      fans.forEach((f, i) => setTimeout(() => { f.play('cheer', 900); f.mood('happy', 1200); }, i * 60));
      mascot.play('dance', 1600);
      talkText(announcer.kind, COUNT[count]);
      if (count >= 20) {
        setTimeout(() => {
          sounds.buzzer();
          sounds.crowd();
          fx.confetti(700, 300, 80);
          talk(announcer.kind, LINES.twenty);
          count = 0;
          score.textContent = '0';
          saved.count = 0;
          saveData('court', saved);
        }, 900);
      } else if (count % 5 === 0) setTimeout(sounds.crowd, 300);
      saved.count = count;
      saveData('court', saved);
      if (b.type === 'melon') setTimeout(() => talk(player.kind, LINES.melon, { chatty: true }), 900);
    }

    function splat(b) {
      removeBall(b);
      b.el.remove();
      sfx.splat();
      fx.blobs(b.x, b.y, '#ef476f', 10);
      fx.blobs(b.x, b.y, '#2d6a4f', 5);
      fx.blobs(b.x, b.y, '#222', 4);
      player.mood('wow', 1200);
      talk(player.kind, LINES.melon, { chatty: true });
    }

    function leave() {
      stop();
      g.close();
      ctx.exit();
    }

    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__court = { balls, hoop, shoot, get count() { return count; } };
    setTimeout(() => {
      player.play('wave', 1400);
      talk(player.kind, LINES.hello);
    }, 400);
  },
};
