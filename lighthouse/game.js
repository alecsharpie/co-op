// Lighthouse & Navigator: the rules, as pure functions over plain JSON (no DOM), so the board can save the state
// as-is and node --test can play it. The board is the only place they run.
//
// Each turn the keeper (who sees the whole bay on their phone) points the lamp at a 3x3 patch, which lights it on
// the TV for the navigator, and in signal mode sends up to 3 symbols. Then the navigator (who sees only what is lit
// or right beside the boat) queues up to 3 moves and sails. Rocks dent the hull; currents push the boat one tile
// after it lands on them; ice floes drift along fixed paths once the boat has moved and shatter when they hit it.
// Every turn burns a measure of lamp oil. Reach the harbour before the hull breaks or the lamp goes out.
//
// Later bays add: buoys the keeper drops as permanent markers on the TV, and fog banks that the lamp (and the
// keeper's map) cannot see into, with hidden reefs inside, which only the navigator's sonar ping reveals.
//
// What the TV knows is s.seen, one value per tile: 0 dark, 1 mist (the lamp found fog there), 2 known. Floes the
// navigator has spotted leave a "last seen" marker (s.floeSeen) with the way they were drifting.

export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const DIR_WORD = { N: 'north', E: 'east', S: 'south', W: 'west' };
const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };
export const SIGNALS = ['N', 'E', 'S', 'W', 'wait', 'danger', 'good', 'unsure'];
export const MOVES_PER_TURN = 3, SIGNALS_PER_TURN = 3, BEAM = 1, SIGHT = 1, SONAR = 2;
export const PHASES = [{ name: 'light', seats: ['keeper'] }, { name: 'steer', seats: ['navigator'] }];

const CURRENTS = { '>': 'E', '<': 'W', '^': 'N', v: 'S' };

// map characters: . water  # rock  L the lighthouse (a rock)  H harbour  B boat start  > < ^ v current
//                 f fog bank (water nobody can see into)  r a reef hidden in the fog (a rock)
export function parseLevel(def) {
  const rows = def.map, h = rows.length, w = rows[0].length;
  let start = null, harbor = null;
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'B') start = { x, y }; if (c === 'H') harbor = { x, y }; }));
  return {
    drifters: [], tips: {}, buoys: 0, sonar: false, ...def,
    w, h, start, harbor, rows: rows.map(r => r.replace('B', '.')),
  };
}

export const tileAt = (lv, x, y) => (x < 0 || y < 0 || x >= lv.w || y >= lv.h ? '#' : lv.rows[y][x]);
export const blocked = (lv, x, y) => '#Lr'.includes(tileAt(lv, x, y));
export const currentAt = (lv, x, y) => CURRENTS[tileAt(lv, x, y)] || null;
export const isFog = (lv, x, y) => 'fr'.includes(tileAt(lv, x, y));
const near = (a, b, r) => Math.abs(a.x - b.x) <= r && Math.abs(a.y - b.y) <= r;
const ring = (a, b, r) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= r;
const same = (a, b) => a.x === b.x && a.y === b.y;

// how: 'lamp' (cannot see into fog), 'sight' (beside the boat), 'sonar' (a diamond that sees through fog)
function reveal(s, lv, c, r, how) {
  for (let y = c.y - r; y <= c.y + r; y++) for (let x = c.x - r; x <= c.x + r; x++) {
    if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) continue;
    if (how === 'sonar' && !ring(c, { x, y }, r)) continue;
    const i = y * lv.w + x;
    s.seen[i] = how === 'lamp' && isFog(lv, x, y) ? Math.max(s.seen[i], 1) : 2;
  }
}

// Can the navigator see this tile right now? Beside the boat, inside this turn's sonar ring, or lit (fog stays dark).
export function visibleAt(s, lv, p) {
  return near(p, s.boat, SIGHT) || (s.ping && ring(p, s.ping, SONAR)) || (s.beam && near(p, s.beam, BEAM) && !isFog(lv, p.x, p.y));
}

export const visibleDrifters = (s, lv) => s.drifters.filter(d => !d.gone && visibleAt(s, lv, d));

// Last-seen markers for floes: refresh the ones in view, forget a marker once its spot is in view and empty.
function spot(s, lv) {
  for (const d of s.drifters) {
    if (d.gone) { delete s.floeSeen[d.n]; continue; }
    if (visibleAt(s, lv, d)) s.floeSeen[d.n] = { x: d.x, y: d.y, turn: s.turn, dir: s.floeSeen[d.n]?.dir || null };
    else if (s.floeSeen[d.n] && visibleAt(s, lv, s.floeSeen[d.n])) delete s.floeSeen[d.n];
  }
}

