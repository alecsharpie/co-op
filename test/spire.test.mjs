// Rules checks for Co-op Spire: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, resolve, validPick, chooseReward, chooseRelic, chooseUpgrade, chooseEvent, rest, advance, describeIntent, intentWords, intentOf, nextOptions, nodeOf, SEATS, partnerOf } from '../spire/game.js';
import { card, ALL, REWARDS, ENEMIES, EVENTS, TAGS, LAYOUT } from '../spire/cards.js';

// put chosen cards in hand, so tests do not depend on the shuffle
const rig = (s, hands) => { for (const seat of SEATS) if (hands[seat]) s.piles[seat].hand = [...hands[seat]]; return s; };
// a fight against a chosen enemy
const versus = (key, seed = 1) => { const s = newRun(seed); const hp = ENEMIES[key].hp; s.enemy = { ...s.enemy, key, hp, max: hp, i: 0 }; return s; };

test('same seed, same run', () => {
  assert.deepEqual(newRun(42).piles, newRun(42).piles);
  assert.deepEqual(newRun(42).map, newRun(42).map);
  assert.notDeepEqual(newRun(42).piles, newRun(43).piles);
  const a = newRun(7), b = newRun(7), p = { warden: [0], striker: [0] };
  assert.deepEqual(resolve(a, p), resolve(b, p));
});

test('every card has text, every combo needs a sign the partner can give', () => {
  for (const seat of SEATS) for (const id of ALL[seat]) {
    for (const v of [id, id + '+']) { const c = card(v); assert.ok(c.text && !/undefined|NaN/.test(c.text), `${v}: ${c.text}`); }
    const c = card(id);
    if (c.combo) {
      assert.ok(TAGS[c.combo.tag], `${id}: unknown tag ${c.combo.tag}`);
      assert.ok(ALL[partnerOf(seat)].some(p => card(p).tags.includes(c.combo.tag)), `${id}: no ${partnerOf(seat)} card gives ${c.combo.tag}`);
    }
  }
  assert.equal(card('strike+').fx.dmg, 8);
  assert.equal(card('execute+').combo.fx.dmg, 20);
});

test('a combo fires only when the partner plays the matching tag', () => {
  const base = rig(newRun(1), { warden: ['mark', 'guard'], striker: ['execute', 'strike'] });
  const alone = resolve(base, { warden: [1], striker: [0] }).state;   // guard + execute: 7
  assert.equal(alone.enemy.hp, base.enemy.max - 7);
  const both = resolve(base, { warden: [0], striker: [0] });           // mark + execute: 15, vulnerable x1.5
  assert.equal(both.state.enemy.hp, base.enemy.max - Math.floor(15 * 1.5));
  const ev = both.events.find(e => e.card === 'execute');
  assert.ok(ev.combo); assert.equal(ev.partnerCard, 'mark');
  // the striker marking does not power the striker's own Execute
  const self = rig(newRun(1), { warden: ['guard'], striker: ['expose', 'execute'] });
  assert.equal(resolve(self, { warden: [0], striker: [0, 1] }).events.find(e => e.card === 'execute').combo, false);
});

test('setup lands before damage whoever plays it', () => {
  const s = rig(newRun(1), { warden: ['crush'], striker: ['expose'] });
  const r = resolve(s, { warden: [0], striker: [0] }).state;
  assert.equal(r.enemy.hp, s.enemy.max - Math.floor(18 * 1.5)); // the Striker's mark turns on the Warden's Crushing Blow
});

test('reckless recoil is cancelled by a partner guard', () => {
  const s = rig(versus('slime'), { warden: ['mark', 'guard'], striker: ['reckless'] });
  const hp0 = s.hp, atk = describeIntent(s.enemy).find(p => p.k === 'atk').total;
  const solo = resolve(s, { warden: [0], striker: [0] }).state;
  assert.equal(solo.hp, hp0 - 5 - atk);
  const guarded = resolve(s, { warden: [1], striker: [0] }).state;
  assert.equal(guarded.hp, hp0 - Math.max(0, atk - 5));
});

test('energy limits picks, Dread cannot be played; enemy follows its intents and loops', () => {
  const s = rig(newRun(1), { warden: ['hold', 'guard', 'guard', 'dread'], striker: ['strike'] });
  assert.equal(validPick(s, 'warden', [0, 1]), true);
  assert.equal(validPick(s, 'warden', [0, 1, 2]), false);
  assert.equal(validPick(s, 'warden', [1, 1]), false);
  assert.equal(validPick(s, 'warden', [3]), false);
  let r = newRun(1); const seen = [];
  const loop = ENEMIES[r.enemy.key].intents.length;
  for (let k = 0; k <= loop; k++) { seen.push(intentOf(r.enemy)); r = resolve(r, { warden: [], striker: [] }).state; if (r.stage !== 'fight') break; }
  if (seen.length > loop) assert.deepEqual(seen[loop], seen[ENEMIES[newRun(1).enemy.key].loopFrom]);
  assert.match(intentWords(newRun(1).enemy), /^Will /);
});

