// Station cards, the recipe book and the role badges, shared by the TV and the phones.
import { CROPS, DISHES, ripe, toRipen, isBed, rolesAt, bedName } from './game.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ROLE = { grower: { icon: '🧑‍🌾', name: 'Grower', tok: '🧤' }, cook: { icon: '🧑‍🍳', name: 'Cook', tok: '🥄' } };

// days left to pick, counting today, before a ripe crop wilts
const wilt = n => `<span class="tag${n <= 1 ? ' bad' : ''}">${n <= 1 ? 'pick today or it wilts!' : `pick within ${n} days`}</span>`;
const dueText = (o, day) => (o.due === day ? 'leaves tonight!' : o.due - day === 1 ? 'waits until tomorrow' : `waits ${o.due - day + 1} days`);
const recipe = d => Object.entries(DISHES[d].needs).map(([c, n]) => CROPS[c].icon.repeat(n)).join('+');
export const ticket = (o, day) => `<span class="ticket${o.joint ? ' joint' : ''}${o.due === day ? ' urgent' : ''}"><span class="ico">${DISHES[o.dish].icon}</span><span class="tk"><b>${'⭐'.repeat(o.stars)}${o.joint ? ' 🤝 feast' : ''}</b><small>${recipe(o.dish)} · ${dueText(o, day)}</small></span></span>`;
export const tokChip = (who, label, extra = '', cls = '') => `<span class="tok ${who} ${cls}" ${extra}>${esc(label)}</span>`;

// Who may act here, as coloured chips: "🧑‍🌾 plant · water" "🧑‍🍳 pick".
export const badges = (at, def) => Object.entries(rolesAt(at, def)).map(([r, what]) => `<span class="rb ${r}">${ROLE[r].icon} ${what}</span>`).join('');

// opts: {tokens: [{who, label, attrs, cls}], cls, bubble: {kind, text}, lock: 'Cook only', badges: false}
export function card(at, s, def, opts = {}) {
  const toks = (opts.tokens || []).map(t => tokChip(t.who, t.label, t.attrs || '', t.cls || '')).join('');
  const bubble = opts.bubble ? `<div class="bubble ${opts.bubble.kind}">${esc(opts.bubble.text)}</div>` : '';
  let body = '', title = '', cls = '';
  if (isBed(at)) {
    const b = s.beds[+at.slice(1)], c = b.crop && CROPS[b.crop];
    title = bedName(at); cls = 'bed' + (ripe(b) ? ' ripe' : '');
    const status = !c ? '<span class="tag">bare soil: plant here</span>'
      : ripe(b) ? `<span class="tag good">ripe: pick it!</span>${def.wilt ? wilt(def.wilt - b.ripeFor + 1) : ''}${c.heavy ? '<span class="tag">🤝 lift together</span>' : ''}`
      : `<span class="tag water">💧 needs ${toRipen(b)} more watering${toRipen(b) > 1 ? 's' : ''}</span>`;
    body = `<div class="big">${c ? (ripe(b) ? c.icon : '🌱') : '🟫'}</div><div class="line">${c ? `<b>${c.name}</b>` : ''}${status}</div>`;
  } else if (at === 'basket') {
    title = 'Basket · picked crops wait here'; cls = 'info';
    const items = Object.entries(s.basket).filter(([, n]) => n > 0);
    body = `<div class="big">${items.length ? items.map(([k, n]) => CROPS[k].icon.repeat(n)).join(' ') : '🧺'}</div>${items.length ? '' : '<span class="tag">empty</span>'}`;
  } else if (at === 'stove') {
    title = 'Stove'; cls = 'stove';
    body = `<div class="big">🍳 ${s.dishes.map(d => DISHES[d].icon).join('')}</div><span class="tag">${s.dishes.length ? 'cooked, ready to serve' : 'nothing cooked yet'}</span>`;
  } else if (at === 'counter') {
    title = 'Counter · customers waiting'; cls = 'counter';
    body = `<div class="tickets">${s.orders.length ? s.orders.map(o => ticket(o, s.day)).join('') : '<span class="tag">nobody waiting</span>'}</div>`;
  }
  const lock = opts.lock ? `<div class="lock">${esc(opts.lock)}</div>` : '';
  return `<div class="card ${cls} ${opts.cls || ''}" data-at="${at}"><div class="ttl"><span>${title}</span></div>${opts.badges === false ? '' : `<div class="rbs">${badges(at, def)}</div>`}${body}<div class="toks">${toks}</div>${bubble}${lock}</div>`;
}

// The recipe book: each dish as a picture sum, and where each ingredient comes from.
export function recipeBook(def, { compact = false } = {}) {
  const dishes = def.dishes.map(d => `<div class="rx"><span class="sum">${recipe(d).replaceAll('+', ' + ')} → ${DISHES[d].icon}</span>${compact ? '' : `<span class="nm">${DISHES[d].name}</span>`}<span class="st">${'⭐'.repeat(DISHES[d].stars)}</span></div>`).join('');
  if (compact) return `<div class="book compact" data-act="book">${dishes}<span class="more">how? ›</span></div>`;
  const crops = def.crops.map(c => `<div class="src">${CROPS[c].icon} <b>${CROPS[c].name}</b>: <span class="rb grower">${ROLE.grower.icon} plant</span> + 💧×${CROPS[c].need} → <span class="rb cook">${ROLE.cook.icon} pick${CROPS[c].heavy ? ' + 🧑‍🌾 lift' : ''}</span></div>`).join('');
  return `<div class="book"><div class="dishes">${dishes}</div><div class="srcs">${crops}<div class="src">Then <span class="rb cook">${ROLE.cook.icon} cook</span> at the stove and <span class="rb cook">${ROLE.cook.icon} serve</span> at the counter.</div></div></div>`;
}

// The order a day plays out in, for the TV and the help cards.
export const DAY_ORDER = ['🧺 pick', '🌱 plant', '💧 water', '🌿 grow', '🍳 cook', '🛎️ serve'];
export const dayOrder = () => `<div class="order">${DAY_ORDER.map(s => `<span>${s}</span>`).join('<i>→</i>')}</div>`;
