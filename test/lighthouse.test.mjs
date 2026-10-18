// Rules and level checks for Lighthouse & Navigator: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, newGame, light, sail, ping, movesAllowed, stars, shortestMoves, driftNext, visibleDrifters, blocked, DIRS, MOVES_PER_TURN } from '../lighthouse/game.js';
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

// Playtest bug: "the iceberg wasn't appearing for the navigator". Floes were only drawn while lit or beside the boat,
// so a lit floe vanished from the TV as soon as the turn ended, and one that hit the boat hid under it.
test('a floe seen under the lamp stays on the TV as a last-seen marker with its drift', () => {
  const ice = bays[1];
  let s = light(newGame(ice), ice, { x: 5, y: 4 }, []);
  assert.deepEqual(s.floeSeen[0], { x: 5, y: 4, turn: 1, dir: null });
  s = sail(s, ice, ['wait']).state; // floe 0 drifts east to (6,4), still under the lamp as it moves
  assert.equal(s.beam, null);
  assert.equal(visibleDrifters(s, ice).length, 0); // not in view any more...
  assert.deepEqual(s.floeSeen[0], { x: 6, y: 4, turn: 1, dir: 'E' }); // ...but marked where it went, heading east
  s = light(s, ice, { x: 1, y: 6 }, []); // lighting elsewhere keeps the marker
  assert.ok(s.floeSeen[0]);
  s = sail(s, ice, ['wait']).state; // unseen, it drifts on to (7,4); the marker stays where it was last seen
  assert.deepEqual([s.floeSeen[0].x, s.floeSeen[0].y], [6, 4]);
  s = light(s, ice, { x: 5, y: 4 }, []); // the marked spot is lit and empty: the marker goes
  assert.equal(s.floeSeen[0], undefined);
});

test('a hidden floe that drifts into the boat says so, costs 1 hull once, and shatters', () => {
  const lv = parseLevel({ hull: 3, oil: 5, map: ['######', '#B...#', '#...H#', '######'], drifters: [{ at: [3, 1], path: 'W' }] });
  let s = newGame(lv);
  assert.equal(Object.keys(s.floeSeen).length, 0);
  const r = sail(s, lv, ['E']); // boat to (2,1); the floe drifts west from (3,1) into it
  assert.equal(r.state.hull, 2);
  assert.equal(r.frames.at(-1).event, 'ice');
  assert.match(r.frames.at(-1).text, /unseen ice floe drifted in from the east/);
  assert.deepEqual(r.state.marks, [{ event: 'ice', x: 2, y: 1 }]);
  assert.ok(r.state.drifters[0].gone);
  s = sail(r.state, lv, ['wait', 'wait', 'wait']).state;
  assert.equal(s.hull, 2); // no second knock from the same floe
});

test('fog: the lamp sees only mist, sonar finds the reefs and costs a move', () => {
  const fog = bays.find(b => b.sonar && !b.buoys);
  const at = (s, x, y) => s.seen[y * fog.w + x];
  let s = light(newGame(fog), fog, { x: 6, y: 4 }, []); // centred on the reef at (6,4)
  assert.equal(at(s, 6, 4), 1); assert.equal(at(s, 5, 3), 1); // mist, contents unknown
  s = { ...s, boat: { x: 4, y: 4 } };
  s = ping(s, fog);
  assert.equal(at(s, 6, 4), 2); // two squares east: the reef shows
  assert.equal(movesAllowed(s), 2);
  assert.equal(ping(s, fog), s); // once a turn
  const r = sail(s, fog, ['E', 'E', 'E']);
  assert.equal(r.state.lastPlan.length, 2);
  assert.equal(r.frames[1].event, 'reef'); // (5,4) is open, (6,4) is the reef
  assert.match(r.frames[1].text, /reef/);
  assert.equal(r.state.pinged, false); assert.equal(r.state.ping, null);
});

test('buoys: the keeper drops up to the bay’s allowance, never on rock, and they stay', () => {
  const lv = bays.find(b => b.buoys === 3);
  let s = newGame(lv);
  s = light(s, lv, null, [], { x: 0, y: 0 }); // rock
  assert.equal(s.buoys.length, 0);
  for (const p of [{ x: 3, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 4 }, { x: 5, y: 2 }, { x: 7, y: 1 }]) s = light(s, lv, null, [], p);
  assert.deepEqual(s.buoys, [{ x: 3, y: 1 }, { x: 3, y: 4 }, { x: 5, y: 2 }]);
  assert.equal(s.buoysLeft, 0);
  s = sail(s, lv, ['wait']).state;
  assert.equal(s.buoys.length, 3);
});

test('stars: home, undented, on par', () => {
  const lv = bays[0], moves = route(lv);
  let s = newGame(lv);
  for (let i = 0; i < moves.length && s.status === 'play'; i += MOVES_PER_TURN) s = sail(light(s, lv, null, []), lv, moves.slice(i, i + MOVES_PER_TURN)).state;
  assert.equal(stars(s, lv), 3);
  assert.equal(stars({ ...s, hull: 1 }, lv), 2);
  assert.equal(stars({ ...s, status: 'lost' }, lv), 0);
});
