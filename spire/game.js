// Co-op Spire: the rules, as pure functions over plain JSON (no DOM), so the board can save the run as-is and
// node --test can play it. The board is the only place they run.
//
// Two players climb together with one shared health bar. Each turn both pick cards from their own hand in secret
// (energy 3 each), then reveal: the Warden sets up (block, weaken, mark), the Striker hits, and many cards combo
// only when the partner played the matching tag the same turn. Setup effects from both hands land before any
// damage, so "I'll mark, you hit" works whoever marks. Poison ticks, then the enemy does what its intent said.
// Between fights: a branching map chosen together, card rewards, campfires (heal or upgrade), ? events, relics.

import { card, canUpgrade, STARTERS, REWARDS, ENEMIES, POOLS, RELICS, EVENTS, LAYOUT } from './cards.js';

export const SEATS = ['warden', 'striker'];
export const PHASES = [{ name: 'plan', seats: SEATS }];
export const VOTE = [{ name: 'vote', seats: SEATS }];
export const ENERGY = 3, HAND = 5, MAX_HP = 60, MAX_ASC = 5;
// difficulty at Ascension 0: enemy HP multiplier and extra damage per hit (tuned with the bots in test/)
export const TUNE = { hp: 1.15, str: 0 };
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
const pickFrom = (s, list) => list[Math.floor(rand(s) * list.length)];

// The map: LAYOUT's slots with enemies and events drawn from the seed (no repeats within a run). The first run
// opens with a training fight against a dummy, with set hands that teach a combo.
function makeMap(s, tutorial) {
  const used = new Set(), events = shuffle(s, Object.keys(EVENTS));
  const enemy = pool => { const left = POOLS[pool].filter(k => !used.has(k)); const k = pickFrom(s, left.length ? left : POOLS[pool]); used.add(k); return k; };
  const rows = LAYOUT.map((slots, floor) => slots.map(type =>
    type === 'fight' ? { type, enemy: enemy(floor < 3 ? 'early' : 'late') }
    : type === 'elite' ? { type, enemy: enemy('elite') }
    : type === 'boss' ? { type, enemy: 'bell' }
    : type === 'event' ? { type, event: events.pop() }
    : { type }));
  return tutorial ? [[{ type: 'tutorial', enemy: 'dummy' }], ...rows] : rows;
}

export function newRun(seed = Date.now(), { asc = 0, tutorial = false } = {}) {
  const s = {
    v: 2, seed: seed | 0, asc: Math.max(0, Math.min(MAX_ASC, asc | 0)), floor: 0, path: [0],
    hp: MAX_HP, maxHp: MAX_HP, str: 0, relics: [], stage: 'map',
    decks: structuredClone(STARTERS), piles: null, energy: null, bonusEnergy: 0, bonusDraw: 0, enemy: null, block: 0, turn: 0,
    rewards: null, relicChoices: null, upgrades: null, event: null, note: '', hints: {}, why: '',
    stats: { turns: 0, combos: 0, dealt: 0, taken: 0, fights: 0 }, fight: null, lastFight: null,
  };
  s.map = makeMap(s, tutorial);
  return enterNode(s);
}

export const nodeOf = s => s.map[s.floor][s.path[s.floor] ?? 0];
export const nextOptions = s => s.map[s.floor + 1] || [];
export const isTutorial = s => nodeOf(s).type === 'tutorial';

function enterNode(s) {
  const node = nodeOf(s);
  s.note = '';
  if (node.type === 'rest') { s.stage = 'rest'; return s; }
  if (node.type === 'event') { s.stage = 'event'; s.event = node.event; return s; }
  const e = ENEMIES[node.enemy], hp = Math.round(e.hp * (TUNE.hp + 0.1 * s.asc));
  s.enemy = { key: node.enemy, hp, max: hp, block: 0, str: TUNE.str + Math.ceil(s.asc / 2), weak: 0, vuln: 0, poison: 0, i: 0 };
  s.piles = Object.fromEntries(SEATS.map(seat => [seat, { draw: shuffle(s, [...s.decks[seat]]), hand: [], discard: [] }]));
  if (node.type === 'tutorial') {
    // set hands for turn 1: the Warden can Mark, the Striker can Execute (draw pops from the end)
    const rig = { warden: ['mark', 'guard', 'bash', 'guard', 'guard'], striker: ['execute', 'strike', 'defend', 'feint', 'strike'] };
    for (const seat of SEATS) {
      const rest = [...s.decks[seat]];
      for (const id of rig[seat]) rest.splice(rest.indexOf(id), 1);
      s.piles[seat].draw = [...shuffle(s, rest), ...rig[seat].reverse()];
    }
  }
  s.block = s.relics.includes('anchor') ? 10 : 0;
  s.turn = 1; s.stage = 'fight'; s.hints = {}; s.bonusEnergy = 0; s.bonusDraw = 0;
  s.fight = { turns: 0, combos: 0, dealt: 0, taken: 0 };
  s.energy = Object.fromEntries(SEATS.map(seat => [seat, ENERGY + (s.relics.includes('lantern') ? 1 : 0)]));
  drawHands(s);
  return s;
}

