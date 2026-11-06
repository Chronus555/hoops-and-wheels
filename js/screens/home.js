import { go } from '../router.js';
import { getState, childName } from '../store.js';
import { isResting, firstGreeting } from '../session.js';
import { setPrompt, repeatPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { holdButton, openGate } from '../ui.js';
import { worldArt } from '../cards.js';
import { WORLDS, GAME_ICONS } from '../data.js';
import { html } from '../util.js';

export function homeScreen(ctx) {
  const s = getState();
  if (!s.setupDone) return go('setup');
  if (isResting()) return go('rest');

  const view = html(`<div class="home-wrap">
    <div class="topbar">
      <button class="round-btn garage-btn" aria-label="My garage">🧰${s.stickers.length ? `<span class="badge">${s.stickers.length}</span>` : ''}</button>
      <div class="topbar-center"><h1 class="logo small">Hoops <span>&amp;</span> Wheels</h1></div>
      <div class="topbar-right">
        <button class="round-btn repeat-btn" aria-label="Say it again">🔊</button>
        <button class="lock-btn" aria-label="Grown-ups: press and hold">🔒</button>
      </div>
    </div>
    <div class="stage home">
      <div class="world-cards">${WORLDS.map(w => `
        <button class="world-card world-${w.id}" data-world="${w.id}">
          <div class="world-art">${worldArt(w.id)}</div>
          <div class="card-name">${w.name}</div>
          <div class="world-games">${w.games.map(g => `<span>${GAME_ICONS[g]}</span>`).join('')}</div>
        </button>`).join('')}
      </div>
    </div>
  </div>`);
  ctx.root.append(view);

  view.querySelectorAll('.world-card').forEach(card => {
    card.addEventListener('click', () => { sfx.pop(); go('world', { world: card.dataset.world }); });
  });
  view.querySelector('.garage-btn').addEventListener('click', () => { sfx.tap(); go('garage'); });
  view.querySelector('.repeat-btn').addEventListener('click', () => repeatPrompt());
  holdButton(view.querySelector('.lock-btn'), 1500, () => openGate(() => go('parent')));

  setPrompt(firstGreeting()
    ? `Hi ${childName()}! Where do you want to play? Numbers, letters, shapes, or memory?`
    : 'Where do you want to play next?');
}
