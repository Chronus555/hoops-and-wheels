// Racetrack: pick a kart, count down 3-2-1-Go, and hold the gas pedal for two laps
// around an oval (seen from above). Yellow boost pads give a burst of speed and the
// pit stop button changes tyres for a boost. Two friendly rivals race too and keep
// it close. At the end everyone stands on the podium with a medal.

import { div, rand, pick, frames, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise, loop } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIENDS, FRIEND_KINDS } from '../../core/friends.js';
import { LINES } from './lines.js';

const NS = 'http://www.w3.org/2000/svg';
const TRACK = 'M700,690 L1040,690 A225,225 0 0 0 1040,240 L360,240 A225,225 0 0 0 360,690 Z';
const KART_COLORS = ['#ef476f', '#4895ef', '#06d6a0', '#9b5de5'];
const LAPS = 2;
const MAX = 380;
const BOOSTS = [0.18, 0.62];
const sounds = {
  beep: hi => tone(hi ? 1320 : 660, hi ? 0.5 : 0.25, { type: 'square', vol: 0.08 }),
  zoom: () => noise(0.6, { freq: 900, q: 0.6, vol: 0.5, to: 3500 }),
  wrench: () => [0, 0.2, 0.4].forEach(at => { tone(1500, 0.08, { type: 'square', vol: 0.05, at }); noise(0.05, { freq: 4000, vol: 0.25, at }); }),
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i > 3 ? 0.5 : 0.18, { type: 'square', vol: 0.06, at: i * 0.16 })),
};

const kartArt = (color, kind, n) => `<svg viewBox="-60 -40 120 80">
  <rect x="-46" y="-38" width="26" height="14" rx="5" fill="#2b2d42"/><rect x="20" y="-38" width="26" height="14" rx="5" fill="#2b2d42"/>
  <rect x="-46" y="24" width="26" height="14" rx="5" fill="#2b2d42"/><rect x="20" y="24" width="26" height="14" rx="5" fill="#2b2d42"/>
  <path d="M-52,-24 L40,-24 Q58,-20 58,0 Q58,20 40,24 L-52,24 Q-58,0 -52,-24 Z" fill="${color}"/>
  <rect x="-56" y="-28" width="10" height="56" rx="4" fill="#343a40"/>
  <circle cx="44" cy="0" r="11" fill="#fff"/><text x="44" y="5" text-anchor="middle" font-size="15" font-weight="900" fill="#222">${n}</text>
  <g transform="translate(-6,0) rotate(90) scale(.42)"><g class="head">${FRIENDS[kind].svg}</g></g>
  <g class="flame"><path d="M-58,-10 L-86,0 L-58,10 Z" fill="#f8961e"/><path d="M-58,-5 L-72,0 L-58,5 Z" fill="#ffd166"/></g></svg>`;

