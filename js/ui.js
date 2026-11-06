import { go, currentScreen } from './router.js';
import { repeatPrompt, say } from './speech.js';
import { sfx } from './sound.js';
import { html, pick, rand, shuffle } from './util.js';
import { PRAISE, worldOf } from './data.js';
import { childName } from './store.js';

// Back/home and "say it again" buttons sit at the top, away from where small wrists rest.
// Inside a game, the left button goes back to that game's world.
export function topBar(ctx, { home = true, repeat = true, center = '' } = {}) {
  const world = worldOf(currentScreen());
  const bar = html(`<div class="topbar">
    ${home ? `<button class="round-btn home-btn" aria-label="${world ? 'Back' : 'Home'}">${world ? '⬅️' : '🏠'}</button>` : '<span></span>'}
    <div class="topbar-center">${center}</div>
    ${repeat ? '<button class="round-btn repeat-btn" aria-label="Say it again">🔊</button>' : '<span></span>'}
  </div>`);
  bar.querySelector('.home-btn')?.addEventListener('click', () => {
    sfx.tap();
    if (world) go('world', { world });
    else go('home');
  });
  bar.querySelector('.repeat-btn')?.addEventListener('click', () => repeatPrompt());
  ctx.root.append(bar);
  return bar;
}

export function praise() {
  return Math.random() < 0.3 ? `${pick(PRAISE)}, ${childName()}!` : `${pick(PRAISE)}!`;
}

export function confetti(root) {
  const colors = ['#e63946', '#ffbe0b', '#3a86ff', '#2a9d8f', '#ff70a6', '#f77f00'];
  const box = html('<div class="confetti"></div>');
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = pick(colors);
    p.style.animationDuration = `${rand(14, 26) / 10}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    box.append(p);
  }
  root.append(box);
  setTimeout(() => box.remove(), 3200);
}

// Press-and-hold so a quick tap from a child doesn't open grown-up things.
export function holdButton(el, ms, onDone) {
  let timer = 0;
  el.style.setProperty('--hold', `${ms}ms`);
  const stop = () => { clearTimeout(timer); el.classList.remove('holding'); };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.classList.add('holding');
    timer = setTimeout(() => { stop(); onDone(); }, ms);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener('contextmenu', e => e.preventDefault());
}

export function openGate(onPass) {
  const a = rand(6, 9);
  const b = rand(6, 9);
  const answer = a * b;
  const opts = shuffle([...new Set([answer, answer + a, answer - b, answer + 10])]);
  const modal = html(`<div class="modal-back">
    <div class="modal gate">
      <h2>Grown-ups only</h2>
      <p>What is ${a} × ${b}?</p>
      <div class="gate-opts">${opts.map(o => `<button class="gate-opt">${o}</button>`).join('')}</div>
      <button class="link-btn">Cancel</button>
    </div>
  </div>`);
  modal.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn && e.target !== modal) return;
    modal.remove();
    if (btn?.classList.contains('gate-opt') && Number(btn.textContent) === answer) onPass();
  });
  document.body.append(modal);
}

// Fly a copy of `el` to a screen point (the original is hidden), e.g. food into a mouth.
export async function flyTo(el, point, { duration = 500, scale = 0.5 } = {}) {
  const from = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  Object.assign(clone.style, {
    position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`,
    height: `${from.height}px`, margin: '0', zIndex: '40', pointerEvents: 'none', visibility: 'visible',
  });
  document.body.append(clone);
  el.style.visibility = 'hidden';
  const dx = point.x - (from.left + from.width / 2);
  const dy = point.y - (from.top + from.height / 2);
  const anim = clone.animate(
    [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
    { duration, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' },
  );
  // Don't rely on the animation alone: a paused/backgrounded page may never finish it.
  const timeout = new Promise(r => setTimeout(r, duration + 300));
  try { await Promise.race([anim.finished, timeout]); } catch { /* cancelled */ } finally { clone.remove(); }
}

// Highlight each element in turn while counting out loud.
export async function countAlong(ctx, els) {
  for (let i = 0; i < els.length; i++) {
    els[i].classList.add('counted');
    sfx.step(i);
    await ctx.wait(say(String(i + 1)));
  }
  els.forEach(e => e.classList.remove('counted'));
}

export const stars = level => '★'.repeat(level) + '☆'.repeat(3 - level);
