import { register, go, currentScreen } from './router.js';
import { addPlayTime, GAMES } from './store.js';
import { stopSpeech } from './speech.js';
import { startScreen } from './screens/start.js';
import { setupScreen } from './screens/setup.js';
import { homeScreen } from './screens/home.js';
import { worldScreen } from './screens/world.js';
import { raceScreen } from './screens/race.js';
import { parkingScreen } from './screens/parking.js';
import { monsterScreen } from './screens/monster.js';
import { hoopScreen } from './screens/hoop.js';
import { traceScreen } from './screens/trace.js';
import { drumScreen } from './screens/drum.js';
import { blendScreen } from './screens/blend.js';
import { buildScreen } from './screens/build.js';
import { trainScreen } from './screens/train.js';
import { sortScreen } from './screens/sort.js';
import { sizeScreen } from './screens/size.js';
import { bandScreen } from './screens/band.js';
import { listenScreen } from './screens/listen.js';
import { rewardScreen } from './screens/reward.js';
import { garageScreen } from './screens/garage.js';
import { restScreen } from './screens/rest.js';
import { parentScreen } from './screens/parent.js';

register('start', startScreen);
register('setup', setupScreen);
register('home', homeScreen);
register('world', worldScreen);
register('race', raceScreen);
register('parking', ctx => parkingScreen(ctx, 'numbers'));
register('monster', monsterScreen);
register('hoop', hoopScreen);
register('letterpark', ctx => parkingScreen(ctx, 'letters'));
register('trace', traceScreen);
register('drum', drumScreen);
register('blend', blendScreen);
register('build', buildScreen);
register('train', trainScreen);
register('sort', sortScreen);
register('size', sizeScreen);
register('band', bandScreen);
register('listen', listenScreen);
register('reward', rewardScreen);
register('garage', garageScreen);
register('rest', restScreen);
register('parent', parentScreen);

go('start');

// Count minutes actually spent playing, for the grown-up progress page.
const PLAY_SCREENS = new Set([...GAMES, 'reward', 'garage']);
setInterval(() => {
  if (document.visibilityState === 'visible' && PLAY_SCREENS.has(currentScreen())) addPlayTime(1 / 3);
}, 20000);

document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech(); });
document.addEventListener('gesturestart', e => e.preventDefault());

// Offline support once it's hosted (skipped on localhost so edits show up right away).
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname) && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
