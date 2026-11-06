// Station cards, the recipe book and the role badges, shared by the TV and the phones, drawn with garden/art.js.
// Rule texts mark sprites as {name}; rich() turns them into inline art.
import { CROPS, DISHES, ripe, toRipen, isBed, rolesAt, bedName } from './game.js';
import { art, hasArt } from '../shared/art.js';
import { plantSprite, CUSTOMERS } from './art.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// escape, then draw every {sprite} inline at about the text's height
export const rich = (s, size = 20) => esc(s).replace(/\{([a-z-]+)\}/g, (m, n) => (hasArt(n) ? art(n, { size, cls: 'ri' }) : m));

export const ROLE = {
  grower: { name: 'Grower', art: 'grower', tok: 'tok-grower', icon: art('grower', { size: 26 }) },
  cook: { name: 'Cook', art: 'cook', tok: 'tok-cook', icon: art('cook', { size: 26 }) },
};
const stars = (n, size = 18) => art('star', { size }).repeat(n);

// days left to pick, counting today, before a ripe crop wilts
const wilt = n => `<span class="tag${n <= 1 ? ' bad' : ''}">${n <= 1 ? 'pick today or it wilts!' : `pick within ${n} days`}</span>`;
const dueText = (o, day) => (o.due === day ? 'leaves tonight!' : o.due - day === 1 ? 'waits until tomorrow' : `waits ${o.due - day + 1} days`);
const recipeArt = (d, size = 20) => Object.entries(DISHES[d].needs).map(([c, n]) => art(c, { size }).repeat(n)).join('<i class="plus">+</i>');
export const customerOf = o => CUSTOMERS[(o.who ?? o.id ?? 0) % CUSTOMERS.length];

// A customer at the counter: their face and a bubble saying what they want.
export const ticket = (o, day, { size = 44 } = {}) => `<span class="ticket${o.joint ? ' joint' : ''}${o.due === day ? ' urgent' : ''}" data-order="${o.id}">
  <span class="cust">${art(customerOf(o), { size })}</span>
  <span class="want">${art(o.joint ? 'feast' : o.dish, { size: size * .5 })}${o.joint ? art(o.dish, { size: size * .5 }) : ''}</span>
  <span class="tk"><b>${stars(o.stars, 15)}${o.joint ? ' feast' : ''}</b><small>${recipeArt(o.dish, 14)} · ${dueText(o, day)}</small></span></span>`;
export const tokChip = (who, label, extra = '', cls = '') => `<span class="tok ${who} ${cls}" ${extra}>${art(ROLE[who].tok, { size: 22 })}<span>${rich(label, 18)}</span></span>`;

// Who may act here, as coloured chips: [grower] plant · water  [cook] pick
export const badges = (at, def) => Object.entries(rolesAt(at, def)).map(([r, what]) => `<span class="rb ${r}">${art(ROLE[r].art, { size: 18 })} ${what}</span>`).join('');

// Watering progress as drops: filled for each watering done.
const drops = b => `<span class="drops">${Array.from({ length: CROPS[b.crop].need }, (_, i) => `<span class="${i < b.grown ? 'on' : ''}">${art('drop', { size: 16 })}</span>`).join('')}</span>`;