function drawHands(s) {
  const n = HAND + (s.relics.includes('quill') ? 1 : 0) + s.bonusDraw;
  s.bonusDraw = 0;
  for (const seat of SEATS) {
    const p = s.piles[seat];
    p.discard.push(...p.hand); p.hand = [];
    for (let k = 0; k < n; k++) {
      if (!p.draw.length) { if (!p.discard.length) break; p.draw = shuffle(s, p.discard); p.discard = []; }
      p.hand.push(p.draw.pop());
    }
  }
}

export const intentOf = enemy => ENEMIES[enemy.key].intents[enemy.i];
const perHit = (enemy, it) => Math.floor((it.atk + enemy.str) * (enemy.weak ? 0.75 : 1));

// What the intent means right now (Strength and Weak included), for the TV and the phones: short parts for the
// badge ({k, text}) and a sentence in words.
export function describeIntent(enemy) {
  const it = intentOf(enemy), parts = [];
  if (it.ghost) parts.push({ k: 'ghost', text: 'fading', say: 'fade away: your hits deal only 1 this turn' });
  if (it.atk) {
    const per = perHit(enemy, it), n = it.hits || 1;
    parts.push({ k: 'atk', text: n > 1 ? `${per}×${n}` : `${per}`, total: per * n,
      say: (n > 1 ? `attack ${n} times for ${per} (${per * n} in all)` : `attack for ${per}`) + (it.drain ? ' and heal by what gets through' : '') });
  }
  if (it.block) parts.push({ k: 'block', text: `${it.block}`, say: `block ${it.block}` });
  if (it.buff) parts.push({ k: 'buff', text: `+${it.buff}`, say: `gain ${it.buff} Strength` });
  if (it.curse) parts.push({ k: 'curse', text: 'curse', say: `curse each of you with ${it.curse} Dread card` });
  if (it.charge) {
    const nx = ENEMIES[enemy.key].intents[enemy.i + 1];
    parts.push({ k: 'charge', text: 'tolling…', say: `toll: next turn it strikes for ${nx?.atk ? perHit(enemy, nx) : 'a lot'}! Plan your Block` });
  }
  return parts;
}
export const intentWords = enemy => 'Will ' + describeIntent(enemy).map(p => p.say).join(', then ') + '.';

// A pick is a list of distinct indexes into the hand whose costs fit the seat's energy.
export function validPick(s, seat, idxs) {
  if (!Array.isArray(idxs) || s.stage !== 'fight') return false;
  const hand = s.piles[seat].hand;
  if (new Set(idxs).size !== idxs.length || idxs.some(i => !Number.isInteger(i) || i < 0 || i >= hand.length || card(hand[i]).unplayable)) return false;
  return idxs.reduce((n, i) => n + card(hand[i]).cost, 0) <= s.energy[seat];
}

