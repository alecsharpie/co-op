// The board's join screen: room code, a QR code for the phones, and who has taken which seat.
// Needs qrcode-generator loaded as a global (see lighthouse/board.html).
import { param } from './net.js';

// tools/serve.mjs answers /__lan with this machine's address on the home network, so a board opened at
// localhost still shows phones a URL they can reach. Elsewhere (GitHub Pages) the request just fails.
let lan = null;
export async function findLan() {
  if (!/^(localhost|127\.)/.test(location.hostname)) return;
  try { lan = (await (await fetch('/__lan')).json()).origin; } catch (e) {}
}

export function joinUrl(room, page = 'hand.html') {
  const base = new URL(page, (lan || location.origin) + location.pathname);
  base.searchParams.set('room', room);
  for (const k of ['net', 'relay']) if (param(k) != null) base.searchParams.set(k, param(k));
  return base.href;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// seats: [{label, icon, blurb, taken, name, connected}]
export function renderLobby(el, { room, title, seats, startable, startLabel = 'Start' }) {
  const url = joinUrl(room);
  let qr = '';
  try { const g = qrcode(0, 'M'); g.addData(url); g.make(); qr = g.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) {}
  const stuck = /^(localhost|127\.)/.test(new URL(url).hostname) && param('net') !== 'local';
  const html = `
    <div class="lobby">
      <div class="qr">${qr}</div>
      <div>
        <h1 style="margin:0 0 6px">${esc(title)}</h1>
        <div style="color:var(--ink-2)">Scan with your phones, or open the link and enter</div>
        <div class="code">${esc(room)}</div>
        <div class="url">${esc(url)}</div>
        ${stuck ? '<div class="warn">This board is on localhost, so phones cannot reach that link. Run <b>npm run serve</b> and open the address it prints.</div>' : ''}
        <div class="seats">${seats.map(s => `
          <div class="seat${s.taken ? ' taken' : ''}">
            <div class="who">${s.icon} ${s.taken ? esc(s.name || s.label) : 'Open seat'}</div>
            <div class="role">${esc(s.label)}: ${esc(s.blurb)}</div>
            ${s.taken ? `<div class="chip" style="margin-top:8px"><span class="dot${s.connected ? ' on' : ''}"></span>${s.connected ? 'connected' : 'reconnecting…'}</div>` : ''}
          </div>`).join('')}
        </div>
        <button class="btn go" data-act="start" ${startable ? '' : 'disabled'}>${esc(startLabel)}</button>
        <button class="btn sm" data-act="swap" style="margin-left:8px">Swap roles</button>
      </div>
    </div>`;
  if (el.innerHTML !== html) el.innerHTML = html;
}
