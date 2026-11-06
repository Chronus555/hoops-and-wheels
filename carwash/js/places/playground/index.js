// Playground: a swing that goes higher with each push, a slide (a friend climbs the
// ladder and whooshes down), a seesaw, a sandbox castle that grows and crumbles,
// bubbles to pop (counted), and a bouncy ball to fling around.

import { div, rand, pick, frames, toStage, track, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { stepBalls, flickVelocity } from '../../core/physics.js';
import { LINES, COUNT } from './lines.js';

const GROUND = 770;
const sounds = {
  creak: () => tone(240 + Math.random() * 60, 0.25, { type: 'triangle', vol: 0.06, to: 200 }),
  slide: () => tone(900, 1.1, { type: 'triangle', vol: 0.12, to: 250 }),
  step: () => tone(500, 0.06, { type: 'square', vol: 0.04 }),
  pop: () => { tone(900 + Math.random() * 600, 0.08, { to: 1800, vol: 0.18 }); noise(0.04, { freq: 5000, vol: 0.15 }); },
  sand: () => noise(0.3, { freq: 900, q: 0.5, vol: 0.3 }),
  crumble: () => noise(0.8, { freq: 500, q: 0.4, vol: 0.4, to: 150 }),
  bounce: v => tone(220, 0.15, { to: 120, vol: Math.min(0.4, v / 2500) }),
};

export default {
  id: 'playground',
  open(ctx) {
    useStyle('js/places/playground/style.css');
    document.body.dataset.screen = 'playground';
    const g = makeScene({ cls: 'playground', onHome: leave });
    const { fx } = g;
    const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5);
    const say = (k, l, o) => talk(k, l, o);

    const panel = div('panel p-play', `<div class="sky"><div class="sun"></div><div class="cloud c1"></div></div><div class="grass"></div>
      <div class="swingframe"><i class="bar"></i><i class="legl"></i><i class="legr"></i></div>
      <div class="ladder"></div><div class="platform"></div><div class="chute"></div>
      <div class="seesawbase"></div><div class="sandbox"><div class="castle"></div></div>`);

    // ---- swing: a pendulum that each push makes go higher -----------------------------
    const swing = div('swing', '<i class="rope l"></i><i class="rope r"></i><i class="seat"></i>', panel);
    const swinger = new Friend(kinds[0], { outfit: pick(OUTFITS), width: 100, parent: swing });
    swinger.el.classList.add('swinger');
    let ang = 0;
    let vel = 0;
    let pushes = 0;
    function push() {
      vel += ang >= 0 ? 1.2 : -1.2;
      if (Math.abs(vel) < 0.6) vel = 1.2;
      pushes++;
      sounds.creak();
      swinger.mood('happy', 1500);
      talkText(kinds[0], COUNT[(pushes - 1) % 10]);
      if (pushes % 4 === 0) setTimeout(() => say(kinds[0], Math.abs(ang) > 0.5 ? LINES.high : LINES.push, { chatty: true }), 700);
    }
    swing.addEventListener('pointerdown', e => { e.stopPropagation(); push(); });

    // ---- slide --------------------------------------------------------------------
    const slider = new Friend(kinds[1], { outfit: pick(OUTFITS), width: 100, parent: panel });
    slider.el.classList.add('slider');
    let sliding = false;
    async function slide() {
      if (sliding) return;
      sliding = true;
      slider.el.classList.add('walking');
      slider.el.className = slider.el.className.replace(/ at-\w+/g, '');
      for (const step of ['at-ladder', 'at-top']) {
        slider.el.classList.add(step);
        for (let i = 0; i < 3; i++) { sounds.step(); await wait(200); }
      }
      slider.el.classList.remove('walking');
      slider.el.classList.add('at-bottom');
      sounds.slide();
      slider.mood('giggle', 1600);
      say(kinds[1], LINES.slide);
      await wait(1100);
      fx.blobs(800, 740, '#e9c46a', 6);
      slider.play('cheer', 900);
      await wait(1000);
      slider.el.className = slider.el.className.replace(/ at-\w+/g, '');
      sliding = false;
    }
    slider.el.addEventListener('pointerdown', e => { e.stopPropagation(); slide(); });
    panel.querySelector('.chute').addEventListener('pointerdown', e => { e.stopPropagation(); slide(); });

    // ---- seesaw -------------------------------------------------------------------
    const seesaw = div('seesaw', '<i class="plank"></i>', panel);
    const riders = [kinds[2], kinds[3]].map((k, i) => {
      const f = new Friend(k, { outfit: pick(OUTFITS), width: 90, parent: seesaw.querySelector('.plank') });
      f.el.classList.add('rider', `r${i}`);
      return f;
    });
    let tilt = 1;
    function seesawGo(side) {
      tilt = side ?? -tilt;
      seesaw.style.setProperty('--tilt', `${tilt * 14}deg`);
      sfx.boing();
      riders[tilt > 0 ? 0 : 1].play('hop', 500);
      riders[tilt > 0 ? 1 : 0].mood('happy', 900);
      say(riders[0].kind, LINES.seesaw, { chatty: true });
    }
    seesaw.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const r = seesaw.getBoundingClientRect();
      seesawGo(e.clientX < r.left + r.width / 2 ? -1 : 1);
    });
    seesawGo(1);

    // ---- sandbox castle -------------------------------------------------------------
    const castle = panel.querySelector('.castle');
    let tiers = 0;
    async function build() {
      if (tiers >= 3) {
        tiers = 0;
        castle.dataset.t = 0;
        sounds.crumble();
        fx.blobs(670, 720, '#e9c46a', 14);
        say(kinds[0], LINES.crumble);
        return;
      }
      tiers++;
      castle.dataset.t = tiers;
      sounds.sand();
      fx.blobs(670, 740, '#e9c46a', 5);
      say(kinds[0], LINES.castle, { chatty: true });
    }
    panel.querySelector('.sandbox').addEventListener('pointerdown', e => { e.stopPropagation(); build(); });

    // ---- bubbles to pop -------------------------------------------------------------
    let popped = 0;
    function blowBubbles() {
      say(kinds[1], LINES.bubbles, { chatty: true });
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const b = div('bubble', '', panel);
          const size = rand(60, 110);
          b.style.cssText = `left:${rand(380, 1000)}px;width:${size}px;height:${size}px;animation-duration:${rand(6, 9)}s`;
          b.addEventListener('pointerdown', e => {
            e.stopPropagation();
            sounds.pop();
            const r = toStage(e.clientX, e.clientY);
            fx.splash(r.x, r.y, 'rgba(200,230,255,.9)', 6);
            b.remove();
            popped++;
            talkText(kinds[1], COUNT[(popped - 1) % 10]);
          });
          setTimeout(() => b.remove(), 9000);
        }, i * 250);
      }
    }

    // ---- bouncy ball ---------------------------------------------------------------------
    const ballEl = div('pball', '', panel);
    const ball = { x: 1250, y: 400, vx: 0, vy: 0, r: 40, bounce: 0.82, grav: 1, drag: 0.1, rot: 0 };
    ballEl.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const hist = [{ ...toStage(e.clientX, e.clientY), t: e.timeStamp }];
      ball.held = true;
      track(e, {
        move: (p, ev) => { ball.x = p.x; ball.y = Math.min(p.y, GROUND - ball.r); hist.push({ ...p, t: ev.timeStamp }); if (hist.length > 10) hist.shift(); },
        end: () => {
          ball.held = false;
          if (hist.length < 3) { ball.vy = -1300; ball.vx = rand(-300, 300); } else Object.assign(ball, flickVelocity(hist));
          say(kinds[2], LINES.ball, { chatty: true });
        },
      });
    });

    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      // swing physics
      vel += -Math.sin(ang) * 9 * dt;
      vel *= 1 - 0.15 * dt;
      ang += vel * dt;
      ang = Math.max(-1.2, Math.min(1.2, ang));
      swing.style.transform = `rotate(${(ang * 180) / Math.PI}deg)`;
      // ball physics
      stepBalls([ball], dt, { floor: GROUND, left: 0, right: 1400, ceiling: 112 }, (b, v) => sounds.bounce(v));
      ballEl.style.transform = `translate(${ball.x - ball.r}px,${ball.y - ball.r}px) rotate(${ball.rot}rad)`;
      return true;
    });

    const tray = div('tray-row');
    const btn = (icon, fn) => { const b = div('tool roundbtn', `<span>${icon}</span>`, tray); b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); fn(); }); return b; };
    const pushBtn = btn('🤲', push);
    btn('🛝', slide);
    btn('⚖️', () => seesawGo());
    btn('🏰', build);
    btn('🫧', blowBubbles);
    btn('⚽', () => { ball.vy = -1400; ball.vx = rand(-500, 500); sfx.boing(); });

    g.setStations([{ id: 'play', icon: '🛝', panel, tray, hint: () => pick([pushBtn, tray.children[1], tray.children[4]]) }]);
    setTimeout(() => say(kinds[0], LINES.hello), 400);

    function leave() {
      stop();
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__play = { push, slide, seesawGo, build, blowBubbles, get state() { return { ang, pushes, tiers, popped, sliding, ball: { x: ball.x, y: ball.y } }; } };
  },
};
