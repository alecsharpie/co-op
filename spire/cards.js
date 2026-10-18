// Cards, enemies, relics, events and the map for Co-op Spire. Data only; game.js gives it meaning.
//
// Card effects (fx): dmg, hits, block, vuln, weak, poison, heal, tempStr (party Strength this turn), selfDmg,
// energyNext / drawNext (both players get that much extra next turn), blockToDmg (deal damage equal to party block).
// A card's combo fires only when the partner played a card with that tag in the same turn; its fx then
// replaces the matching keys of the card's own fx. Card text is written from the fx (cardText), so upgrades
// ('strike+') and combos always describe exactly what they do.

// The signs that link cards across the two hands: a card "gives" its tags; a combo "needs" one from the partner.
export const TAGS = {
  guard: { icon: '🛡️', name: 'Guard' },
  mark:  { icon: '🎯', name: 'Mark' },
  feint: { icon: '🎭', name: 'Feint' },
  cry:   { icon: '📣', name: 'Battle Cry' },
  rally: { icon: '🚩', name: 'Rally' },
  snare: { icon: '🕸️', name: 'Snare' },
  swift: { icon: '💨', name: 'Swift' },
};

const BASE = {
  // Warden: support and control
  guard:      { seat: 'warden', name: 'Guard', cost: 1, tags: ['guard'], fx: { block: 5 } },
  bash:       { seat: 'warden', name: 'Shield Bash', cost: 1, tags: ['guard'], fx: { dmg: 4, block: 3 } },
  mark:       { seat: 'warden', name: 'Mark Target', cost: 1, tags: ['mark'], fx: { vuln: 2 } },
  riposte:    { seat: 'warden', name: 'Riposte', cost: 1, tags: ['guard'], fx: { block: 6 }, combo: { tag: 'feint', fx: { block: 6, dmg: 10 } } },
  secondwind: { seat: 'warden', name: 'Second Wind', cost: 1, tags: [], fx: { heal: 4 }, combo: { tag: 'cry', fx: { heal: 8, energyNext: 1 } } },
  rally:      { seat: 'warden', name: 'Rally', cost: 1, tags: ['rally'], fx: { tempStr: 2 } },
  hold:       { seat: 'warden', name: 'Hold the Line', cost: 2, tags: ['guard'], fx: { block: 12, weak: 1 } },
  snare:      { seat: 'warden', name: 'Snare', cost: 1, tags: ['snare'], fx: { weak: 2 } },
  crush:      { seat: 'warden', name: 'Crushing Blow', cost: 2, tags: [], fx: { dmg: 8 }, combo: { tag: 'mark', fx: { dmg: 18 } } },
  bulwark:    { seat: 'warden', name: 'Bulwark', cost: 2, tags: ['guard'], fx: { block: 9 }, combo: { tag: 'guard', fx: { block: 16 } } },
  beacon:     { seat: 'warden', name: 'Beacon', cost: 1, tags: ['mark', 'rally'], fx: { vuln: 1, tempStr: 1 } },
  smoke:      { seat: 'warden', name: 'Smoke Bomb', cost: 1, tags: ['snare'], fx: { weak: 1, block: 4 } },
  bless:      { seat: 'warden', name: 'Blessing', cost: 1, tags: ['rally'], fx: { heal: 3, tempStr: 1 } },
  insight:    { seat: 'warden', name: 'Insight', cost: 0, tags: ['mark'], fx: { vuln: 1 } },
  phalanx:    { seat: 'warden', name: 'Phalanx', cost: 2, tags: ['guard'], fx: { block: 8 }, combo: { tag: 'cry', fx: { block: 14, weak: 1 } } },
  venom:      { seat: 'warden', name: 'Venom Ward', cost: 1, tags: [], fx: { poison: 4 }, combo: { tag: 'feint', fx: { poison: 8 } } },
  tactics:    { seat: 'warden', name: 'Tactics', cost: 1, tags: [], fx: { block: 3, drawNext: 1 }, combo: { tag: 'swift', fx: { block: 6, drawNext: 2 } } },

  // Striker: damage
  strike:     { seat: 'striker', name: 'Strike', cost: 1, tags: [], fx: { dmg: 6 } },
  defend:     { seat: 'striker', name: 'Defend', cost: 1, tags: ['guard'], fx: { block: 4 } },
  execute:    { seat: 'striker', name: 'Execute', cost: 2, tags: [], fx: { dmg: 7 }, combo: { tag: 'mark', fx: { dmg: 15 } } },
  feint:      { seat: 'striker', name: 'Feint', cost: 0, tags: ['feint'], fx: { dmg: 3 } },
  reckless:   { seat: 'striker', name: 'Reckless Swing', cost: 1, tags: [], fx: { dmg: 12, selfDmg: 5 }, combo: { tag: 'guard', fx: { selfDmg: 0 } } },
  flurry:     { seat: 'striker', name: 'Flurry', cost: 1, tags: [], fx: { dmg: 2, hits: 3 }, combo: { tag: 'rally', fx: { hits: 5 } } },
  counter:    { seat: 'striker', name: 'Counter', cost: 1, tags: [], fx: { block: 3 }, combo: { tag: 'guard', fx: { block: 3, blockToDmg: true } } },
  cry:        { seat: 'striker', name: 'Battle Cry', cost: 1, tags: ['cry'], fx: { tempStr: 1 } },
  pounce:     { seat: 'striker', name: 'Pounce', cost: 1, tags: [], fx: { dmg: 5 }, combo: { tag: 'snare', fx: { dmg: 12 } } },
  expose:     { seat: 'striker', name: 'Expose', cost: 1, tags: ['mark'], fx: { vuln: 2 } },
  heavy:      { seat: 'striker', name: 'Heavy Blow', cost: 2, tags: [], fx: { dmg: 14 } },
  dagger:     { seat: 'striker', name: 'Twin Daggers', cost: 1, tags: ['feint'], fx: { dmg: 3, hits: 2 } },
  toxic:      { seat: 'striker', name: 'Toxic Blade', cost: 1, tags: [], fx: { dmg: 4, poison: 2 }, combo: { tag: 'mark', fx: { poison: 5 } } },
  quick:      { seat: 'striker', name: 'Quickstep', cost: 0, tags: ['swift'], fx: { block: 3 } },
  finisher:   { seat: 'striker', name: 'Finisher', cost: 2, tags: [], fx: { dmg: 10 }, combo: { tag: 'snare', fx: { dmg: 20 } } },
  shout:      { seat: 'striker', name: 'War Shout', cost: 1, tags: ['cry', 'guard'], fx: { block: 5, tempStr: 1 } },
  lunge:      { seat: 'striker', name: 'Lunge', cost: 1, tags: ['swift'], fx: { dmg: 7 } },

  // added to a player's discard pile by the Hexer; gone when the fight ends
  dread:      { seat: null, name: 'Dread', cost: 0, tags: [], fx: {}, unplayable: true },
};

