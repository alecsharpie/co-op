// Rules and level checks for Lighthouse & Navigator: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, newGame, light, sail, shortestMoves, driftNext, visibleDrifters, blocked, DIRS, MOVES_PER_TURN } from '../lighthouse/game.js';
import { LEVELS } from '../lighthouse/levels.js';

const bays = LEVELS.map(d => parseLevel({ drifters: [], ...d }));

// A shortest route as a list of moves, ignoring floes (same rules as shortestMoves).
function route(lv) {
  const key = p => p.y * lv.w + p.x, prev = new Map([[key(lv.start), null]]), q = [lv.start];
  while (q.length) {
    const p = q.shift();
    if (p.x === lv.harbor.x && p.y === lv.harbor.y) break;
    for (const [m, [dx, dy]] of Object.entries(DIRS)) {
      let n = { x: p.x + dx, y: p.y + dy };
      if (blocked(lv, n.x, n.y)) continue;
      const c = { '>': 'E', '<': 'W', '^': 'N', v: 'S' }[lv.rows[n.y][n.x]];
      if (c) { const k = { x: n.x + DIRS[c][0], y: n.y + DIRS[c][1] }; if (!blocked(lv, k.x, k.y)) n = k; }
      if (!prev.has(key(n))) { prev.set(key(n), [p, m]); q.push(n); }
    }
  }
  const moves = []; let p = lv.harbor;
  while (prev.get(key(p))) { const [b, m] = prev.get(key(p)); moves.unshift(m); p = b; }
  return moves;
}

test('every bay is well formed and solvable inside its oil', () => {
  for (const lv of bays) {
    assert.ok(lv.rows.every(r => r.length === lv.w), `${lv.name}: ragged rows`);
    assert.ok(lv.start && lv.harbor, `${lv.name}: needs B and H`);
    const n = shortestMoves(lv);
    assert.ok(Number.isFinite(n), `${lv.name}: harbour unreachable`);
    assert.ok(Math.ceil(n / MOVES_PER_TURN) < lv.oil, `${lv.name}: ${n} moves needs more than ${lv.oil - 1} turns`);
  }
});

test('floes start in water and every authored step actually moves', () => {
  for (const lv of bays) lv.drifters.forEach((d, n) => {
    let f = { n, x: d.at[0], y: d.at[1], i: 0 };
    assert.ok(!blocked(lv, f.x, f.y), `${lv.name} floe ${n} starts on rock`);
    for (let k = 0; k < d.path.length * 2; k++) {
      const next = driftNext(lv, f);
      if (d.path[k % d.path.length] !== '.') assert.notDeepEqual(next, { x: f.x, y: f.y }, `${lv.name} floe ${n} stuck at step ${k}`);
      f = { ...f, ...next, i: f.i + 1 };
    }
  });
});

test('sailing the shortest route wins First Light', () => {
  const lv = bays[0], moves = route(lv);
  let s = newGame(lv);
  for (let i = 0; i < moves.length && s.status === 'play'; i += MOVES_PER_TURN) {
    s = light(s, lv, { x: s.boat.x + 1, y: s.boat.y }, ['E']);
    s = sail(s, lv, moves.slice(i, i + MOVES_PER_TURN)).state;
  }
  assert.equal(s.status, 'won');
  assert.equal(s.hull, lv.hull);
});

test('rocks dent the hull, the lamp runs dry, floes stay hidden until lit', () => {
  const lv = bays[0];
  let s = newGame(lv); // boat at (1,1), rock to the north
  const r = sail(s, lv, ['N', 'N', 'N']);
  assert.equal(r.state.hull, lv.hull - 3); assert.equal(r.state.status, 'lost');
  assert.deepEqual(r.frames.map(f => f.event), ['bump', 'bump', 'bump']);

  s = newGame(lv);
  for (let i = 0; i < lv.oil; i++) s = sail(light(s, lv, null, []), lv, ['wait']).state;
  assert.equal(s.status, 'lost'); assert.match(s.why, /oil/);

  const ice = bays[1]; s = newGame(ice);
  assert.equal(visibleDrifters(s, ice).length, 0);
  s = light(s, ice, { x: 5, y: 4 }, []);
  assert.equal(visibleDrifters(s, ice).length, 1);
});

test('the keeper can send at most three known signals', () => {
  const s = light(newGame(bays[0]), bays[0], null, ['N', 'bogus', 'E', 'S', 'W']);
  assert.deepEqual(s.signals, ['N', 'E', 'S']);
});
