// Lighthouse & Navigator artwork, in the house style of shared/art.js. Night-sea palette; colours are --lh-* tokens
// (set in tiles.css) with literal fallbacks. Signals reuse the shared arrows, check, question and wait icons.
import { defineArt, LINE, SHINE, starPoints } from '../shared/art.js';

// LINE with another width (an SVG element keeps only the first of two stroke-width attributes)
const line = w => `stroke="var(--art-line, #131a2c)" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const FOAM = 'stroke="var(--lh-foam, #dff3ff)" stroke-width="3" stroke-linecap="round" fill="none"';
const foam = (y = 55, op = .7) => `<path d="M4 ${y} q5 -4 10 0 t10 0 t10 0 t10 0 t10 0 t10 0" ${FOAM} opacity="${op}"/>`;
const ripple = y => `<path d="M8 ${y} q6 -4 12 0 t12 0 t12 0 t12 0" stroke="var(--lh-ripple, #8fd0ff)" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>`;

// tower outline: x of the left wall at height y (wall leans in from 22 at y=56 to 27 at y=20)
const lx = y => (22 + (56 - y) * 5 / 36).toFixed(1), rx = y => (64 - (22 + (56 - y) * 5 / 36)).toFixed(1);
const band = (a, b) => `<path d="M${lx(a)} ${a} L${rx(a)} ${a} L${rx(b)} ${b} L${lx(b)} ${b} Z" fill="var(--lh-red, #e0503f)"/>`;

export const SPRITES = {
  rock: `<path d="M7 52 C5 40 12 31 21 31 C23 20 35 15 44 23 C54 23 59 36 57 52 Z" fill="var(--lh-rock, #7a8296)" ${LINE}/>
    <path d="M11 51 C18 45 27 47 33 51 Z" fill="var(--lh-rock-dark, #5b6276)"/><path d="M40 51 C44 44 51 44 54 51 Z" fill="var(--lh-rock-dark, #5b6276)"/>
    <ellipse cx="34" cy="27" rx="7" ry="3.5" ${SHINE}/>${foam()}`,
  'rock-b': `<path d="M6 52 C6 43 11 37 18 38 C20 30 28 28 32 33 C36 24 50 24 52 36 C59 38 60 46 58 52 Z" fill="var(--lh-rock, #7a8296)" ${LINE}/>
    <path d="M30 52 C32 44 40 42 46 52 Z" fill="var(--lh-rock-dark, #5b6276)"/><ellipse cx="41" cy="31" rx="6" ry="3" ${SHINE}/><ellipse cx="17" cy="41" rx="4" ry="2" ${SHINE}/>${foam()}`,
  'rock-c': `<path d="M10 52 C8 36 18 24 30 24 C44 24 56 34 54 52 Z" fill="var(--lh-rock, #7a8296)" ${LINE}/>
    <path d="M14 51 C20 40 30 40 36 51 Z" fill="var(--lh-rock-dark, #5b6276)"/><ellipse cx="27" cy="31" rx="8" ry="3.5" ${SHINE}/>${foam()}`,
  reef: `<path d="M5 50 L12 36 L18 43 L25 27 L32 41 L38 31 L45 42 L50 35 L59 50 Z" fill="var(--lh-reef, #a5714f)" ${LINE}/>
    <path d="M25 33 L28 40 L22 40 Z M38 36 L41 41 L35 41 Z" fill="var(--lh-reef-dark, #7d5239)"/>${foam(54, .85)}`,
  lighthouse: `<path d="M10 60 C10 52 20 49 32 49 C44 49 54 52 54 60 Z" fill="var(--lh-rock, #7a8296)" ${LINE}/>
    <path d="M${lx(56)} 56 L${lx(20)} 20 L${rx(20)} 20 L${rx(56)} 56 Z" fill="var(--lh-white, #f4f1e8)"/>
    ${band(30, 37)}${band(44, 51)}
    <path d="M${lx(56)} 56 L${lx(20)} 20 L${rx(20)} 20 L${rx(56)} 56 Z" fill="none" ${LINE}/>
    <rect x="22" y="17" width="20" height="5" rx="2" fill="var(--lh-dark, #2b3550)" ${LINE}/>
    <rect x="26" y="8" width="12" height="10" rx="2" fill="var(--lh-glow, #ffe27a)" ${LINE}/>
    <path d="M24 9 L32 2 L40 9 Z" fill="var(--lh-red, #e0503f)" ${LINE}/>
    <rect x="29" y="40" width="6" height="9" rx="3" fill="var(--lh-dark, #2b3550)"/><rect x="${lx(52) * 1 + 3}" y="24" width="3" height="20" rx="1.5" ${SHINE}/>`,
  harbor: `<rect x="4" y="30" width="56" height="13" rx="3" fill="var(--lh-wood, #b98552)" ${LINE}/>
    <path d="M18 30 V43 M32 30 V43 M46 30 V43" stroke="var(--lh-wood-dark, #85593a)" stroke-width="2.5"/>
    <rect x="9" y="42" width="6" height="14" rx="2" fill="var(--lh-wood-dark, #85593a)" ${LINE}/><rect x="49" y="42" width="6" height="14" rx="2" fill="var(--lh-wood-dark, #85593a)" ${LINE}/>
    <path d="M40 30 V8" ${LINE}/><path d="M40 9 L55 14 L40 19 Z" fill="var(--lh-flag, #ffcf5a)" ${LINE}/>
    <rect x="6" y="32" width="20" height="3" rx="1.5" ${SHINE}/>${ripple(58)}`,
  current: `<path d="M10 18 L26 32 L10 46" stroke="var(--art-line, #131a2c)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".5"/>
    <path d="M10 18 L26 32 L10 46" stroke="var(--lh-current, #bfe8ff)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M32 18 L48 32 L32 46" stroke="var(--lh-current, #bfe8ff)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55"/>`,
  fog: `<g fill="var(--lh-fog, #c6cfdf)" stroke="var(--lh-fog-line, #7d889e)" stroke-width="3"><circle cx="20" cy="38" r="11"/><circle cx="34" cy="30" r="14"/><circle cx="46" cy="40" r="10"/></g>
    <rect x="10" y="38" width="46" height="12" rx="6" fill="var(--lh-fog, #c6cfdf)"/><ellipse cx="30" cy="25" rx="6" ry="3" ${SHINE}/>`,
  boat: `<path d="M33 9 V41" ${LINE}/><path d="M35 11 L53 37 H35 Z" fill="var(--lh-sail, #f6ecd2)" ${LINE}/><path d="M31 15 L15 37 H31 Z" fill="var(--lh-white, #ffffff)" ${LINE}/>
    <path d="M33 9 L41 6 L33 4" fill="var(--lh-red, #e0503f)" ${line(2)}/>
    <path d="M7 41 H57 L49 54 H15 Z" fill="var(--lh-hull, #d9603f)" ${LINE}/><path d="M11 46 H53" stroke="var(--lh-white, #f4f1e8)" stroke-width="3"/>
    <path d="M38 16 L46 29" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
  floe: `<path d="M9 45 L17 27 L27 31 L35 15 L46 28 L55 45 Z" fill="var(--lh-ice, #e6f6ff)" ${LINE}/>
    <path d="M35 15 L38 45 H55 L46 28 Z" fill="var(--lh-ice-dark, #a8d6f0)"/><path d="M17 27 L21 45 H9 Z" fill="var(--lh-ice-dark, #a8d6f0)"/>
    <path d="M9 45 L17 27 L27 31 L35 15 L46 28 L55 45 Z" fill="none" ${LINE}/><path d="M28 29 L33 20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${ripple(52)}`,
  shatter: `<g fill="var(--lh-ice, #e6f6ff)" ${line(2.5)}><path d="M6 20 L22 12 L20 30 Z"/><path d="M40 6 L58 18 L42 26 Z"/><path d="M8 46 L26 38 L24 58 Z"/><path d="M42 40 L58 46 L46 58 Z"/><path d="M26 24 L38 22 L40 38 L26 40 Z"/></g>
    <path d="M28 27 L34 26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  crash: `<polygon points="${starPoints(32, 32, 27, 13, 8, -90)}" fill="var(--lh-crash, #ff9a4d)" ${LINE}/><polygon points="${starPoints(32, 32, 14, 7, 8, -70)}" fill="var(--lh-glow, #ffe27a)"/>`,
  buoy: `<ellipse cx="32" cy="50" rx="17" ry="5" fill="var(--lh-ripple, #8fd0ff)" opacity=".5"/>
    <path d="M22 48 L26 22 H38 L42 48 Z" fill="var(--lh-buoy, #ff7a3d)" ${LINE}/><path d="M24.5 34 H39.5 L40.6 41 H23.4 Z" fill="var(--lh-white, #f4f1e8)"/>
    <path d="M22 48 L26 22 H38 L42 48 Z" fill="none" ${LINE}/><path d="M32 22 V14" ${LINE}/><circle cx="32" cy="11" r="5" fill="var(--lh-glow, #ffe27a)" ${LINE}/><rect x="28" y="25" width="3" height="8" rx="1.5" ${SHINE}/>`,
  sonar: `<circle cx="32" cy="32" r="25" fill="var(--lh-sonar-bg, #12392f)" ${LINE}/><circle cx="32" cy="32" r="16" fill="none" stroke="var(--lh-sonar, #6ff0bd)" stroke-width="2.5" opacity=".6"/>
    <circle cx="32" cy="32" r="7" fill="none" stroke="var(--lh-sonar, #6ff0bd)" stroke-width="2.5" opacity=".8"/><path d="M32 32 L49 15" stroke="var(--lh-sonar, #6ff0bd)" stroke-width="4" stroke-linecap="round"/><circle cx="43" cy="38" r="3.5" fill="var(--lh-sonar, #6ff0bd)"/>`,
  lamp: `<path d="M24 16 a8 8 0 0 1 16 0" fill="none" ${LINE}/><rect x="22" y="16" width="20" height="6" rx="2" fill="var(--lh-dark, #2b3550)" ${LINE}/>
    <rect x="23" y="22" width="18" height="24" rx="4" fill="var(--lh-glow, #ffe27a)" ${LINE}/><path d="M32 28 C36 33 36 38 32 40 C28 38 28 33 32 28 Z" fill="var(--lh-crash, #ff9a4d)"/>
    <rect x="20" y="46" width="24" height="7" rx="2" fill="var(--lh-dark, #2b3550)" ${LINE}/><rect x="26" y="25" width="3" height="10" rx="1.5" ${SHINE}/>`,
  oil: `<rect x="16" y="12" width="32" height="42" rx="6" fill="var(--lh-oil, #c0473a)" ${LINE}/><path d="M16 24 H48 M16 42 H48" ${line(2.5)}/>
    <path d="M32 27 C36 32 37 35 32 38 C27 35 28 32 32 27 Z" fill="var(--lh-glow, #ffe27a)"/><rect x="20" y="15" width="4" height="34" rx="2" ${SHINE}/>`,
  danger: `<path d="M32 8 L58 54 H6 Z" fill="var(--lh-flag, #ffcf5a)" ${LINE}/><path d="M32 24 V38" stroke="var(--art-line, #131a2c)" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="46" r="3.6" fill="var(--art-line, #131a2c)"/>`,
  anchor: `<circle cx="32" cy="12" r="6" fill="none" ${line(5)}/><circle cx="32" cy="12" r="6" fill="none" stroke="var(--lh-steel, #d8e1f0)" stroke-width="2"/>
    <path d="M32 18 V54 M20 28 H44 M12 40 C14 50 22 55 32 55 C42 55 50 50 52 40" fill="none" ${line(7)}/>
    <path d="M32 18 V54 M20 28 H44 M12 40 C14 50 22 55 32 55 C42 55 50 50 52 40" fill="none" stroke="var(--lh-steel, #d8e1f0)" stroke-width="3" stroke-linecap="round"/>
    <path d="M7 42 L12 36 L17 42 M47 42 L52 36 L57 42" fill="var(--lh-steel, #d8e1f0)" ${line(2.5)}/>`,
  wreck: `<g transform="rotate(-24 32 40)"><path d="M33 13 V41" ${LINE}/><path d="M35 15 L49 37 H35 Z" fill="var(--lh-sail, #f6ecd2)" ${LINE}/>
    <path d="M7 41 H57 L49 54 H15 Z" fill="var(--lh-hull, #d9603f)" ${LINE}/><path d="M24 44 L29 50 L26 52" stroke="var(--art-line, #131a2c)" stroke-width="2.5" fill="none"/></g>
    <path d="M2 50 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 V64 H2 Z" fill="var(--lh-sea, #1d4f7a)" ${LINE}/>${foam(50, .9)}`,
  keeper: `<circle cx="32" cy="32" r="29" fill="var(--lh-keeper-bg, #2f6b8f)" ${LINE}/>
    <path d="M12 58 C14 46 22 42 32 42 C42 42 50 46 52 58 Z" fill="var(--lh-coat, #f2b33d)" ${LINE}/>
    <circle cx="32" cy="31" r="12" fill="var(--lh-skin, #f2c39b)" ${LINE}/>
    <path d="M19 28 C19 16 45 16 45 28 Z" fill="var(--lh-red, #e0503f)" ${LINE}/><path d="M18 28 H46" ${line(5)}/><path d="M18 28 H46" stroke="var(--lh-white, #f4f1e8)" stroke-width="2.5"/>
    <circle cx="32" cy="14" r="4" fill="var(--lh-white, #f4f1e8)" ${LINE}/>
    <circle cx="27.5" cy="33" r="1.8" fill="var(--art-line, #131a2c)"/><circle cx="36.5" cy="33" r="1.8" fill="var(--art-line, #131a2c)"/>
    <path d="M28 38 Q32 41 36 38" fill="none" ${line(2.2)}/><circle cx="24.5" cy="37" r="2.2" fill="#ff8e8e" opacity=".6"/><circle cx="39.5" cy="37" r="2.2" fill="#ff8e8e" opacity=".6"/>`,
  navigator: `<circle cx="32" cy="32" r="29" fill="var(--lh-nav-bg, #3b5d8f)" ${LINE}/>
    <path d="M12 58 C14 46 22 42 32 42 C42 42 50 46 52 58 Z" fill="var(--lh-navy, #24324f)" ${LINE}/><path d="M28 43 L32 50 L36 43" fill="var(--lh-white, #f4f1e8)" ${line(2)}/>
    <circle cx="32" cy="32" r="12" fill="var(--lh-skin-2, #d9a27a)" ${LINE}/>
    <path d="M17 24 C17 15 47 15 47 24 L45 27 H19 Z" fill="var(--lh-white, #f4f1e8)" ${LINE}/><rect x="17" y="25" width="30" height="5" rx="2" fill="var(--lh-navy, #24324f)" ${LINE}/>
    <circle cx="32" cy="21" r="3" fill="var(--lh-flag, #ffcf5a)" ${line(2)}/>
    <circle cx="27.5" cy="34" r="1.8" fill="var(--art-line, #131a2c)"/><circle cx="36.5" cy="34" r="1.8" fill="var(--art-line, #131a2c)"/>
    <path d="M28 39 Q32 42 36 39" fill="none" ${line(2.2)}/><circle cx="24.5" cy="38" r="2.2" fill="#ff8e8e" opacity=".5"/><circle cx="39.5" cy="38" r="2.2" fill="#ff8e8e" opacity=".5"/>`,
  sync: `<circle cx="24" cy="32" r="15" fill="none" ${line(8)}/><circle cx="40" cy="32" r="15" fill="none" ${line(8)}/>
    <circle cx="24" cy="32" r="15" fill="none" stroke="var(--lh-glow, #ffe27a)" stroke-width="4"/><circle cx="40" cy="32" r="15" fill="none" stroke="var(--lh-sonar, #6ff0bd)" stroke-width="4"/>`,
  moon: `<path d="M40 8 A24 24 0 1 0 56 44 A19 19 0 1 1 40 8 Z" fill="var(--lh-moon, #f6ecd2)" ${LINE}/><circle cx="26" cy="38" r="3" fill="var(--lh-moon-dark, #dccfae)"/><circle cx="33" cy="48" r="2" fill="var(--lh-moon-dark, #dccfae)"/>`,
};

defineArt(SPRITES);
