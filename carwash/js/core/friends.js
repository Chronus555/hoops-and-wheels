// The animal friends who live in Sudsy Town: hippo, frog, lion, pig, elephant and
// bear. Original characters. Each has a head (also used as car drivers), a body,
// a voice pitch for the recorded clips, and a skin colour for hands.

function eyes(y, dx, white = false) {
  const w = white ? `<circle cx="${-dx}" cy="${y}" r="10" fill="#fff"/><circle cx="${dx}" cy="${y}" r="10" fill="#fff"/>` : '';
  return `${w}<g class="eyes-open"><circle cx="${-dx}" cy="${y}" r="6.5" fill="#222"/><circle cx="${dx}" cy="${y}" r="6.5" fill="#222"/>`
    + `<circle cx="${-dx + 2}" cy="${y - 2.5}" r="2.3" fill="#fff"/><circle cx="${dx + 2}" cy="${y - 2.5}" r="2.3" fill="#fff"/></g>`
    + `<g class="eyes-closed" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"><path d="M${-dx - 6},${y + 2} q6,-7 12,0"/><path d="M${dx - 6},${y + 2} q6,-7 12,0"/></g>`;
}
function mouth(y, w, x = 0) {
  return `<path class="m-smile" d="M${x - w},${y} q${w},${w * 0.9} ${2 * w},0" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>`
    + `<path class="m-open" d="M${x - w - 2},${y - 2} q${w + 2},${w * 1.7} ${2 * w + 4},0 z" fill="#8c2f39" stroke="#222" stroke-width="3" stroke-linejoin="round"/>`
    + `<ellipse class="m-o" cx="${x}" cy="${y + 3}" rx="5.5" ry="7" fill="#8c2f39" stroke="#222" stroke-width="3"/>`;
}
const cheeks = (y, dx, c = 'rgba(255,120,150,.45)') => `<ellipse cx="${-dx}" cy="${y}" rx="7" ry="4.5" fill="${c}"/><ellipse cx="${dx}" cy="${y}" rx="7" ry="4.5" fill="${c}"/>`;

export const FRIENDS = {
  hippo: {
    pitch: 0.9,
    skin: '#a294d1',
    svg: `<circle cx="-24" cy="-30" r="9" fill="#8a7bb8"/><circle cx="24" cy="-30" r="9" fill="#8a7bb8"/>
      <circle r="36" fill="#a294d1"/><ellipse cy="16" rx="30" ry="20" fill="#c0b5e8"/>
      <circle cx="-9" cy="8" r="3.2" fill="#6d5fa0"/><circle cx="9" cy="8" r="3.2" fill="#6d5fa0"/>
      ${eyes(-12, 13)}${mouth(23, 9)}`,
  },
  frog: {
    pitch: 1.18,
    skin: '#70d266',
    svg: `<circle cx="-17" cy="-26" r="15" fill="#5bbf55"/><circle cx="17" cy="-26" r="15" fill="#5bbf55"/>
      <ellipse rx="40" ry="31" cy="4" fill="#70d266"/>${cheeks(14, 24)}
      ${eyes(-26, 17, true)}${mouth(12, 14)}`,
  },
  lion: {
    pitch: 1.0,
    skin: '#ffd27a',
    svg: `${Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `<circle cx="${(Math.cos(a) * 33).toFixed(1)}" cy="${(Math.sin(a) * 33).toFixed(1)}" r="14" fill="#e07a2f"/>`;
    }).join('')}<circle r="34" fill="#f4a261"/><circle r="29" fill="#ffd27a"/>
      <circle cx="-20" cy="-24" r="7" fill="#ffd27a"/><circle cx="20" cy="-24" r="7" fill="#ffd27a"/>
      <path d="M-6,4 h12 l-6,7 z" fill="#8a4b2a"/>${cheeks(10, 18)}
      ${eyes(-7, 12)}${mouth(16, 7)}`,
  },
  pig: {
    pitch: 1.12,
    skin: '#ffb3c8',
    svg: `<path d="M-30,-14 L-26,-42 L-8,-30 Z" fill="#ff8fb1"/><path d="M30,-14 L26,-42 L8,-30 Z" fill="#ff8fb1"/>
      <circle r="36" fill="#ffb3c8"/><ellipse cy="8" rx="15" ry="11" fill="#ff8fb1"/>
      <ellipse cx="-5" cy="8" rx="2.6" ry="4" fill="#d9577f"/><ellipse cx="5" cy="8" rx="2.6" ry="4" fill="#d9577f"/>
      ${eyes(-12, 14)}${mouth(25, 7)}`,
  },
  elephant: {
    pitch: 0.95,
    skin: '#9cc0e4',
    svg: `<ellipse cx="-36" cy="0" rx="20" ry="26" fill="#7da2c9"/><ellipse cx="36" cy="0" rx="20" ry="26" fill="#7da2c9"/>
      <circle r="34" fill="#9cc0e4"/>
      <path d="M-7,2 C-8,22 -2,36 14,37 C23,37 23,28 16,28 C9,28 7,20 7,2 Z" fill="#8bb2da"/>
      ${eyes(-10, 13)}${mouth(19, 6, -18)}`,
  },
  bear: {
    pitch: 0.92,
    skin: '#a9714b',
    svg: `<circle cx="-26" cy="-26" r="12" fill="#8d5a3b"/><circle cx="26" cy="-26" r="12" fill="#8d5a3b"/>
      <circle cx="-26" cy="-26" r="6" fill="#e0b48f"/><circle cx="26" cy="-26" r="6" fill="#e0b48f"/>
      <circle r="36" fill="#a9714b"/><ellipse cy="12" rx="18" ry="14" fill="#ecc8a3"/>
      <ellipse cy="4" rx="7" ry="5" fill="#3b2416"/>
      ${eyes(-10, 13)}${mouth(18, 7)}`,
  },
};
export const FRIEND_KINDS = Object.keys(FRIENDS);

