import { go } from '../router.js';
import { childName } from '../store.js';
import { sessionOver } from '../session.js';
import { say } from '../speech.js';
import { sfx } from '../sound.js';
import { topBar, confetti } from '../ui.js';
import { CHALLENGES, PRAISE, worldOf } from '../data.js';
import { html, pick } from '../util.js';

// Every finished round earns a sticker for the garage. Sometimes there's also a
// real-world challenge to do with a grown-up.
export function rewardScreen(ctx) {
  const { game, sticker, levelUp } = ctx.params;
  const over = sessionOver();
  const challenge = !over && Math.random() < 0.4 ? pick(CHALLENGES) : null;

  topBar(ctx, { repeat: false });
  const view = html(`<div class="stage reward">
    <div class="sticker-burst"><span class="rays"></span><span class="big">${sticker ? sticker.pic : '⭐'}</span></div>
    ${challenge ? `<div class="challenge"><span class="challenge-icon">${challenge.pic}</span>
      <span><b>Grown-up challenge:</b> ${challenge.text}</span></div>` : ''}
    <div class="reward-actions">
      ${over ? '' : '<button class="big-btn again primary" aria-label="Play again">🔁</button>'}
      ${over ? '' : '<button class="big-btn to-world" aria-label="Other games">⬅️</button>'}
      <button class="big-btn to-garage" aria-label="My garage">🧰</button>
    </div>
  </div>`);
  ctx.root.append(view);
  view.querySelector('.again')?.addEventListener('click', () => { sfx.tap(); go(game); });
  view.querySelector('.to-world')?.addEventListener('click', () => { sfx.tap(); go('world', { world: worldOf(game) }); });
  view.querySelector('.to-garage').addEventListener('click', () => { sfx.tap(); go('garage'); });

  ctx.run(async () => {
    sfx.cheer();
    confetti(ctx.root);
    await ctx.wait(say(sticker
      ? `${pick(PRAISE)}, ${childName()}! You won a ${sticker.name} sticker for your garage!`
      : `${pick(PRAISE)}! You have every sticker, so here's a gold star!`));
    if (levelUp) await ctx.wait(say("You're getting so good! Next time will be a little trickier."));
    if (challenge) await ctx.wait(say(`Grown-up challenge! ${challenge.say}`));
    if (over) {
      await ctx.wait(1500);
      go('rest');
    }
  });
}
