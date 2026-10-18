// Rules and season checks for Two-Keeper Garden: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSeason, resolveDay, optionsFor, cleanPlan, stations, ripe, weatherOn, CROPS, DISHES, TOKENS, forecast, upcoming } from '../garden/game.js';
import { SEASONS } from '../garden/seasons.js';

// A pair of simple bots that plan together, as a couple talking it through would. The grower follows rules of
// thumb; the cook tries every combination of tokens and keeps the one that does best today.
function growerPlan(s, def) {
  const p = [], add = t => p.length < TOKENS && p.push(t);
  s.beds.forEach((b, i) => { if (ripe(b) && CROPS[b.crop].heavy) add({ at: 'b' + i, verb: 'lift' }); });
  if (s.orders.some(o => o.joint) && (s.dishes.includes('pie') || ((s.basket.pumpkin || 0) && (s.basket.herb || 0)))) add({ at: 'counter', verb: 'help' });
  if (weatherOn(def, s.day) !== 'rain') s.beds.map((b, i) => [b, i]).filter(([b]) => b.crop && !ripe(b))
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
  const opts = stations(def).flatMap(at => optionsFor('cook', at, s, def).map(o => ({ at, verb: o.verb, ...(o.opt ? { opt: o.opt } : {}) })));
  let best = [], bestScore = -Infinity;
  const score = r => r.state.stars * 10 + r.state.dishes.filter(d => r.state.orders.some(o => o.dish === d)).length * 4
    + Object.values(r.state.basket).reduce((a, b) => a + b, 0) - r.events.filter(e => e.kind === 'bad' && e.who === 'cook').length;
  for (let a = 0; a < opts.length; a++) for (let b = a; b < opts.length; b++) for (let c = b; c < opts.length; c++) {
    const plan = [opts[a], opts[b], opts[c]], sc = score(resolveDay(s, def, { grower, cook: plan }));
    if (sc > bestScore) { bestScore = sc; best = plan; }
  }
  return best;
}
function playSeason(def) {
  let s = newSeason(def);
  while (s.status === 'play') { const grower = growerPlan(s, def); s = resolveDay(s, def, { grower, cook: cookPlan(s, def, grower) }).state; }
  return s;
}

test('simple bots playing together reach every season target (people who plan ahead do better)', () => {
  for (const def of SEASONS) {
    const s = playSeason(def);
    const max = def.orders.reduce((a, o) => a + o.stars, 0);
    console.log(`${def.name}: bots ${s.stars}/${def.target} (max ${max}), served ${s.served}, missed ${s.missed}`);
    assert.equal(s.status, 'won', `${def.name}: bots got ${s.stars} of ${def.target}`);
  }
});

test('resolution is deterministic and does not touch the old state', () => {
  const def = SEASONS[1], s = newSeason(def), before = JSON.stringify(s);
  const plans = { grower: [{ at: 'b2', verb: 'plant', opt: 'herb' }, { at: 'b2', verb: 'water' }], cook: [{ at: 'b1', verb: 'harvest' }, { at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'counter', verb: 'serve' }] };
  assert.deepEqual(resolveDay(s, def, plans), resolveDay(s, def, plans));
  assert.equal(JSON.stringify(s), before);
});

test('one day: harvest, cook and serve in order; planting and watering grows', () => {
  const def = SEASONS[0], s = newSeason(def); // b0 herbs are ripe, a tea order is open
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
  const def = SEASONS[2], s = newSeason(def);
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
  const def = SEASONS[0];
  const p = cleanPlan('grower', [{ at: 'stove', verb: 'cook', opt: 'tea' }, { at: 'b0', verb: 'harvest' }, { at: 'b0', verb: 'water' }, { at: 'b1', verb: 'water' }, { at: 'b2', verb: 'water' }, { at: 'b0', verb: 'water' }], def);
  assert.deepEqual(p.map(t => t.at), ['b0', 'b1', 'b2']);
  assert.deepEqual(optionsFor('grower', 'stove', newSeason(def), def), []);
});

test('each keeper has something only they know', () => {
  const def = SEASONS[0], s = newSeason(def);
  assert.deepEqual(forecast(s, def).map(f => f.w), ['sun', 'sun', 'rain']);
  assert.deepEqual(upcoming(s, def).map(o => o.dish), ['salad', 'soup']);
});