// ---- bodies ------------------------------------------------------------------------
// A friend stands with its feet at (0,0) and is about 230 units tall. Arms are their
// own groups so CSS can wave them (.wave, .cheer, .dance on the wrapper).

export const OUTFITS = ['#ef476f', '#f8961e', '#ffd166', '#06d6a0', '#4895ef', '#9b5de5', '#ff8fc7'];

export function friendSVG(kind, { outfit = '#4895ef', number = null, pants = '#3d405b' } = {}) {
  const f = FRIENDS[kind] || FRIENDS.bear;
  const arm = side => {
    const x = side < 0 ? -40 : 28;
    return `<g class="arm arm-${side < 0 ? 'l' : 'r'}"><rect x="${x}" y="-128" width="12" height="62" rx="6" fill="${outfit}"/>`
      + `<circle cx="${x + 6}" cy="-62" r="10" fill="${f.skin}"/></g>`;
  };
  const num = number == null ? '' : `<text x="0" y="-78" text-anchor="middle" font-size="34" font-weight="900" font-family="Arial Rounded MT Bold, Avenir Next, system-ui, sans-serif" fill="#fff">${number}</text>`;
  return `<g class="friend-body">
    <rect x="-22" y="-60" width="18" height="56" rx="8" fill="${pants}"/><rect x="4" y="-60" width="18" height="56" rx="8" fill="${pants}"/>
    <ellipse cx="-14" cy="-3" rx="15" ry="8" fill="#2b2d42"/><ellipse cx="14" cy="-3" rx="15" ry="8" fill="#2b2d42"/>
    ${arm(-1)}${arm(1)}
    <rect x="-32" y="-134" width="64" height="84" rx="26" fill="${outfit}"/>${num}
    <g transform="translate(0,-170)"><g class="head driver">${f.svg}</g></g>
  </g>`;
}

// A friend on screen: a small wrapper element that can change mood, wave, cheer,
// dance and talk.
export class Friend {
  constructor(kind, { outfit, number, width = 120, parent = null } = {}) {
    this.kind = kind;
    this.el = document.createElement('div');
    this.el.className = 'friend';
    this.el.style.width = `${width}px`;
    this.el.style.height = `${(width * 240) / 130}px`;
    this.dress({ outfit, number });
    if (parent) parent.appendChild(this.el);
  }

  // Changes clothes (and the number on the shirt).
  dress({ outfit, number = null } = {}) {
    this.outfit = outfit;
    this.number = number;
    this.el.innerHTML = `<svg viewBox="-65 -238 130 240" overflow="visible">${friendSVG(this.kind, { outfit, number })}</svg>`;
  }

  mood(m, ms = 1400) {
    this.el.dataset.mood = m;
    clearTimeout(this.moodTimer);
    if (ms) this.moodTimer = setTimeout(() => { this.el.dataset.mood = ''; }, ms);
  }

  // One-off animation: 'wave', 'cheer', 'hop', 'spin'. 'dance' can also be left on.
  play(cls, ms = 1200) {
    this.el.classList.remove(cls);
    void this.el.offsetWidth;
    this.el.classList.add(cls);
    clearTimeout(this[`t_${cls}`]);
    if (ms) this[`t_${cls}`] = setTimeout(() => this.el.classList.remove(cls), ms);
  }
}
