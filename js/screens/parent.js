import { go } from '../router.js';
import { GAMES, getState, update, itemStats, skillLevel, setSkillLevel, resetProgress, todayKey } from '../store.js';
import { isResting, endRest } from '../session.js';
import { rankedVoices, voiceQuality, say } from '../speech.js';
import { ALPHABET, WORDS, RHYMES, CHALLENGES, LEVEL_INFO, GAME_NAMES, ALL_SHAPES } from '../data.js';
import { html, esc, range } from '../util.js';

function cls(key) {
  const { seen, correct } = itemStats(key);
  if (!seen) return 'unseen';
  if (seen < 3) return 'learning';
  const acc = correct / seen;
  return acc >= 0.8 ? 'good' : acc >= 0.5 ? 'ok' : 'hard';
}

function grid(title, entries) {
  return `<div class="grid-block"><h3>${title}</h3><div class="mastery">${entries.map(([label, key]) => {
    const { seen, correct } = itemStats(key);
    return `<span class="m ${cls(key)}" title="${seen ? `${correct}/${seen} first try` : 'not tried yet'}">${label}</span>`;
  }).join('')}</div></div>`;
}

function lastDays(n) {
  const days = getState().days;
  return range(0, n - 1).map(i => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = todayKey(d);
    const v = days[k] || { minutes: 0, rounds: 0 };
    const label = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return `<tr><td>${label}</td><td>${Math.round(v.minutes)} min</td><td>${v.rounds} round${v.rounds === 1 ? '' : 's'}</td></tr>`;
  }).join('');
}