test('poison ticks through block; ghost turns cap hits at 1; thorns and drain bite back', () => {
  let s = rig(versus('sentinel'), { warden: ['venom'], striker: ['feint'] });
  s = resolve(s, { warden: [0], striker: [0] }).state;      // venom combo: poison 8, ticks 8 at once
  assert.equal(s.enemy.poison, 7);
  assert.equal(s.enemy.hp, ENEMIES.sentinel.hp - 3 - 8);

  const w = rig(versus('wisp'), { warden: [], striker: ['heavy'] });
  assert.equal(intentOf(w.enemy).ghost, true);
  assert.equal(resolve(w, { warden: [], striker: [0] }).state.enemy.hp, ENEMIES.wisp.hp - 1);

  const c = rig(versus('crab'), { warden: [], striker: ['dagger'] });
  const cr = resolve(c, { warden: [], striker: [0] });
  assert.ok(cr.events.some(e => /spikes/.test(e.text)));
  assert.equal(cr.state.hp, c.hp - 2 * ENEMIES.crab.thorns - 9); // thorns from both dagger hits, then its 9 attack

  const b = rig(versus('bat'), { warden: [], striker: ['strike'] });
  const br = resolve(b, { warden: [], striker: [0] }).state;
  assert.equal(br.enemy.hp, ENEMIES.bat.hp); // took 6, then drank back the 5x2 that got through (capped at its max)
});

test('the hexer curses both decks for the fight only', () => {
  let s = versus('hexer');
  s = resolve(s, { warden: [], striker: [] }).state;
  for (const seat of SEATS) assert.ok([...s.piles[seat].discard, ...s.piles[seat].hand, ...s.piles[seat].draw].includes('dread'));
  assert.ok(!s.decks.warden.includes('dread'));
});

test('the map branches and both players choose the way', () => {
  const s = newRun(5);
  assert.equal(s.map.length, LAYOUT.length);
  assert.equal(newRun(5, { tutorial: true }).map.length, LAYOUT.length + 1);
  const won = { ...structuredClone(s), stage: 'map' };
  assert.equal(nextOptions(won).length, 2);
  const right = advance(won, 1);
  assert.equal(right.floor, 1); assert.equal(nodeOf(right).type, nextOptions(won)[1].type);
  assert.equal(advance(won, 5), won); // out of range: nothing happens
});

test('events, campfire upgrades and relics change the run', () => {
  const base = { ...newRun(3), stage: 'event', hp: 30 };
  for (const [key, ev] of Object.entries(EVENTS)) for (const o of ev.options) {
    const r = chooseEvent({ ...structuredClone(base), event: key }, o.id);
    assert.equal(r.stage, 'map', `${key}/${o.id}`); assert.ok(r.note, `${key}/${o.id} says nothing`);
    assert.ok(r.hp > 0 && r.hp <= r.maxHp);
  }
  assert.equal(chooseEvent({ ...structuredClone(base), event: 'shrine' }, 'pray').hp, 45);
  const fire = rest({ ...newRun(3), stage: 'rest' }, 'upgrade');
  assert.equal(fire.stage, 'upgrade');
  const up = chooseUpgrade(fire, { warden: 0, striker: null });
  assert.equal(up.decks.warden[0], 'guard+'); assert.equal(up.stage, 'map');
});

test('the tutorial deals hands that can land Mark + Execute', () => {
  const s = newRun(9, { tutorial: true });
  assert.equal(s.enemy.key, 'dummy');
  assert.ok(s.piles.warden.hand.includes('mark')); assert.ok(s.piles.striker.hand.includes('execute'));
  const r = resolve(s, { warden: [s.piles.warden.hand.indexOf('mark')], striker: [s.piles.striker.hand.indexOf('execute')] });
  assert.ok(r.events.find(e => e.card === 'execute').combo);
});

