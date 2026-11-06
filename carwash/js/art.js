// All drawings are SVG built from code, so there are no image files to load.
// Cars live in a 600 x 320 box, facing right, with the ground near y = 302.

export const COLORS = {
  red: '#ef476f',
  orange: '#f8961e',
  yellow: '#ffd166',
  green: '#06d6a0',
  blue: '#4895ef',
  purple: '#9b5de5',
  pink: '#ff8fc7',
  white: '#f1f3f5',
  rainbow: 'rainbow',
};
export const COLOR_NAMES = Object.keys(COLORS);
export const RAINBOW = ['#ef476f', '#f8961e', '#ffd166', '#06d6a0', '#4895ef', '#9b5de5'];

// ---- vehicles ------------------------------------------------------------------

const light = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="15" fill="#fff6bf" stroke="rgba(0,0,0,.15)" stroke-width="3"/>`;
const tail = (x, y) => `<rect x="${x - 6}" y="${y - 12}" width="12" height="24" rx="5" fill="#ff5d5d"/>`;
const seam = d => `<path d="${d}" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="4" stroke-linecap="round"/>`;
const handle = (x, y) => `<rect x="${x}" y="${y}" width="32" height="9" rx="4.5" fill="rgba(0,0,0,.22)"/>`;

export const VEHICLES = {
  bubble: {
    body: 'M70,250 C52,250 46,205 66,180 C88,154 145,142 172,140 C192,82 242,48 300,48 C362,48 408,84 428,140 C478,142 532,152 548,188 C558,214 554,250 530,250 Z',
    windows: ['M206,140 C220,98 255,74 300,74 C349,74 383,100 396,140 Z'],
    seats: [{ x: 300, y: 118, s: 1 }],
    wheels: [{ x: 160, y: 250, r: 52 }, { x: 440, y: 250, r: 52 }],
    roof: { x: 300, y: 50 },
    fuel: { x: 118, y: 178 },
    details: light(542, 192) + tail(62, 196) + seam('M300,142 V246') + handle(318, 160),
  },
  truck: {
    body: 'M36,256 L36,156 Q36,148 44,148 L326,148 L340,74 Q344,56 362,56 L446,56 Q466,56 474,74 L498,138 L548,146 Q568,150 568,172 L568,240 Q568,256 552,256 Z',
    windows: ['M360,78 L446,78 L468,138 L352,138 Z'],
    seats: [{ x: 410, y: 116, s: 0.95 }],
    wheels: [{ x: 150, y: 256, r: 54 }, { x: 474, y: 256, r: 54 }],
    roof: { x: 404, y: 58 },
    fuel: { x: 290, y: 196 },
    details: light(562, 176) + tail(42, 172) + seam('M40,172 H322') + seam('M336,150 L332,246') + handle(350, 162),
  },
  racer: {
    body: 'M40,252 C26,226 36,190 84,184 L224,172 C250,128 296,110 342,114 C372,117 394,134 408,154 C484,160 548,184 576,216 C592,240 574,254 548,254 Z M42,196 L54,122 L146,122 L150,138 L76,138 L68,196 Z',
    windows: ['M262,168 C276,140 302,128 332,129 C354,130 368,143 380,160 Z'],
    seats: [{ x: 320, y: 158, s: 0.82 }],
    wheels: [{ x: 140, y: 252, r: 50 }, { x: 472, y: 252, r: 50 }],
    roof: { x: 318, y: 116 },
    fuel: { x: 250, y: 206 },
    details: light(566, 214) + tail(44, 214) + seam('M230,176 C300,168 380,166 420,172'),
  },
  bus: {
    body: 'M28,262 L28,74 Q28,40 62,40 L520,40 Q556,40 566,76 L578,236 Q580,262 554,262 Z',
    windows: [
      'M66,66 h80 v78 h-80 Z', 'M166,66 h80 v78 h-80 Z', 'M266,66 h80 v78 h-80 Z', 'M366,66 h80 v78 h-80 Z',
      'M470,66 L536,66 Q550,66 552,80 L558,150 L470,150 Z',
    ],
    seats: [
      { x: 106, y: 116, s: 0.78 }, { x: 206, y: 116, s: 0.78 }, { x: 306, y: 116, s: 0.78 }, { x: 406, y: 116, s: 0.78 },
      { x: 512, y: 116, s: 0.88 },
    ],
    wheels: [{ x: 130, y: 262, r: 50 }, { x: 466, y: 262, r: 50 }],
    roof: { x: 300, y: 42 },
    fuel: { x: 300, y: 214 },
    details: light(570, 212) + tail(34, 206) + '<rect x="28" y="166" width="550" height="14" fill="rgba(255,255,255,.35)"/>' + seam('M460,160 V250'),
  },
};
export const VEHICLE_TYPES = Object.keys(VEHICLES);

// ---- drivers (original animal friends) --------------------------------------------

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

export const DRIVERS = {
  hippo: {
    pitch: 0.9,
    svg: `<circle cx="-24" cy="-30" r="9" fill="#8a7bb8"/><circle cx="24" cy="-30" r="9" fill="#8a7bb8"/>
      <circle r="36" fill="#a294d1"/><ellipse cy="16" rx="30" ry="20" fill="#c0b5e8"/>
      <circle cx="-9" cy="8" r="3.2" fill="#6d5fa0"/><circle cx="9" cy="8" r="3.2" fill="#6d5fa0"/>
      ${eyes(-12, 13)}${mouth(23, 9)}`,
  },
  frog: {
    pitch: 1.18,
    svg: `<circle cx="-17" cy="-26" r="15" fill="#5bbf55"/><circle cx="17" cy="-26" r="15" fill="#5bbf55"/>
      <ellipse rx="40" ry="31" cy="4" fill="#70d266"/>${cheeks(14, 24)}
      ${eyes(-26, 17, true)}${mouth(12, 14)}`,
  },
  lion: {
    pitch: 1.0,
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
    svg: `<path d="M-30,-14 L-26,-42 L-8,-30 Z" fill="#ff8fb1"/><path d="M30,-14 L26,-42 L8,-30 Z" fill="#ff8fb1"/>
      <circle r="36" fill="#ffb3c8"/><ellipse cy="8" rx="15" ry="11" fill="#ff8fb1"/>
      <ellipse cx="-5" cy="8" rx="2.6" ry="4" fill="#d9577f"/><ellipse cx="5" cy="8" rx="2.6" ry="4" fill="#d9577f"/>
      ${eyes(-12, 14)}${mouth(25, 7)}`,
  },
  elephant: {
    pitch: 0.95,
    svg: `<ellipse cx="-36" cy="0" rx="20" ry="26" fill="#7da2c9"/><ellipse cx="36" cy="0" rx="20" ry="26" fill="#7da2c9"/>
      <circle r="34" fill="#9cc0e4"/>
      <path d="M-7,2 C-8,22 -2,36 14,37 C23,37 23,28 16,28 C9,28 7,20 7,2 Z" fill="#8bb2da"/>
      ${eyes(-10, 13)}${mouth(19, 6, -18)}`,
  },
  bear: {
    pitch: 0.92,
    svg: `<circle cx="-26" cy="-26" r="12" fill="#8d5a3b"/><circle cx="26" cy="-26" r="12" fill="#8d5a3b"/>
      <circle cx="-26" cy="-26" r="6" fill="#e0b48f"/><circle cx="26" cy="-26" r="6" fill="#e0b48f"/>
      <circle r="36" fill="#a9714b"/><ellipse cy="12" rx="18" ry="14" fill="#ecc8a3"/>
      <ellipse cy="4" rx="7" ry="5" fill="#3b2416"/>
      ${eyes(-10, 13)}${mouth(18, 7)}`,
  },
};
export const DRIVER_KINDS = Object.keys(DRIVERS);

// ---- wheels ------------------------------------------------------------------------
// Drawn around (0,0) at the vehicle's base radius r. `size` makes some wheels bigger.

const bolts = (n, rr, br, c) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return `<circle cx="${(Math.cos(a) * rr).toFixed(1)}" cy="${(Math.sin(a) * rr).toFixed(1)}" r="${br}" fill="${c}"/>`;
}).join('');
const tire = r => `<circle r="${r}" fill="#2f3640"/><circle r="${r - 5}" fill="none" stroke="#3d4652" stroke-width="3"/>`;

export const WHEELS = {
  classic: { size: 1, draw: r => `${tire(r)}<circle r="${r * 0.58}" fill="#dfe6ee"/><circle r="${r * 0.2}" fill="#9aa5b1"/>${bolts(5, r * 0.38, r * 0.06, '#9aa5b1')}` },
  monster: {
    size: 1.4,
    draw: r => `${Array.from({ length: 14 }, (_, i) => `<rect x="${-r * 0.13}" y="${-r - 4}" width="${r * 0.26}" height="${r * 0.3}" rx="3" fill="#2f3640" transform="rotate(${(i * 360) / 14})"/>`).join('')}
      <circle r="${r - 2}" fill="#2f3640"/><circle r="${r * 0.46}" fill="#ffd166"/><circle r="${r * 0.16}" fill="#e09f3e"/>${bolts(6, r * 0.31, r * 0.05, '#e09f3e')}`,
  },
  basketball: {
    size: 1.05,
    draw: r => `<circle r="${r}" fill="#2f3640"/><circle r="${r * 0.84}" fill="#f28c28"/>
      <g fill="none" stroke="#3a2412" stroke-width="${r * 0.06}"><path d="M0,${-r * 0.84} V${r * 0.84} M${-r * 0.84},0 H${r * 0.84}"/>
      <path d="M${-r * 0.6},${-r * 0.58} Q${-r * 0.2},0 ${-r * 0.6},${r * 0.58}"/><path d="M${r * 0.6},${-r * 0.58} Q${r * 0.2},0 ${r * 0.6},${r * 0.58}"/></g>`,
  },
  flower: {
    size: 1,
    draw: r => `${tire(r)}${Array.from({ length: 6 }, (_, i) => `<ellipse cx="0" cy="${-r * 0.36}" rx="${r * 0.18}" ry="${r * 0.26}" fill="#ff8fab" transform="rotate(${i * 60})"/>`).join('')}<circle r="${r * 0.2}" fill="#ffd166"/>`,
  },
  star: {
    size: 1,
    draw: r => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.25 : r * 0.58;
        return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
      }).join(' ');
      return `${tire(r)}<circle r="${r * 0.66}" fill="#4361ee"/><polygon points="${pts}" fill="#ffd166"/>`;
    },
  },
  donut: {
    size: 1.05,
    draw: r => `<circle r="${r}" fill="#d9a066"/><circle r="${r * 0.86}" fill="#ff8fc7"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        const d = r * (i % 2 ? 0.48 : 0.68);
        return `<rect x="-5" y="-2" width="10" height="4" rx="2" fill="${RAINBOW[i % 6]}" transform="translate(${(Math.cos(a) * d).toFixed(1)},${(Math.sin(a) * d).toFixed(1)}) rotate(${i * 47})"/>`;
      }).join('')}<circle r="${r * 0.26}" fill="#5a3a22"/>`,
  },
  square: {
    size: 1,
    square: true,
    draw: r => `<rect x="${-r * 0.92}" y="${-r * 0.92}" width="${r * 1.84}" height="${r * 1.84}" rx="${r * 0.18}" fill="#2f3640"/>
      <rect x="${-r * 0.5}" y="${-r * 0.5}" width="${r}" height="${r}" rx="${r * 0.08}" fill="#dfe6ee"/><circle r="${r * 0.15}" fill="#9aa5b1"/>`,
  },
  tiny: { size: 0.6, draw: r => `${tire(r)}<circle r="${r * 0.55}" fill="#06d6a0"/><circle r="${r * 0.2}" fill="#fff"/>` },
};
export const WHEEL_TYPES = Object.keys(WHEELS);

// ---- roof toppers (drawn with the bottom centre at 0,0) --------------------------

export const TOPPERS = {
  siren: `<rect x="-34" y="-14" width="68" height="16" rx="6" fill="#495057"/>
    <path class="siren-l" d="M-30,-14 V-40 A30,26 0 0 1 0,-62 V-14 Z" fill="#ef233c"/>
    <path class="siren-r" d="M30,-14 V-40 A30,26 0 0 0 0,-62 V-14 Z" fill="#4361ee"/>
    <path d="M-18,-42 q4,-10 12,-12" stroke="rgba(255,255,255,.7)" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  hoop: `<rect x="-6" y="-120" width="12" height="122" fill="#adb5bd"/>
    <rect x="-56" y="-190" width="112" height="78" rx="6" fill="#fff" stroke="#adb5bd" stroke-width="5"/>
    <rect x="-22" y="-166" width="44" height="34" fill="none" stroke="#ef476f" stroke-width="5"/>
    <path d="M-30,-128 L-22,-92 H22 L30,-128" fill="none" stroke="#fff" stroke-width="3"/>
    <path d="M-18,-128 L-12,-92 M0,-128 V-92 M18,-128 L12,-92 M-26,-112 H26" stroke="#fff" stroke-width="2.5"/>
    <ellipse cy="-128" rx="32" ry="7" fill="none" stroke="#f77f00" stroke-width="6"/>`,
  crown: `<path d="M-60,0 L-66,-70 L-34,-36 L0,-86 L34,-36 L66,-70 L60,0 Z" fill="#ffd166" stroke="#e09f3e" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="0" cy="-22" r="10" fill="#ef476f"/><circle cx="-36" cy="-16" r="7" fill="#4895ef"/><circle cx="36" cy="-16" r="7" fill="#06d6a0"/>
    <circle cx="-66" cy="-72" r="7" fill="#fff"/><circle cx="0" cy="-88" r="8" fill="#fff"/><circle cx="66" cy="-72" r="7" fill="#fff"/>`,
  propeller: `<path d="M-46,0 A46,40 0 0 1 46,0 Z" fill="#ef476f"/><path d="M-46,0 A46,40 0 0 1 -16,-37 L-16,0 Z" fill="#ffd166"/><path d="M16,-37 A46,40 0 0 1 46,0 L16,0 Z" fill="#4895ef"/>
    <rect x="-4" y="-66" width="8" height="28" fill="#495057"/>
    <g class="prop" transform="translate(0,-66)"><g class="prop-spin"><ellipse cx="-38" rx="38" ry="9" fill="#06d6a0"/><ellipse cx="38" rx="38" ry="9" fill="#9b5de5"/><circle r="7" fill="#495057"/></g></g>`,
  rocket: `<g transform="translate(0,-34)">
    <g class="flame"><path d="M-92,0 L-150,-18 L-128,0 L-150,18 Z" fill="#f8961e"/><path d="M-92,0 L-128,-9 L-116,0 L-128,9 Z" fill="#ffd166"/></g>
    <rect x="-92" y="-26" width="150" height="52" rx="26" fill="#e9ecef" stroke="#adb5bd" stroke-width="4"/>
    <path d="M56,-26 Q104,0 56,26 Z" fill="#ef476f"/><circle cx="14" r="12" fill="#4895ef" stroke="#adb5bd" stroke-width="4"/>
    <path d="M-80,-26 L-104,-48 L-60,-26 Z M-80,26 L-104,48 L-60,26 Z" fill="#ef476f"/></g>
    <rect x="-30" y="-10" width="60" height="12" rx="4" fill="#495057"/>`,
  cone: `<path d="M-30,-60 L0,0 L30,-60 Z" fill="#e9b872" stroke="#c9934a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-22,-50 L10,-12 M-8,-58 L18,-26 M20,-50 L-10,-12" stroke="#c9934a" stroke-width="3"/>
    <circle cx="-14" cy="-74" r="24" fill="#ff8fc7"/><circle cx="16" cy="-72" r="24" fill="#fff3d6"/><circle cx="0" cy="-100" r="24" fill="#8c5a3c"/>
    <circle cx="4" cy="-128" r="9" fill="#ef233c"/><path d="M4,-136 q6,-12 14,-14" stroke="#2d6a4f" stroke-width="3" fill="none"/>`,
};
export const TOPPER_TYPES = Object.keys(TOPPERS);

