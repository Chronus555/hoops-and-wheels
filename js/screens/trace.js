// Trace It: drive a little car along a letter-shaped road with a finger.
// Tracing in the right stroke order builds letter formation before he holds a pencil;
// the top level has him write his whole name.

import { getState, skillLevel, recordAnswer, pickTarget, nameLetters, childName } from '../store.js';
import { carSVG } from '../art.js';
import { say, setPrompt, clearPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, praise, confetti } from '../ui.js';
import { finishRound } from '../round.js';
import { ALPHABET, LETTER_NAMES, STARTER_LETTERS } from '../data.js';
import { html } from '../util.js';

// Strokes on a 100×140 grid, in the usual handwriting order and direction.
// Angles are in degrees, clockwise from 3 o'clock (SVG's y axis points down).
function arc(cx, cy, rx, ry, a0, a1) {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 10));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}
const S = (...parts) => parts.flatMap(p => (typeof p[0] === 'number' ? [p] : p));

const STROKES = {
  A: [S([50, 10], [15, 130]), S([50, 10], [85, 130]), S([28, 88], [72, 88])],
  B: [S([20, 10], [20, 130]), S([20, 10], [50, 10], arc(50, 38, 26, 28, -90, 90), [20, 66]),
    S([20, 66], [55, 66], arc(55, 98, 28, 32, -90, 90), [20, 130])],
  C: [S(arc(55, 70, 38, 60, -40, -320))],
  D: [S([20, 10], [20, 130]), S([20, 10], [40, 10], arc(40, 70, 42, 60, -90, 90), [20, 130])],
  E: [S([20, 10], [20, 130]), S([20, 10], [80, 10]), S([20, 70], [70, 70]), S([20, 130], [80, 130])],
  F: [S([20, 10], [20, 130]), S([20, 10], [80, 10]), S([20, 70], [70, 70])],
  G: [S(arc(55, 70, 38, 60, -40, -330), [90, 72], [60, 72])],
  H: [S([20, 10], [20, 130]), S([80, 10], [80, 130]), S([20, 70], [80, 70])],
  I: [S([50, 10], [50, 130]), S([25, 10], [75, 10]), S([25, 130], [75, 130])],
  J: [S([70, 10], [70, 95], arc(45, 95, 25, 35, 0, 180))],
  K: [S([20, 10], [20, 130]), S([80, 10], [20, 78]), S([40, 58], [82, 130])],
  L: [S([20, 10], [20, 130], [80, 130])],
  M: [S([15, 130], [15, 10], [50, 85], [85, 10], [85, 130])],
  N: [S([20, 130], [20, 10], [80, 130], [80, 10])],
  O: [S(arc(50, 70, 38, 60, -90, -450))],
  P: [S([20, 10], [20, 130]), S([20, 10], [50, 10], arc(50, 40, 28, 30, -90, 90), [20, 70])],
  Q: [S(arc(50, 70, 38, 60, -90, -450)), S([60, 100], [90, 135])],
  R: [S([20, 10], [20, 130]), S([20, 10], [50, 10], arc(50, 40, 28, 30, -90, 90), [20, 70]), S([45, 70], [82, 130])],
  S: [S(arc(50, 40, 28, 30, -20, -270), arc(50, 100, 30, 30, -90, 160))],
  T: [S([15, 10], [85, 10]), S([50, 10], [50, 130])],
  U: [S([20, 10], [20, 95], arc(50, 95, 30, 35, 180, 0), [80, 10])],
  V: [S([15, 10], [50, 130], [85, 10])],
  W: [S([10, 10], [30, 130], [50, 50], [70, 130], [90, 10])],
  X: [S([20, 10], [80, 130]), S([80, 10], [20, 130])],
  Y: [S([20, 10], [50, 70]), S([80, 10], [50, 70], [50, 130])],
  Z: [S([20, 10], [80, 10], [20, 130], [80, 130])],
  0: [S(arc(50, 70, 35, 60, -90, -450))],
  1: [S([32, 32], [50, 10], [50, 130])],
  2: [S(arc(50, 42, 30, 32, -170, 25), [20, 130], [82, 130])],
  3: [S(arc(48, 40, 30, 30, -160, 90), arc(48, 100, 32, 30, -90, 160))],
  4: [S([55, 10], [15, 92], [85, 92]), S([62, 10], [62, 130])],
  5: [S([75, 10], [30, 10], [26, 62], arc(50, 95, 32, 35, -125, 155))],
  6: [S(arc(60, 72, 40, 62, -65, -180), arc(50, 100, 30, 30, 180, 540))],
  7: [S([18, 10], [82, 10], [40, 130])],
  8: [S(arc(50, 40, 25, 30, -90, 270)), S(arc(50, 100, 30, 30, -90, 270))],
  9: [S(arc(50, 42, 28, 32, 0, -360), [78, 130])],
};
const DIGITS = '0123456789'.split('');

// Evenly spaced points (every 2 units) so progress moves smoothly.
function densify(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let s = 1; s <= steps; s++) out.push([x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps]);
  }
  return out;
}

const pts = arr => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const spoken = ch => (DIGITS.includes(ch) ? `the number ${ch}` : `the letter ${LETTER_NAMES[ch]}`);
const shortName = ch => (DIGITS.includes(ch) ? ch : LETTER_NAMES[ch]);

