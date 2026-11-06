import { recordRound, awardSticker } from './store.js';
import { STICKERS } from './data.js';
import { go } from './router.js';

// rate = share of questions answered right on the first try (drives difficulty).
export function finishRound(game, rate) {
  const { levelUp } = recordRound(game, rate);
  const sticker = awardSticker(STICKERS);
  go('reward', { game, sticker, levelUp });
}