// ---- stickers (drawn around 0,0, about 70 across) ------------------------------------

function starPts(R, r, n = 5) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const d = i % 2 ? r : R;
    return `${(Math.cos(a) * d).toFixed(1)},${(Math.sin(a) * d).toFixed(1)}`;
  }).join(' ');
}
const ring = 'stroke="#fff" stroke-width="5" stroke-linejoin="round"';
const numSticker = n => `<circle r="32" fill="#fff" stroke="#222" stroke-width="4"/><text y="15" text-anchor="middle" font-size="44" font-weight="900" font-family="Arial Rounded MT Bold, Avenir Next, system-ui, sans-serif" fill="#222">${n}</text>`;

export const STICKERS = {
  star: { say: 'Star!', svg: `<polygon points="${starPts(36, 15)}" fill="#ffd166" ${ring}/>` },
  heart: { say: 'Heart!', svg: `<path d="M0,30 C-40,4 -36,-28 -14,-28 C-4,-28 0,-18 0,-14 C0,-18 4,-28 14,-28 C36,-28 40,4 0,30 Z" fill="#ef476f" ${ring}/>` },
  circle: { say: 'Circle!', svg: `<circle r="30" fill="#4895ef" ${ring}/>` },
  square: { say: 'Square!', svg: `<rect x="-27" y="-27" width="54" height="54" rx="4" fill="#06d6a0" ${ring}/>` },
  triangle: { say: 'Triangle!', svg: `<path d="M0,-32 L32,26 H-32 Z" fill="#f8961e" ${ring}/>` },
  bolt: { say: 'Lightning bolt!', svg: `<path d="M8,-34 L-22,4 H-2 L-10,34 L22,-6 H2 Z" fill="#ffd166" ${ring}/>` },
  fire: { say: 'Fire!', svg: `<path d="M0,32 C-26,32 -30,6 -18,-10 C-14,0 -8,2 -6,0 C-12,-16 -2,-30 6,-36 C6,-20 28,-12 24,8 C22,24 12,32 0,32 Z" fill="#f8961e" ${ring}/><path d="M0,28 C-10,28 -12,16 -6,8 C-2,14 4,12 4,4 C12,10 12,28 0,28 Z" fill="#ffd166"/>` },
  ball: {
    say: 'Basketball!',
    svg: `<circle r="31" fill="#f28c28" ${ring}/><g fill="none" stroke="#3a2412" stroke-width="2.5"><path d="M0,-30 V30 M-30,0 H30"/><path d="M-21,-21 Q-8,0 -21,21"/><path d="M21,-21 Q8,0 21,21"/></g>`,
  },
  smile: {
    say: 'Smiley face!',
    svg: `<circle r="31" fill="#ffd166" ${ring}/><circle cx="-10" cy="-8" r="4" fill="#222"/><circle cx="10" cy="-8" r="4" fill="#222"/><path d="M-14,6 Q0,22 14,6" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>`,
  },
  flower: {
    say: 'Flower!',
    svg: `${Array.from({ length: 6 }, (_, i) => `<circle cx="0" cy="-18" r="14" fill="#c77dff" transform="rotate(${i * 60})"/>`).join('')}<circle r="12" fill="#ffd166"/>`,
  },
  stripes: { say: 'Racing stripes!', big: true, svg: '<rect x="-110" y="-22" width="220" height="14" rx="7" fill="#fff"/><rect x="-110" y="2" width="220" height="14" rx="7" fill="#fff"/><rect x="-110" y="-6" width="220" height="4" fill="#222" opacity=".25"/>' },
  flames: {
    say: 'Flames!',
    big: true,
    svg: '<path d="M-110,20 C-60,22 -20,18 20,10 C0,0 30,-6 50,-14 C34,-18 60,-26 80,-34 C70,-20 90,-12 110,-10 C80,8 40,30 -110,30 Z" fill="#f8961e"/><path d="M-110,24 C-50,24 0,20 40,14 C30,8 50,4 66,-2 C50,10 20,24 -110,27 Z" fill="#ffd166"/>',
  },
  checkers: {
    say: 'Checkers!',
    big: true,
    svg: Array.from({ length: 24 }, (_, i) => {
      const c = i % 8;
      const r = Math.floor(i / 8);
      return `<rect x="${-80 + c * 20}" y="${-30 + r * 20}" width="20" height="20" fill="${(c + r) % 2 ? '#222' : '#fff'}"/>`;
    }).join(''),
  },
  rainbow: {
    say: 'Rainbow!',
    big: true,
    svg: RAINBOW.map((c, i) => `<path d="M${-100 + i * 10},30 A${100 - i * 10},${70 - i * 8} 0 0 1 ${100 - i * 10},30" fill="none" stroke="${c}" stroke-width="10"/>`).join(''),
  },
};
const NUMBER_WORDS = ['Zero!', 'One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
for (let n = 0; n <= 9; n++) STICKERS[`n${n}`] = { say: NUMBER_WORDS[n], svg: numSticker(n) };
export { NUMBER_WORDS };
export const SHEET_STICKERS = ['star', 'heart', 'circle', 'square', 'triangle', 'bolt', 'fire', 'ball', 'smile', 'flower'];
export const BIG_STICKERS = ['stripes', 'flames', 'checkers', 'rainbow'];

// ---- tools -----------------------------------------------------------------------

export const TOOLS = {
  sponge: `<svg viewBox="-60 -45 120 90"><rect x="-54" y="-36" width="108" height="72" rx="22" fill="#ffd166" stroke="#e09f3e" stroke-width="5"/>
    <circle cx="-26" cy="-12" r="6" fill="#e9b949"/><circle cx="4" cy="8" r="8" fill="#e9b949"/><circle cx="28" cy="-14" r="5" fill="#e9b949"/><circle cx="-14" cy="16" r="4" fill="#e9b949"/><circle cx="30" cy="14" r="4" fill="#e9b949"/></svg>`,
  soap: `<svg viewBox="-50 -70 100 140"><rect x="-8" y="-66" width="16" height="22" fill="#adb5bd"/><path d="M-8,-66 h36 v10 h-36z" fill="#adb5bd"/>
    <rect x="-34" y="-46" width="68" height="110" rx="18" fill="#4cc9f0" stroke="#3a9dc0" stroke-width="5"/>
    <circle cx="-8" cy="4" r="14" fill="#fff" opacity=".85"/><circle cx="12" cy="24" r="9" fill="#fff" opacity=".85"/><circle cx="10" cy="-14" r="6" fill="#fff" opacity=".85"/></svg>`,
  hose: `<svg viewBox="-55 -70 110 140"><path d="M-40,-60 C-40,-20 -30,0 -14,10" stroke="#2d6a4f" stroke-width="14" fill="none" stroke-linecap="round"/>
    <rect x="-24" y="-6" width="40" height="50" rx="10" fill="#38b000" transform="rotate(-20)"/>
    <rect x="-6" y="26" width="26" height="40" rx="6" fill="#ffd166" transform="rotate(-20)"/><rect x="-1" y="58" width="16" height="10" rx="3" fill="#495057" transform="rotate(-20)"/></svg>`,
  towel: `<svg viewBox="-60 -45 120 90"><rect x="-54" y="-32" width="108" height="64" rx="10" fill="#ff8fab" stroke="#e5698a" stroke-width="5"/>
    <path d="M-54,-10 H54 M-54,10 H54" stroke="#ffc2d1" stroke-width="6"/></svg>`,
  mud: `<svg viewBox="-55 -55 110 110"><path d="M-40,-20 L-32,46 H32 L40,-20 Z" fill="#8d99ae" stroke="#5c677d" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-40,-20 C-30,-34 -14,-26 -6,-32 C4,-42 20,-30 28,-34 C36,-36 44,-26 40,-20 Z" fill="#7a5230"/><circle cx="-18" cy="-10" r="7" fill="#7a5230"/><circle cx="20" cy="-6" r="5" fill="#7a5230"/>
    <path d="M-40,-20 C-44,-46 44,-46 40,-20" fill="none" stroke="#5c677d" stroke-width="4"/></svg>`,
  can: c => `<svg viewBox="-40 -70 80 140"><rect x="-10" y="-66" width="20" height="16" rx="4" fill="#495057"/><rect x="-26" y="-52" width="52" height="20" rx="8" fill="${c}"/>
    <rect x="-28" y="-36" width="56" height="102" rx="12" fill="#dee2e6" stroke="#adb5bd" stroke-width="4"/><rect x="-28" y="-6" width="56" height="34" fill="${c}"/></svg>`,
  bucket: c => `<svg viewBox="-50 -55 100 110"><path d="M-38,-26 L-30,44 H30 L38,-26 Z" fill="#dee2e6" stroke="#adb5bd" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cy="-26" rx="38" ry="9" fill="${c}" stroke="#adb5bd" stroke-width="4"/><path d="M-20,-24 v22 a6,6 0 0 0 12,0 v-22 Z M10,-24 v12 a5,5 0 0 0 10,0 v-12 Z" fill="${c}"/>
    <path d="M-38,-26 C-40,-56 40,-56 38,-26" fill="none" stroke="#868e96" stroke-width="4"/></svg>`,
  pump: `<svg viewBox="-50 -80 100 160"><rect x="-6" y="-74" width="12" height="40" fill="#adb5bd"/><rect x="-36" y="-80" width="72" height="12" rx="6" fill="#ef476f"/>
    <rect x="-20" y="-40" width="40" height="100" rx="10" fill="#4895ef"/><rect x="-36" y="60" width="72" height="14" rx="5" fill="#495057"/>
    <path d="M20,40 C50,40 50,70 40,76" stroke="#222" stroke-width="6" fill="none"/></svg>`,
  lift: `<svg viewBox="-60 -60 120 120"><rect x="-52" y="-52" width="104" height="104" rx="22" fill="#ffd166" stroke="#e09f3e" stroke-width="5"/>
    <path d="M-22,-6 L0,-34 L22,-6 Z" fill="#2b2d42"/><path d="M-22,8 L0,36 L22,8 Z" fill="#2b2d42"/></svg>`,
  wrench: `<svg viewBox="-60 -60 120 120"><path d="M-40,40 L14,-14" stroke="#adb5bd" stroke-width="16" stroke-linecap="round"/>
    <path d="M30,-50 A26,26 0 1 0 50,-30 L32,-26 L26,-32 Z" fill="#adb5bd" stroke="#868e96" stroke-width="4"/></svg>`,
  camera: `<svg viewBox="-60 -50 120 100"><rect x="-54" y="-30" width="108" height="72" rx="14" fill="#495057"/><rect x="-24" y="-42" width="48" height="16" rx="5" fill="#495057"/>
    <circle cy="6" r="25" fill="#212529" stroke="#adb5bd" stroke-width="5"/><circle cy="6" r="12" fill="#4895ef"/><circle cx="-5" cy="1" r="4" fill="#fff"/><rect x="30" y="-22" width="14" height="9" rx="3" fill="#ffd166"/></svg>`,
  go: `<svg viewBox="-40 -80 80 160"><rect x="-32" y="-76" width="64" height="152" rx="18" fill="#343a40"/>
    <circle class="tl-r" cy="-44" r="18" fill="#5c1a1a"/><circle class="tl-y" cy="0" r="18" fill="#5c4a1a"/><circle class="tl-g" cy="44" r="18" fill="#2fbf71"/></svg>`,
};
