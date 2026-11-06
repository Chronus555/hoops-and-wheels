// Animal Doctor: a friend comes in with a booboo (a bumped knee, the sniffles, a
// fever or a tummy ache). Every tool does something: the stethoscope hears a
// heartbeat, the x-ray shows something silly inside, the "shot" only tickles.
// The right tool makes them better, then they get a lollipop and the next friend
// comes in. Tapping the patient names the body part ("Knee!", "Tummy!").

import { div, rand, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { makeTool, areaTarget } from '../../core/tools.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, PARTS } from './lines.js';

// The patient: a friend 260 wide; friend units -> stage units.
const P = { x: 570, y: 300, w: 260, h: 480, k: 2 };
const toStage = (fx, fy) => ({ x: P.x + (fx + 65) * P.k, y: P.y + (fy + 238) * P.k });
const toFriend = p => ({ x: (p.x - P.x) / P.k - 65, y: (p.y - P.y) / P.k - 238 });
const SPOTS = {
  head: [0, -200], eyes: [0, -176], nose: [0, -162], mouth: [0, -150], ears: [-28, -196],
  tummy: [0, -92], arm: [-34, -105], hand: [-34, -62], knee: [-13, -32], foot: [-14, -4],
};
const BOOBOOS = ['knee', 'sneeze', 'fever', 'tummy'];
const CURES = { knee: 'bandage', sneeze: 'tissue', fever: 'ice', tummy: 'medicine' };
const SILLY = ['🚗', '🐟', '🧦', '⚽', '🦆', '🍌', '🧸'];

const sounds = {
  beat: () => [0, 0.18, 0.7, 0.88].forEach(at => tone(70, 0.12, { vol: 0.5, at, to: 50 })),
  achoo: () => { noise(0.5, { freq: 2500, q: 0.6, vol: 0.5, to: 900 }); tone(500, 0.3, { to: 200, type: 'triangle', vol: 0.15 }); },
  zap: () => { tone(300, 0.6, { type: 'sawtooth', vol: 0.06, to: 1200 }); noise(0.6, { freq: 4000, vol: 0.1 }); },
  gulp: () => [0, 0.25].forEach(at => tone(240, 0.12, { to: 140, vol: 0.3, at })),
  rumble: () => tone(90, 0.7, { type: 'sawtooth', vol: 0.08, to: 60 }),
};

export default {
  id: 'doctor',
  open(ctx) {
    useStyle('js/places/doctor/style.css');
    document.body.dataset.screen = 'doctor';
    const g = makeScene({ cls: 'doctor', onHome: leave });
    const { fx } = g;
    const panel = div('panel p-doctor', `<div class="wall"></div><div class="floor"></div><div class="cross"></div>
      <div class="chart"><i></i><i></i><i></i></div><div class="bed"></div><div class="jar">🍭</div>`);
    const patientBox = div('patient', '', panel);
    patientBox.style.cssText = `left:${P.x}px;top:${P.y}px;width:${P.w}px;height:${P.h}px`;
    let patient = null;
    let overlay = null;
    let booboo = null;
    let lastKind = null;
    let cured = false;
    const bandages = [];

    // Silly booboo pictures drawn over the patient, in friend units.
    function drawOverlay() {
      const parts = [];
      if (booboo === 'knee') parts.push('<path d="M-22,-36 l6,4 l3,-5 l5,6 l4,-4" fill="none" stroke="#e63946" stroke-width="3" stroke-linecap="round"/>');
      if (booboo === 'sneeze') parts.push('<circle cx="0" cy="-160" r="7" fill="#ff6b6b" opacity=".85"/><circle cx="10" cy="-150" r="2.5" fill="#a8dadc"/>');
      if (booboo === 'fever') parts.push('<circle cx="-18" cy="-160" r="8" fill="#ff6b6b" opacity=".6"/><circle cx="18" cy="-160" r="8" fill="#ff6b6b" opacity=".6"/><path d="M26,-196 q4,8 0,12 q-4,-4 0,-12" fill="#90e0ef"/>');
      if (booboo === 'tummy') parts.push('<path d="M-12,-100 q6,-6 12,0 t12,0" fill="none" stroke="#6d597a" stroke-width="2.5"/>');
      bandages.forEach(b => parts.push(`<g transform="translate(${b.x},${b.y}) rotate(${b.r})"><rect x="-12" y="-5" width="24" height="10" rx="4" fill="#f4d1ae" stroke="#d4a373" stroke-width="1.2"/><rect x="-4" y="-4" width="8" height="8" fill="#e9c46a"/></g>`));
      overlay.innerHTML = parts.join('');
    }

    async function nextPatient() {
      cured = false;
      bandages.length = 0;
      const kind = pick(FRIEND_KINDS.filter(k => k !== lastKind));
      lastKind = kind;
      booboo = pick(BOOBOOS);
      patientBox.innerHTML = '';
      patient = new Friend(kind, { outfit: pick(OUTFITS), width: P.w, parent: patientBox });
      overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlay.setAttribute('viewBox', '-65 -238 130 240');
      overlay.setAttribute('class', 'overlay');
      patientBox.appendChild(overlay);
      drawOverlay();
      patientBox.animate([{ transform: 'translateX(-700px)' }, { transform: 'none' }], { duration: 900, easing: 'ease-out' });
      patient.el.classList.add('walking');
      await wait(900);
      patient.el.classList.remove('walking');
      patient.mood(booboo === 'fever' || booboo === 'tummy' ? 'wow' : 'squint', 1600);
      await talk(kind, LINES.hello);
      talk(kind, LINES[booboo]);
      if (booboo === 'sneeze') setTimeout(sneeze, 3500);
      if (booboo === 'tummy') sounds.rumble();
    }

    function sneeze() {
      if (cured || booboo !== 'sneeze' || !patient) return;
      sounds.achoo();
      patient.play('hop', 600);
      patient.mood('squint', 900);
      const n = toStage(0, -160);
      fx.splash(n.x, n.y, 'rgba(168,218,220,.9)', 8);
      talk(patient.kind, LINES.achoo, { chatty: true });
    }

    async function cure() {
      if (cured) return;
      cured = true;
      booboo = null;
      drawOverlay();
      sfx.ta_da();
      fx.sparkles(P.x + P.w / 2, P.y + 200, 140, 20);
      patient.mood('happy', 3000);
      patient.play('cheer', 1200);
      await talk(patient.kind, LINES.better);
      // A lollipop from the jar.
      const lolly = div('lolly', '🍭', panel);
      lolly.animate([{ transform: 'translate(1180px,330px) scale(.5)' }, { transform: `translate(${P.x + 40}px,${P.y + 330}px) scale(1)` }], { duration: 700, fill: 'forwards', easing: 'ease-out' });
      sfx.pop();
      await wait(800);
      await talk(patient.kind, LINES.lolly);
      patient.play('wave', 1400);
      talk(patient.kind, LINES.bye);
      await wait(1200);
      lolly.remove();
      patient.el.classList.add('walking');
      patientBox.animate([{ transform: 'none' }, { transform: 'translateX(900px)' }], { duration: 1000, easing: 'ease-in', fill: 'forwards' });
      await wait(1000);
      if (!g.screen.isConnected) return;
      patientBox.getAnimations().forEach(a => a.cancel());
      nextPatient();
    }

    // Tapping the patient names the body part.
    function nearestPart(p) {
      const f = toFriend(p);
      let best = null;
      let bd = 1e9;
      for (const [name, [x, y]] of Object.entries(SPOTS)) {
        const d = Math.min(Math.hypot(f.x - x, f.y - y), Math.hypot(f.x + x, f.y - y));
        if (d < bd) { bd = d; best = name; }
      }
      return bd < 34 ? best : null;
    }
    patientBox.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (!patient) return;
      const r = patientBox.getBoundingClientRect();
      const p = { x: P.x + ((e.clientX - r.left) / r.width) * P.w, y: P.y + ((e.clientY - r.top) / r.height) * P.h };
      const part = nearestPart(p);
      if (!part) return;
      sfx.boing();
      patient.mood('giggle', 900);
      fx.sparkles(p.x, p.y, 20, 3);
      talkText(patient.kind, PARTS[part]);
    });

    // ---- tools -------------------------------------------------------------------
    const target = areaTarget(P);
    g.target = target;
    const near = (p, spot, r = 60) => {
      const [x, y] = SPOTS[spot];
      const s = toStage(x, y);
      const s2 = toStage(-x, y);
      return Math.min(Math.hypot(p.x - s.x, p.y - s.y), Math.hypot(p.x - s2.x, p.y - s2.y)) < r;
    };
    const busyTalk = (lines, o) => patient && talk(patient.kind, lines, o);
    const svgTool = (art, vb = '-50 -50 100 100') => `<svg viewBox="${vb}">${art}</svg>`;

    const tools = {
      thermometer: makeTool(g, {
        art: svgTool('<rect x="-7" y="-44" width="14" height="70" rx="7" fill="#fff" stroke="#adb5bd" stroke-width="3"/><circle cy="32" r="12" fill="#ef233c"/><rect x="-3" y="-10" width="6" height="40" fill="#ef233c"/>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          const hot = booboo === 'fever';
          wiggle(patientBox, 'jump');
          sfx.ding();
          const b = div('reading', hot ? '🔥' : '🙂', panel);
          b.style.cssText = `left:${P.x + 200}px;top:${P.y + 40}px`;
          setTimeout(() => b.remove(), 1600);
          busyTalk(hot ? LINES.hot : LINES.ok);
          return true;
        },
        tap() { this.drop(toStage(0, -150), null, true); },
      }),
      stethoscope: makeTool(g, {
        art: svgTool('<path d="M-26,-40 V-6 Q-26,20 0,20 Q26,20 26,-6 V-40" fill="none" stroke="#495057" stroke-width="6"/><path d="M0,20 V30" stroke="#495057" stroke-width="6"/><circle cy="38" r="12" fill="#adb5bd" stroke="#495057" stroke-width="4"/>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          sounds.beat();
          const h = div('heart', '❤️', panel);
          h.style.cssText = `left:${p.x - 30}px;top:${p.y - 60}px`;
          setTimeout(() => h.remove(), 1600);
          busyTalk(LINES.heart);
          return true;
        },
        tap() { this.drop(toStage(0, -100), null, true); },
      }),
      bandage: makeTool(g, {
        art: svgTool('<g transform="rotate(-30)"><rect x="-40" y="-14" width="80" height="28" rx="12" fill="#f4d1ae" stroke="#d4a373" stroke-width="3"/><rect x="-12" y="-12" width="24" height="24" fill="#e9c46a"/></g>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          const f = toFriend(p);
          bandages.push({ x: f.x, y: f.y, r: rand(-30, 30) });
          if (bandages.length > 8) bandages.shift();
          drawOverlay();
          sfx.sticker();
          if (booboo === 'knee' && near(p, 'knee', 70)) cure();
          else busyTalk(LINES.tickle, { chatty: true });
          return true;
        },
        tap() { this.drop(booboo === 'knee' ? toStage(-13, -32) : toStage(rand(-25, 25), rand(-120, -40)), null, true); },
      }),
      tissue: makeTool(g, {
        art: svgTool('<path d="M-36,-20 Q-30,-40 -10,-34 Q0,-46 12,-34 Q32,-40 36,-20 L30,36 L-30,36 Z" fill="#fff" stroke="#ced4da" stroke-width="3"/>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          if (near(p, 'nose', 80)) {
            sounds.achoo();
            patient.play('hop', 500);
            if (booboo === 'sneeze') setTimeout(cure, 700);
            else busyTalk(LINES.tickle, { chatty: true });
          } else busyTalk(LINES.tickle, { chatty: true });
          return true;
        },
        tap() { this.drop(toStage(0, -162), null, true); },
      }),
      ice: makeTool(g, {
        art: svgTool('<rect x="-38" y="-26" width="76" height="52" rx="16" fill="#90e0ef" stroke="#48cae4" stroke-width="4"/><rect x="-20" y="-14" width="14" height="14" rx="3" fill="#fff" opacity=".8"/><rect x="4" y="0" width="14" height="14" rx="3" fill="#fff" opacity=".8"/>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          patient.mood('squint', 1200);
          busyTalk(LINES.cold);
          if (booboo === 'fever' && near(p, 'head', 110)) setTimeout(cure, 1200);
          return true;
        },
        tap() { this.drop(toStage(0, -200), null, true); },
      }),
      medicine: makeTool(g, {
        art: svgTool('<ellipse cx="-14" cy="12" rx="22" ry="14" fill="#adb5bd"/><rect x="2" y="6" width="50" height="10" rx="5" fill="#adb5bd" transform="rotate(-25)"/><ellipse cx="-14" cy="10" rx="16" ry="8" fill="#ff8fc7"/>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          if (near(p, 'mouth', 80)) {
            sounds.gulp();
            const m = toStage(0, -150);
            fx.bubbles(m.x, m.y, 10);
            busyTalk(LINES.yum);
            if (booboo === 'tummy' || booboo === 'fever') setTimeout(cure, 1500);
          } else busyTalk(LINES.tickle, { chatty: true });
          return true;
        },
        tap() { this.drop(toStage(0, -150), null, true); },
      }),
      shot: makeTool(g, {
        art: svgTool('<rect x="-30" y="-10" width="50" height="20" rx="4" fill="#e0fbfc" stroke="#90e0ef" stroke-width="3"/><rect x="20" y="-3" width="26" height="6" fill="#adb5bd"/><rect x="-44" y="-14" width="14" height="28" rx="3" fill="#90e0ef"/><text x="-6" y="7" text-anchor="middle" font-size="16">🪶</text>'),
        w: 90, h: 90,
        drop(p, sp, on) {
          if (!on) return false;
          patient.mood('giggle', 1400);
          sfx.boing();
          busyTalk(LINES.tickle);
          return true;
        },
        tap() { this.drop(toStage(-34, -105), null, true); },
      }),
    };
    const xray = div('tool xraybtn', svgTool('<rect x="-40" y="-40" width="80" height="80" rx="14" fill="#1d3557"/><path d="M-20,-20 h40 M-24,-6 h48 M-22,8 h44 M0,-30 v60" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'));
    xray.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (!patient || g.busy()) return;
      g.setBusy(true);
      sounds.zap();
      const screen = div('xray', `<div class="bones"></div><div class="thing">${pick(SILLY)}</div>`, panel);
      screen.style.cssText = `left:${P.x + 40}px;top:${P.y + 160}px`;
      patient.mood('wow', 2200);
      busyTalk(LINES.xray);
      await wait(2400);
      screen.remove();
      g.setBusy(false);
    });
    const tray = div('tray-row');
    tray.append(...Object.values(tools), xray);

    g.setStations([{ id: 'doctor', icon: '🩺', panel, tray, hint: () => tools[CURES[booboo]] || tools.stethoscope }]);
    nextPatient();
    const sneezer = setInterval(() => { if (!g.screen.isConnected) clearInterval(sneezer); else if (Math.random() < 0.5) sneeze(); }, 6000);

    function leave() {
      clearInterval(sneezer);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__doc = { get booboo() { return booboo; }, get cured() { return cured; }, tools, toStage, cure, get patient() { return patient; } };
  },
};
