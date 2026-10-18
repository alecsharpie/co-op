// Cards, enemies, relics and the map for Co-op Spire. Data only; game.js gives it meaning.
//
// Card effects (fx): dmg, hits, block, vuln, weak, heal, tempStr (party Strength this turn), selfDmg,
// energyNext (both players get that much extra energy next turn), blockToDmg (deal damage equal to party block).
// A card's combo fires only when the partner played a card with that tag in the same turn; its fx then
// replaces the matching keys of the card's own fx.

export const CARDS = {
  // Warden: support and control
  guard:      { seat: 'warden', name: 'Guard', cost: 1, tags: ['guard'], fx: { block: 5 }, text: 'Block 5.' },
  bash:       { seat: 'warden', name: 'Shield Bash', cost: 1, tags: ['guard'], fx: { dmg: 4, block: 3 }, text: 'Deal 4. Block 3.' },
  mark:       { seat: 'warden', name: 'Mark Target', cost: 1, tags: ['mark'], fx: { vuln: 2 }, text: 'Enemy Vulnerable 2 (takes 50% more).' },
  riposte:    { seat: 'warden', name: 'Riposte', cost: 1, tags: ['guard'], fx: { block: 6 }, text: 'Block 6.', combo: { tag: 'feint', fx: { block: 6, dmg: 10 }, text: 'Partner feints: also deal 10.' } },
  secondwind: { seat: 'warden', name: 'Second Wind', cost: 1, tags: [], fx: { heal: 4 }, text: 'Heal 4.', combo: { tag: 'cry', fx: { heal: 8, energyNext: 1 }, text: 'Partner cries out: heal 8, both +1 energy next turn.' } },
  rally:      { seat: 'warden', name: 'Rally', cost: 1, tags: ['rally'], fx: { tempStr: 2 }, text: 'Party +2 Strength this turn.' },
  hold:       { seat: 'warden', name: 'Hold the Line', cost: 2, tags: ['guard'], fx: { block: 12, weak: 1 }, text: 'Block 12. Enemy Weak 1.' },
  snare:      { seat: 'warden', name: 'Snare', cost: 1, tags: ['snare'], fx: { weak: 2 }, text: 'Enemy Weak 2 (hits 25% softer).' },
  crush:      { seat: 'warden', name: 'Crushing Blow', cost: 2, tags: [], fx: { dmg: 8 }, text: 'Deal 8.', combo: { tag: 'mark', fx: { dmg: 18 }, text: 'Partner marks: deal 18 instead.' } },
  bulwark:    { seat: 'warden', name: 'Bulwark', cost: 2, tags: ['guard'], fx: { block: 9 }, text: 'Block 9.', combo: { tag: 'guard', fx: { block: 16 }, text: 'Partner guards too: Block 16.' } },
  beacon:     { seat: 'warden', name: 'Beacon', cost: 1, tags: ['mark', 'rally'], fx: { vuln: 1, tempStr: 1 }, text: 'Vulnerable 1. Party +1 Strength this turn.' },

  // Striker: damage
  strike:     { seat: 'striker', name: 'Strike', cost: 1, tags: [], fx: { dmg: 6 }, text: 'Deal 6.' },
  defend:     { seat: 'striker', name: 'Defend', cost: 1, tags: ['guard'], fx: { block: 4 }, text: 'Block 4.' },
  execute:    { seat: 'striker', name: 'Execute', cost: 2, tags: [], fx: { dmg: 7 }, text: 'Deal 7.', combo: { tag: 'mark', fx: { dmg: 15 }, text: 'Partner marks: deal 15 instead.' } },
  feint:      { seat: 'striker', name: 'Feint', cost: 0, tags: ['feint'], fx: { dmg: 3 }, text: 'Deal 3.' },
  reckless:   { seat: 'striker', name: 'Reckless Swing', cost: 1, tags: [], fx: { dmg: 12, selfDmg: 5 }, text: 'Deal 12. Party loses 5 HP.', combo: { tag: 'guard', fx: { selfDmg: 0 }, text: 'Partner guards: no recoil.' } },
  flurry:     { seat: 'striker', name: 'Flurry', cost: 1, tags: [], fx: { dmg: 2, hits: 3 }, text: 'Deal 2 three times.', combo: { tag: 'rally', fx: { hits: 5 }, text: 'Partner rallies: five times.' } },
  counter:    { seat: 'striker', name: 'Counter', cost: 1, tags: [], fx: { block: 3 }, text: 'Block 3.', combo: { tag: 'guard', fx: { block: 3, blockToDmg: true }, text: 'Partner guards: also deal damage equal to party Block.' } },
  cry:        { seat: 'striker', name: 'Battle Cry', cost: 1, tags: ['cry'], fx: { tempStr: 1 }, text: 'Party +1 Strength this turn.' },
  pounce:     { seat: 'striker', name: 'Pounce', cost: 1, tags: [], fx: { dmg: 5 }, text: 'Deal 5.', combo: { tag: 'snare', fx: { dmg: 12 }, text: 'Partner snares: deal 12 instead.' } },
  expose:     { seat: 'striker', name: 'Expose', cost: 1, tags: ['mark'], fx: { vuln: 2 }, text: 'Enemy Vulnerable 2.' },
  heavy:      { seat: 'striker', name: 'Heavy Blow', cost: 2, tags: [], fx: { dmg: 14 }, text: 'Deal 14.' },
};

