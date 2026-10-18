// Co-op Spire: the rules, as pure functions over plain JSON (no DOM), so the board can save the run as-is and
// node --test can play it. The board is the only place they run.
//
// Two players climb together with one shared health bar. Each turn both pick cards from their own hand in secret
// (energy 3 each), then reveal: the Warden sets up (block, weaken, mark), the Striker hits, and many cards combo
// only when the partner played the matching tag the same turn. Setup effects from both hands land before any
// damage, so "I'll mark, you hit" works whoever marks. Then the enemy does what its intent said.

import { CARDS, STARTERS, REWARDS, ENEMIES, RELICS, MAP } from './cards.js';

export const SEATS = ['warden', 'striker'];
export const PHASES = [{ name: 'plan', seats: SEATS }];
export const VOTE = [{ name: 'vote', seats: SEATS }];
export const ENERGY = 3, HAND = 5, MAX_HP = 60;
export const partnerOf = seat => (seat === 'warden' ? 'striker' : 'warden');

// mulberry32, with its state kept in the run so a reload replays the same shuffles
export function rand(s) {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function newRun(seed = Date.now()) {
  const s = {
    seed: seed | 0, floor: 0, hp: MAX_HP, maxHp: MAX_HP, str: 0, relics: [], stage: 'map',
    decks: structuredClone(STARTERS), piles: null, energy: null, bonusEnergy: 0, enemy: null, block: 0, turn: 0,
    rewards: null, relicChoices: null, hints: {}, why: '',
  };
  return enterNode(s);
}

export const nodeOf = s => MAP[s.floor];

function enterNode(s) {
  const node = nodeOf(s);
  if (node.type === 'rest') { s.stage = 'rest'; return s; }
  const e = ENEMIES[node.enemy];
  s.enemy = { key: node.enemy, hp: e.hp, max: e.hp, block: 0, str: 0, weak: 0, vuln: 0, i: 0 };
  s.piles = Object.fromEntries(SEATS.map(seat => [seat, { draw: shuffle(s, [...s.decks[seat]]), hand: [], discard: [] }]));
  s.block = s.relics.includes('anchor') ? 10 : 0;
  s.turn = 1; s.stage = 'fight'; s.hints = {};
  s.energy = Object.fromEntries(SEATS.map(seat => [seat, ENERGY + (s.relics.includes('lantern') ? 1 : 0)]));
  drawHands(s);
  return s;
}

function drawHands(s) {
  for (const seat of SEATS) {
    const p = s.piles[seat];
    p.discard.push(...p.hand); p.hand = [];
    for (let k = 0; k < HAND; k++) {
      if (!p.draw.length) { if (!p.discard.length) break; p.draw = shuffle(s, p.discard); p.discard = []; }
      p.hand.push(p.draw.pop());
    }
  }
}

export const intentOf = enemy => ENEMIES[enemy.key].intents[enemy.i];

// What the intent means in numbers right now (Strength and Weak included), for the TV and the phones.
export function describeIntent(enemy) {
  const it = intentOf(enemy), parts = [];
  if (it.atk) { const per = Math.floor((it.atk + enemy.str) * (enemy.weak ? 0.75 : 1)); parts.push({ k: 'atk', text: it.hits ? `${per}×${it.hits}` : `${per}`, total: per * (it.hits || 1) }); }
  if (it.block) parts.push({ k: 'block', text: `${it.block}` });
  if (it.buff) parts.push({ k: 'buff', text: `+${it.buff}` });
  if (it.charge) parts.push({ k: 'charge', text: 'tolling…' });
  return parts;
}

// A pick is a list of distinct indexes into the hand whose costs fit the seat's energy.
export function validPick(s, seat, idxs) {
  if (!Array.isArray(idxs) || s.stage !== 'fight') return false;
  const hand = s.piles[seat].hand;
  if (new Set(idxs).size !== idxs.length || idxs.some(i => !Number.isInteger(i) || i < 0 || i >= hand.length)) return false;
  return idxs.reduce((n, i) => n + CARDS[hand[i]].cost, 0) <= s.energy[seat];
}

// Both picks revealed: resolve the players' cards, then the enemy's turn. Returns {state, events, mid}: one event per
// card played ({seat, card, combo, text}) then the enemy's ({seat: 'enemy', text}) and the outcome; mid is the bars
// between the two halves.
export function resolve(s0, picks) {
  const s = structuredClone(s0), e = s.enemy, events = [];
  const played = Object.fromEntries(SEATS.map(seat => [seat, (picks[seat] || []).map(i => s.piles[seat].hand[i])]));
  const tags = Object.fromEntries(SEATS.map(seat => [seat, new Set(played[seat].flatMap(id => CARDS[id].tags))]));
  let tempStr = 0, combos = 0;

  const plays = SEATS.flatMap(seat => played[seat].map(id => {
    const c = CARDS[id], combo = !!(c.combo && tags[partnerOf(seat)].has(c.combo.tag));
    return { seat, card: id, combo, fx: combo ? { ...c.fx, ...c.combo.fx } : c.fx, out: [] };
  }));
  const hit = (p, n, useStr = true) => {
    let d = Math.max(0, n + (useStr ? s.str + tempStr : 0));
    if (e.vuln) d = Math.floor(d * 1.5);
    const soak = Math.min(e.block, d); e.block -= soak; e.hp -= d - soak;
    p.dealt = (p.dealt || 0) + d;
  };

  // pass 1: everything but damage, from both hands
  for (const p of plays) {
    const fx = p.fx;
    if (fx.block) { s.block += fx.block; p.out.push(`+${fx.block} block`); }
    if (fx.tempStr) { tempStr += fx.tempStr; p.out.push(`+${fx.tempStr} Strength`); }
    if (fx.vuln) { e.vuln += fx.vuln; p.out.push(`Vulnerable ${fx.vuln}`); }
    if (fx.weak) { e.weak += fx.weak; p.out.push(`Weak ${fx.weak}`); }
    if (fx.heal) { const h = Math.min(fx.heal, s.maxHp - s.hp); s.hp += h; p.out.push(`heal ${fx.heal}`); }
    if (fx.selfDmg) { s.hp -= fx.selfDmg; p.out.push(`recoil ${fx.selfDmg}`); }
    if (fx.energyNext) { s.bonusEnergy += fx.energyNext; p.out.push(`+${fx.energyNext} energy next turn`); }
    if (p.combo) {
      combos++;
      if (s.relics.includes('ring')) s.hp = Math.min(s.maxHp, s.hp + 2);
      if (combos === 1 && s.relics.includes('bells')) p.bells = true;
    }
  }
  // pass 2: damage, from both hands
  for (const p of plays) {
    if (p.fx.dmg) for (let k = 0; k < (p.fx.hits || 1); k++) hit(p, p.fx.dmg);
    if (p.fx.blockToDmg) hit(p, s.block, false);
    if (p.bells) hit(p, 5, false);
    if (p.dealt) p.out.unshift(`${p.dealt} damage`);
  }
  for (const p of plays) events.push({ seat: p.seat, card: p.card, combo: p.combo, text: p.out.join(', ') || 'no effect' });
  for (const seat of SEATS) { const pl = s.piles[seat]; for (const i of [...(picks[seat] || [])].sort((a, b) => b - a)) pl.discard.push(...pl.hand.splice(i, 1)); }
  // the bars as they stand once the players' cards have landed, for the reveal to show before the enemy acts
  const mid = { enemyHp: Math.max(0, e.hp), enemyBlock: e.block, hp: Math.max(0, s.hp), block: s.block };

  if (e.hp <= 0) { e.hp = 0; return { state: winFight(s, events), events, mid }; }
  if (s.hp <= 0) return { state: lose(s, 'The party fell to its own recklessness.'), events, mid };

  // the enemy's turn
  const it = intentOf(e), info = ENEMIES[e.key], said = [];
  e.block = 0;
  if (it.block) { e.block += it.block; said.push(`gains ${it.block} block`); }
  if (it.atk) {
    const per = Math.floor((it.atk + e.str) * (e.weak ? 0.75 : 1));
    let taken = 0;
    for (let k = 0; k < (it.hits || 1); k++) { const soak = Math.min(s.block, per); s.block -= soak; s.hp -= per - soak; taken += per - soak; }
    said.push(`attacks for ${per}${it.hits ? '×' + it.hits : ''} (${taken} got through)`);
  }
  if (it.buff) { e.str += it.buff; said.push(`grows stronger (+${it.buff})`); }
  if (it.charge) said.push('begins to toll… something big is coming');
  events.push({ seat: 'enemy', text: `${info.name} ${said.join(', ')}.` });
  e.i = e.i + 1 < info.intents.length ? e.i + 1 : info.loopFrom;
  e.vuln = Math.max(0, e.vuln - 1); e.weak = Math.max(0, e.weak - 1);
  s.block = 0;
  if (s.hp <= 0) return { state: lose(s, `${info.name} was too much this time.`), events, mid };

  s.turn++; s.hints = {};
  for (const seat of SEATS) s.energy[seat] = ENERGY + s.bonusEnergy;
  s.bonusEnergy = 0;
  drawHands(s);
  return { state: s, events, mid };
}

function lose(s, why) { s.hp = 0; s.stage = 'lost'; s.why = why; return s; }

function winFight(s, events) {
  events.push({ seat: 'enemy', text: `${ENEMIES[s.enemy.key].name} is defeated!` });
  s.block = 0; s.bonusEnergy = 0; s.hints = {};
  if (nodeOf(s).type === 'boss') { s.stage = 'won'; s.why = 'The Hollow Bell falls silent. You reached the top together.'; return s; }
  s.stage = 'reward';
  s.rewards = Object.fromEntries(SEATS.map(seat => [seat, shuffle(s, [...new Set(REWARDS[seat])]).slice(0, 3)]));
  return s;
}

// choices: {warden: card id or null (skip), striker: ...}
export function chooseReward(s0, choices) {
  const s = structuredClone(s0);
  for (const seat of SEATS) if (s.rewards[seat].includes(choices[seat])) s.decks[seat].push(choices[seat]);
  s.rewards = null;
  if (nodeOf(s).type === 'elite') {
    s.stage = 'relic';
    s.relicChoices = shuffle(s, Object.keys(RELICS).filter(r => !s.relics.includes(r))).slice(0, 2);
  } else s.stage = 'map';
  return s;
}

export function chooseRelic(s0, id) {
  const s = structuredClone(s0);
  if (!s.relicChoices.includes(id)) return s;
  s.relics.push(id); if (id === 'whetstone') s.str++;
  s.relicChoices = null; s.stage = 'map';
  return s;
}

export const REST = { heal: 'Rest: heal 20', sharpen: 'Sharpen: party +1 Strength for the run' };
export function rest(s0, choice) {
  const s = structuredClone(s0);
  if (choice === 'heal') s.hp = Math.min(s.maxHp, s.hp + 20);
  else if (choice === 'sharpen') s.str++;
  else return s;
  s.stage = 'map';
  return s;
}

// From the map screen (a good stopping point) to the next floor.
export function advance(s0) {
  const s = structuredClone(s0);
  if (s.stage !== 'map') return s;
  s.floor++;
  return enterNode(s);
}

export function hint(s0, seat, emoji) {
  const s = structuredClone(s0);
  s.hints[seat] = emoji;
  return s;
}
