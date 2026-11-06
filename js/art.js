// Inline SVG drawings, so the app works offline with no image files.

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = s => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function wheel(cx) {
  return `<g class="wheel" style="transform-origin:${cx}px 52px">
    <circle cx="${cx}" cy="52" r="11" fill="#222"/>
    <circle cx="${cx}" cy="52" r="5" fill="#ddd"/>
    <path d="M${cx - 8} 52 H${cx + 8} M${cx} 44 V60" stroke="#999" stroke-width="2"/>
  </g>`;
}

export function carSVG(color, { label = '' } = {}) {
  const d = shade(color, -70);
  const badge = label === ''
    ? ''
    : `<circle cx="54" cy="40" r="10" fill="#fff" stroke="${d}" stroke-width="1.5"/>
       <text x="54" y="44.5" text-anchor="middle" font-size="${String(label).length > 1 ? 11 : 13}" font-weight="900" fill="#1d3557">${label}</text>`;
  return `<svg class="car" viewBox="0 0 120 70" aria-hidden="true">
    <ellipse cx="60" cy="64" rx="48" ry="4" fill="rgba(0,0,0,.2)"/>
    <path d="M8 46 Q6 32 20 30 L36 28 L48 13 Q52 9 60 9 L82 9 Q90 9 94 15 L103 28 Q114 30 114 40 L114 47 Q114 51 110 51 L12 51 Q8 51 8 46Z"
      fill="${color}" stroke="${d}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M51 15 Q53 13 57 13 L70 13 L70 28 L41 28 Z" fill="#d6f1ff" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M74 13 L84 13 Q88 13 90 17 L97 28 L74 28 Z" fill="#d6f1ff" stroke="${d}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="106" y="34" width="7" height="6" rx="2" fill="#ffe066"/>
    <rect x="8" y="35" width="5" height="6" rx="2" fill="#ff8787"/>
    ${badge}
    ${wheel(32)}${wheel(92)}
  </svg>`;
}

export function ballSVG() {
  return `<svg class="ball" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#f4842b" stroke="#7a3b0b" stroke-width="4"/>
    <path d="M4 50 H96 M50 4 V96 M20 17 Q42 50 20 83 M80 17 Q58 50 80 83" stroke="#7a3b0b" stroke-width="4" fill="none"/>
  </svg>`;
}

