// Robot Workshop: build a robot from parts. Pick a part type on the left (head,
// body, arms, bottom, top), then tap one of its four options in the tray; heads
// and bodies are shapes, so each one is named ("Square!", "Triangle!"). Paint it,
// then press the big button: the robot powers up, beeps, talks and dances in its
// own way (wheels roll, legs jump, a rocket lifts off). The robot is remembered.

import { div, pick, wait, useStyle } from '../../core/stage.js';
import { sfx, tone, noise } from '../../core/sound.js';
import { say, talk } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIEND_KINDS } from '../../core/friends.js';
import { loadData, saveData } from '../../core/store.js';
import { LINES, PART_NAMES } from './lines.js';

const METALS = ['#adb5bd', '#ef476f', '#4895ef', '#06d6a0', '#ffd166', '#9b5de5'];
const dark = '#495057';

// Each part is drawn in a 400 x 520 box: base at the bottom, body, head, top.
const PARTS = {
  head: {
    square: c => `<rect x="138" y="88" width="124" height="120" rx="16" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
    circle: c => `<circle cx="200" cy="148" r="66" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
    triangle: c => `<path d="M200,70 L278,212 L122,212 Z" fill="${c}" stroke="${dark}" stroke-width="5" stroke-linejoin="round"/>`,
    oval: c => `<ellipse cx="200" cy="150" rx="88" ry="58" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
  },
  body: {
    rectangle: c => `<rect x="130" y="222" width="140" height="168" rx="14" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
    circle: c => `<circle cx="200" cy="306" r="86" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
    triangle: c => `<path d="M104,222 L296,222 L200,396 Z" fill="${c}" stroke="${dark}" stroke-width="5" stroke-linejoin="round"/>`,
    square: c => `<rect x="118" y="222" width="164" height="164" rx="12" fill="${c}" stroke="${dark}" stroke-width="5"/>`,
  },
  arms: {
    straight: c => side(s => `<rect x="${s < 0 ? 72 : 288}" y="236" width="40" height="120" rx="14" fill="${c}" stroke="${dark}" stroke-width="5"/><circle cx="${s < 0 ? 92 : 308}" cy="366" r="20" fill="${dark}"/>`),
    springy: () => side(s => `<path d="M${s < 0 ? 128 : 272},250 ${Array.from({ length: 8 }, (_, i) => `L${200 + s * (82 + (i % 2) * 34)},${262 + i * 14}`).join(' ')}" fill="none" stroke="${dark}" stroke-width="8" stroke-linejoin="round"/><circle cx="${200 + s * 100}" cy="${372}" r="18" fill="#ffd166" stroke="${dark}" stroke-width="5"/>`),
    claws: c => side(s => `<rect x="${s < 0 ? 78 : 286}" y="240" width="36" height="100" rx="12" fill="${c}" stroke="${dark}" stroke-width="5"/><path d="M${200 + s * 104},340 l${-s * 26},34 M${200 + s * 104},340 l${s * 22},36" stroke="${dark}" stroke-width="10" stroke-linecap="round"/>`),
    noodle: () => side(s => `<path d="M${200 + s * 70},250 C${200 + s * 150},260 ${200 + s * 90},330 ${200 + s * 150},380" fill="none" stroke="#ff8fab" stroke-width="16" stroke-linecap="round"/><circle cx="${200 + s * 150}" cy="384" r="14" fill="#ff8fab"/>`),
  },
  base: {
    wheels: () => `<rect x="150" y="388" width="100" height="30" fill="${dark}"/><g class="wheel"><circle cx="140" cy="450" r="48" fill="#2f3640"/><circle cx="140" cy="450" r="18" fill="#dfe6ee"/></g><g class="wheel"><circle cx="260" cy="450" r="48" fill="#2f3640"/><circle cx="260" cy="450" r="18" fill="#dfe6ee"/></g>`,
    legs: c => `<rect x="148" y="388" width="34" height="96" rx="12" fill="${c}" stroke="${dark}" stroke-width="5"/><rect x="218" y="388" width="34" height="96" rx="12" fill="${c}" stroke="${dark}" stroke-width="5"/><rect x="128" y="474" width="64" height="26" rx="12" fill="${dark}"/><rect x="208" y="474" width="64" height="26" rx="12" fill="${dark}"/>`,
    tracks: () => `<rect x="96" y="420" width="208" height="80" rx="40" fill="#2f3640"/>${[136, 178, 222, 264].map(x => `<circle class="wheel" cx="${x}" cy="460" r="18" fill="#6c757d"/>`).join('')}<rect x="170" y="388" width="60" height="34" fill="${dark}"/>`,
    rocket: c => `<path d="M150,388 L250,388 L230,450 L170,450 Z" fill="${c}" stroke="${dark}" stroke-width="5"/><path class="jet" d="M178,452 L200,512 L222,452 Z" fill="#f8961e"/><path class="jet" d="M188,452 L200,490 L212,452 Z" fill="#ffd166"/>`,
  },
  top: {
    antenna: () => '<rect x="196" y="20" width="8" height="70" fill="#495057"/><circle class="blink" cx="200" cy="20" r="14" fill="#ef476f"/>',
    propeller: () => '<rect x="196" y="40" width="8" height="50" fill="#495057"/><g class="spinner"><ellipse cx="160" cy="38" rx="40" ry="9" fill="#06d6a0"/><ellipse cx="240" cy="38" rx="40" ry="9" fill="#9b5de5"/></g>',
    bulb: () => '<rect x="186" y="66" width="28" height="24" fill="#adb5bd"/><circle class="bulb" cx="200" cy="44" r="28" fill="#fff6bf" stroke="#e09f3e" stroke-width="4"/>',
    none: () => '',
  },
};
function side(f) { return f(-1) + f(1); }
const ORDER = ['head', 'body', 'arms', 'base', 'top'];
const TAB_ICONS = { head: '🙂', body: '🟦', arms: '💪', base: '🛞', top: '📡' };

const sounds = {
  click: () => { tone(800, 0.05, { type: 'square', vol: 0.06 }); noise(0.04, { freq: 3000, vol: 0.2 }); },
  powerUp: () => { tone(200, 0.9, { type: 'sawtooth', vol: 0.08, to: 1200 }); [0.9, 1.05, 1.2].forEach((at, i) => tone(880 + i * 220, 0.12, { type: 'square', vol: 0.06, at })); },
  beeps: () => { for (let i = 0; i < 6; i++) tone(600 + Math.random() * 1200, 0.08, { type: 'square', vol: 0.05, at: i * 0.12 }); },
  powerDown: () => tone(900, 0.8, { type: 'sawtooth', vol: 0.06, to: 100 }),
};

export default {
  id: 'robot',
  open(ctx) {
    useStyle('js/places/robot/style.css');
    document.body.dataset.screen = 'robot';
    const g = makeScene({ cls: 'robot', onHome: leave });
    const { fx } = g;
    const bot = loadData('robot', { head: 'square', body: 'rectangle', arms: 'straight', base: 'wheels', top: 'antenna', color: '#adb5bd' });
    const helper = pick(FRIEND_KINDS);

    const panel = div('panel p-robot', '<div class="wall"></div><div class="floor"></div><div class="gears"><i></i><i></i></div><div class="blueprint"></div>');
    const stand = div('robotstand', '<div class="platform"></div>', panel);
    const robotEl = div('bot', '', stand);
    const friend = new Friend(helper, { outfit: '#fff', width: 150, parent: panel });
    friend.el.classList.add('helper');
    friend.el.insertAdjacentHTML('beforeend', '<div class="goggles"></div>');
    friend.el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      friend.play('wave', 1200);
      talk(helper, LINES.hello, { chatty: true });
    });
    let alive = false;

    function draw() {
      const c = bot.color;
      const eyes = bot.head === 'triangle' ? [[180, 172], [220, 172]] : [[175, 140], [225, 140]];
      const face = `${eyes.map(([x, y]) => `<circle class="eye" cx="${x}" cy="${y}" r="13" fill="#212529"/><circle class="glint" cx="${x + 4}" cy="${y - 4}" r="4" fill="#fff"/>`).join('')}
        <rect class="mouth" x="170" y="${bot.head === 'triangle' ? 192 : 172}" width="60" height="12" rx="6" fill="#212529"/>`;
      const chest = `<circle class="light l1" cx="180" cy="290" r="10" fill="#ef476f"/><circle class="light l2" cx="200" cy="290" r="10" fill="#ffd166"/><circle class="light l3" cx="220" cy="290" r="10" fill="#06d6a0"/>
        <rect x="175" y="314" width="50" height="34" rx="6" fill="rgba(0,0,0,.2)"/>`;
      robotEl.innerHTML = `<svg viewBox="0 0 400 520" overflow="visible">
        <g class="part-base base-${bot.base}">${PARTS.base[bot.base](c)}</g>
        <g class="part-arms">${PARTS.arms[bot.arms](c)}</g>
        <g class="part-body">${PARTS.body[bot.body](c)}${chest}</g>
        <rect x="185" y="200" width="30" height="26" fill="${dark}"/>
        <g class="part-head">${PARTS.head[bot.head](c)}${face}</g>
        <g class="part-top top-${bot.top}">${PARTS.top[bot.top](c)}</g></svg>`;
      saveData('robot', bot);
    }
    draw();
    robotEl.addEventListener('pointerdown', e => {
      e.stopPropagation();
      sounds.beeps();
      wiggle(robotEl, 'jiggle');
      if (alive) say(pick(LINES.tickle), 0.85);
    });

    // ---- part picker -------------------------------------------------------------
    let tab = 'head';
    const tabs = div('parttabs', '', panel);
    const tabBtns = ORDER.map(k => {
      const b = div(`parttab${k === tab ? ' on' : ''}`, `<span>${TAB_ICONS[k]}</span>`, tabs);
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        tab = k;
        tabBtns.forEach(x => x.classList.toggle('on', x === b));
        sfx.tap();
        fillTray();
      });
      return b;
    });
    const tray = div('tray-row');
    const options = div('options', '', tray);
    function fillTray() {
      options.innerHTML = '';
      for (const [name, art] of Object.entries(PARTS[tab])) {
        const viewBox = { head: '60 50 280 180', body: '90 200 220 210', arms: '40 220 320 180', base: '80 380 240 140', top: '100 0 200 110' }[tab];
        const b = div(`tool partopt${bot[tab] === name ? ' on' : ''}`, name === 'none' ? '<span class="none">✖️</span>' : `<svg viewBox="${viewBox}">${art(bot.color)}</svg>`, options);
        b.addEventListener('pointerdown', e => {
          e.stopPropagation();
          bot[tab] = name;
          sounds.click();
          draw();
          fillTray();
          wiggle(robotEl, 'jiggle');
          fx.sparkles(700, tab === 'head' ? 300 : tab === 'top' ? 230 : 480, 80, 8);
          say(PART_NAMES[name], alive ? 0.85 : 1.05);
        });
      }
    }
    fillTray();
    const paint = div('tool roundbtn', '<span>🎨</span>', tray);
    paint.addEventListener('pointerdown', e => {
      e.stopPropagation();
      bot.color = METALS[(METALS.indexOf(bot.color) + 1) % METALS.length];
      sfx.gloop();
      fx.blobs(700, 450, bot.color, 10);
      draw();
      fillTray();
      talk(helper, LINES.paint, { chatty: true });
    });
    const power = div('tool powerbtn', '<span>⚡</span>', tray);
    power.addEventListener('pointerdown', async e => {
      e.stopPropagation();
      if (g.busy()) return;
      g.setBusy(true);
      wiggle(power, 'press');
      if (alive) {
        alive = false;
        sounds.powerDown();
        robotEl.classList.remove('alive', `dance-${bot.base}`);
        await say(pick(LINES.off), 0.85);
        g.setBusy(false);
        return;
      }
      await talk(helper, LINES.power);
      sounds.powerUp();
      alive = true;
      robotEl.classList.add('alive');
      fx.sparkles(700, 380, 160, 24);
      await wait(1200);
      robotEl.classList.add(`dance-${bot.base}`);
      sounds.beeps();
      await say(pick(LINES.robot), 0.85);
      g.setBusy(false);
    });

    g.setStations([{ id: 'robot', icon: '🤖', panel, tray, hint: () => (alive ? options.firstChild : power) }]);
    setTimeout(() => talk(helper, LINES.hello), 400);

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__robot = { bot, get alive() { return alive; } };
  },
};
