// Drawing for Co-op Spire, shared by the board and the phones: card tiles, keywords you can tap, intents, status
// pills. All pictures are sprites from art.js.
import { art } from '../shared/art.js';
import { CARD_ART } from './art.js';
import { card, TAGS, GLOSSARY, ENEMIES } from './cards.js';
import { describeIntent } from './game.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ROLES = {
  warden: { label: 'Warden', sprite: 'warden', blurb: 'support and control: block, weaken, mark the target' },
  striker: { label: 'Striker', sprite: 'striker', blurb: 'damage: attacks that hit much harder with the right setup' },
};
export const roleIcon = (seat, size = 24) => art(ROLES[seat].sprite, { size, label: ROLES[seat].label });
const INTENT = { atk: 'i-attack', block: 'i-block', buff: 'i-buff', charge: 'i-charge', curse: 'i-curse', ghost: 'i-ghost' };
export const intentSprite = p => p.k === 'atk' && /×/.test(p.text) ? 'i-multi' : INTENT[p.k];
export const NODE = {
  tutorial: { sprite: 'en-dummy', name: 'Training' }, fight: { sprite: 'n-fight', name: 'Fight' }, elite: { sprite: 'n-elite', name: 'Elite fight' },
  boss: { sprite: 'n-boss', name: 'The boss' }, rest: { sprite: 'n-rest', name: 'Campfire' }, event: { sprite: 'n-event', name: 'Unknown room' },
};
export const nodeIcon = (type, size = 24) => art(NODE[type].sprite, { size, label: NODE[type].name });
export const enemyArt = (key, size) => art(ENEMIES[key].icon, { size, label: ENEMIES[key].name });
// Idle motion per enemy (spire.css), so each one moves in character on the TV.
export const ENEMY_ANIM = { slime: 'squish', bat: 'flap', crab: 'scuttle', cultist: 'sway', hexer: 'hover', wisp: 'haunt', sentinel: 'hum', nob: 'breathe', knight: 'sway', bell: 'swing', dummy: 'wobble' };

// Wrap the glossary words so a tap explains them.
const KW = new RegExp(`\\b(${Object.keys(GLOSSARY).join('|')})\\b`, 'g');
export const kw = text => esc(text).replace(KW, w => `<span class="kw" data-kw="${w}">${w}</span>`);
export const tagIcon = (t, size = 16) => art(TAGS[t].icon, { size, label: TAGS[t].name });
export const tagChip = t => `<span class="tag">${tagIcon(t)} ${esc(TAGS[t].name)}</span>`;
export const linkIcon = (size = 16) => art('link', { size, label: 'Combo' });
export const hintIcon = (id, size = 24) => art('h-' + id, { size });