export default {
  id: 'racetrack',
  open(ctx) {
    useStyle('js/places/racetrack/style.css');
    document.body.dataset.screen = 'racetrack';
    const g = makeScene({ cls: 'racetrack', onHome: leave });
    const { fx } = g;

    const panel = div('panel p-race', '<div class="grass"></div>');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'trackart');
    svg.setAttribute('viewBox', '0 0 1400 1000');
    svg.innerHTML = `
      <path d="${TRACK}" fill="none" stroke="#fff" stroke-width="176"/>
      <path d="${TRACK}" fill="none" stroke="#ef233c" stroke-width="176" stroke-dasharray="30 30"/>
      <path d="${TRACK}" fill="none" stroke="#6c757d" stroke-width="156"/>
      <path class="center" d="${TRACK}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-dasharray="24 24"/>
      <g class="startline"><rect x="690" y="612" width="22" height="156" fill="url(#chk)"/></g>
      <defs><pattern id="chk" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="11" height="11" fill="#fff"/><rect x="11" y="11" width="11" height="11" fill="#fff"/><rect x="11" width="11" height="11" fill="#222"/><rect y="11" width="11" height="11" fill="#222"/></pattern></defs>
      <g class="boosts"></g>
      <rect x="480" y="360" width="440" height="210" rx="40" fill="#52b788"/>
      <text x="700" y="490" text-anchor="middle" font-size="90">🏁</text>`;
    panel.appendChild(svg);
    const path = svg.querySelector('.center');
    const len = path.getTotalLength();
    const N = 720;
    const pts = Array.from({ length: N + 1 }, (_, i) => path.getPointAtLength((i / N) * len));
    function at(s, lane = 0) {
      const f = (((s % 1) + 1) % 1) * N;
      const i = Math.floor(f);
      const a = pts[i];
      const b = pts[i + 1];
      const x = a.x + (b.x - a.x) * (f - i);
      const y = a.y + (b.y - a.y) * (f - i);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      return { x: x - Math.sin(ang) * lane, y: y + Math.cos(ang) * lane, ang };
    }
    // Boost pads: yellow arrows across the track.
    svg.querySelector('.boosts').innerHTML = BOOSTS.map(s => {
      const p = at(s);
      return `<g transform="translate(${p.x},${p.y}) rotate(${(p.ang * 180) / Math.PI})"><rect x="-40" y="-66" width="80" height="132" rx="14" fill="#ffd166"/><path d="M-20,-36 L10,0 L-20,36 M0,-36 L30,0 L0,36" fill="none" stroke="#f8961e" stroke-width="12" stroke-linecap="round"/></g>`;
    }).join('');

    const lights = div('startlights', '<i></i><i></i><i></i>', panel);
    const karts = [];
    let phase = 'pick';
    let gas = false;
    let player = null;
    let finished = [];

    // ---- pick a kart --------------------------------------------------------------
    const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5).slice(0, 4);
    const garage = div('kartpick', '', panel);
    function showPick() {
      phase = 'pick';
      garage.innerHTML = '';
      garage.classList.add('on');
      karts.forEach(k => k.el.remove());
      karts.length = 0;
      finished = [];
      kinds.forEach((kind, i) => {
        const b = div('pickkart', kartArt(KART_COLORS[i], kind, i + 1), garage);
        b.addEventListener('pointerdown', e => {
          e.stopPropagation();
          if (phase !== 'pick') return;
          sfx.pop();
          talk(kind, LINES.me);
          startRace(i);
        });
      });
      setTimeout(() => talk(kinds[0], LINES.pick), 300);
    }

    async function startRace(pi) {
      phase = 'grid';
      garage.classList.remove('on');
      const order = [pi, ...[0, 1, 2, 3].filter(i => i !== pi).sort(() => Math.random() - 0.5).slice(0, 2)];
      order.forEach((ki, n) => {
        const el = div('kart', kartArt(KART_COLORS[ki], kinds[ki], ki + 1), panel);
        const k = { el, kind: kinds[ki], color: KART_COLORS[ki], s: -0.012 - n * 0.006, lap: 0, v: 0, lane: [-46, 0, 46][n], boost: 0, pit: 0, me: n === 0, done: false };
        karts.push(k);
        el.addEventListener('pointerdown', e => {
          e.stopPropagation();
          sfx.honk();
          talk(k.kind, LINES.boost, { chatty: true });
        });
        draw(k);
      });
      player = karts[0];
      await wait(600);
      for (let i = 0; i < 3; i++) {
        lights.dataset.n = String(i + 1);
        sounds.beep(false);
        talkText(player.kind, LINES.count[i]);
        await wait(900);
      }
      lights.dataset.n = 'go';
      sounds.beep(true);
      talkText(player.kind, 'Go!');
      phase = 'race';
      setTimeout(() => { lights.dataset.n = ''; }, 1200);
    }

    function draw(k) {
      const p = at(k.s, k.lane);
      k.el.style.transform = `translate(${p.x - 60}px,${p.y - 40}px) rotate(${(p.ang * 180) / Math.PI}deg)`;
      k.el.classList.toggle('boosting', k.boost > 0);
    }

    // ---- racing ------------------------------------------------------------------
    let engineStop = null;
    const stop = frames(dt => {
      if (!g.screen.isConnected) return false;
      if (phase !== 'race') return true;
      const lead = Math.max(...karts.map(k => k.lap + k.s));
      const mine = player.lap + player.s;
      for (const k of karts) {
        if (k.done) {
          k.v = Math.max(0, k.v - 300 * dt);
        } else if (k.pit > 0) {
          k.pit -= dt;
          k.v = 0;
          if (k.pit <= 0) k.boost = 1.4;
        } else {
          let target;
          if (k.me) target = gas ? MAX : 0;
          else {
            // Friendly rivals: they ease off when far ahead and catch up when behind.
            const gap = k.lap + k.s - mine;
            target = MAX * (gap > 0.12 ? 0.35 : gap > 0.04 ? 0.8 : gap < -0.1 ? 1 : 0.9) * (k.wobble ??= rand(0.92, 1));
          }
          if (k.boost > 0) target *= 1.6;
          const acc = target > k.v ? 420 : 520;
          k.v = target > k.v ? Math.min(target, k.v + acc * dt) : Math.max(target, k.v - acc * dt);
        }
        k.boost = Math.max(0, k.boost - dt);
        const before = k.s;
        k.s += (k.v * dt) / len;
        // Boost pads
        for (const b of BOOSTS) {
          if (before < b && k.s >= b) {
            k.boost = 1;
            if (k.me) {
              sounds.zoom();
              talk(k.kind, LINES.boost, { chatty: true });
            }
          }
        }
        if (k.s >= 1) {
          k.s -= 1;
          k.lap++;
          if (k.lap >= LAPS && !k.done) finish(k);
          else if (k.me) {
            sfx.ding();
            talk(k.kind, LINES.lap);
          }
        }
        draw(k);
      }
      if (gas && !engineStop) engineStop = loop('brush');
      if (!gas && engineStop) { engineStop(); engineStop = null; }
      void lead;
      return true;
    });

    function finish(k) {
      k.done = true;
      finished.push(k);
      if (k.me) {
        sfx.ta_da();
        fx.confetti(700, 650, 50);
        talk(k.kind, [LINES.first, LINES.second, LINES.third][finished.length - 1]);
      }
      if (finished.length === karts.length) setTimeout(podium, 1500);
      else if (k.me) {
        // The others whizz home quickly once the player has finished.
        karts.forEach(o => { if (!o.done) o.boost = 9; });
      }
    }

    // ---- podium --------------------------------------------------------------------
    const stand = div('podium', '', panel);
    function podium() {
      phase = 'podium';
      gas = false;
      engineStop?.();
      engineStop = null;
      karts.forEach(k => k.el.remove());
      stand.innerHTML = '<div class="steps"><b class="p2">2</b><b class="p1">1</b><b class="p3">3</b></div>';
      stand.classList.add('on');
      const spots = [[620, 300], [430, 380], [810, 420]];
      const medals = ['🥇', '🥈', '🥉'];
      finished.forEach((k, i) => {
        const f = new Friend(k.kind, { outfit: k.color, width: 150, parent: stand });
        f.el.classList.add('winner');
        f.el.style.left = `${spots[i][0]}px`;
        f.el.style.top = `${spots[i][1] - 120}px`;
        div('medal', medals[i], f.el);
        setTimeout(() => { f.play('cheer', 1500); f.mood('happy', 3000); }, 400 + i * 300);
      });
      sounds.fanfare();
      fx.confetti(700, 300, 90);
      setTimeout(() => talk(player.kind, LINES.medal), 900);
      againBtn.classList.add('on');
    }
    const againBtn = div('againbtn', '🏁', panel);
    againBtn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      againBtn.classList.remove('on');
      stand.classList.remove('on');
      stand.innerHTML = '';
      talk(player?.kind || kinds[0], LINES.again);
      showPick();
    });

    // ---- controls ---------------------------------------------------------------------
    const tray = div('tray-row');
    const pit = div('tool pitbtn', '<span>🔧</span>', tray);
    pit.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (phase !== 'race' || player.done || player.pit > 0) return sfx.boing();
      wiggle(pit, 'press');
      player.pit = 1.3;
      sounds.wrench();
      const p = at(player.s, player.lane);
      fx.sparkles(p.x, p.y, 50, 10);
      talk(player.kind, LINES.pit);
    });
    const gasBtn = div('tool gasbtn', '<span>GO</span>', tray);
    const press = on => e => {
      e.stopPropagation();
      gas = on && phase === 'race';
      gasBtn.classList.toggle('down', on);
      if (on && phase === 'race') sfx.vroom();
    };
    gasBtn.addEventListener('pointerdown', press(true));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => gasBtn.addEventListener(t, press(false)));
    const honk = div('tool honkbtn', '<span>📯</span>', tray);
    honk.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sfx.honk();
    });

    g.setStations([{ id: 'race', icon: '🏁', panel, tray, hint: () => (phase === 'race' ? gasBtn : phase === 'podium' ? againBtn : garage.firstChild) }]);
    showPick();

    function leave() {
      stop();
      engineStop?.();
      g.close();
      ctx.exit();
    }

    if (['localhost', '127.0.0.1'].includes(location.hostname)) {
      window.__race = { karts, get phase() { return phase; }, setGas: b => { gas = b; }, pick: i => startRace(i), get finished() { return finished.map(k => k.kind); } };
    }
  },
};
