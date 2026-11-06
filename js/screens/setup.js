import { go } from '../router.js';
import { update } from '../store.js';
import { html } from '../util.js';

// First run only: a grown-up types the child's name so the game can cheer for them.
export function setupScreen(ctx) {
  const view = html(`<div class="setup">
    <div class="panel">
      <h1>Welcome, grown-up! 👋</h1>
      <p>What's your child's name? The game will cheer for them by name and start with the letters in it.</p>
      <input class="f-name" maxlength="20" placeholder="Child's name" autocomplete="off" autocapitalize="words">
      <button class="primary-btn">Start playing</button>
      <p class="hint">Settings and progress are behind the 🔒 button on the home screen. Press and hold it, then answer a grown-up question.</p>
    </div>
  </div>`);
  ctx.root.append(view);
  const input = view.querySelector('.f-name');
  const done = () => {
    update(s => { s.childName = input.value.trim(); s.setupDone = true; });
    go('home');
  };
  view.querySelector('.primary-btn').addEventListener('click', done);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
}
