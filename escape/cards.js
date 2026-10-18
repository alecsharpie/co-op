// Draws clue cards and answer tokens as HTML strings, for the phones (cards) and the TV (tokens in the log).
// Placeholder art: emoji and small inline SVGs.
import { COLORS } from './rooms.js';

export const DIR_ICON = { N: '⬆️', E: '➡️', S: '⬇️', W: '⬅️' };
const DIR_WORD = { N: 'north', E: 'east', S: 'south', W: 'west' };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function flagSvg(f) {
  const a = COLORS[f.a], b = COLORS[f.b] || a;
  const body = {
    solid: `<rect width="60" height="40" fill="${a}"/>`,
    split: `<rect width="30" height="40" fill="${a}"/><rect x="30" width="30" height="40" fill="${b}"/>`,
    cross: `<rect width="60" height="40" fill="${a}"/><rect x="24" width="12" height="40" fill="${b}"/><rect y="14" width="60" height="12" fill="${b}"/>`,
    stripes: `<rect width="60" height="40" fill="${a}"/><rect y="13" width="60" height="14" fill="${b}"/>`,
  }[f.pattern];
  return `<svg class="flag" viewBox="0 0 60 40" aria-label="${esc(`${f.pattern} ${f.a} ${f.b || ''}`)}">${body}<rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/></svg>`;
}

export function planetSvg(p) {
  const c = COLORS[p.color];
  const moons = Array.from({ length: p.moons }, (_, i) => `<circle cx="${18 + i * 64}" cy="14" r="7" fill="#d9dde6"/>`).join('');
  const rings = p.rings ? `<ellipse cx="50" cy="55" rx="44" ry="11" fill="none" stroke="#e8d9a8" stroke-width="5" transform="rotate(-12 50 55)"/>` : '';
  return `<svg class="planet" viewBox="0 0 100 100"><circle cx="50" cy="55" r="26" fill="${c}"/>${rings}${moons}</svg>`;
}

const swatch = (name, big) => `<span class="sw${big ? ' big' : ''}"><i style="background:${COLORS[name]}"></i><small>${esc(name)}</small></span>`;

// One answer token: a digit, an arrow, a colour or a letter.
export function token(kind, t, big) {
  if (kind === 'colors') return swatch(t, big);
  if (kind === 'dirs') return `<span class="tk">${DIR_ICON[t] || esc(t)}</span>`;
  return `<span class="tk">${esc(t)}</span>`;
}

const BODY = {
  symbols: c => `<div class="row">${c.items.map(x => `<span class="big-sym">${x}</span>`).join('')}</div>`,
  legend: c => `<div class="pairs">${c.pairs.map(([a, b]) => `<span>${a}<b>${esc(b)}</b></span>`).join('')}</div>`,
  flags: c => `<div class="row">${c.items.map(flagSvg).join('')}</div>`,
  flagbook: c => `<div class="book">${c.pairs.map(([f, d]) => `<div>${flagSvg(f)}<span>${DIR_ICON[d]} ${DIR_WORD[d]}</span></div>`).join('')}</div>`,
  valves: c => {
    const n = c.colors.length, w = 60 * n + 20;
    const valves = c.colors.map((col, i) => `<g transform="translate(${40 + i * 60} 40)"><rect x="-4" y="0" width="8" height="18" fill="#9aa4b5"/><circle r="17" fill="${COLORS[col]}" stroke="rgba(0,0,0,.4)" stroke-width="3"/><circle r="4" fill="rgba(0,0,0,.4)"/><text y="52" text-anchor="middle" fill="#9fb0cf" font-size="15" font-weight="700">${i + 1}</text></g>`).join('');
    return `<div class="valves"><svg viewBox="0 0 ${w} 100"><rect x="0" y="56" width="${w}" height="14" rx="7" fill="#6b7586"/>${valves}</svg>
      <div class="gauge"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#f1f1f1" stroke="#6b7586" stroke-width="4"/><line x1="30" y1="30" x2="${30 + 18 * Math.cos(Math.PI * (0.75 + c.gauge / 13))}" y2="${30 + 18 * Math.sin(Math.PI * (0.75 + c.gauge / 13))}" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="30" r="3" fill="#333"/></svg><b>${c.gauge}</b><small>gauge</small></div></div>`;
  },
  rules: c => `<ol class="rules">${c.items.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`,
  grid: c => `<table class="plan"><tr><th></th>${[...c.cols].map(x => `<th>${x}</th>`).join('')}</tr>${[...c.rows].map(r =>
    `<tr><th>${r}</th>${[...c.cols].map(k => `<td>${c.cells[k + r] || ''}</td>`).join('')}</tr>`).join('')}</table><div class="compass">⬆️ north</div>`,
  walk: c => `<div class="walk"><p>Start at the <span class="big-sym sm">${c.start}</span></p>${c.steps.map(([d, k]) =>
    `<p>${DIR_ICON[d]} Walk ${k} square${k > 1 ? 's' : ''} ${DIR_WORD[d]}.</p>`).join('')}<p>⛏️ Dig there.</p></div>`,
  digitgrid: c => `<div class="dg">${c.rows.flatMap(r => [...r]).map(d => `<span>${d}</span>`).join('')}</div>`,
  stencil: c => `<div class="dg stencil">${Array.from({ length: 16 }, (_, i) => `<span class="${c.holes.some(([r, k]) => r * 4 + k === i) ? 'hole' : ''}"></span>`).join('')}</div>`,
  planets: c => `<div class="row planets">${c.items.map(planetSvg).join('')}</div>`,
  almanac: c => `<div class="walk"><p><b>Nearest first:</b> ${c.order.map(esc).join(' → ')}</p>${c.guide.map(g =>
    `<p>🪐 <b>${esc(g.name)}</b>: ${g.moons ? g.moons + ' moon' + (g.moons > 1 ? 's' : '') : 'no moons'}, ${g.rings ? 'rings' : 'no rings'}</p>`).join('')}</div>`,
  halfkey: c => `<div class="row key">${c.tokens.map(t => token(c.kind, t, true)).join('')}</div>`,
};

export function cardHtml(c) {
  return `<section class="clue${c.solved ? ' done' : ''}${c.type === 'halfkey' ? ' halfkey' : ''}">
    <div class="clue-h"><span class="ico">${c.icon}</span><b>${esc(c.title)}</b>${c.solved ? '<span class="open">🔓 open</span>' : ''}</div>
    <div class="cap">${esc(c.caption)} <span class="for">For the ${esc(c.lockTitle.toLowerCase())}.</span></div>
    ${c.solved ? '' : BODY[c.type](c)}
  </section>`;
}
