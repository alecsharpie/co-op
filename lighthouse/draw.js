// Draws the bay into an element, for the TV (only what the navigator knows) and the keeper's phone (everything but
// the inside of fog banks). Layers, bottom up: the sea (one animated background under every tile), the tiles
// (redrawn as one string), the lamp beam (a ray from the lighthouse that sweeps to its target), and the tokens:
// boat, floes, buoys, wake and crash marks, kept as elements so they glide between tiles while a sail animates.
import { BEAM, SONAR, DIRS, isFog } from './game.js';
import { art } from '../shared/art.js';
import './art.js';

export const SIGNAL_ART = { N: 'arrow-n', E: 'arrow-e', S: 'arrow-s', W: 'arrow-w', wait: 'wait', danger: 'danger', good: 'check', unsure: 'question' };
export const SIGNAL_WORD = { N: 'go up', E: 'go right', S: 'go down', W: 'go left', wait: 'wait', danger: 'danger', good: 'good', unsure: 'not sure' };
export const MOVE_ART = { N: 'arrow-n', E: 'arrow-e', S: 'arrow-s', W: 'arrow-w', wait: 'wait' };
export const ARROW = { N: '↑', E: '→', S: '↓', W: '←', wait: 'wait' };
export const sigArt = (s, size = 40) => art(SIGNAL_ART[s], { size, label: SIGNAL_WORD[s] });
export const moveArt = (m, size = 40) => art(MOVE_ART[m], { size, label: m === 'wait' ? 'wait' : SIGNAL_WORD[m] });

const CUR_DIR = { '>': 'e', '<': 'w', '^': 'n', v: 's' };
const MARK = { bump: 'crash', reef: 'crash', ice: 'shatter' };
const ROCKS = ['rock', 'rock-b', 'rock-c'];

const dirOf = (a, b) => Object.keys(DIRS).find(k => a.x + DIRS[k][0] === b.x && a.y + DIRS[k][1] === b.y) || null;