const stepOf = (lv, d) => lv.drifters[d.n].path[d.i % lv.drifters[d.n].path.length];

// Where a floe will be after its next drift (it holds still rather than run aground).
export function driftNext(lv, d) {
  const v = DIRS[stepOf(lv, d)];
  if (!v) return { x: d.x, y: d.y };
  const x = d.x + v[0], y = d.y + v[1];
  return blocked(lv, x, y) || tileAt(lv, x, y) === 'H' ? { x: d.x, y: d.y } : { x, y };
}

export function newGame(lv) {
  const s = {
    boat: { ...lv.start }, hull: lv.hull, oil: lv.oil, turn: 1, status: 'play', why: '',
    drifters: lv.drifters.map((d, n) => ({ n, x: d.at[0], y: d.at[1], i: 0 })),
    seen: Array(lv.w * lv.h).fill(0), beam: null, signals: [], lastPlan: [],
    floeSeen: {}, trail: [], events: [], marks: [], buoys: [], buoysLeft: lv.buoys, ping: null, pinged: false,
  };
  reveal(s, lv, s.boat, SIGHT, 'sight');
  spot(s, lv);
  return s;
}

// The keeper's half of a turn: aim the lamp (or not), pick signals, maybe drop a buoy.
export function light(s0, lv, beam, signals, buoy = null) {
  const s = structuredClone(s0);
  const inside = p => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < lv.w && p.y < lv.h;
  s.beam = inside(beam) ? { x: beam.x, y: beam.y } : null;
  s.signals = (Array.isArray(signals) ? signals : []).filter(x => SIGNALS.includes(x)).slice(0, SIGNALS_PER_TURN);
  if (inside(buoy) && s.buoysLeft > 0 && !blocked(lv, buoy.x, buoy.y) && !s.buoys.some(b => same(b, buoy))) {
    s.buoys.push({ x: buoy.x, y: buoy.y }); s.buoysLeft--;
  }
  if (s.beam) reveal(s, lv, s.beam, BEAM, 'lamp');
  spot(s, lv);
  return s;
}

// The navigator's sonar: once a turn, before sailing, in bays that have it. Sees 2 tiles around the boat, fog and
// all, and costs one of the turn's moves.
export function ping(s0, lv) {
  if (!lv.sonar || s0.pinged || s0.status !== 'play') return s0;
  const s = structuredClone(s0);
  s.ping = { ...s.boat }; s.pinged = true;
  reveal(s, lv, s.ping, SONAR, 'sonar');
  spot(s, lv);
  return s;
}

export const movesAllowed = s => MOVES_PER_TURN - (s.pinged ? 1 : 0);

