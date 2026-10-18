// Draws clue cards and answer tokens as HTML strings, for the phones (cards) and the TV (tokens in the log).
// Placeholder art: emoji and small inline SVGs. Anything with data-t can be tapped on a phone to tick it off while
// reading it out (hand.html keeps the ticks).
import { COLORS, unmirror } from './rooms.js';

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


const DAY = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday' };
const ANIMAL = { '🦊': 'fox', '🦉': 'owl', '🐇': 'hare' };
const notes = b => `<span class="notes">${[...b].map(n => `<i class="${n === 'L' ? 'long' : 'short'}"></i>`).join('')}</span>`;
const side = o => Object.entries(o).map(([k, n]) => k.repeat(n)).join(' ');
function clueText(k) {
  const a = x => `${x} ${ANIMAL[x]}`;
  if (k.k === 'pos') return `The ${a(k.who)} hangs ${['on the left', 'in the middle', 'on the right'][k.at]}.`;
  if (k.k === 'frame') return `The ${a(k.who)} is in the <b>${esc(k.color)}</b> frame.`;
  if (k.k === 'notFrame') return `The ${a(k.who)} is <b>not</b> in the ${esc(k.color)} frame.`;
  if (k.k === 'leftOf') return `The ${a(k.a)} hangs somewhere to the left of the ${a(k.b)}.`;
  return '';
}

// A clock face; mirrored, its numerals read backwards and the hand shows where it appears in the glass.
export function clockSvg(hour, mirrored = false, size = 180) {
  const nums = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1, a = (h / 12) * 2 * Math.PI;
    return `<text x="${50 + 36 * Math.sin(a)}" y="${54 + 36 * -Math.cos(a)}" text-anchor="middle" font-size="11" font-weight="700" fill="#2a1d00">${h}</text>`;
  }).join('');
  const a = (hour / 12) * 2 * Math.PI;
  const face = `<circle cx="50" cy="50" r="47" fill="#f6ead0" stroke="#8a6a3a" stroke-width="4"/>${nums}
    <line x1="50" y1="50" x2="${50 + 26 * Math.sin(a)}" y2="${50 - 26 * Math.cos(a)}" stroke="#2a1d00" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="#2a1d00"/>`;
  return `<svg class="clock${mirrored ? ' mirrored' : ''}" width="${size}" height="${size}" viewBox="0 0 100 100">${mirrored ? `<g transform="translate(100 0) scale(-1 1)">${face}</g>` : face}</svg>`;
}