// Upgrading adds about a third to every number (at least 1); recoil and hit counts stay the same.
const UPGRADES = ['dmg', 'block', 'vuln', 'weak', 'poison', 'heal', 'tempStr'];
const up = fx => Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, UPGRADES.includes(k) && v ? v + Math.max(1, Math.round(v / 3)) : v]));

const cache = {};
// card('strike') or card('strike+'): the full definition, text included.
export function card(id) {
  if (cache[id]) return cache[id];
  const plus = id.endsWith('+'), b = BASE[plus ? id.slice(0, -1) : id];
  if (!b) return null;
  const c = { ...b, id, upgraded: plus, name: b.name + (plus ? '+' : ''), fx: plus ? up(b.fx) : b.fx };
  if (b.combo) c.combo = { tag: b.combo.tag, fx: plus ? up(b.combo.fx) : b.combo.fx };
  c.text = b.unplayable ? 'Unplayable. Clogs your hand until the fight ends.' : fxText(c.fx);
  if (c.combo) c.combo.text = comboText(c.fx, { ...c.fx, ...c.combo.fx });
  return (cache[id] = c);
}
export const isCard = id => typeof id === 'string' && !!card(id);
export const canUpgrade = id => !id.endsWith('+') && !BASE[id].unplayable;

export function fxText(fx) {
  const t = [];
  if (fx.dmg) t.push(fx.hits > 1 ? `Deal ${fx.dmg} ×${fx.hits}` : `Deal ${fx.dmg}`);
  if (fx.blockToDmg) t.push('Deal damage equal to party Block');
  if (fx.block) t.push(`Block ${fx.block}`);
  if (fx.vuln) t.push(`Vulnerable ${fx.vuln}`);
  if (fx.weak) t.push(`Weak ${fx.weak}`);
  if (fx.poison) t.push(`Poison ${fx.poison}`);
  if (fx.heal) t.push(`Heal ${fx.heal}`);
  if (fx.tempStr) t.push(`Party +${fx.tempStr} Strength this turn`);
  if (fx.selfDmg) t.push(`Party loses ${fx.selfDmg} HP`);
  if (fx.energyNext) t.push(`Both +${fx.energyNext} energy next turn`);
  if (fx.drawNext) t.push(`Both draw ${fx.drawNext} more next turn`);
  return t.length ? t.join('. ') + '.' : 'No effect.';
}
function comboText(base, merged) {
  let t = fxText(merged);
  if (base.selfDmg && !merged.selfDmg) t = t === 'No effect.' ? 'No recoil.' : t + ' No recoil.';
  return t;
}

