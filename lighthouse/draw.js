// Draws the bay into an element, for the TV (only what the navigator knows) and the keeper's phone (everything but
// the inside of fog banks). Tiles are redrawn as one string; the boat and floes are kept as elements so they glide
// between tiles while a sail animates. Markers (buoys, last turn's wake, crash marks) are redrawn each time.
import { BEAM, SONAR, DIRS, isFog } from './game.js';

export const SIGNAL_ICON = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️', wait: '✋', danger: '⚠️', good: '👍', unsure: '❓' };
export const SIGNAL_WORD = { N: 'go up', E: 'go right', S: 'go down', W: 'go left', wait: 'wait', danger: 'danger', good: 'good', unsure: 'not sure' };
export const MOVE_ICON = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️', wait: '⏸️' };
export const ARROW = { N: '↑', E: '→', S: '↓', W: '←' };
const CUR = { '>': '›', '<': '‹', '^': '˄', v: '˅' };
const CUR_DIR = { '>': 'e', '<': 'w', '^': 'n', v: 's' };
const MARK = { bump: '💥', reef: '💥', ice: '💥' };

const dirOf = (a, b) => Object.keys(DIRS).find(k => a.x + DIRS[k][0] === b.x && a.y + DIRS[k][1] === b.y) || null;

// g: {boat, seen, beam, ping, buoys, trail, marks, floeSeen}
// opts: {tv, keeper, size, drifters (the ones to draw; keeper's carry .next), beam (keeper's unsent aim), buoyAim}
export function drawSea(el, lv, g, opts = {}) {
  const box = el.parentElement;
  const size = opts.size || Math.max(16, Math.floor(Math.min((box.clientWidth - 8) / lv.w, (box.clientHeight - 8) / lv.h)));
  el.style.setProperty('--t', size + 'px');
  el.style.width = size * lv.w + 'px'; el.style.height = size * lv.h + 'px';
  if (!el.firstChild) el.innerHTML = '<div class="tiles"></div><div class="tokens"></div>';
  const beam = opts.beam !== undefined ? opts.beam : g.beam;
  const seen = (x, y) => (g.seen ? g.seen[y * lv.w + x] : 2);
  const lit = (x, y) => beam && Math.abs(x - beam.x) <= BEAM && Math.abs(y - beam.y) <= BEAM;
  const pinged = (x, y) => g.ping && Math.abs(x - g.ping.x) + Math.abs(y - g.ping.y) <= SONAR;

  let html = '';
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
    const c = lv.rows[y][x], fog = isFog(lv, x, y), sn = seen(x, y);
    let k, glyph = '';
    if (opts.tv && sn === 0) k = 'dark';
    else if (fog && sn < 2) k = 'mist';
    else if (c === '#' || c === 'r') k = c === 'r' ? 'rock reef' : 'rock';
    else if (c === 'L') { k = 'lamp'; glyph = '🗼'; }
    else if (c === 'H') { k = 'harbor'; glyph = '⚓'; }
    else if (CUR[c]) { k = 'cur ' + CUR_DIR[c]; glyph = CUR[c]; }
    else k = fog ? 'water misty' : 'water';
    const cls = `t ${k}${lit(x, y) ? ' lit' : ''}${pinged(x, y) ? ' sonar' : ''}`;
    html += `<div class="${cls}" data-x="${x}" data-y="${y}">${glyph}</div>`;
  }
  const tiles = el.firstChild;
  if (tiles.innerHTML !== html) tiles.innerHTML = html;

  const want = new Map();
  (g.trail || []).slice(0, -1).forEach((p, i) => want.set('t' + i, { ...p, cls: 'wake', glyph: '' }));
  (g.buoys || []).forEach((b, i) => want.set('b' + i, { ...b, cls: 'buoy', glyph: '🟠' }));
  if (opts.buoyAim) want.set('baim', { ...opts.buoyAim, cls: 'buoy aim', glyph: '🟠' });
  if (opts.tv) for (const [n, m] of Object.entries(g.floeSeen || {})) {
    if ((opts.drifters || []).some(d => String(d.n) === n)) continue; // in plain view: no marker needed
    want.set('m' + n, { ...m, cls: 'floe last', glyph: '🧊', badge: m.dir ? ARROW[m.dir] : '?' });
  }
  (opts.drifters || []).forEach((d, i) => {
    const dir = d.next ? dirOf(d, d.next) : g.floeSeen?.[d.n]?.dir;
    want.set('d' + (d.n ?? i), { x: d.x, y: d.y, cls: 'floe', glyph: '🧊', badge: dir ? ARROW[dir] : '' });
    if (d.next && dir) want.set('n' + (d.n ?? i), { ...d.next, cls: 'ghost', glyph: '' });
  });
  want.set('boat', { ...g.boat, cls: 'boat', glyph: '⛵' });
  (g.marks || []).forEach((m, i) => want.set('x' + i + m.event + m.x + m.y, { ...m, cls: 'mark ' + m.event, glyph: MARK[m.event] || '' }));

  const tokens = el.lastChild;
  for (const t of [...tokens.children]) if (!want.has(t.dataset.k)) t.remove();
  for (const [k, v] of want) {
    let t = tokens.querySelector(`[data-k="${k}"]`);
    const fresh = !t;
    if (fresh) { t = document.createElement('div'); t.dataset.k = k; tokens.appendChild(t); t.style.transition = 'none'; }
    t.className = 'tok ' + v.cls;
    t.innerHTML = v.glyph + (v.badge ? `<span class="badge">${v.badge}</span>` : '');
    t.style.transform = `translate(${v.x * size}px, ${v.y * size}px)`;
    if (fresh) { t.offsetWidth; t.style.transition = ''; } // appear in place rather than glide in from the corner
  }
}

// The TV's key to the map, and the keeper's (who never sees darkness or last-seen marks).
export function legendHtml(lv, { tv }) {
  const item = (sw, glyph, label) => `<span class="lg"><span class="sw t ${sw}">${glyph}</span>${label}</span>`;
  const has = chars => lv.rows.some(r => [...r].some(c => chars.includes(c)));
  return [
    item('rock', '', 'rock'),
    has('><^v') ? item('cur e', '›', 'current: pushes 1 more') : '',
    item('harbor', '⚓', tv ? 'harbour (once found)' : 'harbour'),
    lv.drifters.length ? `<span class="lg">🧊 floe${tv ? '' : ' <span class="ring"></span> next drift'}</span>` : '',
    lv.drifters.length && tv ? '<span class="lg"><span class="faded">🧊</span> last seen</span>' : '',
    has('fr') ? item('mist', '', 'fog: only sonar sees in') : '',
    lv.buoys ? '<span class="lg">🟠 buoy</span>' : '',
    tv ? item('water lit', '', 'lit by the lamp') : '',
    tv ? item('dark', '', 'not seen yet') : '',
  ].join('');
}