// The navigator's half: sail the plan and resolve the turn. Returns the new state and the frames to animate, one
// per step: {boat, drifters, hull, seen, floeSeen, event, text, at}; event is null, 'bump', 'reef', 'current',
// 'ice' or 'harbor', text says what happened in words and at is where. s.events keeps them for the log, s.marks for
// the TV.
export function sail(s0, lv, plan) {
  const s = structuredClone(s0), frames = [], events = [];
  const moves = (Array.isArray(plan) ? plan : []).filter(m => m === 'wait' || DIRS[m]).slice(0, movesAllowed(s));
  s.lastPlan = moves; s.trail = [{ ...s.boat }]; s.marks = [];
  const note = (event, at, text) => { events.push({ event, x: at.x, y: at.y, text }); if (event !== 'current') s.marks.push({ event, x: at.x, y: at.y }); };
  const frame = (event, text = null) => frames.push({
    boat: { ...s.boat }, drifters: s.drifters.map(d => ({ ...d })), hull: s.hull,
    seen: [...s.seen], floeSeen: structuredClone(s.floeSeen), event, text, at: event ? events.at(-1) && { x: events.at(-1).x, y: events.at(-1).y } : null,
  });
  const over = () => {
    if (same(s.boat, lv.harbor)) { s.status = 'won'; s.why = 'Safe in the harbour.'; return true; }
    if (s.hull <= 0) { s.status = 'lost'; s.why = 'The hull gave way.'; return true; }
    return false;
  };
  const finish = () => { s.events = events; return { state: s, frames }; };
  // A floe and the boat meet: the hull takes it, the floe breaks up. `from` is the direction the floe came from.
  const hit = (d, from) => {
    const known = !!s0.floeSeen[d.n];
    s.hull--; d.gone = true;
    const text = known ? `Hit the ice floe ${from ? 'to the ' + DIR_WORD[from] : ''}. Hull −1; the floe shattered.`
      : `An unseen ice floe drifted in from the ${DIR_WORD[from] || 'dark'}. Hull −1; it shattered. Light the floes so the navigator can see them!`;
    note('ice', s.boat, text);
    return text;
  };

  for (const m of moves) {
    let event = null, text = null;
    if (m !== 'wait') {
      const [dx, dy] = DIRS[m], at = { x: s.boat.x + dx, y: s.boat.y + dy };
      if (blocked(lv, at.x, at.y)) {
        s.hull--;
        event = tileAt(lv, at.x, at.y) === 'r' ? 'reef' : 'bump';
        text = event === 'reef' ? `Scraped a reef hidden in the fog to the ${DIR_WORD[m]}. Hull −1.` : `Ran onto rocks to the ${DIR_WORD[m]}. Hull −1.`;
        note(event, at, text);
        reveal(s, lv, at, 0, 'sight');
      } else s.boat = at;
    }
    reveal(s, lv, s.boat, SIGHT, 'sight');
    const c = !event && m !== 'wait' && currentAt(lv, s.boat.x, s.boat.y);
    if (c) {
      const at = { x: s.boat.x + DIRS[c][0], y: s.boat.y + DIRS[c][1] };
      if (!blocked(lv, at.x, at.y)) {
        s.boat = at; event = 'current'; text = `The current swept the boat ${DIR_WORD[c]}.`;
        note(event, at, text); reveal(s, lv, s.boat, SIGHT, 'sight');
      }
    }
    const d = s.drifters.find(f => !f.gone && same(f, s.boat));
    if (d) { text = hit(d, m !== 'wait' ? m : null); event = 'ice'; }
    s.trail.push({ ...s.boat });
    spot(s, lv);
    if (over()) { frame(s.status === 'won' ? 'harbor' : event, s.status === 'won' ? 'Into the harbour!' : text); return finish(); }
    frame(event, text);
  }

  // The tide: every floe takes its next step. One that was in view stays marked with the way it went.
  let event = null, text = null;
  for (const d of s.drifters) {
    if (d.gone) continue;
    const step = stepOf(lv, d), wasSeen = visibleAt(s, lv, d), from = { x: d.x, y: d.y };
    Object.assign(d, driftNext(lv, d)); d.i++;
    const moved = !same(from, d);
    if (same(d, s.boat)) { text = hit(d, OPP[step]); event = 'ice'; continue; }
    if (visibleAt(s, lv, d)) s.floeSeen[d.n] = { x: d.x, y: d.y, turn: s.turn, dir: moved ? step : null };
    else if (wasSeen) s.floeSeen[d.n] = { ...from, turn: s.turn, dir: moved ? step : null };
  }
  for (const d of s.drifters) if (d.gone) delete s.floeSeen[d.n];
  frame(event, text);
  if (over()) return finish();

  s.oil--; s.turn++; s.beam = null; s.signals = []; s.ping = null; s.pinged = false;
  spot(s, lv);
  if (s.oil <= 0) { s.status = 'lost'; s.why = 'The lamp ran out of oil.'; }
  return finish();
}

// Shortest number of moves to the harbour, ignoring floes (levels are tuned with this; see test/).
const shortestCache = new WeakMap();
export function shortestMoves(lv) {
  if (shortestCache.has(lv)) return shortestCache.get(lv);
  const key = p => p.y * lv.w + p.x, dist = new Map([[key(lv.start), 0]]), q = [lv.start];
  let best = Infinity;
  while (q.length) {
    const p = q.shift(), d = dist.get(key(p));
    if (same(p, lv.harbor)) { best = d; break; }
    for (const [dx, dy] of Object.values(DIRS)) {
      let n = { x: p.x + dx, y: p.y + dy };
      if (blocked(lv, n.x, n.y)) continue;
      const c = currentAt(lv, n.x, n.y);
      if (c) { const m = { x: n.x + DIRS[c][0], y: n.y + DIRS[c][1] }; if (!blocked(lv, m.x, m.y)) n = m; }
      if (!dist.has(key(n))) { dist.set(key(n), d + 1); q.push(n); }
    }
  }
  shortestCache.set(lv, best);
  return best;
}

// Par: the fewest turns the route needs, plus one to talk it over (and one more where sonar pings cost moves).
export const parTurns = lv => Math.ceil(shortestMoves(lv) / MOVES_PER_TURN) + 1 + (lv.sonar ? 1 : 0);

// Stars for a finished bay: one for getting home, one for an undented hull, one for making par.
export function stars(s, lv) {
  if (s.status !== 'won') return 0;
  return 1 + (s.hull === lv.hull ? 1 : 0) + (s.turn <= parTurns(lv) ? 1 : 0);
}