export const NET_SVG = `<svg class="net" viewBox="0 0 100 60" aria-hidden="true">
  <path d="M3 2 L18 58 M27 2 L34 58 M50 2 V58 M73 2 L66 58 M97 2 L82 58 M9 20 H91 M14 40 H86 M18 58 H82"
    stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;

export function monsterSVG(color = '#8e5cf7') {
  const d = shade(color, -80);
  const belly = shade(color, 70);
  return `<svg class="monster" viewBox="0 0 200 210" aria-hidden="true">
    <ellipse cx="62" cy="198" rx="26" ry="11" fill="${d}"/>
    <ellipse cx="138" cy="198" rx="26" ry="11" fill="${d}"/>
    <g class="m-body">
      <path d="M58 42 L46 6 L80 30Z M142 42 L154 6 L120 30Z" fill="#ffd166" stroke="#c99a2e" stroke-width="3" stroke-linejoin="round"/>
      <path d="M100 22 C160 22 186 70 186 120 C186 170 150 196 100 196 C50 196 14 170 14 120 C14 70 40 22 100 22Z"
        fill="${color}" stroke="${d}" stroke-width="4"/>
      <ellipse cx="100" cy="152" rx="54" ry="38" fill="${belly}"/>
      <circle cx="72" cy="76" r="21" fill="#fff" stroke="${d}" stroke-width="3"/>
      <circle cx="128" cy="76" r="21" fill="#fff" stroke="${d}" stroke-width="3"/>
      <circle class="pupil" cx="75" cy="81" r="9" fill="#1d3557"/>
      <circle class="pupil" cx="125" cy="81" r="9" fill="#1d3557"/>
      <path class="mouth-closed" d="M68 112 Q100 140 132 112" fill="none" stroke="${d}" stroke-width="6" stroke-linecap="round"/>
      <g class="mouth-open">
        <ellipse cx="100" cy="122" rx="38" ry="27" fill="#3b0d2c" stroke="${d}" stroke-width="4"/>
        <ellipse cx="100" cy="137" rx="20" ry="9" fill="#ff6b8b"/>
        <path d="M78 97 L86 110 L94 97Z M106 97 L114 110 L122 97Z" fill="#fff"/>
      </g>
    </g>
  </svg>`;
}

export function engineSVG(color = '#e63946') {
  const d = shade(color, -70);
  const wheel = (cx, r) => `<g class="wheel" style="transform-origin:${cx}px 98px">
    <circle cx="${cx}" cy="98" r="${r}" fill="#222"/><circle cx="${cx}" cy="98" r="${r * 0.4}" fill="#ddd"/>
    <path d="M${cx - r + 3} 98 H${cx + r - 3} M${cx} ${98 - r + 3} V${98 + r - 3}" stroke="#999" stroke-width="2"/></g>`;
  return `<svg class="engine" viewBox="0 0 160 118" aria-hidden="true">
    <rect x="62" y="46" width="78" height="44" rx="10" fill="${color}" stroke="${d}" stroke-width="4"/>
    <rect x="100" y="14" width="18" height="34" rx="3" fill="#2b2d42"/>
    <rect x="10" y="22" width="56" height="68" rx="8" fill="${color}" stroke="${d}" stroke-width="4"/>
    <rect x="20" y="33" width="36" height="25" rx="4" fill="#d6f1ff" stroke="${d}" stroke-width="3"/>
    <rect x="2" y="12" width="72" height="12" rx="4" fill="${d}"/>
    <path d="M140 84 L158 106 L140 106Z" fill="#6c757d"/>
    <circle cx="146" cy="60" r="6" fill="#ffe066"/>
    ${wheel(36, 17)}${wheel(88, 13)}${wheel(120, 13)}
  </svg>`;
}

// One shape drawn inside the box (x, y, w, h), as an SVG element string.
export function shapeMarkup(type, x, y, w, h, attrs = '') {
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (type) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) / 2}" ${attrs}/>`;
    case 'oval':
      return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" ${attrs}/>`;
    case 'square': {
      const s = Math.min(w, h);
      return `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="${s * 0.06}" ${attrs}/>`;
    }
    case 'rectangle':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.08}" ${attrs}/>`;
    case 'triangle':
      return `<polygon points="${cx},${y} ${x + w},${y + h} ${x},${y + h}" ${attrs}/>`;
    case 'diamond':
      return `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" ${attrs}/>`;
    case 'star': {
      const R = Math.min(w, h) / 2;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? R * 0.45 : R;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a) + R * 0.06).toFixed(1)}`;
      });
      return `<polygon points="${pts.join(' ')}" ${attrs}/>`;
    }
    case 'heart':
      return `<path transform="translate(${x} ${y}) scale(${w / 100} ${h / 100})" vector-effect="non-scaling-stroke"
        d="M50 92 C12 64 2 40 18 20 C32 4 50 12 50 28 C50 12 68 4 82 20 C98 40 88 64 50 92Z" ${attrs}/>`;
    default:
      return '';
  }
}

export function shapeSVG(type, color, w = 100, h = 100) {
  const attrs = `fill="${color}" stroke="${shade(color, -70)}" stroke-width="4" stroke-linejoin="round"`;
  return `<svg class="shape" viewBox="-4 -4 ${w + 8} ${h + 8}" aria-hidden="true">${shapeMarkup(type, 0, 0, w, h, attrs)}</svg>`;
}

// A finished blueprint, for the home-screen card.
export function blueprintSVG(bp) {
  return `<svg class="shape" viewBox="40 0 320 360" aria-hidden="true">${bp.slots.map(s =>
    shapeMarkup(s.fancy || s.shape, s.x, s.y, s.w, s.h, `fill="${s.color}" stroke="${shade(s.color, -70)}" stroke-width="4" stroke-linejoin="round"`)).join('')}</svg>`;
}

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export function dieHTML(n) {
  return Array.from({ length: 9 }, (_, i) => `<span class="pip${PIPS[n].includes(i) ? ' on' : ''}"></span>`).join('');
}
