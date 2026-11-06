// Custom artwork for every prototype, as inline SVG strings (no image files, no emoji). Each game defines its own
// sprites with defineArt() and draws them with art(); this file holds the shared UI icons and the house style.
//
// House style (keep every game's art in it so the four read as one family):
//   - viewBox 0 0 64 64 unless a sprite needs another; drawn to read at 24px on a phone and 120px on a TV.
//   - Chunky, rounded, storybook-flat: simple silhouettes, one base fill, one darker shade, one soft highlight
//     (white at ~.3 opacity, upper left). No gradients beyond that, no thin detail lines.
//   - Outline: stroke var(--art-line) at 3 (2.5 for small inner detail), round caps and joins.
//   - Colour only from tokens with fallbacks, e.g. fill="var(--art-gold, #ffcf5a)", so a game can retheme by setting
//     the tokens in its CSS. Shared tokens are below in ART_TOKENS; games add their own (--lh-*, --sp-*, ...).
//   - Sprites are static; motion comes from CSS on the wrapping element (classes in theme.css: .bob, .pulse, .spin).
//
//   defineArt({ boat: '<path …/>', wave: { vb: '0 0 64 32', svg: '…' } })
//   art('boat', { size: 48, cls: 'bob', label: 'Boat' })  ->  '<svg …>'

const sprites = {};

export function defineArt(set) { Object.assign(sprites, set); }

