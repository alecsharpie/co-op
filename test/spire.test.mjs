// Rules checks for Co-op Spire: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, resolve, validPick, chooseReward, chooseRelic, rest, advance, describeIntent, intentOf, SEATS, partnerOf } from '../spire/game.js';
import { CARDS } from '../spire/cards.js';

// put chosen cards in hand, so tests do not depend on the shuffle
const rig = (s, hands) => { for (const seat of SEATS) if (hands[seat]) s.piles[seat].hand = [...hands[seat]]; return s; };

test('same seed, same run', () => {
  assert.deepEqual(newRun(42).piles, newRun(42).piles);
  assert.notDeepEqual(newRun(42).piles, newRun(43).piles);
  const a = newRun(7), b = newRun(7), p = { warden: [0], striker: [0] };
  assert.deepEqual(resolve(a, p), resolve(b, p));
});

test('a combo fires only when the partner plays the matching tag', () => {
  const base = rig(newRun(1), { warden: ['mark', 'guard'], striker: ['execute', 'strike'] });
  const alone = resolve(base, { warden: [1], striker: [0] }).state;   // guard + execute: 7
  assert.equal(alone.enemy.hp, base.enemy.max - 7);
  const both = resolve(base, { warden: [0], striker: [0] });           // mark + execute: 15, vulnerable x1.5
  assert.equal(both.state.enemy.hp, base.enemy.max - Math.floor(15 * 1.5));
  assert.ok(both.events.find(e => e.card === 'execute').combo);
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
  const s = rig(newRun(1), { warden: ['mark', 'guard'], striker: ['reckless'] });
  const hp0 = s.hp, atk = describeIntent(s.enemy)[0].total;
  const solo = resolve(s, { warden: [0], striker: [0] }).state;
  assert.equal(solo.hp, hp0 - 5 - atk);
  const guarded = resolve(s, { warden: [1], striker: [0] }).state;
  assert.equal(guarded.hp, hp0 - Math.max(0, atk - 5));
});

test('energy limits picks; enemy follows its intents and loops', () => {
  const s = rig(newRun(1), { warden: ['hold', 'guard', 'guard'], striker: ['strike'] });
  assert.equal(validPick(s, 'warden', [0, 1]), true);
  assert.equal(validPick(s, 'warden', [0, 1, 2]), false);
  assert.equal(validPick(s, 'warden', [1, 1]), false);
  let r = newRun(1); const seen = [];
  for (let k = 0; k < 4; k++) { seen.push(intentOf(r.enemy)); r = resolve(r, { warden: [], striker: [] }).state; }
  assert.deepEqual(seen[3], seen[0]);
  assert.equal(r.turn, 5);
});

// A simple greedy pair: spend all energy, damage and combos first, guard when a big hit is coming.
function autoPick(s, seat) {
  const hand = s.piles[seat].hand, want = describeIntent(s.enemy).find(p => p.k === 'atk')?.total || 0;
  const score = id => { const c = CARDS[id], f = c.fx; return (f.dmg || 0) * (f.hits || 1) + (c.combo ? 6 : 0) + (f.block || 0) * (want > 8 ? 1.2 : 0.4) + (c.tags.length ? 3 : 0); };
  const order = hand.map((id, i) => i).sort((a, b) => score(hand[b]) - score(hand[a]));
  const pick = []; let e = s.energy[seat];
  for (const i of order) if (CARDS[hand[i]].cost <= e) { pick.push(i); e -= CARDS[hand[i]].cost; }
  return pick;
}

test('fight 1 is winnable with plain play', () => {
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) {
    let s = newRun(seed);
    for (let t = 0; t < 30 && s.stage === 'fight'; t++) s = resolve(s, { warden: autoPick(s, 'warden'), striker: autoPick(s, 'striker') }).state;
    if (s.stage === 'reward') wins++;
  }
  assert.ok(wins >= 18, `won fight 1 in only ${wins}/20 seeds`);
});

test('a whole run can be played start to finish', () => {
  const tally = { won: 0, lost: 0 }, floors = [];
  for (let seed = 1; seed <= 30; seed++) {
    let s = newRun(seed);
    for (let step = 0; step < 300 && !['won', 'lost'].includes(s.stage); step++) {
      if (s.stage === 'fight') s = resolve(s, { warden: autoPick(s, 'warden'), striker: autoPick(s, 'striker') }).state;
      else if (s.stage === 'reward') s = chooseReward(s, { warden: s.rewards.warden[0], striker: s.rewards.striker[0] });
      else if (s.stage === 'relic') s = chooseRelic(s, s.relicChoices[0]);
      else if (s.stage === 'rest') s = rest(s, s.hp < 40 ? 'heal' : 'sharpen');
      else if (s.stage === 'map') s = advance(s);
    }
    tally[s.stage]++; floors.push(s.floor);
  }
  console.log('greedy bots over 30 seeds:', tally, 'floors reached', floors.join(''));
  assert.equal(tally.won + tally.lost, 30);
});