const BODY = {
  symbols: c => `<div class="row">${c.items.map((x, i) => `<span class="big-sym" data-t="${i}">${x}</span>`).join('')}</div>`,
  legend: c => `<div class="pairs">${c.pairs.map(([a, b], i) => `<span data-t="${i}">${a}<b>${esc(b)}</b></span>`).join('')}</div>`,
  flags: c => `<div class="row">${c.items.map((f, i) => `<span data-t="${i}">${flagSvg(f)}</span>`).join('')}</div>`,
  flagbook: c => `<div class="book">${c.pairs.map(([f, d], i) => `<div data-t="${i}">${flagSvg(f)}<span>${DIR_ICON[d]} ${DIR_WORD[d]}</span></div>`).join('')}</div>`,
  valves: c => {
    const n = c.colors.length, w = 60 * n + 20;
    const valves = c.colors.map((col, i) => `<g transform="translate(${40 + i * 60} 40)"><rect x="-4" y="0" width="8" height="18" fill="#9aa4b5"/><circle r="17" fill="${COLORS[col]}" stroke="rgba(0,0,0,.4)" stroke-width="3"/><circle r="4" fill="rgba(0,0,0,.4)"/><text y="52" text-anchor="middle" fill="#9fb0cf" font-size="15" font-weight="700">${i + 1}</text></g>`).join('');
    return `<div class="valves"><svg viewBox="0 0 ${w} 100"><rect x="0" y="56" width="${w}" height="14" rx="7" fill="#6b7586"/>${valves}</svg>
      <div class="gauge"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#f1f1f1" stroke="#6b7586" stroke-width="4"/><line x1="30" y1="30" x2="${30 + 18 * Math.cos(Math.PI * (0.75 + c.gauge / 13))}" y2="${30 + 18 * Math.sin(Math.PI * (0.75 + c.gauge / 13))}" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="30" r="3" fill="#333"/></svg><b>${c.gauge}</b><small>gauge</small></div></div>`;
  },
  rules: c => `<ol class="rules">${c.items.map((x, i) => `<li data-t="${i}">${esc(x)}</li>`).join('')}</ol>`,
  grid: c => `<table class="plan"><tr><th></th>${[...c.cols].map(x => `<th>${x}</th>`).join('')}</tr>${[...c.rows].map(r =>
    `<tr><th>${r}</th>${[...c.cols].map(k => `<td>${c.cells[k + r] || ''}</td>`).join('')}</tr>`).join('')}</table><div class="compass">⬆️ north</div>`,
  walk: c => `<div class="walk"><p>Start at the <span class="big-sym sm">${c.start}</span></p>${c.steps.map(([d, k], i) =>
    `<p data-t="${i}">${DIR_ICON[d]} Walk ${k} square${k > 1 ? 's' : ''} ${DIR_WORD[d]}.</p>`).join('')}<p>⛏️ Dig there.</p></div>`,
  digitgrid: c => `<div class="dg">${c.rows.flatMap(r => [...r]).map((d, i) => `<span data-t="${i}">${d}</span>`).join('')}</div>`,
  stencil: c => `<div class="dg stencil">${Array.from({ length: 16 }, (_, i) => `<span class="${c.holes.some(([r, k]) => r * 4 + k === i) ? 'hole' : ''}"></span>`).join('')}</div>`,
  planets: c => `<div class="row planets">${c.items.map((p, i) => `<span data-t="${i}">${planetSvg(p)}</span>`).join('')}</div>`,
  almanac: c => `<div class="walk"><p><b>Nearest first:</b> ${c.order.map(esc).join(' → ')}</p>${c.guide.map((g, i) =>
    `<p data-t="${i}">🪐 <b>${esc(g.name)}</b>: ${g.moons ? g.moons + ' moon' + (g.moons > 1 ? 's' : '') : 'no moons'}, ${g.rings ? 'rings' : 'no rings'}</p>`).join('')}</div>`,
  halfkey: c => `<div class="row key">${c.tokens.map((t, i) => `<span data-t="${i}">${token(c.kind, t, true)}</span>`).join('')}</div>`,
  coach: c => `<ol class="coach">${c.steps.map((x, i) => `<li data-t="${i}">${esc(x)}</li>`).join('')}</ol>`,
  rhythm: c => `<div class="bars">${c.bars.map((b, i) => `<div class="bar" data-t="${i}"><small>Bar ${i + 1}</small>${notes(b)}</div>`).join('')}</div>
    <div class="legend-notes">${notes('L')} long &nbsp; ${notes('S')} short</div>`,
  tunebook: c => `<div class="book">${c.pairs.map(([b, d], i) => `<div data-t="${i}">${notes(b)}<b class="num">${esc(d)}</b></div>`).join('')}</div>`,
  drawer: c => `<div class="drawer">${c.items.map((x, i) => `<span data-t="${i}">${x}</span>`).join('')}</div>`,
  order: c => `<p class="say">${esc(c.text)}</p><div class="row">${c.ask.map((x, i) => `<span class="big-sym ordinal" data-t="${i}"><small>${['1st', '2nd', '3rd', '4th'][i]}</small>${x}</span>`).join('')}</div>`,
  mirrorclock: c => `<div class="row">${clockSvg(unmirror(c.hand), true)}</div>`,
  shred: c => `<div class="shred">${c.rows[0].split(' ').map((_, d) => `<div class="glyph" data-t="${d}">${c.rows.map(r =>
    [...r.split(' ')[d]].map(px => `<i class="${px === '1' ? 'paint' : px === '0' ? 'bare' : 'torn'}"></i>`).join('')).join('')}</div>`).join('')}</div>
    <div class="legend-notes"><i class="paint"></i> paint <i class="bare"></i> bare canvas <i class="torn"></i> your partner’s strip</div>`,
  logic: c => `<ul class="rules logic">${c.clues.map((k, i) => `<li data-t="${i}">${clueText(k)}</li>`).join('')}</ul><p class="say">${esc(c.ask)}</p>`,
  tides: c => `<table class="tides"><tr><th></th>${c.times.map(t => `<th>${esc(t)}</th>`).join('')}</tr>${c.days.map((d, r) =>
    `<tr><th>${esc(d)}</th>${c.heights[r].map((h, k) => `<td data-t="${r * 10 + k}">${h}</td>`).join('')}</tr>`).join('')}</table>`,
  ticket: c => `<div class="ticket"><div><small>Arrived</small><b>${esc(DAY[c.day] || c.day)}</b><b>${esc(c.time)}</b></div><p>${esc(c.rule)}</p></div>`,
  scales: c => c.eqs.map((e, i) => `<div class="scale" data-t="${i}"><span>${side(e.left)}</span><span class="beam">⚖️</span><span>${side(e.right)}</span></div>`).join(''),
  scalenote: c => `<div class="walk">${Object.entries(c.known).map(([k, w]) => `<p>One ${k} weighs <b>${w}</b>.</p>`).join('')}
    <p>The vault asks: what do ${c.ask.join(' and ')} weigh <b>together</b>?</p></div>`,
};

// A clue card on a phone, in its lock's colour. ticks: the set of `${key}:${t}` this phone has ticked off.
export function cardHtml(c, ticks = new Set()) {
  let body = c.solved ? '' : BODY[c.type](c);
  body = body.replace(/data-t="(\d+)"/g, (m, t) => `${m}${ticks.has(`${c.key}:${t}`) ? ' data-ticked="1"' : ''}`);
  return `<section class="clue${c.solved ? ' done' : ''}${c.type === 'halfkey' ? ' halfkey' : ''}${c.type === 'coach' ? ' coach-card' : ''}" style="--lc:${c.color}" data-key="${esc(c.key)}">
    <div class="clue-h"><span class="ico">${c.icon}</span><b>${esc(c.title)}</b>${c.solved ? '<span class="open">🔓 open</span>' : ''}</div>
    <div class="cap">${esc(c.caption)}</div>
    ${body}
  </section>`;
}