// Bots. Greedy: spends all energy on its own best cards, blind to the partner. Coordinated: also knows the
// partner's hand (as talking would tell them) and values combos it can complete.
function bestPick(s, seat, partnerTags = new Set()) {
  const hand = s.piles[seat].hand, intent = describeIntent(s.enemy), want = intent.find(p => p.k === 'atk')?.total || 0, ghost = intent.some(p => p.k === 'ghost');
  const score = id => {
    const c = card(id); if (c.unplayable) return -99;
    const f = c.combo && partnerTags.has(c.combo.tag) ? { ...c.fx, ...c.combo.fx } : c.fx;
    return (ghost ? 0.1 : 1) * (f.dmg || 0) * (f.hits || 1) + (f.poison || 0) * 1.5 + (f.block || 0) * (want > 8 ? 1.2 : 0.4)
      + (f.vuln || 0) * 3 + (f.weak || 0) * 2 + (f.heal || 0) * 0.5 + (f.tempStr || 0) * 3 - (f.selfDmg || 0);
  };
  const order = hand.map((id, i) => i).sort((a, b) => score(hand[b]) - score(hand[a]));
  const pick = []; let e = s.energy[seat];
  for (const i of order) if (score(hand[i]) > 0 && card(hand[i]).cost <= e) { pick.push(i); e -= card(hand[i]).cost; }
  return pick;
}
// Talking it over, as a search: try every pair of affordable picks (up to 3 cards each) and keep the pair that
// does the most, scored with the same combo rules as resolve().
function subsets(s, seat) {
  const hand = s.piles[seat].hand, out = [[]];
  const rec = (start, cur, cost) => { for (let i = start; i < hand.length; i++) { const c = card(hand[i]); if (c.unplayable || cost + c.cost > s.energy[seat] || cur.length >= 3) continue; const n = [...cur, i]; out.push(n); rec(i + 1, n, cost + c.cost); } };
  rec(0, [], 0);
  return out;
}
function value(s, picks) {
  const e = s.enemy, intent = describeIntent(e), incoming = intent.find(p => p.k === 'atk')?.total || 0, ghost = intent.some(p => p.k === 'ghost');
  const ids = Object.fromEntries(SEATS.map(seat => [seat, picks[seat].map(i => s.piles[seat].hand[i])]));
  const tags = Object.fromEntries(SEATS.map(seat => [seat, new Set(ids[seat].flatMap(id => card(id).tags))]));
  const fxs = SEATS.flatMap(seat => ids[seat].map(id => { const c = card(id); return c.combo && tags[partnerOf(seat)].has(c.combo.tag) ? { ...c.fx, ...c.combo.fx } : c.fx; }));
  let str = s.str, vuln = e.vuln, block = 0, dmg = 0, v = 0;
  for (const f of fxs) { str += f.tempStr || 0; vuln += f.vuln || 0; block += f.block || 0; v += (f.weak || 0) * 2 + (f.poison || 0) * 2 + (f.heal || 0) * 0.6 - (f.selfDmg || 0) + (f.vuln || 0) * 2 + (f.drawNext || 0) + (f.energyNext || 0) * 2; }
  for (const f of fxs) if (f.dmg) for (let k = 0; k < (f.hits || 1); k++) { let d = f.dmg + str; if (vuln) d = Math.floor(d * 1.5); dmg += ghost ? 1 : d; }
  return Math.min(dmg, e.hp + e.block) + Math.min(block, incoming) * 1.1 + v + (dmg >= e.hp + e.block ? 50 : 0);
}
function coordinated(s) {
  let best = null, bv = -Infinity;
  for (const w of subsets(s, 'warden')) for (const st of subsets(s, 'striker')) { const v = value(s, { warden: w, striker: st }); if (v > bv) { bv = v; best = { warden: w, striker: st }; } }
  return best;
}
// Playing blind: each picks their own best cards by the same scoring, as if the partner played nothing.
function blind(s) {
  const one = seat => { let best = [], bv = -Infinity; for (const p of subsets(s, seat)) { const v = value(s, { warden: [], striker: [], [seat]: p }); if (v > bv) { bv = v; best = p; } } return best; };
  return { warden: one('warden'), striker: one('striker') };
}
function playRun(seed, picker) {
  let s = newRun(seed);
  for (let step = 0; step < 500 && !['won', 'lost'].includes(s.stage); step++) {
    if (s.stage === 'fight') s = resolve(s, picker(s)).state;
    else if (s.stage === 'reward') s = chooseReward(s, { warden: s.rewards.warden[0], striker: s.rewards.striker[0] });
    else if (s.stage === 'relic') s = chooseRelic(s, s.relicChoices[0]);
    else if (s.stage === 'rest') s = rest(s, s.hp < 40 ? 'heal' : 'upgrade');
    else if (s.stage === 'upgrade') s = chooseUpgrade(s, { warden: 0, striker: 0 });
    else if (s.stage === 'event') s = chooseEvent(s, EVENTS[s.event].options[0].id);
    else if (s.stage === 'map') s = advance(s, 0);
  }
  return s;
}

test('fight 1 is winnable with plain play', () => {
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) {
    let s = newRun(seed);
    for (let t = 0; t < 30 && s.stage === 'fight'; t++) s = resolve(s, { warden: bestPick(s, 'warden'), striker: bestPick(s, 'striker') }).state;
    if (s.stage === 'reward') wins++;
  }
  assert.ok(wins >= 18, `won fight 1 in only ${wins}/20 seeds`);
});

test('talking it over wins more runs than playing blind', () => {
  const N = 120, tally = { greedy: 0, coordinated: 0 }, turns = [];
  for (let seed = 1; seed <= N; seed++) {
    if (playRun(seed, blind).stage === 'won') tally.greedy++;
    const c = playRun(seed, coordinated);
    if (c.stage === 'won') { tally.coordinated++; turns.push(c.stats.turns); }
  }
  const avg = turns.length ? (turns.reduce((a, b) => a + b, 0) / turns.length).toFixed(1) : '-';
  console.log(`runs won over ${N} seeds: greedy ${tally.greedy}, coordinated ${tally.coordinated}; winning runs average ${avg} turns`);
  assert.ok(tally.coordinated > tally.greedy, 'coordination should pay off');
  assert.ok(tally.coordinated < N, 'the climb should not be a sure thing');
});
