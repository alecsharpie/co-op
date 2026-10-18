// Rules and season checks for Two-Keeper Garden: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSeason, resolveDay, optionsFor, cleanPlan, checkPlan, stations, ripe, weatherOn, CROPS, DISHES, TOKENS, forecast, upcoming } from '../garden/game.js';
import { SEASONS } from '../garden/seasons.js';

const season = name => SEASONS.find(d => d.name === name);

// A pair of simple bots that plan together, as a couple talking it through would. The grower follows rules of
// thumb; the cook tries every combination of tokens and keeps the one that does best today.
function growerPlan(s, def) {
  const p = [], add = t => p.length < TOKENS && p.push(t);
  s.beds.forEach((b, i) => { if (ripe(b) && CROPS[b.crop].heavy) add({ at: 'b' + i, verb: 'lift' }); });
  if (s.orders.some(o => o.joint) && (s.dishes.includes('pie') || ((s.basket.pumpkin || 0) && (s.basket.herb || 0)))) add({ at: 'counter', verb: 'help' });
  if (weatherOn(def, s.day) === 'storm') s.beds.map((b, i) => [b, i]).filter(([b]) => b.crop && !ripe(b) && b.grown > 0).forEach(([, i]) => add({ at: 'b' + i, verb: 'cover' }));
  if (weatherOn(def, s.day) === 'sun') s.beds.map((b, i) => [b, i]).filter(([b]) => b.crop && !ripe(b))
    .sort(([a], [b]) => (CROPS[a.crop].need - a.grown) - (CROPS[b.crop].need - b.grown)).forEach(([, i]) => add({ at: 'b' + i, verb: 'water' }));
  const want = {};
  for (const o of [...s.orders, ...def.orders.filter(o => o.day > s.day)]) for (const [c, n] of Object.entries(DISHES[o.dish].needs)) want[c] = (want[c] || 0) + n;
  for (const b of s.beds) if (b.crop) want[b.crop] = (want[b.crop] || 0) - 1;
  for (const [c, n] of Object.entries(s.basket)) want[c] = (want[c] || 0) - n;
  s.beds.forEach((b, i) => {
    if (b.crop) return;
    const crop = def.crops.slice().sort((a, b) => (want[b] || 0) - (want[a] || 0))[0];
    want[crop] = (want[crop] || 0) - 1;
    add({ at: 'b' + i, verb: 'plant', opt: crop });
  });
  return p;
}
function cookPlan(s, def, grower) {
  const opts = stations(def, s).flatMap(at => optionsFor('cook', at, s, def).map(o => ({ at, verb: o.verb, ...(o.opt ? { opt: o.opt } : {}) })));
  let best = [], bestScore = -Infinity;
  const score = r => r.state.stars * 10 + r.state.dishes.filter(d => r.state.orders.some(o => o.dish === d)).length * 4
    + Object.values(r.state.basket).reduce((a, b) => a + b, 0) - r.events.filter(e => e.kind === 'bad' && e.who === 'cook').length;
  for (let a = 0; a < opts.length; a++) for (let b = a; b < opts.length; b++) for (let c = b; c < opts.length; c++) {
    const plan = [opts[a], opts[b], opts[c]], sc = score(resolveDay(s, def, { grower, cook: plan }));
    if (sc > bestScore) { bestScore = sc; best = plan; }
  }
  return best;
}
function playSeason(def, upgrades = []) {
  let s = newSeason(def, upgrades);
  while (s.status === 'play') { const grower = growerPlan(s, def); s = resolveDay(s, def, { grower, cook: cookPlan(s, def, grower) }).state; }
  return s;
}

test('simple bots playing together reach every season target (people who plan ahead do better)', () => {
  for (const def of SEASONS) {
    const s = playSeason(def);
    const max = def.orders.reduce((a, o) => a + (o.stars ?? DISHES[o.dish].stars), 0);
    console.log(`${def.name}: bots ${s.stars}/${def.target} (max ${max}), served ${s.served}, missed ${s.missed}`);
    assert.equal(s.status, 'won', `${def.name}: bots got ${s.stars} of ${def.target}`);
  }
});

test('resolution is deterministic and does not touch the old state', () => {
  const def = season('Summer Fair'), s = newSeason(def), before = JSON.stringify(s);
  const plans = { grower: [{ at: 'b2', verb: 'plant', opt: 'herb' }, { at: 'b2', verb: 'water' }], cook: [{ at: 'b1', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'counter', verb: 'serve' }] };
  assert.deepEqual(resolveDay(s, def, plans), resolveDay(s, def, plans));
  assert.equal(JSON.stringify(s), before);
});

test('one day: harvest, cook and serve in order; planting and watering grows', () => {
  const def = season('Spring Café'), s = newSeason(def); // b0 herbs are ripe, a tea order is open
  const r = resolveDay(s, def, {
    grower: [{ at: 'b2', verb: 'plant', opt: 'herb' }, { at: 'b2', verb: 'water' }, { at: 'b1', verb: 'water' }],
    cook: [{ at: 'b0', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'counter', verb: 'serve' }],
  });
  assert.equal(r.state.stars, 1);
  assert.ok(ripe(r.state.beds[2]), 'herbs planted and watered the same day are ripe');
  assert.ok(ripe(r.state.beds[1]), 'tomato reached 2 waterings');
  assert.equal(r.state.day, 2);
});