// Every playable card id (not upgrades) by seat, for rewards and the reference.
export const ALL = Object.fromEntries(['warden', 'striker'].map(seat => [seat, Object.keys(BASE).filter(k => BASE[k].seat === seat)]));

export const STARTERS = {
  warden: ['guard', 'guard', 'guard', 'bash', 'bash', 'mark', 'riposte', 'secondwind'],
  striker: ['strike', 'strike', 'strike', 'defend', 'defend', 'execute', 'feint', 'reckless'],
};

export const REWARDS = {
  warden: ['rally', 'hold', 'snare', 'crush', 'bulwark', 'beacon', 'smoke', 'bless', 'insight', 'phalanx', 'venom', 'tactics', 'riposte', 'mark'],
  striker: ['flurry', 'counter', 'cry', 'pounce', 'expose', 'heavy', 'dagger', 'toxic', 'quick', 'finisher', 'shout', 'lunge', 'execute', 'feint'],
};

// The words a player can tap for an explanation.
export const GLOSSARY = {
  Block: 'Stops that much damage this turn. The party shares one Block, and it wears off when the turn ends.',
  Vulnerable: 'Takes 50% more damage from your attacks. Goes down by 1 each turn.',
  Weak: 'Hits 25% softer. Goes down by 1 each turn.',
  Strength: 'Adds that much to every hit the party deals.',
  Poison: 'The enemy loses that much HP at the end of your turn, then Poison goes down by 1. It ignores Block.',
  Energy: 'Each of you has 3 ⚡ every turn. A card costs the number in its yellow circle.',
  Combo: 'A card with 🤝 does more when your partner plays a card with the matching sign in the same turn. Talk about it!',
  Unplayable: 'Cannot be played. It just takes up room in your hand until the fight ends.',
};

// An intent: atk (per hit), hits, block, buff (enemy Strength), charge (telegraph only), drain (heals by the
// damage that gets through), curse (shuffles that many Dread into each discard pile), ghost (while this intent
// shows, every hit on the enemy deals only 1). thorns: the party takes that much each time it hits the enemy.
// Intents play in order, then loop back to loopFrom.
export const ENEMIES = {
  dummy:    { name: 'Straw Dummy', icon: '🪆', hp: 30, loopFrom: 0, intents: [{ atk: 4 }, { atk: 6 }],
              about: 'A practice target. Hits gently.' },
  slime:    { name: 'Bog Slime', icon: '🟢', hp: 56, loopFrom: 0, intents: [{ atk: 11 }, { atk: 6, hits: 2 }, { block: 10, atk: 5 }],
              about: 'Simple and sturdy.' },
  bat:      { name: 'Vampire Bats', icon: '🦇', hp: 50, loopFrom: 0, intents: [{ atk: 5, hits: 2, drain: true }, { block: 6, atk: 4 }, { atk: 11, drain: true }],
              about: 'Heals by whatever damage gets through your Block.' },
  crab:     { name: 'Spiked Crab', icon: '🦀', hp: 60, thorns: 2, loopFrom: 0, intents: [{ atk: 9 }, { block: 12 }, { atk: 5, hits: 2 }],
              about: 'Thorns 2: the party takes 2 every time it hits. Few big hits beat many small ones.' },
  cultist:  { name: 'Bell Cultist', icon: '🕯️', hp: 70, loopFrom: 1, intents: [{ buff: 3 }, { atk: 8, buff: 2 }],
              about: 'Gets stronger every turn. End it fast.' },
  hexer:    { name: 'Hexer', icon: '🧙', hp: 78, loopFrom: 0, intents: [{ curse: 1, atk: 5 }, { atk: 12 }, { atk: 6, hits: 2 }, { curse: 1, block: 8 }],
              about: 'Curses you with Dread cards that clog your hands.' },
  wisp:     { name: 'Grave Wisp', icon: '👻', hp: 74, loopFrom: 0, intents: [{ ghost: true, buff: 2 }, { atk: 14 }, { atk: 7, hits: 2 }],
              about: 'When it fades, every hit deals only 1. Use those turns to set up, Block and Poison.' },
  sentinel: { name: 'Sentinel', icon: '🗿', hp: 100, loopFrom: 0, intents: [{ block: 16, atk: 8 }, { atk: 17 }, { atk: 6, hits: 3 }],
              about: 'Hides behind thick Block. Vulnerable cracks it.' },
  nob:      { name: 'Gremlin Nob', icon: '👹', hp: 120, loopFrom: 1, intents: [{ buff: 4 }, { atk: 18 }, { atk: 9, hits: 2 }, { block: 12, atk: 6 }],
              about: 'Elite. Hits very hard once it has bulked up.' },
  knight:   { name: 'Hollow Knight', icon: '⚜️', hp: 130, loopFrom: 0, intents: [{ block: 18, atk: 8 }, { atk: 20 }, { block: 14, buff: 2 }, { atk: 10, hits: 2 }],
              about: 'Elite. Huge Block every other turn: hit it when it is open.' },
  bell:     { name: 'The Hollow Bell', icon: '🔔', hp: 250, loopFrom: 0, intents: [{ atk: 9, hits: 2 }, { block: 20, buff: 3 }, { charge: true }, { atk: 40 }, { atk: 14 }],
              about: 'The boss. When it tolls, a 40-damage strike comes next turn: Block together!' },
};
export const POOLS = { early: ['slime', 'bat', 'crab', 'cultist'], late: ['sentinel', 'hexer', 'wisp', 'crab'], elite: ['nob', 'knight'] };

