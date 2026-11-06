import { go } from '../router.js';
import { skillLevel } from '../store.js';
import { setPrompt, repeatPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { stars } from '../ui.js';
import { gameArt, worldArt } from '../cards.js';
import { WORLDS, GAME_NAMES } from '../data.js';
import { html } from '../util.js';

// One learning world: the games for a single area, so he can focus on it.
export function worldScreen(ctx) {
  const w = WORLDS.find(x => x.id === ctx.params.world) || WORLDS[0];
  const view = html(`<div class="world-wrap">
    <div class="topbar">
      <button class="round-btn home-btn" aria-label="Home">🏠</button>
      <div class="topbar-center"><div class="world-title world-${w.id}">${worldArt(w.id)}<span>${w.name}</span></div></div>
      <button class="round-btn repeat-btn" aria-label="Say it again">🔊</button>
    </div>
    <div class="stage world">
      <div class="game-cards count-${w.games.length}">${w.games.map(g => `
        <button class="game-card card-${g}" data-game="${g}">
          <div class="card-art">${gameArt(g)}</div>
          <div class="card-name">${GAME_NAMES[g]}</div>
          <div class="stars">${stars(skillLevel(g))}</div>
        </button>`).join('')}
      </div>
    </div>
  </div>`);
  ctx.root.append(view);
  ctx.root.classList.add(`in-world-${w.id}`);

  view.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => { sfx.vroom(); go(card.dataset.game); });
  });
  view.querySelector('.home-btn').addEventListener('click', () => { sfx.tap(); go('home'); });
  view.querySelector('.repeat-btn').addEventListener('click', () => repeatPrompt());

  setPrompt(`${w.say}! Pick a game.`);
}