// g: {boat, seen, beam, ping, buoys, trail, marks, floeSeen, turn}
// opts: {tv, size, drifters (the ones to draw; keeper's carry .next), beam (keeper's unsent aim), buoyAim}
export function drawSea(el, lv, g, opts = {}) {
  const box = el.parentElement;
  const size = opts.size || Math.max(16, Math.floor(Math.min((box.clientWidth - 8) / lv.w, (box.clientHeight - 8) / lv.h)));
  el.style.setProperty('--t', size + 'px');
  el.style.width = size * lv.w + 'px'; el.style.height = size * lv.h + 'px';
  if (!el.firstChild) el.innerHTML = '<div class="sea"></div><div class="tiles"></div><div class="beam"><div class="pool"></div><div class="ray"></div></div><div class="tokens"></div>';
  const [, tiles, beamEl, tokens] = el.children;
  const beam = opts.beam !== undefined ? opts.beam : g.beam;
  const seen = (x, y) => (g.seen ? g.seen[y * lv.w + x] : 2);
  const lit = (x, y) => beam && Math.abs(x - beam.x) <= BEAM && Math.abs(y - beam.y) <= BEAM;
  const pinged = (x, y) => g.ping && Math.abs(x - g.ping.x) + Math.abs(y - g.ping.y) <= SONAR;
  const tileArt = name => art(name, { size });
  let lamp = null;

  let html = '';
  for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
    const c = lv.rows[y][x], fog = isFog(lv, x, y), sn = seen(x, y);
    let k, inner = '';
    if (c === 'L') lamp = { x, y };
    if (opts.tv && sn === 0) k = 'dark';
    else if (fog && sn < 2) { k = 'mist'; inner = tileArt('fog'); }
    else if (c === 'r') { k = 'reef'; inner = tileArt('reef'); }
    else if (c === '#') { k = 'rock'; inner = tileArt(ROCKS[(x * 7 + y * 13) % 3]); }
    else if (c === 'L') { k = 'lamp'; inner = tileArt('lighthouse'); }
    else if (c === 'H') { k = 'harbor'; inner = tileArt('harbor'); }
    else if (CUR_DIR[c]) { k = 'cur ' + CUR_DIR[c]; inner = `<span class="flow">${tileArt('current')}</span>`; }
    else k = fog ? 'water misty' : 'water';
    const cls = `t ${k}${lit(x, y) ? ' lit' : ''}${pinged(x, y) ? ' sonar' : ''}`;
    html += `<div class="${cls}" data-x="${x}" data-y="${y}">${inner}</div>`;
  }
  if (tiles.innerHTML !== html) tiles.innerHTML = html;

  // The lamp: a ray from the lighthouse that swings to the lit patch (TV only; the keeper's phone just highlights).
  if (opts.tv && lamp) {
    const [pool, ray] = beamEl.children;
    if (beam) {
      const ox = (lamp.x + .5) * size, oy = (lamp.y + .3) * size, tx = (beam.x + .5) * size, ty = (beam.y + .5) * size;
      let ang = Math.atan2(ty - oy, tx - ox) * 180 / Math.PI;
      if (el._ang != null) while (ang - el._ang > 180) ang -= 360;
      if (el._ang != null) while (el._ang - ang > 180) ang += 360;
      el._ang = ang;
      ray.style.cssText = `left:${ox}px;top:${oy}px;width:${Math.hypot(tx - ox, ty - oy) + size}px;height:${size * 3}px;transform:translateY(-50%) rotate(${ang}deg);opacity:1`;
      pool.style.cssText = `left:${(beam.x - 1) * size}px;top:${(beam.y - 1) * size}px;width:${size * 3}px;height:${size * 3}px;opacity:1`;
    } else { ray.style.opacity = 0; pool.style.opacity = 0; }
  }

  // which way the boat faces: the way it last moved sideways
  if (el._prev && g.boat.x !== el._prev.x) el._face = g.boat.x < el._prev.x ? 'w' : 'e';
  el._prev = { ...g.boat };

  const want = new Map();
  (g.trail || []).slice(0, -1).forEach((p, i) => want.set('t' + i, { ...p, cls: 'wake', inner: '' }));
  (g.buoys || []).forEach((b, i) => want.set('b' + i, { ...b, cls: 'buoy', inner: `<span class="bob">${tileArt('buoy')}</span>` }));
  if (opts.buoyAim) want.set('baim', { ...opts.buoyAim, cls: 'buoy aim', inner: tileArt('buoy') });
  if (opts.tv) for (const [n, m] of Object.entries(g.floeSeen || {})) {
    if ((opts.drifters || []).some(d => String(d.n) === n)) continue; // in plain view: no marker needed
    want.set('m' + n, { ...m, cls: 'floe last', inner: tileArt('floe'), badge: m.dir ? ARROW[m.dir] : '?' });
  }
  (opts.drifters || []).forEach((d, i) => {
    const dir = d.next ? dirOf(d, d.next) : g.floeSeen?.[d.n]?.dir;
    want.set('d' + (d.n ?? i), { x: d.x, y: d.y, cls: 'floe', inner: `<span class="bob slow">${tileArt('floe')}</span>`, badge: dir ? ARROW[dir] : '' });
    if (d.next && dir) want.set('n' + (d.n ?? i), { ...d.next, cls: 'ghost', inner: '' });
  });
  want.set('boat', { ...g.boat, cls: 'boat' + (el._face === 'w' ? ' face-w' : ''), inner: `<span class="bob">${tileArt('boat')}</span>` });
  (g.marks || []).forEach((m, i) => want.set('x' + i + m.event + m.x + m.y, { ...m, cls: 'mark ' + m.event, inner: art(MARK[m.event] || 'crash', { size: size * .8 }) }));
  if (opts.tv && g.ping) want.set(`ping${g.turn}`, { ...g.ping, cls: 'ripple', inner: '<i></i><i></i><i></i>' });

  for (const t of [...tokens.children]) if (!want.has(t.dataset.k)) t.remove();
  for (const [k, v] of want) {
    let t = tokens.querySelector(`[data-k="${k}"]`);
    const fresh = !t;
    if (fresh) { t = document.createElement('div'); t.dataset.k = k; tokens.appendChild(t); t.style.transition = 'none'; }
    const cls = 'tok ' + v.cls, inner = v.inner + (v.badge ? `<span class="badge">${v.badge}</span>` : '');
    if (t.className !== cls) t.className = cls;
    if (t._inner !== inner) { t.innerHTML = inner; t._inner = inner; } // leave running animations alone
    t.style.transform = `translate(${v.x * size}px, ${v.y * size}px)`;
    if (fresh) { t.offsetWidth; t.style.transition = ''; } // appear in place rather than glide in from the corner
  }
}

// Where a tile is on the page, for bursts and floating text.
export function tilePoint(el, p) {
  const r = el.getBoundingClientRect(), size = parseFloat(el.style.getPropertyValue('--t'));
  return { x: r.left + (p.x + .5) * size, y: r.top + (p.y + .5) * size };
}

// The TV's key to the map, and the keeper's (who never sees darkness or last-seen marks).
export function legendHtml(lv, { tv }) {
  const icon = (name, cls = '') => `<span class="sw ${cls}">${art(name, { size: 22 })}</span>`;
  const swatch = cls => `<span class="sw t ${cls}"></span>`;
  const item = (sw, label) => `<span class="lg">${sw}${label}</span>`;
  const has = chars => lv.rows.some(r => [...r].some(c => chars.includes(c)));
  return [
    item(icon('rock'), 'rock'),
    has('><^v') ? item(icon('current'), 'current: pushes 1 more') : '',
    item(icon('harbor'), tv ? 'harbour (once found)' : 'harbour'),
    lv.drifters.length ? item(icon('floe'), `floe${tv ? '' : ' <span class="ring"></span> next drift'}`) : '',
    lv.drifters.length && tv ? item(icon('floe', 'faded'), 'last seen') : '',
    has('fr') ? item(icon('fog'), 'fog: only sonar sees in') : '',
    lv.buoys ? item(icon('buoy'), 'buoy') : '',
    tv ? item(swatch('water lit'), 'lit by the lamp') : '',
    tv ? item(swatch('dark'), 'not seen yet') : '',
  ].join('');
}