export const RELICS = {
  lantern:   { name: 'Lantern', icon: '🏮', text: 'Both start each fight with +1 energy on turn 1.' },
  anchor:    { name: 'Anchor', icon: '⚓', text: 'Start each fight with 10 Block.' },
  ring:      { name: 'Bond Ring', icon: '💍', text: 'Every combo heals the party 2.' },
  whetstone: { name: 'Whetstone', icon: '🪨', text: 'Party +1 Strength for the rest of the run.' },
  bells:     { name: 'Twin Bells', icon: '🎐', text: 'The first combo each turn also deals 5.' },
  quill:     { name: 'Quill', icon: '🪶', text: 'Both draw 6 cards a turn instead of 5.' },
  drum:      { name: 'War Drum', icon: '🥁', text: 'Party +2 Strength on the first turn of each fight.' },
  vial:      { name: 'Healing Vial', icon: '🧪', text: 'Heal 6 after every fight.' },
  compass:   { name: 'Compass', icon: '🧭', text: 'Card rewards offer 4 cards instead of 3.' },
};

// ? rooms: both players must agree on an option.
export const EVENTS = {
  shrine:  { icon: '⛩️', title: 'A cracked shrine', text: 'Moss covers an old shrine. It hums when you come near.',
             options: [{ id: 'pray', label: 'Pray', desc: 'Heal 15.' }, { id: 'bleed', label: 'Offer blood', desc: 'Lose 8 HP. Each of you upgrades a random card.' }] },
  tinker:  { icon: '🧰', title: 'A wandering tinker', text: '"I can lighten your load, or sell you a trinket."',
             options: [{ id: 'thin', label: 'Lighten the load', desc: 'The Warden loses a Guard and the Striker a Strike.' }, { id: 'buy', label: 'Buy a trinket', desc: 'Lose 12 HP. Gain a random relic.' }, { id: 'leave', label: 'Move on', desc: 'Nothing happens.' }] },
  library: { icon: '📚', title: 'A dusty library', text: 'Two books lie open on a lectern, as if waiting for you.',
             options: [{ id: 'study', label: 'Study together', desc: 'Each of you adds a random card to your deck.' }, { id: 'nap', label: 'Nap in the stacks', desc: 'Heal 10 and Max HP +4.' }] },
  dice:    { icon: '🎲', title: 'Goblin dice', text: 'A goblin rattles a cup. "Double or nothing?"',
             options: [{ id: 'roll', label: 'Roll', desc: 'Even: gain a relic. Odd: lose 10 HP.' }, { id: 'walk', label: 'Walk away', desc: 'Nothing happens.' }] },
  well:    { icon: '🪣', title: 'A wishing well', text: 'Coins glitter far below.',
             options: [{ id: 'wish', label: 'Make a wish', desc: 'Party +1 Strength for the run. Max HP −6.' }, { id: 'drink', label: 'Drink', desc: 'Heal 20.' }] },
};

// The climb, as slots: each floor offers one node, or two to choose between together. game.js fills in
// enemies and events from the seed.
export const LAYOUT = [
  ['fight'],
  ['fight', 'event'],
  ['fight', 'rest'],
  ['elite', 'event'],
  ['rest'],
  ['fight', 'elite'],
  ['boss'],
];

export const HINTS = [
  { e: '⚔️', t: "I'll attack" },
  { e: '🛡️', t: "I'll block" },
  { e: '🎯', t: "I'll set up" },
  { e: '💪', t: 'Go big!' },
  { e: '❓', t: 'What do you need?' },
];