export function parentScreen(ctx) {
  const s = getState();
  const voices = rankedVoices();
  const QUALITY = { best: '★★★ natural', good: '★★ enhanced', basic: 'basic', silly: 'silly voice' };
  const view = html(`<div class="parent">
    <header class="parent-head">
      <h1>Grown-up corner</h1>
      <button class="primary-btn done">Done</button>
    </header>

    <section>
      <h2>Settings</h2>
      <label>Child's name <input class="f-name" maxlength="20" value="${esc(s.childName)}" autocomplete="off"></label>
      <label>Play session length
        <select class="f-session">${[5, 10, 15, 20, 30, 0].map(m =>
          `<option value="${m}"${m === s.settings.sessionMinutes ? ' selected' : ''}>${m ? `${m} minutes` : 'No limit'}</option>`).join('')}
        </select>
      </label>
      <p class="note">When time is up, the current round finishes and the garage "closes" for an hour. You can reopen it here.</p>
      <label>Voice speed
        <select class="f-rate">${[[0.75, 'Slow'], [0.9, 'Normal'], [1.05, 'Quick']].map(([v, t]) =>
          `<option value="${v}"${v === s.settings.voiceRate ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
      </label>
      <label>Voice
        <span class="row">
          <select class="f-voice"><option value="">Automatic (best available)</option>${voices.map(v =>
            `<option value="${esc(v.name)}"${v.name === s.settings.voiceName ? ' selected' : ''}>${esc(v.name)} (${v.lang}) · ${QUALITY[voiceQuality(v)]}</option>`).join('')}
          </select>
          <button class="secondary-btn test-voice">Test</button>
        </span>
      </label>
      ${voices.some(v => voiceQuality(v) === 'best') ? '' : `<p class="note voice-tip"><b>Want a more natural voice?</b> On iPad: Settings → Accessibility → Spoken Content → Voices → English, then download a voice marked <b>Premium</b> (Ava, Zoe or Evan sound great) or <b>Enhanced</b>. Then reopen this app and it's picked automatically. On a Windows PC, open the game in Microsoft Edge, which has natural-sounding voices built in.</p>`}
      ${isResting() ? '<button class="primary-btn unrest">Reopen the garage now</button>' : ''}
    </section>

    <section>
      <h2>Progress</h2>
      <table class="days">${lastDays(7)}</table>
      <div class="levels">${GAMES.map(g => `<div class="level-row">
        <div><b>${GAME_NAMES[g]}</b><p class="note">${LEVEL_INFO[g][skillLevel(g) - 1]}</p></div>
        <select data-game="${g}">${[1, 2, 3].map(l =>
          `<option value="${l}"${l === skillLevel(g) ? ' selected' : ''}>Level ${l}</option>`).join('')}</select>
      </div>`).join('')}</div>
      <p class="note">Levels adjust on their own: two strong rounds in a row move up, two rough rounds move down.</p>
      ${grid('Numbers', range(0, 20).map(n => [n, `num:${n}`]))}
      ${grid('Capital letters', ALPHABET.map(L => [L, `letter:${L}`]))}
      ${grid('Lowercase letters', ALPHABET.map(L => [L.toLowerCase(), `lower:${L.toLowerCase()}`]))}
      ${grid('Beginning sounds', WORDS.map(w => [w.L, `sound:${w.L}`]))}
      ${grid('Rhymes', RHYMES.map(p => [`${p[0].word}/${p[1].word}`, `rhyme:${p[0].word}`]))}
      ${grid('Counting out a set (feed the monster N)', range(1, 10).map(n => [n, `set:${n}`]))}
      ${grid('More / less and story problems', [['more', 'cmp:more'], ['less', 'cmp:less'], ['adding', 'story:add'], ['taking away', 'story:sub']])}
      ${grid('Shapes', ALL_SHAPES.map(t => [t, `shape:${t}`]))}
      ${grid('Patterns', ['AB', 'AAB', 'ABB', 'ABC', 'AABB'].map(t => [t, `pattern:${t}`]))}
      ${grid('Tracing letters and numbers', [...ALPHABET, ...'0123456789'].map(c => [c, `trace:${c}`]))}
      ${grid('Beats in a word (syllables)', [1, 2, 3, 4].map(n => [`${n} beat${n > 1 ? 's' : ''}`, `syll:${n}`]))}
      ${grid('Blending word parts', [['cup·cake', 'blend:compound'], ['2 parts', 'blend:2'], ['3 parts', 'blend:3'], ['4 parts', 'blend:4']])}
      ${grid('Sorting', [['by color', 'sort:color'], ['by shape', 'sort:shape'], ['by kind', 'sort:kind']])}
      ${grid('Sizes', [['biggest', 'size:biggest'], ['smallest', 'size:smallest'], ['lining up', 'size:order']])}
      ${grid('Memory (notes remembered)', range(2, 7).map(n => [`${n} notes`, `band:${n}`]))}
      ${grid('Following directions', [1, 2, 3].map(n => [`${n} step${n > 1 ? 's' : ''}`, `listen:${n}`]))}
      <div class="legend">
        <span class="m unseen">·</span> not tried
        <span class="m learning">·</span> just started
        <span class="m hard">·</span> needs practice
        <span class="m ok">·</span> getting there
        <span class="m good">·</span> knows it
      </div>
    </section>

    <section>
      <h2>Play together, off screen</h2>
      <p class="note">These pop up after some rounds. Doing them together helps the learning stick.</p>
      <ul class="challenges">${CHALLENGES.map(c => `<li>${c.pic} ${c.text}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>Tips for iPad</h2>
      <ul class="tips">
        <li><b>Add to Home Screen:</b> in Safari tap Share, then "Add to Home Screen". It opens full screen like a regular app.</li>
        <li><b>Guided Access:</b> Settings → Accessibility → Guided Access. Triple-click the top (or Home) button while playing to lock the iPad to this app.</li>
        <li><b>Sound:</b> make sure the iPad isn't on silent and the volume is up.</li>
      </ul>
    </section>

    <section class="danger">
      <button class="secondary-btn reset">Reset all progress and stickers</button>
    </section>
  </div>`);
  ctx.root.append(view);

  const q = sel => view.querySelector(sel);
  q('.done').addEventListener('click', () => go('home'));
  q('.f-name').addEventListener('input', e => update(st => { st.childName = e.target.value.trim(); }));
  q('.f-session').addEventListener('change', e => update(st => { st.settings.sessionMinutes = Number(e.target.value); }));
  q('.f-rate').addEventListener('change', e => update(st => { st.settings.voiceRate = Number(e.target.value); }));
  q('.f-voice').addEventListener('change', e => update(st => { st.settings.voiceName = e.target.value; }));
  q('.test-voice').addEventListener('click', () => say('Ready, set, go! Let us count to five. One, two, three, four, five!'));
  q('.unrest')?.addEventListener('click', () => { endRest(); go('home'); });
  view.querySelectorAll('select[data-game]').forEach(el =>
    el.addEventListener('change', () => { setSkillLevel(el.dataset.game, Number(el.value)); go('parent'); }));
  q('.reset').addEventListener('click', () => {
    if (confirm('Reset all progress, levels and stickers? The name and settings stay.')) {
      resetProgress();
      go('parent');
    }
  });
}
