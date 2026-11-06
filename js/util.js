export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleExcept(pool, n, exclude = []) {
  return shuffle(pool.filter(x => !exclude.includes(x))).slice(0, n);
}

// Waits for a Web Animation, but never longer than its duration (paused pages may never finish it).
export function finished(anim) {
  const ms = (anim.effect?.getTiming().duration || 0) + 300;
  return Promise.race([anim.finished.catch(() => {}), sleep(ms)]);
}

export function html(str) {
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  return t.content.firstElementChild;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function waitClick(el) {
  return new Promise(res => el.addEventListener('click', res, { once: true }));
}

// Resolves with the index of whichever element is tapped first.
export function waitAny(els) {
  return new Promise(res => {
    const handlers = els.map((el, i) => {
      const h = () => {
        handlers.forEach(([e, fn]) => e.removeEventListener('click', fn));
        res(i);
      };
      el.addEventListener('click', h);
      return [el, h];
    });
  });
}