// Both picks revealed: resolve the players' cards, poison, then the enemy's turn. Returns {state, events, mid}: one
// event per card played ({seat, card, combo, partnerCard, text}) then the enemy's ({seat: 'enemy', text}) and the
// outcome; mid is the bars between the two halves.
export function resolve(s0, picks) {
  const s = structuredClone(s0), e = s.enemy, info = ENEMIES[e.key], it0 = intentOf(e), events = [];
  const played = Object.fromEntries(SEATS.map(seat => [seat, (picks[seat] || []).map(i => s.piles[seat].hand[i])]));
  const tags = Object.fromEntries(SEATS.map(seat => [seat, new Set(played[seat].flatMap(id => card(id).tags))]));
  let tempStr = s.turn === 1 && s.relics.includes('drum') ? 2 : 0, combos = 0, thorns = 0;

  const plays = SEATS.flatMap(seat => played[seat].map(id => {
    const c = card(id), combo = !!(c.combo && tags[partnerOf(seat)].has(c.combo.tag));
    // which partner card set it off, for the reveal to show the pair
    const partnerCard = combo ? played[partnerOf(seat)].find(p => card(p).tags.includes(c.combo.tag)) : null;
    return { seat, card: id, combo, partnerCard, fx: combo ? { ...c.fx, ...c.combo.fx } : c.fx, out: [] };
  }));
  const hit = (p, n, useStr = true) => {
    let d = Math.max(0, n + (useStr ? s.str + tempStr : 0));
    if (e.vuln) d = Math.floor(d * 1.5);
    if (it0.ghost) d = Math.min(d, 1);
    const soak = Math.min(e.block, d); e.block -= soak; e.hp -= d - soak;
    p.dealt = (p.dealt || 0) + d;
    if (info.thorns) thorns += info.thorns;
  };

  // pass 1: everything but damage, from both hands
  for (const p of plays) {
    const fx = p.fx;
    if (fx.block) { s.block += fx.block; p.out.push(`+${fx.block} Block`); }
    if (fx.tempStr) { tempStr += fx.tempStr; p.out.push(`+${fx.tempStr} Strength`); }
    if (fx.vuln) { e.vuln += fx.vuln; p.out.push(`Vulnerable ${fx.vuln}`); }
    if (fx.weak) { e.weak += fx.weak; p.out.push(`Weak ${fx.weak}`); }
    if (fx.poison) { e.poison += fx.poison; p.out.push(`Poison ${fx.poison}`); }
    if (fx.heal) { const h = Math.min(fx.heal, s.maxHp - s.hp); s.hp += h; p.out.push(`heal ${fx.heal}`); }
    if (fx.selfDmg) { s.hp -= fx.selfDmg; s.fight.taken += fx.selfDmg; p.out.push(`recoil ${fx.selfDmg}`); }
    if (fx.energyNext) { s.bonusEnergy += fx.energyNext; p.out.push(`+${fx.energyNext} energy next turn`); }
    if (fx.drawNext) { s.bonusDraw += fx.drawNext; p.out.push(`draw +${fx.drawNext} next turn`); }
    if (p.combo) {
      combos++;
      if (s.relics.includes('ring')) s.hp = Math.min(s.maxHp, s.hp + 2);
      if (combos === 1 && s.relics.includes('bells')) p.bells = true;
    }
  }
  // pass 2: damage, from both hands (the summary counts only HP actually taken off, not overkill or Block)
  const hpBefore = e.hp;
  for (const p of plays) {
    if (p.fx.dmg) for (let k = 0; k < (p.fx.hits || 1); k++) hit(p, p.fx.dmg);
    if (p.fx.blockToDmg) hit(p, s.block, false);
    if (p.bells) hit(p, 5, false);
    if (p.dealt) p.out.unshift(`${p.dealt} damage`);
    if (it0.ghost && p.dealt) p.out.push('(it fades: 1 per hit)');
  }
  s.fight.dealt += Math.max(0, hpBefore - Math.max(0, e.hp));
  for (const p of plays) events.push({ seat: p.seat, card: p.card, combo: p.combo, partnerCard: p.partnerCard, text: p.out.join(', ') || 'no effect' });
  for (const seat of SEATS) { const pl = s.piles[seat]; for (const i of [...(picks[seat] || [])].sort((a, b) => b - a)) pl.discard.push(...pl.hand.splice(i, 1)); }
  s.fight.combos += combos;
  if (thorns) {
    const soak = Math.min(s.block, thorns); s.block -= soak; s.hp -= thorns - soak; s.fight.taken += thorns - soak;
    events.push({ seat: 'enemy', text: `The spikes hurt: the party takes ${thorns} (${thorns - soak} through Block).` });
  }
  // the bars as they stand once the players' cards have landed, for the reveal to show before the enemy acts
  const mid = { enemyHp: Math.max(0, e.hp), enemyBlock: e.block, hp: Math.max(0, s.hp), block: s.block };

  if (e.hp <= 0) { e.hp = 0; return { state: winFight(s, events), events, mid }; }
  if (s.hp <= 0) return { state: lose(s, 'The party fell to its own recklessness.'), events, mid };

  if (e.poison) {
    s.fight.dealt += Math.min(e.poison, e.hp); e.hp -= e.poison;
    events.push({ seat: 'enemy', text: `${info.name} takes ${e.poison} poison.` });
    e.poison--;
    if (e.hp <= 0) { e.hp = 0; return { state: winFight(s, events), events, mid }; }
  }

  // the enemy's turn
  const it = it0, said = [];
  e.block = 0;
  if (it.block) { e.block += it.block; said.push(`gains ${it.block} Block`); }
  if (it.atk) {
    const per = perHit(e, it);
    let taken = 0;
    for (let k = 0; k < (it.hits || 1); k++) { const soak = Math.min(s.block, per); s.block -= soak; s.hp -= per - soak; taken += per - soak; }
    s.fight.taken += taken;
    said.push(`attacks for ${per}${it.hits ? '×' + it.hits : ''} (${taken} got through)`);
    if (it.drain && taken) { const h = Math.min(taken, e.max - e.hp); e.hp += h; said.push(`and drinks ${h} back`); }
  }
  if (it.buff) { e.str += it.buff; said.push(`grows stronger (+${it.buff})`); }
  if (it.curse) { for (const seat of SEATS) for (let k = 0; k < it.curse; k++) s.piles[seat].discard.push('dread'); said.push('curses you: a Dread card joins each deck for this fight'); }
  if (it.ghost) said.push('flickers back into sight');
  if (it.charge) said.push('begins to toll… something big is coming');
  events.push({ seat: 'enemy', text: `${info.name} ${said.join(', ')}.` });
  e.i = e.i + 1 < info.intents.length ? e.i + 1 : info.loopFrom;
  e.vuln = Math.max(0, e.vuln - 1); e.weak = Math.max(0, e.weak - 1);
  s.block = 0;
  s.fight.turns++; s.stats.turns++;
  if (s.hp <= 0) return { state: lose(s, `${info.name} was too much this time.`), events, mid };

  s.turn++; s.hints = {};
  for (const seat of SEATS) s.energy[seat] = ENERGY + s.bonusEnergy;
  s.bonusEnergy = 0;
  drawHands(s);
  return { state: s, events, mid };
}