export function traceScreen(ctx) {
  const level = skillLevel('trace');
  const tolerance = [24, 18, 15][level - 1];
  const name = getState().childName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);

  let letters;
  if (level === 3 && name.length >= 2) {
    letters = name.split('');
  } else {
    const pool = level === 1 ? [...new Set([...nameLetters(), ...STARTER_LETTERS, 'L', 'T', 'H', 'I'])] : [...ALPHABET, ...DIGITS];
    letters = [];
    let last = '';
    for (let i = 0; i < 3; i++) {
      last = pickTarget(pool.map(c => `trace:${c}`), last && `trace:${last}`).slice(6);
      letters.push(last);
    }
  }
  const nameMode = level === 3 && letters.join('') === name;

  topBar(ctx, { center: `<div class="trace-progress">${letters.map(() => '<span class="slot-letter"></span>').join('')}</div>` });
  const view = html('<div class="stage trace-game"><div class="trace-board"></div></div>');
  ctx.root.append(view);
  const board = view.querySelector('.trace-board');
  const slots = [...ctx.root.querySelectorAll('.slot-letter')];

  async function traceLetter(ch, idx) {
    const strokes = STROKES[ch].map(densify);
    let slips = 0;
    board.innerHTML = `<svg class="trace-svg" viewBox="-16 -16 132 172">
      <g class="roads">${strokes.map(s => `<polyline class="road" points="${pts(s)}"/>`).join('')}</g>
      <g class="lines">${strokes.map(s => `<polyline class="center-line" points="${pts(s)}"/>`).join('')}</g>
      <g class="inks"></g>
      <g class="tracer">${carSVG(getState().carColor).replace('<svg ', '<svg x="-16" y="-10" width="32" height="19" ')}</g>
      <g class="marker"></g>
    </svg>`;
    const svg = board.querySelector('svg');
    const inks = svg.querySelector('.inks');
    const marker = svg.querySelector('.marker');
    const tracer = svg.querySelector('.tracer');
    const roads = [...svg.querySelectorAll('.road')];

    const toSvg = e => {
      const p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };

    function placeTracer(points, i) {
      const [x, y] = points[i];
      const [nx, ny] = points[Math.min(i + 3, points.length - 1)];
      const [px, py] = points[Math.max(i - 3, 0)];
      const angle = (Math.atan2(ny - py, nx - px) * 180) / Math.PI;
      const flip = Math.abs(angle) > 90 ? ' scale(1,-1)' : '';
      tracer.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})${flip}`);
    }

    for (let k = 0; k < strokes.length; k++) {
      const points = strokes[k];
      roads.forEach((r, j) => r.classList.toggle('active', j === k));
      const ink = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      ink.setAttribute('class', 'ink');
      inks.append(ink);
      const [sx, sy] = points[0];
      const [ax, ay] = points[Math.min(8, points.length - 1)];
      const arrowAngle = (Math.atan2(ay - sy, ax - sx) * 180) / Math.PI;
      marker.innerHTML = `<circle class="start-dot" cx="${sx}" cy="${sy}" r="9"/>
        <text class="start-num" x="${sx}" y="${sy + 4.5}" text-anchor="middle">${k + 1}</text>
        ${level === 1 ? `<path class="arrow" transform="translate(${ax} ${ay}) rotate(${arrowAngle})" d="M-5 -6 L6 0 L-5 6Z"/>` : ''}`;
      placeTracer(points, 0);

      if (k === 0) {
        setPrompt(idx === 0
          ? `${nameMode ? `Let's write your name, ${childName()}! First, ` : "Let's trace "}${spoken(ch)}! Put your finger on the green dot and drive along the road.`
          : `Now ${spoken(ch)}! Start at the green dot.`);
      } else {
        setPrompt('Now the next line! Start at the green dot.');
      }

      // Progress only moves forward along the road, and only near the finger.
      await ctx.wait(new Promise(resolve => {
        let i = 0;
        let down = false;
        let off = false;
        const move = e => {
          if (!down) return;
          const p = toSvg(e);
          let best = -1;
          let bestD = Infinity;
          for (let j = i; j < Math.min(i + 14, points.length); j++) {
            const d = Math.hypot(points[j][0] - p.x, points[j][1] - p.y);
            if (d < bestD) { bestD = d; best = j; }
          }
          if (bestD <= tolerance) {
            off = false;
            if (best > i) {
              i = best;
              ink.setAttribute('points', pts(points.slice(0, i + 1)));
              placeTracer(points, i);
              if (i >= points.length - 2) {
                cleanup();
                resolve();
              }
            }
          } else if (bestD > tolerance * 1.8 && !off && i > 0) {
            off = true;
            slips++;
          }
        };
        const start = e => {
          down = true;
          svg.setPointerCapture(e.pointerId);
          clearPrompt();
          move(e);
        };
        const stop = () => { down = false; };
        const cleanup = () => {
          svg.removeEventListener('pointerdown', start);
          svg.removeEventListener('pointermove', move);
          svg.removeEventListener('pointerup', stop);
          svg.removeEventListener('pointercancel', stop);
        };
        svg.addEventListener('pointerdown', start);
        svg.addEventListener('pointermove', move);
        svg.addEventListener('pointerup', stop);
        svg.addEventListener('pointercancel', stop);
      }));
      ink.setAttribute('points', pts(points));
      sfx.chime();
    }

    marker.innerHTML = '';
    roads.forEach(r => r.classList.remove('active'));
    svg.classList.add('finished');
    slots[idx].textContent = ch;
    slots[idx].classList.add('filled');
    recordAnswer(`trace:${ch}`, slips <= 2);
    await ctx.wait(say(`${shortName(ch)}! You wrote ${spoken(ch)}! ${praise()}`));
    return slips <= 2;
  }

  ctx.run(async () => {
    let good = 0;
    for (let i = 0; i < letters.length; i++) {
      if (await traceLetter(letters[i], i)) good++;
    }
    if (nameMode) {
      sfx.cheer();
      confetti(ctx.root);
      await ctx.wait(say(`You wrote your name! ${letters.map(shortName).join(', ')}. ${childName()}!`));
    }
    finishRound('trace', good / letters.length);
  });
}