// opts: {tokens: [{who, label, attrs, cls}], cls, bubble: {kind, text}, lock: 'Cook only', badges: false, wilted, big}
export function card(at, s, def, opts = {}) {
  const toks = (opts.tokens || []).map(t => tokChip(t.who, t.label, t.attrs || '', t.cls || '')).join('');
  const bubble = opts.bubble ? `<div class="bubble ${opts.bubble.kind}">${rich(opts.bubble.text)}</div>` : '';
  const big = opts.big || 56;
  let body = '', title = '', cls = '';
  if (isBed(at)) {
    const b = s.beds[+at.slice(1)], c = b.crop && CROPS[b.crop];
    title = bedName(at); cls = 'bed' + (ripe(b) ? ' ripe' : '');
    const status = !c ? '<span class="tag">bare soil: plant here</span>'
      : ripe(b) ? `<span class="tag good">ripe: pick it!</span>${def.wilt ? wilt(def.wilt - b.ripeFor + 1) : ''}${c.heavy ? `<span class="tag">${art('partner', { size: 16 })} lift together</span>` : ''}`
      : `<span class="tag water">${drops(b)} ${toRipen(b)} more watering${toRipen(b) > 1 ? 's' : ''}</span>`;
    const sprite = opts.wilted ? 'wilted' : plantSprite(b, CROPS);
    body = `<div class="plot"><div class="plant${ripe(b) ? ' bob' : ''}">${sprite ? art(sprite, { size: big }) : ''}</div>${art('bed', { size: big * .42 })}</div><div class="line">${c ? `<b>${c.name}</b>` : ''}${status}</div>`;
  } else if (at === 'basket') {
    title = 'Basket · picked crops wait here'; cls = 'info';
    const items = Object.entries(s.basket).filter(([, n]) => n > 0);
    body = `<div class="big">${art(items.length ? 'basket' : 'basket-empty', { size: big * .9 })}<span class="items">${items.map(([k, n]) => art(k, { size: big * .6 }).repeat(n)).join('')}</span></div>${items.length ? '' : '<span class="tag">empty</span>'}`;
  } else if (at === 'stove') {
    title = 'Stove'; cls = 'stove';
    body = `<div class="big">${art('stove', { size: big * .9 })}<span class="items">${s.dishes.map(d => `<span class="dish">${art(d, { size: big * .75 })}</span>`).join('')}</span></div><span class="tag">${s.dishes.length ? 'cooked, ready to serve' : 'nothing cooked yet'}</span>`;
  } else if (at === 'counter') {
    title = 'Counter · customers waiting'; cls = 'counter';
    body = `<div class="tickets">${s.orders.length ? s.orders.map(o => ticket(o, s.day, { size: big * .8 })).join('') : `<span class="empty-counter">${art('counter', { size: big * .8 })}<span class="tag">nobody waiting</span></span>`}</div>`;
  }
  const lock = opts.lock ? `<div class="lock"><span>${rich(opts.lock, 22)}</span></div>` : '';
  return `<div class="card ${cls} ${opts.cls || ''}" data-at="${at}"><div class="ttl"><span>${title}</span></div>${opts.badges === false ? '' : `<div class="rbs">${badges(at, def)}</div>`}${body}<div class="toks">${toks}</div>${bubble}${lock}</div>`;
}

// The recipe book: each dish as a picture sum, and where each ingredient comes from.
export function recipeBook(def, { compact = false } = {}) {
  const dishes = def.dishes.map(d => `<div class="rx"><span class="sum">${recipeArt(d, compact ? 22 : 30)}<i class="eq">→</i>${art(d, { size: compact ? 28 : 40 })}</span>${compact ? '' : `<span class="nm">${DISHES[d].name}</span>`}<span class="st">${stars(DISHES[d].stars, compact ? 12 : 16)}</span></div>`).join('');
  if (compact) return `<div class="book compact" data-act="book">${art('book', { size: 26 })}${dishes}<span class="more">how? ›</span></div>`;
  const crops = def.crops.map(c => `<div class="src">${art(c, { size: 26 })} <b>${CROPS[c].name}</b>: <span class="rb grower">${art('grower', { size: 16 })} plant</span> + ${art('drop', { size: 18 })}×${CROPS[c].need} → <span class="rb cook">${art('cook', { size: 16 })} pick${CROPS[c].heavy ? '</span> + <span class="rb grower">' + art('grower', { size: 16 }) + ' lift' : ''}</span></div>`).join('');
  return `<div class="book"><div class="dishes">${dishes}</div><div class="srcs">${crops}<div class="src">Then <span class="rb cook">${art('cook', { size: 16 })} cook</span> at the stove and <span class="rb cook">${art('cook', { size: 16 })} serve</span> at the counter.</div></div></div>`;
}

// The order a day plays out in, for the TV and the help cards.
export const DAY_STEPS = [['harvest', 'basket', 'pick'], ['plant', 'sprout', 'plant'], ['water', 'drop', 'water'], ['grow', 'herb-grow', 'grow'], ['cook', 'pan', 'cook'], ['serve', 'bell', 'serve']];
export const DAY_ORDER_TEXT = DAY_STEPS.map(s => s[2]).join(' → ');
export const dayOrder = (now = null) => `<div class="order">${DAY_STEPS.map(([k, a, w]) => `<span class="${k === now ? 'now' : ''}">${art(a, { size: 20 })} ${w}</span>`).join('<i>→</i>')}</div>`;