function lose(s, why) { s.hp = 0; s.stage = 'lost'; s.why = why; foldStats(s); return s; }
function foldStats(s) {
  if (!s.fight) return;
  for (const k of ['combos', 'dealt', 'taken']) s.stats[k] += s.fight[k];
}

function winFight(s, events) {
  const name = ENEMIES[s.enemy.key].name;
  events.push({ seat: 'enemy', text: `${name} is defeated!` });
  s.fight.turns++; s.stats.turns++; s.stats.fights++;
  foldStats(s);
  s.lastFight = { ...s.fight, enemy: s.enemy.key };
  s.block = 0; s.bonusEnergy = 0; s.bonusDraw = 0; s.hints = {};
  if (s.relics.includes('vial')) s.hp = Math.min(s.maxHp, s.hp + 6);
  if (nodeOf(s).type === 'boss') { s.stage = 'won'; s.why = 'The Hollow Bell falls silent. You reached the top together.'; return s; }
  s.stage = 'reward';
  const n = s.relics.includes('compass') ? 4 : 3;
  s.rewards = Object.fromEntries(SEATS.map(seat => [seat, shuffle(s, [...new Set(REWARDS[seat])]).slice(0, n)]));
  return s;
}

const relicDrop = (s, n) => shuffle(s, Object.keys(RELICS).filter(r => !s.relics.includes(r))).slice(0, n);
function gainRelic(s, id) { s.relics.push(id); if (id === 'whetstone') s.str++; }

// choices: {warden: card id or null (skip), striker: ...}
export function chooseReward(s0, choices) {
  const s = structuredClone(s0);
  for (const seat of SEATS) if (s.rewards[seat].includes(choices[seat])) s.decks[seat].push(choices[seat]);
  s.rewards = null;
  if (nodeOf(s).type === 'elite') { s.stage = 'relic'; s.relicChoices = relicDrop(s, 2); }
  else s.stage = 'map';
  return s;
}

export function chooseRelic(s0, id) {
  const s = structuredClone(s0);
  if (!s.relicChoices.includes(id)) return s;
  gainRelic(s, id);
  s.relicChoices = null; s.stage = 'map';
  return s;
}

