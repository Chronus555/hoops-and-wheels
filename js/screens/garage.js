import { getState, update } from '../store.js';
import { carSVG } from '../art.js';
import { say, setPrompt } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar } from '../ui.js';
import { COLORS, STICKERS } from '../data.js';
import { html } from '../util.js';

// The sticker collection, plus painting your own car (a bit of color practice).
export function garageScreen(ctx) {
  const s = getState();
  const owned = new Set(s.stickers);

  topBar(ctx);
  const view = html(`<div class="stage garage">
    <div class="garage-car">
      <div class="big-car">${carSVG(s.carColor)}</div>
      <div class="swatches">${COLORS.map(c =>
        `<button class="swatch${c.hex === s.carColor ? ' on' : ''}" style="--c:${c.hex}" data-hex="${c.hex}" aria-label="${c.name}"></button>`).join('')}
      </div>
    </div>
    <div class="shelf-wrap">
      <div class="shelf">${STICKERS.map(st =>
        `<button class="sticker${owned.has(st.id) ? '' : ' locked'}" data-id="${st.id}"><span>${st.pic}</span></button>`).join('')}
      </div>
      ${s.stars ? `<div class="star-count">⭐ × ${s.stars}</div>` : ''}
    </div>
  </div>`);
  ctx.root.append(view);
  const bigCar = view.querySelector('.big-car');

  view.querySelector('.swatches').addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    const color = COLORS.find(c => c.hex === sw.dataset.hex);
    update(st => { st.carColor = color.hex; });
    view.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === sw));
    bigCar.innerHTML = carSVG(color.hex);
    bigCar.classList.remove('bounce');
    void bigCar.offsetWidth;
    bigCar.classList.add('bounce');
    sfx.honk();
    say(`${color.name}!`);
  });

  view.querySelector('.shelf').addEventListener('click', e => {
    const btn = e.target.closest('.sticker');
    if (!btn) return;
    const st = STICKERS.find(x => x.id === btn.dataset.id);
    btn.classList.remove('bounce');
    void btn.offsetWidth;
    btn.classList.add('bounce');
    if (owned.has(st.id)) { sfx.pop(); say(`${st.name}!`); }
    else say('Keep playing to win this one!');
  });

  const n = owned.size;
  setPrompt(n
    ? `Welcome to your garage! You have ${n} sticker${n === 1 ? '' : 's'}. Tap a color to paint your car!`
    : 'Welcome to your garage! Play games to win stickers. Tap a color to paint your car!');
}
