// Drawing for Co-op Spire, shared by the board and the phones: card tiles, keywords you can tap, intents.
import { card, TAGS, GLOSSARY, ENEMIES } from './cards.js';
import { describeIntent } from './game.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ROLES = {
  warden: { label: 'Warden', icon: '🛡️', blurb: 'support and control: block, weaken, mark the target' },
  striker: { label: 'Striker', icon: '⚔️', blurb: 'damage: attacks that hit much harder with the right setup' },
};
export const INTENT_ICON = { atk: '🗡️', block: '🛡️', buff: '💪', charge: '🔔', curse: '🕯️', ghost: '👻' };
export const NODE = {
  tutorial: { icon: '🪆', name: 'Training' }, fight: { icon: '⚔️', name: 'Fight' }, elite: { icon: '💀', name: 'Elite fight' },
  boss: { icon: '🔔', name: 'The boss' }, rest: { icon: '🔥', name: 'Campfire' }, event: { icon: '❓', name: 'Unknown room' },
};

// Wrap the glossary words so a tap explains them.
const KW = new RegExp(`\\b(${Object.keys(GLOSSARY).join('|')})\\b`, 'g');
export const kw = text => esc(text).replace(KW, w => `<span class="kw" data-kw="${w}">${w}</span>`);
export const tagChip = t => `<span class="tag">${TAGS[t].icon} ${esc(TAGS[t].name)}</span>`;

// A card tile. opts: {act, sel, off, dim, partnerDeck (ids: says which partner cards link with this one), cls}
export function cardHtml(id, opts = {}) {
  const c = card(id), tag = opts.act ? 'button' : 'div';
  const links = [];
  let maybe = false;
  if (opts.partnerDeck) {
    const deck = [...new Set(opts.partnerDeck.map(x => x.replace(/\+$/, '')))];
    if (c.combo) {
      const givers = deck.filter(p => card(p).tags.includes(c.combo.tag));
      if (givers.length) { maybe = true; links.push(`✨ Partner's ${givers.map(p => esc(card(p).name)).join(', ')} can set this off`); }
    }
    const powers = deck.filter(p => card(p).combo && c.tags.includes(card(p).combo.tag));
    if (powers.length) { maybe = true; links.push(`✨ Powers partner's ${powers.map(p => esc(card(p).name)).join(', ')}`); }
  }
  return `<${tag} class="card ${c.seat || 'curse'}${c.upgraded ? ' up' : ''}${opts.sel ? ' sel' : ''}${opts.dim ? ' dim' : ''}${maybe ? ' maybe' : ''} ${opts.cls || ''}"${opts.act ? ` data-act="${opts.act}"` : ''}${opts.off ? ' disabled' : ''}>
    <span class="cost">${c.unplayable ? '✖' : c.cost}</span>
    <span class="nm">${esc(c.name)}</span>
    <span class="tx">${kw(c.text)}</span>
    ${c.combo ? `<span class="cb">🤝 With partner's ${TAGS[c.combo.tag].icon} ${esc(TAGS[c.combo.tag].name)}: ${kw(c.combo.text)}</span>` : ''}
    ${c.tags.length ? `<span class="tg">Gives ${c.tags.map(tagChip).join(' ')}</span>` : ''}
    ${links.length ? `<span class="lk">${links.join('<br>')}</span>` : ''}
  </${tag}>`;
}

export function intentHtml(enemy, big = false) {
  const parts = describeIntent(enemy);
  return `<div class="intent${big ? ' big' : ''}">${parts.map(p => `<span>${INTENT_ICON[p.k]} ${esc(p.text)}</span>`).join('')}</div>`;
}

export function statusPills(e) {
  return [
    e.block ? `<span class="pill blk">🛡️ <span class="kw" data-kw="Block">Block</span> ${e.block}</span>` : '',
    e.vuln ? `<span class="pill vuln">🎯 <span class="kw" data-kw="Vulnerable">Vulnerable</span> ${e.vuln}</span>` : '',
    e.weak ? `<span class="pill weak">🌀 <span class="kw" data-kw="Weak">Weak</span> ${e.weak}</span>` : '',
    e.poison ? `<span class="pill poi">☠️ <span class="kw" data-kw="Poison">Poison</span> ${e.poison}</span>` : '',
    e.str ? `<span class="pill str">💪 <span class="kw" data-kw="Strength">Strength</span> ${e.str}</span>` : '',
    ENEMIES[e.key]?.thorns ? `<span class="pill thr">🌵 Thorns ${ENEMIES[e.key].thorns}</span>` : '',
  ].join('');
}

export const glossaryCard = word => ({ icon: '📖', title: word, intro: GLOSSARY[word], sections: [] });
export const fullGlossary = () => ({
  icon: '📖', title: 'Words on the cards', sections: [{ h: 'Tap any underlined word to see this', items: Object.entries(GLOSSARY).map(([k, v]) => `<b>${k}</b>: ${v}`) },
    { h: 'Combo signs', items: Object.entries(TAGS).map(([, t]) => `${t.icon} <b>${t.name}</b>`) }],
});

export const HOW_TO_PLAY = {
  icon: '🃏', title: 'How to play Co-op Spire',
  intro: 'Climb the spire together. You share one health bar and win or lose together.',
  sections: [
    { h: 'Each turn', items: [
      '<b>1. Pick in secret.</b> Each of you taps cards on your phone. You have 3 ⚡ energy; a card costs the number in its yellow circle.',
      '<b>2. Lock in.</b> Talk it over first (or, in Quiet mode, send a hint). You can change your mind until your partner locks in too.',
      '<b>3. Reveal.</b> The TV plays both hands. Setup (Block, Mark, Weak) lands before damage, so order does not matter.',
      '<b>4. The enemy acts</b> as its red intent box said. Watch it to know when to block.' ] },
    { h: 'Combos 🤝', items: [
      'A card with 🤝 gets much stronger if your <b>partner</b> plays a card with the matching sign the same turn: 🎯 Mark + Execute, 🛡️ Guard + Reckless Swing…',
      'Cards marked ✨ link with something in your partner\'s deck. Ask what they have!' ] },
    { h: 'Between fights', items: [
      'Pick a card for your own deck. Choose your path on the map together, rest or train at campfires, and decide ? rooms together.',
      'Every cleared floor is a good stopping point: the run is saved.' ] },
  ],
};
