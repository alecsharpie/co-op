// Sound effects synthesised with WebAudio: no audio files, nothing to load. The board plays most sounds (it is the
// shared speaker); phones play only quiet taps. Browsers start audio only after a tap, so unlock() is wired to the
// first pointerdown automatically. Muting is remembered per device.
//   import { sfx, soundToggleHtml } from '../shared/sfx.js';   sfx.good();
import { load, save } from './net.js';

let ctx = null, master = null, muted = load('coop-muted', false);

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : .55; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
addEventListener('pointerdown', () => audio(), { once: true, passive: true });

// One shaped note. f2 slides the pitch; type is an oscillator type or 'noise'.
function note({ f = 440, f2 = null, type = 'sine', dur = .14, vol = .25, at = 0, attack = .006, q = 1 }) {
  const c = audio(); if (!c || muted) return;
  const t = c.currentTime + at, g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let src;
  if (type === 'noise') {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.setValueAtTime(f, t); filt.Q.value = q;
    if (f2) filt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    src.connect(filt).connect(g);
  } else {
    src = c.createOscillator(); src.type = type; src.frequency.setValueAtTime(f, t);
    if (f2) src.frequency.exponentialRampToValueAtTime(f2, t + dur);
    src.connect(g);
  }
  g.connect(master); src.start(t); src.stop(t + dur + .02);
}
const chord = (fs, o = {}) => fs.forEach((f, i) => note({ f, at: (o.step || 0) * i, ...o }));

export const sfx = {
  tap: () => note({ f: 660, type: 'triangle', dur: .06, vol: .12 }),
  select: () => note({ f: 520, f2: 780, type: 'triangle', dur: .09, vol: .14 }),
  back: () => note({ f: 600, f2: 380, type: 'triangle', dur: .09, vol: .12 }),
  lock: () => { note({ f: 300, type: 'square', dur: .05, vol: .08 }); note({ f: 900, type: 'triangle', dur: .12, vol: .14, at: .04 }); },
  reveal: () => { note({ f: 200, f2: 1200, type: 'noise', dur: .35, vol: .18, q: 4 }); chord([523, 659, 784], { type: 'triangle', step: .07, dur: .3, vol: .12, at: .15 }); },
  good: () => chord([660, 880], { type: 'triangle', step: .08, dur: .22, vol: .16 }),
  great: () => chord([523, 659, 784, 1047], { type: 'triangle', step: .07, dur: .35, vol: .16 }),
  bad: () => { note({ f: 220, f2: 150, type: 'sawtooth', dur: .25, vol: .1 }); note({ f: 160, type: 'noise', dur: .2, vol: .2, q: 2 }); },
  thud: () => { note({ f: 120, f2: 50, type: 'sine', dur: .25, vol: .4 }); note({ f: 400, type: 'noise', dur: .12, vol: .2, q: .7 }); },
  splash: () => note({ f: 1800, f2: 400, type: 'noise', dur: .45, vol: .22, q: .8 }),
  whoosh: () => note({ f: 300, f2: 2200, type: 'noise', dur: .3, vol: .14, q: 3 }),
  coin: () => { note({ f: 988, type: 'square', dur: .07, vol: .07 }); note({ f: 1319, type: 'square', dur: .18, vol: .07, at: .07 }); },
  chime: () => chord([1047, 1319, 1568], { type: 'sine', step: .11, dur: .6, vol: .12 }),
  win: () => { chord([523, 659, 784], { type: 'triangle', step: .12, dur: .4, vol: .15 }); chord([1047, 1319], { type: 'triangle', step: .1, dur: .7, vol: .14, at: .4 }); },
  lose: () => chord([392, 330, 262], { type: 'triangle', step: .22, dur: .5, vol: .14 }),
  tick: () => note({ f: 1400, type: 'square', dur: .025, vol: .05 }),
  note, chord,
};

export const isMuted = () => muted;
export function setMuted(m) {
  muted = !!m; save('coop-muted', muted);
  if (master) master.gain.value = muted ? 0 : .55;
}
