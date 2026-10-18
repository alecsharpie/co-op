// Station cards for the TV and the phones: beds, the basket, the stove and the counter.
import { CROPS, DISHES, ripe, isBed } from './game.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const ROLE = { grower: { icon: '🧑‍🌾', name: 'Grower', tok: '🧤' }, cook: { icon: '🧑‍🍳', name: 'Cook', tok: '🥄' } };

// days left to pick, counting today, before a ripe crop wilts
const wilt = n => `<span class="tag${n <= 1 ? ' bad' : ''}">${n <= 1 ? 'pick today!' : `pick within ${n} days`}</span>`;
const dueText = (o, day) => (o.due === day ? 'due today!' : o.due - day === 1 ? 'due tomorrow' : `due in ${o.due - day} days`);
export const ticket = (o, day) => `<span class="ticket${o.joint ? ' joint' : ''}${o.due === day ? ' urgent' : ''}"><span class="ico">${DISHES[o.dish].icon}</span>${'⭐'.repeat(o.stars)}${o.joint ? ' 🤝' : ''}<small>${dueText(o, day)}</small></span>`;
export const tokChip = (who, label, extra = '', cls = '') => `<span class="tok ${who} ${cls}" ${extra}>${esc(label)}</span>`;

// opts: {tokens: [{who, label, attrs, cls}], cls, bubble: {kind, text}}
export function card(at, s, def, opts = {}) {
  const toks = (opts.tokens || []).map(t => tokChip(t.who, t.label, t.attrs || '', t.cls || '')).join('');
  const bubble = opts.bubble ? `<div class="bubble ${opts.bubble.kind}">${esc(opts.bubble.text)}</div>` : '';
  let body = '', title = '', cls = '';
  if (isBed(at)) {
    const b = s.beds[+at.slice(1)], c = b.crop && CROPS[b.crop];
    title = `Bed ${+at.slice(1) + 1}`; cls = 'bed' + (ripe(b) ? ' ripe' : '');
    const status = !c ? '<span class="tag">bare soil</span>'
      : ripe(b) ? `<span class="tag good">ripe!</span>${def.wilt ? wilt(def.wilt - b.ripeFor + 1) : ''}${c.heavy ? '<span class="tag">lift together</span>' : ''}`
      : `<div class="pips">${Array.from({ length: c.need }, (_, i) => `<span class="pip${i < b.grown ? ' on' : ''}"></span>`).join('')}</div>`;
    body = `<div class="big">${c ? (ripe(b) ? c.icon : '🌱') : '🟫'}</div><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${c ? `<b>${c.name}</b>` : ''}${status}</div>`;
  } else if (at === 'basket') {
    title = 'Basket'; cls = 'info';
    const items = Object.entries(s.basket).filter(([, n]) => n > 0);
    body = `<div class="big">${items.length ? items.map(([k, n]) => CROPS[k].icon.repeat(n)).join(' ') : '🧺'}</div>${items.length ? '' : '<span class="tag">empty</span>'}`;
  } else if (at === 'stove') {
    title = 'Stove'; cls = 'stove';
    body = `<div class="big">🍳 ${s.dishes.map(d => DISHES[d].icon).join('')}</div><span class="tag">${s.dishes.length ? 'ready to serve' : 'nothing cooked yet'}</span>`;
  } else if (at === 'counter') {
    title = 'Counter'; cls = 'counter';
    body = `<div class="tickets">${s.orders.length ? s.orders.map(o => ticket(o, s.day)).join('') : '<span class="tag">no orders waiting</span>'}</div>`;
  }
  return `<div class="card ${cls} ${opts.cls || ''}" data-at="${at}"><div class="ttl"><span>${title}</span></div>${body}<div class="toks">${toks}</div>${bubble}</div>`;
}