export const STARTERS = {
  warden: ['guard', 'guard', 'guard', 'bash', 'bash', 'mark', 'riposte', 'secondwind'],
  striker: ['strike', 'strike', 'strike', 'defend', 'defend', 'execute', 'feint', 'reckless'],
};

export const REWARDS = {
  warden: ['rally', 'hold', 'snare', 'crush', 'bulwark', 'beacon', 'riposte', 'secondwind', 'mark'],
  striker: ['flurry', 'counter', 'cry', 'pounce', 'expose', 'heavy', 'execute', 'reckless', 'feint'],
};

// An intent: atk (per hit), hits, block, buff (enemy Strength), charge (telegraph only). Intents play in order,
// then loop back to loopFrom.
export const ENEMIES = {
  slime:    { name: 'Bog Slime', icon: '🟢', hp: 56, loopFrom: 0, intents: [{ atk: 11 }, { atk: 6, hits: 2 }, { block: 10, atk: 5 }] },
  cultist:  { name: 'Bell Cultist', icon: '🕯️', hp: 70, loopFrom: 1, intents: [{ buff: 3 }, { atk: 8, buff: 2 }] },
  nob:      { name: 'Gremlin Nob', icon: '👹', hp: 120, loopFrom: 1, intents: [{ buff: 4 }, { atk: 18 }, { atk: 9, hits: 2 }, { block: 12, atk: 6 }] },
  sentinel: { name: 'Sentinel', icon: '🗿', hp: 100, loopFrom: 0, intents: [{ block: 16, atk: 8 }, { atk: 17 }, { atk: 6, hits: 3 }] },
  bell:     { name: 'The Hollow Bell', icon: '🔔', hp: 250, loopFrom: 0, intents: [{ atk: 9, hits: 2 }, { block: 20, buff: 3 }, { charge: true }, { atk: 40 }, { atk: 14 }] },
};

export const RELICS = {
  lantern:   { name: 'Lantern', icon: '🏮', text: 'Both start each fight with +1 energy on turn 1.' },
  anchor:    { name: 'Anchor', icon: '⚓', text: 'Start each fight with 10 Block.' },
  ring:      { name: 'Bond Ring', icon: '💍', text: 'Every combo heals the party 2.' },
  whetstone: { name: 'Whetstone', icon: '🪨', text: 'Party +1 Strength for the rest of the run.' },
  bells:     { name: 'Twin Bells', icon: '🎐', text: 'The first combo each turn also deals 5.' },
};

// The climb: one card reward after every fight; the elite also drops a relic.
export const MAP = [
  { type: 'fight', enemy: 'slime' },
  { type: 'fight', enemy: 'cultist' },
  { type: 'rest' },
  { type: 'elite', enemy: 'nob' },
  { type: 'fight', enemy: 'sentinel' },
  { type: 'boss', enemy: 'bell' },
];

export const HINTS = ['⚔️', '🛡️', '🎯', '💪', '❓'];
