// Little pictures for the world and game cards, so a pre-reader can pick by sight.

import { getState } from './store.js';
import { carSVG, ballSVG, monsterSVG, engineSVG, blueprintSVG, shapeSVG } from './art.js';
import { BLUEPRINTS } from './data.js';

export function gameArt(id) {
  const color = getState().carColor;
  switch (id) {
    case 'race':
      return `<div class="mini-track">${carSVG(color)}<span class="flag">🏁</span></div>`;
    case 'parking':
      return `<div class="mini-lot"><span class="p-sign">5</span>${carSVG('#ffbe0b')}</div>`;
    case 'letterpark':
      return `<div class="mini-lot"><span class="p-sign purple">B</span>${carSVG('#2a9d8f')}</div>`;
    case 'monster':
      return `<div class="mini-monster">${monsterSVG()}<span class="mini-cookie">🍪</span></div>`;
    case 'hoop':
      return `<div class="mini-hoop"><div class="mini-board"></div><div class="mini-rim"></div>${ballSVG()}</div>`;
    case 'trace':
      return '<div class="mini-trace"><span class="trace-letter">A</span><span class="mini-pencil">✏️</span></div>';
    case 'drum':
      return '<div class="mini-emoji">🥁<span class="mini-dots"><i></i><i></i><i></i></span></div>';
    case 'blend':
      return '<div class="mini-emoji">🤖<span class="mini-bubble">cup… cake</span></div>';
    case 'build':
      return `<div class="mini-build">${blueprintSVG(BLUEPRINTS[0])}</div>`;
    case 'train':
      return `<div class="mini-train">${engineSVG()}<span class="mini-car">🐶</span><span class="mini-car">🐱</span></div>`;
    case 'sort':
      return `<div class="mini-sort"><span class="mini-box red">${carSVG('#e63946')}</span><span class="mini-box blue">${carSVG('#3a86ff')}</span></div>`;
    case 'size':
      return '<div class="mini-sizes"><span style="font-size:28px">🐻</span><span style="font-size:44px">🐻</span><span style="font-size:64px">🐻</span></div>';
    case 'band':
      return '<div class="mini-band"><span style="--c:#2a9d8f">🐸</span><span style="--c:#ffbe0b">🐥</span><span style="--c:#e76f51">🐻</span><span style="--c:#3a86ff">🐳</span></div>';
    case 'listen':
      return '<div class="mini-emoji">👂<span class="mini-bubble">tap the 🐶</span></div>';
    default:
      return '';
  }
}

export function worldArt(id) {
  switch (id) {
    case 'numbers':
      return '<div class="world-glyphs"><span>1</span><span>2</span><span>3</span></div>';
    case 'letters':
      return '<div class="world-glyphs"><span>A</span><span>B</span><span>C</span></div>';
    case 'shapes':
      return `<div class="shape-trio">${shapeSVG('triangle', '#ffbe0b')}${shapeSVG('circle', '#ff70a6')}${shapeSVG('square', '#06d6a0')}</div>`;
    case 'brain':
      return '<div class="world-emoji">🧠<span>🎵</span></div>';
    default:
      return '';
  }
}