// A card tile. opts: {act, sel, off, dim, partnerDeck (ids: says which partner cards link with this one), cls, pic}
export function cardHtml(id, opts = {}) {
  const c = card(id), tag = opts.act ? 'button' : 'div', base = id.replace(/\+$/, '');
  const links = [];
  let maybe = false;
  if (opts.partnerDeck) {
    const deck = [...new Set(opts.partnerDeck.map(x => x.replace(/\+$/, '')))];
    if (c.combo) {
      const givers = deck.filter(p => card(p).tags.includes(c.combo.tag));
      if (givers.length) { maybe = true; links.push(`Partner's ${givers.map(p => esc(card(p).name)).join(', ')} can set this off`); }
    }
    const powers = deck.filter(p => card(p).combo && c.tags.includes(card(p).combo.tag));
    if (powers.length) { maybe = true; links.push(`Powers partner's ${powers.map(p => esc(card(p).name)).join(', ')}`); }
  }
  return `<${tag} class="card ${c.seat || 'curse'}${c.upgraded ? ' up' : ''}${opts.sel ? ' sel' : ''}${opts.dim ? ' dim' : ''}${maybe ? ' maybe' : ''} ${opts.cls || ''}"${opts.act ? ` data-act="${opts.act}"` : ''}${opts.off ? ' disabled' : ''}>
    <span class="cost" title="Energy cost">${c.unplayable ? '–' : c.cost}</span>
    <span class="head"><span class="pic">${art(CARD_ART[base] || 'deck', { size: opts.pic || 40 })}</span><span class="nm">${esc(c.name)}</span></span>
    <span class="tx">${kw(c.text)}</span>
    ${c.combo ? `<span class="cb">${linkIcon(18)}<span>With partner's ${tagIcon(c.combo.tag, 18)} <b>${esc(TAGS[c.combo.tag].name)}</b>: ${kw(c.combo.text)}</span></span>` : ''}
    ${c.tags.length ? `<span class="tg">Gives ${c.tags.map(tagChip).join(' ')}</span>` : ''}
    ${links.length ? `<span class="lk">${art('sparkle', { size: 14 })}<span>${links.join('<br>')}</span></span>` : ''}
  </${tag}>`;
}

export function intentHtml(enemy, big = false) {
  const parts = describeIntent(enemy), size = big ? 44 : 22;
  return `<div class="intent${big ? ' big' : ''}">${parts.map(p => `<span>${art(intentSprite(p), { size })}${esc(p.text)}</span>`).join('')}</div>`;
}

const pill = (cls, sprite, word, n, glossary = true) =>
  `<span class="pill ${cls}">${art(sprite, { size: 20 })}${glossary ? `<span class="kw" data-kw="${word}">${word}</span>` : word} ${n}</span>`;
export function statusPills(e) {
  return [
    e.block ? pill('blk', 's-block', 'Block', e.block) : '',
    e.vuln ? pill('vuln', 's-vuln', 'Vulnerable', e.vuln) : '',
    e.weak ? pill('weak', 's-weak', 'Weak', e.weak) : '',
    e.poison ? pill('poi', 's-poison', 'Poison', e.poison) : '',
    e.str ? pill('str', 's-strength', 'Strength', e.str) : '',
    ENEMIES[e.key]?.thorns ? pill('thr', 's-thorns', 'Thorns', ENEMIES[e.key].thorns, false) : '',
  ].join('');
}
export const partyPills = r => (r.block ? pill('blk', 's-block', 'Block', r.block) : '') + (r.str ? pill('str', 's-strength', 'Strength', r.str) : '');

// The sync meter: combos on consecutive turns, paying out every SYNC.
export function syncMeter(streak = 0, sync = 3) {
  const n = streak % sync;
  return `<span class="sync${n === sync - 1 ? ' ready' : ''}">${art('sync', { size: 22 })}<b>Sync</b>${Array.from({ length: sync }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
}

const ICON = s => art(s, { size: 34 });
export const glossaryCard = word => ({ icon: ICON('book'), title: word, intro: GLOSSARY[word], sections: [] });
export const fullGlossary = () => ({
  icon: ICON('book'), title: 'Words on the cards', sections: [{ h: 'Tap any underlined word to see this', items: Object.entries(GLOSSARY).map(([k, v]) => `<b>${k}</b>: ${v}`) },
    { h: 'Combo signs', items: Object.keys(TAGS).map(t => `${tagIcon(t, 20)} <b>${TAGS[t].name}</b>`) }],
});

const I = (s, size = 20) => art(s, { size });
export const HOW_TO_PLAY = {
  icon: ICON('spire'), title: 'How to play Co-op Spire',
  intro: 'Climb the spire together. You share one health bar and win or lose together.',
  sections: [
    { h: 'Each turn', items: [
      `<b>1. Pick in secret.</b> Each of you taps cards on your phone. You have 3 ${I('energy')} energy; a card costs the number on its bolt.`,
      '<b>2. Lock in.</b> Talk it over first (or, in Quiet mode, send a hint). You can change your mind until your partner locks in too.',
      '<b>3. Reveal.</b> The TV plays both hands. Setup (Block, Mark, Weak) lands before damage, so order does not matter.',
      '<b>4. The enemy acts</b> as its red intent box said. Watch it to know when to block.' ] },
    { h: `Combos ${I('link')}`, items: [
      `A card with ${I('link')} gets much stronger if your <b>partner</b> plays a card with the matching sign the same turn: ${I('tag-mark')} Mark + Execute, ${I('tag-guard')} Guard + Reckless Swing…`,
      `Land a combo ${'three'} turns in a row and you are ${I('sync')} <b>in sync</b>: both get +1 energy next turn.`,
      `Cards with a ${I('sparkle', 16)} link with something in your partner's deck. Ask what they have!` ] },
    { h: 'Between fights', items: [
      'Pick a card for your own deck. Choose your path on the map together, rest or train at campfires, and decide ? rooms together.',
      'Every cleared floor is a good stopping point: the run is saved.' ] },
  ],
};