export const REST = { heal: 'Rest: heal 20', upgrade: 'Train: each of you upgrades a card' };
export function rest(s0, choice) {
  const s = structuredClone(s0);
  if (choice === 'heal') { s.hp = Math.min(s.maxHp, s.hp + 20); s.stage = 'map'; s.note = 'You rested by the fire and healed 20.'; }
  else if (choice === 'upgrade') { s.stage = 'upgrade'; s.upgrades = true; }
  return s;
}

// choices: {warden: index into own deck or null, striker: ...}
export function chooseUpgrade(s0, choices) {
  const s = structuredClone(s0), done = [];
  for (const seat of SEATS) {
    const i = choices[seat], id = s.decks[seat][i];
    if (Number.isInteger(i) && id && canUpgrade(id)) { s.decks[seat][i] = id + '+'; done.push(card(id + '+').name); }
  }
  s.upgrades = null; s.stage = 'map';
  s.note = done.length ? `Upgraded: ${done.join(', ')}.` : 'You sat by the fire.';
  return s;
}

function upgradeRandom(s, seat) {
  const ok = s.decks[seat].map((id, i) => [id, i]).filter(([id]) => canUpgrade(id));
  if (!ok.length) return null;
  const [id, i] = pickFrom(s, ok); s.decks[seat][i] = id + '+';
  return card(id + '+').name;
}

// A ? room's option, agreed by both.
export function chooseEvent(s0, option) {
  const s = structuredClone(s0), ev = EVENTS[s.event];
  if (!ev || !ev.options.some(o => o.id === option)) return s0;
  const heal = n => { const h = Math.min(n, s.maxHp - s.hp); s.hp += h; return h; };
  let note = '';
  if (option === 'pray') note = `You prayed. Healed ${heal(15)}.`;
  else if (option === 'bleed') { s.hp = Math.max(1, s.hp - 8); note = `You bled for the shrine. Upgraded: ${SEATS.map(seat => upgradeRandom(s, seat)).filter(Boolean).join(', ') || 'nothing'}.`; }
  else if (option === 'thin') {
    for (const [seat, id] of [['warden', 'guard'], ['striker', 'strike']]) { const i = s.decks[seat].indexOf(id); if (i >= 0) s.decks[seat].splice(i, 1); }
    note = 'Lighter decks: a Guard and a Strike are gone.';
  } else if (option === 'buy') { s.hp = Math.max(1, s.hp - 12); const [r] = relicDrop(s, 1); if (r) gainRelic(s, r); note = r ? `You paid in blood for the ${RELICS[r].name}: ${RELICS[r].text}` : 'The tinker had nothing left.'; }
  else if (option === 'study') { const got = SEATS.map(seat => { const id = pickFrom(s, REWARDS[seat]); s.decks[seat].push(id); return card(id).name; }); note = `You learned something: ${got.join(' and ')} join your decks.`; }
  else if (option === 'nap') { s.maxHp += 4; note = `A good nap. Max HP +4, healed ${heal(10)}.`; }
  else if (option === 'roll') {
    const d = 1 + Math.floor(rand(s) * 6);
    if (d % 2 === 0) { const [r] = relicDrop(s, 1); if (r) gainRelic(s, r); note = `Rolled a ${d}! The goblin hands over the ${r ? RELICS[r].name + ': ' + RELICS[r].text : 'cup'}`; }
    else { s.hp = Math.max(1, s.hp - 10); note = `Rolled a ${d}. The goblin bites you: −10 HP.`; }
  } else if (option === 'wish') { s.str++; s.maxHp -= 6; s.hp = Math.min(s.hp, s.maxHp); note = 'Your wish is granted: party +1 Strength. Max HP −6.'; }
  else if (option === 'drink') note = `Cool water. Healed ${heal(20)}.`;
  else note = 'You moved on.';
  s.event = null; s.stage = 'map'; s.note = note;
  return s;
}

// From the map screen (a good stopping point) to the next floor; choice picks between two nodes.
export function advance(s0, choice = 0) {
  const s = structuredClone(s0);
  const opts = nextOptions(s);
  if (s.stage !== 'map' || !opts.length || !Number.isInteger(choice) || choice < 0 || choice >= opts.length) return s0;
  s.floor++; s.path[s.floor] = choice;
  return enterNode(s);
}

export function hint(s0, seat, emoji) {
  const s = structuredClone(s0);
  s.hints[seat] = emoji;
  return s;
}
