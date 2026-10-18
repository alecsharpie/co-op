// How-to-play cards, one look for every prototype. Phones show a role card (what you can do, what only your partner
// can do, the goal) the first time someone takes a seat and behind a "?" button; the board shows the game's rules.
//   showHelp({icon, title, intro, sections: [{h, items: [html…]}], button})
//   helpOnce('lighthouse-keeper', card)   only if this phone has not seen it yet
//   roleCard({icon, role, goal, can, partner, tips})   the standard shape for a seat
import { load, save } from './net.js';

let box = null;

export function showHelp({ icon = '', title, intro = '', sections = [], button = 'Got it' }, onClose) {
  closeHelp();
  box = document.createElement('div');
  box.className = 'help-wrap';
  box.innerHTML = `<div class="help" role="dialog" aria-label="${title}">
    <div class="help-title">${icon ? `<span class="help-icon">${icon}</span>` : ''}${title}</div>
    ${intro ? `<p class="help-intro">${intro}</p>` : ''}
    ${sections.map(s => `<div class="help-sec"><h3>${s.h}</h3><ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}
    <button class="btn go help-ok">${button}</button></div>`;
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.help-ok')) { closeHelp(); onClose && onClose(); } });
  document.body.appendChild(box);
}

export function closeHelp() { if (box) { box.remove(); box = null; } }

// One storage key per card, so two pages sharing storage (dev.html) cannot undo each other's write.
export function helpOnce(key, card) {
  if (load(`coop-help-seen:${key}`)) return false;
  save(`coop-help-seen:${key}`, 1);
  showHelp(card);
  return true;
}

export function roleCard({ icon, role, goal, can = [], partner = [], tips = [] }) {
  return {
    icon, title: `You are the ${role}`, intro: goal,
    sections: [
      { h: '✅ You can', items: can },
      ...(partner.length ? [{ h: '🤝 Only your partner can', items: partner }] : []),
      ...(tips.length ? [{ h: '💡 Tips', items: tips }] : []),
    ],
  };
}

// A small round "?" button; put it in a page's top bar and call showHelp from its click handler.
export const helpButtonHtml = (act = 'help') => `<button class="help-btn" data-act="${act}" aria-label="How to play">?</button>`;