test('pumpkins need both keepers; feasts need both at the counter', () => {
  const def = season('Harvest Moon'), s = newSeason(def);
  s.beds[2].grown = 3; // ripe pumpkin
  let r = resolveDay(s, def, { grower: [], cook: [{ at: 'b2', verb: 'harvest' }] });
  assert.equal(r.state.basket.pumpkin, undefined); assert.match(r.events[0].text, /too heavy/);
  r = resolveDay(s, def, { grower: [{ at: 'b2', verb: 'lift' }], cook: [{ at: 'b2', verb: 'harvest' }] });
  assert.equal(r.state.basket.pumpkin, 1);

  const f = structuredClone(s); f.dishes = ['pie']; f.orders = [{ id: 9, dish: 'pie', due: 5, stars: 4, joint: true }];
  assert.equal(resolveDay(f, def, { grower: [], cook: [{ at: 'counter', verb: 'serve' }] }).state.stars, 0);
  assert.equal(resolveDay(f, def, { grower: [{ at: 'counter', verb: 'help' }], cook: [{ at: 'counter', verb: 'serve' }] }).state.stars, 4);
});

test('plans are cleaned: three tokens, only moves the role can make', () => {
  const def = season('Spring Café');
  const p = cleanPlan('grower', [{ at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'b0', verb: 'harvest' }, { at: 'b0', verb: 'water' }, { at: 'b1', verb: 'water' }, { at: 'b2', verb: 'water' }, { at: 'b0', verb: 'water' }], def);
  assert.deepEqual(p.map(t => t.at), ['b0', 'b1', 'b2']);
  assert.deepEqual(optionsFor('grower', 'stove', newSeason(def), def), []);
});

test('each keeper has something only they know', () => {
  const def = season('Spring Café'), s = newSeason(def);
  assert.deepEqual(forecast(s, def).map(f => f.w), ['sun', 'sun', 'rain']);
  assert.deepEqual(upcoming(s, def).map(o => o.dish), ['salad', 'soup']);
});

test('following the guided first season step by step wins it, salad included', () => {
  const def = season('First Morning');
  const steps = {
    1: { grower: [{ at: 'b1', verb: 'water' }, { at: 'b2', verb: 'plant', opt: 'herb' }, { at: 'b2', verb: 'water' }],
         cook: [{ at: 'b0', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'counter', verb: 'serve' }] },
    2: { grower: [{ at: 'b1', verb: 'plant', opt: 'tomato' }, { at: 'b2', verb: 'plant', opt: 'herb' }],
         cook: [{ at: 'b1', verb: 'harvest' }, { at: 'b2', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'salad' }] },
    3: { grower: [{ at: 'b1', verb: 'water' }, { at: 'b2', verb: 'water' }], cook: [{ at: 'counter', verb: 'serve' }] },
  };
  let s = newSeason(def);
  for (let d = 1; d <= 3; d++) {
    for (const seat of ['grower', 'cook']) assert.ok(checkPlan(seat, steps[d][seat], s, def).every(c => c.ok !== false), `day ${d} ${seat}: the guide's own steps pass the phone's checks`);
    const r = resolveDay(s, def, steps[d]);
    assert.ok(!r.events.some(e => e.kind === 'bad'), `day ${d}: ${r.events.filter(e => e.kind === 'bad').map(e => e.text)}`);
    s = r.state;
  }
  assert.equal(s.status, 'won'); assert.equal(s.stars, 3);
});

test('the phone explains a doomed token before Ready: salad without tomato, unripe pick, rain', () => {
  const def = season('Spring Café'), s = newSeason(def); // b0 herbs ripe, b1 tomato half grown
  const [pick, cook] = checkPlan('cook', [{ at: 'b0', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'salad' }], s, def);
  assert.equal(pick.ok, true); assert.equal(cook.ok, false); assert.match(cook.text, /Missing 🍅/);
  assert.match(checkPlan('cook', [{ at: 'b1', verb: 'harvest' }], s, def)[0].text, /needs 1 more watering/);
  const wet = { ...s, day: 3 };
  assert.equal(checkPlan('grower', [{ at: 'b1', verb: 'water' }], wet, def)[0].ok, false);
  const r = resolveDay(s, def, { grower: [], cook: [{ at: 'stove', verb: 'cook', opt: 'salad' }] });
  assert.match(r.events[0].text, /needs 🌿 \+ 🍅, but the basket had nothing/);
});

test('storms flatten uncovered growing crops; covering saves them', () => {
  const def = season('Summer Fair'), s = newSeason(def);
  s.day = def.storm[0];
  let r = resolveDay(s, def, { grower: [], cook: [] });
  assert.equal(r.state.beds[0].grown, 0, 'half-grown tomato flattened');
  r = resolveDay(s, def, { grower: [{ at: 'b0', verb: 'cover' }], cook: [] });
  assert.equal(r.state.beds[0].grown, 1, 'covered tomato kept its growth');
});

test('upgrades: greenhouse adds a bed, compost gives a head start, the barrel waters the neighbour', () => {
  const def = season('Spring Café');
  assert.equal(newSeason(def, ['greenhouse']).beds.length, def.beds.length + 1);
  assert.equal(stations(def, newSeason(def, ['greenhouse'])).length, def.beds.length + 3);
  let r = resolveDay(newSeason(def, ['compost']), def, { grower: [{ at: 'b2', verb: 'plant', opt: 'tomato' }], cook: [] });
  assert.equal(r.state.beds[2].grown, 1);
  const s = newSeason(def, ['barrel']); s.beds[2] = { crop: 'tomato', grown: 0, ripeFor: 0 };
  r = resolveDay(s, def, { grower: [{ at: 'b1', verb: 'water' }], cook: [] });
  assert.equal(r.state.beds[2].grown, 1, 'bed 3 watered by the barrel');
  for (const d of SEASONS) assert.equal(playSeason(d, ['greenhouse', 'compost', 'barrel']).status, 'won', `${d.name} with every upgrade`);
});