export function art(name, { size = 24, cls = '', label = '' } = {}) {
  const s = sprites[name];
  if (!s) return `<svg class="art art-missing ${cls}" width="${size}" height="${size}" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" fill="#f0f" /></svg>`;
  const { vb = '0 0 64 64', svg } = typeof s === 'string' ? { svg: s } : s;
  const [, , w, h] = vb.split(' ').map(Number);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="art ${cls}" viewBox="${vb}" width="${size * (w / h)}" height="${size}" ${a11y}>${svg}</svg>`;
}

export const hasArt = name => name in sprites;

// common strokes and fills, so sprite strings stay short
// An outline with its own width and colour. Use this rather than LINE plus another stroke attribute: an SVG element
// keeps only the first of two duplicate attributes.
export const line = (w = 3, colour = 'var(--art-line, #131a2c)') => `stroke="${colour}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
export const LINE = line();
export const SHINE = 'fill="#fff" opacity=".3"';

// A star polygon's points (for stars, sparkles, badges).
export function starPoints(cx, cy, outer, inner, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer, a = (rot + i * 180 / n) * Math.PI / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const arrow = rot => `<g transform="rotate(${rot} 32 32)"><path d="M32 10 L52 32 H40 V54 H24 V32 H12 Z" fill="var(--art-arrow, #e8eef9)" ${LINE}/><path d="M32 16 L44 29 H36 V34 H32 Z" ${SHINE}/></g>`;

// Shared UI icons.
defineArt({
  check: `<circle cx="32" cy="32" r="24" fill="var(--art-good, #5fd39a)" ${LINE}/><path d="M21 33 L29 41 L44 24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  cross: `<circle cx="32" cy="32" r="24" fill="var(--art-bad, #ff7a6b)" ${LINE}/><path d="M23 23 L41 41 M41 23 L23 41" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  question: `<circle cx="32" cy="32" r="24" fill="var(--art-blue, #5aa6ff)" ${LINE}/><path d="M25 26 a7.5 7.5 0 1 1 11 6.5 c-3 1.8 -4 3 -4 6.5" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/><circle cx="32" cy="46" r="3.4" fill="#fff"/>`,
  lock: `<path d="M22 30 V22 a10 10 0 0 1 20 0 V30" fill="none" ${line(6)}/><path d="M22 30 V22 a10 10 0 0 1 20 0 V30" fill="none" stroke="var(--art-steel, #c9d3e6)" stroke-width="3"/><rect x="14" y="28" width="36" height="28" rx="7" fill="var(--art-gold, #ffcf5a)" ${LINE}/><circle cx="32" cy="40" r="4" fill="var(--art-line, #131a2c)"/><path d="M32 42 V48" stroke="var(--art-line, #131a2c)" stroke-width="4" stroke-linecap="round"/><rect x="18" y="31" width="12" height="5" rx="2.5" ${SHINE}/>`,
  unlock: `<path d="M22 30 V22 a10 10 0 0 1 19 -4" fill="none" ${line(6)}/><path d="M22 30 V22 a10 10 0 0 1 19 -4" fill="none" stroke="var(--art-steel, #c9d3e6)" stroke-width="3"/><rect x="14" y="28" width="36" height="28" rx="7" fill="var(--art-good, #5fd39a)" ${LINE}/><circle cx="32" cy="40" r="4" fill="var(--art-line, #131a2c)"/><path d="M32 42 V48" stroke="var(--art-line, #131a2c)" stroke-width="4" stroke-linecap="round"/><rect x="18" y="31" width="12" height="5" rx="2.5" ${SHINE}/>`,
  star: `<polygon points="${starPoints(32, 34, 26, 11)}" fill="var(--art-gold, #ffcf5a)" ${LINE}/><polygon points="${starPoints(27, 27, 7, 3)}" ${SHINE}/>`,
  'star-empty': `<polygon points="${starPoints(32, 34, 26, 11)}" fill="var(--art-empty, rgba(255,255,255,.06))" ${line(3, 'var(--art-empty-line, #5a6d94)')}/>`,
  sparkle: `<polygon points="${starPoints(32, 32, 28, 7, 4, 0)}" fill="var(--art-gold, #ffe9a3)"/>`,
  heart: `<path d="M32 54 C12 41 7 30 12 21 C17 13 27 14 32 22 C37 14 47 13 52 21 C57 30 52 41 32 54Z" fill="var(--art-heart, #ff6b7d)" ${LINE}/><path d="M17 23 C19 19 23 18 26 20" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`,
  'heart-empty': `<path d="M32 54 C12 41 7 30 12 21 C17 13 27 14 32 22 C37 14 47 13 52 21 C57 30 52 41 32 54Z" fill="var(--art-empty, rgba(255,255,255,.06))" ${line(3, 'var(--art-empty-line, #5a6d94)')}/>`,
  partner: `<circle cx="23" cy="22" r="9" fill="var(--art-warm, #ffb36b)" ${LINE}/><path d="M8 52 a15 14 0 0 1 30 0 Z" fill="var(--art-warm, #ffb36b)" ${LINE}/><circle cx="42" cy="24" r="9" fill="var(--art-cool, #7cc6ff)" ${LINE}/><path d="M27 54 a15 14 0 0 1 30 0 Z" fill="var(--art-cool, #7cc6ff)" ${LINE}/>`,
  bulb: `<path d="M32 8 a17 17 0 0 1 10 31 c-2 2 -3 4 -3 7 H25 c0 -3 -1 -5 -3 -7 A17 17 0 0 1 32 8Z" fill="var(--art-gold, #ffe27a)" ${LINE}/><rect x="24" y="46" width="16" height="9" rx="3" fill="var(--art-steel, #c9d3e6)" ${LINE}/><path d="M24 18 a10 10 0 0 1 8 -4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`,
  sound: `<path d="M10 25 H20 L32 14 V50 L20 39 H10 Z" fill="var(--art-arrow, #e8eef9)" ${LINE}/><path d="M40 24 a11 11 0 0 1 0 16 M46 18 a19 19 0 0 1 0 28" fill="none" ${line(4, 'var(--art-arrow, #e8eef9)')}/>`,
  mute: `<path d="M10 25 H20 L32 14 V50 L20 39 H10 Z" fill="var(--art-arrow, #e8eef9)" ${LINE}/><path d="M40 25 L54 39 M54 25 L40 39" stroke="var(--art-bad, #ff7a6b)" stroke-width="5" stroke-linecap="round"/>`,
  'arrow-n': arrow(0), 'arrow-e': arrow(90), 'arrow-s': arrow(180), 'arrow-w': arrow(270),
  undo: `<path d="M20 22 H38 a13 13 0 0 1 0 26 H26" fill="none" ${line(9)}/><path d="M20 22 H38 a13 13 0 0 1 0 26 H26" fill="none" stroke="var(--art-arrow, #e8eef9)" stroke-width="4" stroke-linecap="round"/><path d="M8 22 L22 10 V34 Z" fill="var(--art-arrow, #e8eef9)" ${LINE}/>`,
  wait: `<rect x="17" y="14" width="11" height="36" rx="4" fill="var(--art-arrow, #e8eef9)" ${LINE}/><rect x="36" y="14" width="11" height="36" rx="4" fill="var(--art-arrow, #e8eef9)" ${LINE}/>`,
  dot: `<circle cx="32" cy="32" r="12" fill="currentColor"/>`,
});

// Little bursts of joy. Coordinates are page pixels; pass an element to burst from its centre.
export function burst(at, { count = 14, sprite = 'sparkle', spread = 120, size = 22 } = {}) {
  let x = at.x, y = at.y;
  if (at instanceof Element) { const r = at.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const a = Math.random() * Math.PI * 2, d = spread * (.45 + Math.random() * .55);
    p.className = 'fx-particle';
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--rot:${Math.random() * 360 - 180}deg;animation-delay:${Math.random() * 80}ms`;
    p.innerHTML = art(sprite, { size: size * (.6 + Math.random() * .7) });
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

// The shake is a transform animation, so it overrides an element's own transform while it runs: shake a wrapper
// or a child, not something positioned with transform.
export function shake(el, cls = 'fx-shake') {
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 500);
}

// Floating "+1" style text that rises from an element and fades.
export function popText(el, text, cls = '') {
  const r = el.getBoundingClientRect(), p = document.createElement('div');
  p.className = 'fx-pop ' + cls; p.textContent = text;
  p.style.left = r.left + r.width / 2 + 'px'; p.style.top = r.top + 'px';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1200);
}
