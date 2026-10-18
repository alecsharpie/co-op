// Draws the bay into an element, for the TV (fogged) and the keeper's phone (everything). Tiles are redrawn as one
// string; the boat and floes are kept as elements so they glide between tiles while a sail animates.
import { BEAM } from './game.js';

export const SIGNAL_ICON = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️', wait: '✋', danger: '⚠️', good: '👍', unsure: '❓' };
export const MOVE_ICON = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️', wait: '⏸️' };
const CUR = { '>': '›', '<': '‹', '^': '˄', v: '˅' };
const CUR_DIR = { '>': 'e', '<': 'w', '^': 'n', v: 's' };

// opts: {tv, drifters (the ones to show), beam (overrides g.beam: the keeper's unsent aim), size (tile px)}
export function drawSea(el, lv, g, opts = {}) {
  const box = el.parentElement;
  const size = opts.size || Math.max(16, Math.floor(Math.min((box.clientWidth - 32) / lv.w, (box.clientHeight - 32) / lv.h)));
  el.style.setProperty('--t', size + 'px');
  el.style.width = size * lv.w + 'px'; el.style.height = size * lv.h + 'px';
  if (!el.firstChild) el.innerHTML = '<div class="tiles"></div><div class="tokens"></div>';
  const beam = opts.beam !== undefined ? opts.beam : g.beam;
  const lit = (x, y) => beam && Math.abs(x - beam.x) <= BEAM && Math.abs(y - beam.y) <= BEAM;

  let html = '';
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
    const c = lv.rows[y][x], fog = opts.tv && !g.seen[y * lv.w + x];
    const k = fog ? 'fog' : c === '#' ? 'rock' : c === 'L' ? 'lamp' : c === 'H' ? 'harbor' : CUR[c] ? 'cur ' + CUR_DIR[c] : 'water';
    const glyph = fog ? '' : c === 'L' ? '🗼' : c === 'H' ? '⚓' : CUR[c] || '';
    html += `<div class="t ${k}${lit(x, y) ? ' lit' : ''}" data-x="${x}" data-y="${y}">${glyph}</div>`;
  }
  const tiles = el.firstChild;
  if (tiles.innerHTML !== html) tiles.innerHTML = html;

  const tokens = el.lastChild, want = new Map();
  want.set('boat', { ...g.boat, cls: 'boat', glyph: '⛵' });
  (opts.drifters || []).forEach(d => {
    want.set('d' + (d.n ?? want.size), { x: d.x, y: d.y, cls: 'floe', glyph: '🧊' });
    if (d.next && (d.next.x !== d.x || d.next.y !== d.y)) want.set('n' + want.size, { ...d.next, cls: 'ghost', glyph: '' });
  });
  for (const t of [...tokens.children]) if (!want.has(t.dataset.k)) t.remove();
  for (const [k, v] of want) {
    let t = tokens.querySelector(`[data-k="${k}"]`);
    const fresh = !t;
    if (fresh) { t = document.createElement('div'); t.dataset.k = k; tokens.appendChild(t); t.style.transition = 'none'; }
    t.className = 'tok ' + v.cls; t.textContent = v.glyph;
    t.style.transform = `translate(${v.x * size}px, ${v.y * size}px)`;
    if (fresh) { t.offsetWidth; t.style.transition = ''; } // appear in place rather than glide in from the corner
  }
}
