// Lighthouse & Navigator: the rules, as pure functions over plain JSON (no DOM), so the board can save the state
// as-is and node --test can play it. The board is the only place they run.
//
// Each turn the keeper (who sees the whole bay on her phone) points the lamp at a 3x3 patch, which lights it on the
// TV for the navigator, and in signal mode sends up to 3 symbols. Then the navigator (who sees only what is lit or
// right beside the boat) queues up to 3 moves and sails. Rocks dent the hull; currents push the boat one tile after
// it lands on them; ice floes drift along fixed paths once the boat has moved. Every turn burns a measure of lamp
// oil. Reach the harbour before the hull breaks or the lamp goes out.

export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const SIGNALS = ['N', 'E', 'S', 'W', 'wait', 'danger', 'good', 'unsure'];
export const MOVES_PER_TURN = 3, SIGNALS_PER_TURN = 3, BEAM = 1, SIGHT = 1;
export const PHASES = [{ name: 'light', seats: ['keeper'] }, { name: 'steer', seats: ['navigator'] }];

const CURRENTS = { '>': 'E', '<': 'W', '^': 'N', v: 'S' };

// map characters: . water  # rock  L the lighthouse (a rock)  H harbour  B boat start  > < ^ v current
export function parseLevel(def) {
  const rows = def.map, h = rows.length, w = rows[0].length;
  let start = null, harbor = null;
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'B') start = { x, y }; if (c === 'H') harbor = { x, y }; }));
  return { ...def, w, h, start, harbor, rows: rows.map(r => r.replace('B', '.')) };
}

export const tileAt = (lv, x, y) => (x < 0 || y < 0 || x >= lv.w || y >= lv.h ? '#' : lv.rows[y][x]);
export const blocked = (lv, x, y) => '#L'.includes(tileAt(lv, x, y));
export const currentAt = (lv, x, y) => CURRENTS[tileAt(lv, x, y)] || null;
const near = (a, b, r) => Math.abs(a.x - b.x) <= r && Math.abs(a.y - b.y) <= r;

function reveal(s, lv, c, r) {
  for (let y = c.y - r; y <= c.y + r; y++) for (let x = c.x - r; x <= c.x + r; x++)
    if (x >= 0 && y >= 0 && x < lv.w && y < lv.h) s.seen[y * lv.w + x] = 1;
}

// Where a floe will be after its next drift (it holds still rather than run aground).
export function driftNext(lv, d) {
  const step = lv.drifters[d.n].path[d.i % lv.drifters[d.n].path.length], v = DIRS[step];
  if (!v) return { x: d.x, y: d.y };
  const x = d.x + v[0], y = d.y + v[1];
  return blocked(lv, x, y) || tileAt(lv, x, y) === 'H' ? { x: d.x, y: d.y } : { x, y };
}

export function newGame(lv) {
  const s = {
    boat: { ...lv.start }, hull: lv.hull, oil: lv.oil, turn: 1, status: 'play', why: '',
    drifters: (lv.drifters || []).map((d, n) => ({ n, x: d.at[0], y: d.at[1], i: 0 })),
    seen: Array(lv.w * lv.h).fill(0), beam: null, signals: [], lastPlan: [],
  };
  reveal(s, lv, s.boat, SIGHT);
  return s;
}

// The keeper's half of a turn: aim the lamp (or not) and pick signals.
export function light(s0, lv, beam, signals) {
  const s = structuredClone(s0);
  s.beam = beam && Number.isInteger(beam.x) && Number.isInteger(beam.y) ? { x: Math.max(0, Math.min(lv.w - 1, beam.x)), y: Math.max(0, Math.min(lv.h - 1, beam.y)) } : null;
  s.signals = (Array.isArray(signals) ? signals : []).filter(x => SIGNALS.includes(x)).slice(0, SIGNALS_PER_TURN);
  if (s.beam) reveal(s, lv, s.beam, BEAM);
  return s;
}

// The navigator's half: sail the plan and resolve the turn. Returns the new state and the frames to animate, one per
// step: {boat, drifters, hull, event} where event is null, 'bump', 'current', 'ice', 'harbor'.
export function sail(s0, lv, plan) {
  const s = structuredClone(s0), frames = [];
  const moves = (Array.isArray(plan) ? plan : []).filter(m => m === 'wait' || DIRS[m]).slice(0, MOVES_PER_TURN);
  const frame = event => frames.push({ boat: { ...s.boat }, drifters: s.drifters.map(d => ({ ...d })), hull: s.hull, event });
  const iced = () => s.drifters.some(d => d.x === s.boat.x && d.y === s.boat.y);
  const over = () => {
    if (s.boat.x === lv.harbor.x && s.boat.y === lv.harbor.y) { s.status = 'won'; s.why = 'Safe in the harbour.'; return true; }
    if (s.hull <= 0) { s.status = 'lost'; s.why = 'The hull gave way.'; return true; }
    return false;
  };
  s.lastPlan = moves;

  for (const m of moves) {
    let event = null;
    if (m !== 'wait') {
      const [dx, dy] = DIRS[m], x = s.boat.x + dx, y = s.boat.y + dy;
      if (blocked(lv, x, y)) { s.hull--; event = 'bump'; reveal(s, lv, { x, y }, 0); }
      else s.boat = { x, y };
    }
    reveal(s, lv, s.boat, SIGHT);
    const c = !event && m !== 'wait' && currentAt(lv, s.boat.x, s.boat.y);
    if (c) {
      const [dx, dy] = DIRS[c], x = s.boat.x + dx, y = s.boat.y + dy;
      if (!blocked(lv, x, y)) { s.boat = { x, y }; event = 'current'; reveal(s, lv, s.boat, SIGHT); }
    }
    if (iced()) { s.hull--; event = 'ice'; }
    if (over()) { frame(s.status === 'won' ? 'harbor' : event); return { state: s, frames }; }
    frame(event);
  }

  for (const d of s.drifters) { Object.assign(d, driftNext(lv, d)); d.i++; }
  if (iced()) s.hull--;
  frame(iced() ? 'ice' : null);
  if (over()) return { state: s, frames };

  s.oil--; s.turn++; s.beam = null; s.signals = [];
  if (s.oil <= 0) { s.status = 'lost'; s.why = 'The lamp ran out of oil.'; }
  return { state: s, frames };
}

// What the navigator may see on the TV: tiles already seen, and floes beside the boat or inside the lit patch.
export function visibleDrifters(s, lv) {
  return s.drifters.filter(d => near(d, s.boat, SIGHT) || (s.beam && near(d, s.beam, BEAM)));
}

// Shortest number of moves to the harbour, ignoring floes (levels are tuned with this; see test/).
export function shortestMoves(lv) {
  const key = p => p.y * lv.w + p.x, dist = new Map([[key(lv.start), 0]]), q = [lv.start];
  while (q.length) {
    const p = q.shift(), d = dist.get(key(p));
    if (p.x === lv.harbor.x && p.y === lv.harbor.y) return d;
    for (const [dx, dy] of Object.values(DIRS)) {
      let n = { x: p.x + dx, y: p.y + dy };
      if (blocked(lv, n.x, n.y)) continue;
      const c = currentAt(lv, n.x, n.y);
      if (c) { const m = { x: n.x + DIRS[c][0], y: n.y + DIRS[c][1] }; if (!blocked(lv, m.x, m.y)) n = m; }
      if (!dist.has(key(n))) { dist.set(key(n), d + 1); q.push(n); }
    }
  }
  return Infinity;
}
