// Co-op Spire artwork, in the house style of shared/art.js: enemies (128 box, they are the TV's centrepiece),
// portraits, card families, intents, statuses, combo signs, relics, events and map nodes (64 box).
import { defineArt, LINE as L, SHINE, starPoints } from '../shared/art.js';

const STEEL = 'var(--art-steel, #c9d3e6)', GOLD = 'var(--sp-gold, #ffcf5a)', WOOD = '#9a6236', INK = 'var(--art-line, #131a2c)';
const BLUE = 'var(--sp-warden, #6fb3ff)', ORANGE = 'var(--sp-striker, #ff8f6b)';
const eye = (x, y, r = 5, pupil = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${L} stroke-width="2.5"/><circle cx="${x + r * .2}" cy="${y + r * .15}" r="${r * .5}" fill="${pupil}"/>`;

// pieces reused across sprites
const shieldPath = 'M32 6 L54 13 V30 C54 44 44 53 32 59 C20 53 10 44 10 30 V13 Z';
const shield = (fill = BLUE, x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="${shieldPath}" fill="${fill}" ${L}/><path d="M32 13 L47 18 V30 C47 40 40 47 32 51 Z" fill="#000" opacity=".14"/><path d="M32 6 V59" stroke="${INK}" stroke-width="2.5" opacity=".35"/><path d="M16 17 L29 12.5 V21 L16 25 Z" ${SHINE}/></g>`;
const sword = (rot = 45, blade = '#eef3fb', s = 1, x = 0, y = 0) => `<g transform="translate(${x} ${y}) rotate(${rot} 32 32) translate(32 32) scale(${s}) translate(-32 -32)"><path d="M28 38 V8 L32 2 L36 8 V38 Z" fill="${blade}" ${L}/><path d="M32 6 V36" stroke="#fff" stroke-width="2" opacity=".6"/><rect x="21" y="37" width="22" height="6" rx="3" fill="${GOLD}" ${L}/><rect x="29" y="43" width="6" height="12" rx="2" fill="${WOOD}" ${L}/><circle cx="32" cy="57.5" r="3.5" fill="${GOLD}" ${L}/></g>`;
const dagger = (rot, x = 0, y = 0) => `<g transform="translate(${x} ${y}) rotate(${rot} 32 32)"><path d="M29 36 V14 L32 8 L35 14 V36 Z" fill="#eef3fb" ${L}/><rect x="24" y="35" width="16" height="5" rx="2.5" fill="${GOLD}" ${L}/><rect x="29.5" y="40" width="5" height="10" rx="2" fill="${WOOD}" ${L}/></g>`;
const target = (cx = 32, cy = 32, r = 24) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff6b6b" ${L}/><circle cx="${cx}" cy="${cy}" r="${r * .66}" fill="#fff" ${L} stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${r * .33}" fill="#ff6b6b" ${L} stroke-width="2.5"/><ellipse cx="${cx - r * .45}" cy="${cy - r * .5}" rx="${r * .2}" ry="${r * .12}" ${SHINE}/>`;
const flame = (x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M32 6 C40 18 50 24 48 40 C46 52 38 58 32 58 C24 58 16 52 16 40 C16 30 24 26 26 16 C30 22 32 26 32 6Z" fill="#ff8f3a" ${L}/><path d="M32 30 C36 36 41 40 40 47 C39 53 35 55 32 55 C28 55 24 52 24 47 C24 42 28 40 32 30Z" fill="#ffd25a"/></g>`;
const drop = (fill, x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M32 6 C40 20 50 30 50 40 a18 18 0 0 1 -36 0 C14 30 24 20 32 6Z" fill="${fill}" ${L}/><ellipse cx="25" cy="38" rx="4" ry="7" ${SHINE}/></g>`;
const bolt = `<path d="M36 4 L14 36 H30 L26 60 L50 26 H34 Z" fill="${GOLD}" ${L}/><path d="M33 10 L20 32 H28 Z" ${SHINE}/>`;

export const SPRITES = {
  // --- enemies: 128 box, a soft shadow under each, faces with personality
  'en-slime': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="114" rx="46" ry="7" fill="#000" opacity=".25"/>
    <path d="M18 110 C8 110 8 96 14 86 C18 58 38 28 64 28 C90 28 110 58 114 86 C120 96 120 110 110 110 Z" fill="#62c46a" ${L}/>
    <path d="M24 104 C40 110 88 110 104 104 C110 96 110 90 108 86 C100 100 30 100 20 86 C18 92 18 98 24 104Z" fill="#000" opacity=".15"/>
    <ellipse cx="44" cy="52" rx="12" ry="7" fill="#fff" opacity=".35" transform="rotate(-30 44 52)"/><circle cx="84" cy="44" r="4" fill="#fff" opacity=".35"/>
    ${eye(50, 72, 9)}${eye(80, 72, 9)}<path d="M56 90 Q65 98 74 90" fill="none" ${L}/>` },
  'en-bat': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="116" rx="30" ry="5" fill="#000" opacity=".22"/>
    <g opacity=".65" transform="translate(70 4) scale(.45)"><path d="M64 60 C40 30 14 34 4 50 C16 52 20 60 22 70 C32 64 40 70 44 80 C52 72 58 72 64 76 C70 72 76 72 84 80 C88 70 96 64 106 70 C108 60 112 52 124 50 C114 34 88 30 64 60Z" fill="#6b4f9a" ${L}/><ellipse cx="64" cy="68" rx="16" ry="20" fill="#7d5cb4" ${L}/></g>
    <path d="M64 58 C38 22 10 28 2 48 C16 50 20 60 22 72 C34 64 42 72 46 84 C54 74 58 74 64 78 C70 74 74 74 82 84 C86 72 94 64 106 72 C108 60 112 50 126 48 C118 28 90 22 64 58Z" fill="#6b4f9a" ${L}/>
    <path d="M30 40 C36 46 40 56 42 66 M98 40 C92 46 88 56 86 66" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".4"/>
    <path d="M48 50 L44 30 L56 44 Z M80 50 L84 30 L72 44 Z" fill="#7d5cb4" ${L}/>
    <ellipse cx="64" cy="70" rx="22" ry="26" fill="#7d5cb4" ${L}/><ellipse cx="56" cy="56" rx="6" ry="4" ${SHINE}/>
    <circle cx="55" cy="66" r="6" fill="#ff4d6d" ${L} stroke-width="2.5"/><circle cx="73" cy="66" r="6" fill="#ff4d6d" ${L} stroke-width="2.5"/>
    <path d="M56 82 Q64 88 72 82" fill="none" ${L}/><path d="M58 83 L60 90 L62 84 M66 84 L68 90 L70 83" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` },
  'en-crab': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="114" rx="48" ry="6" fill="#000" opacity=".22"/>
    <path d="M30 90 L14 108 M40 96 L30 112 M98 90 L114 108 M88 96 L98 112" stroke="#d9573f" stroke-width="7" stroke-linecap="round"/><path d="M30 90 L14 108 M40 96 L30 112 M98 90 L114 108 M88 96 L98 112" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    <path d="M30 60 L22 40 M98 60 L106 40" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M30 60 L22 40 M98 60 L106 40" stroke="#f2704f" stroke-width="5" stroke-linecap="round"/>
    <path d="M10 30 C4 18 16 6 28 12 L22 24 L32 26 C34 36 22 42 10 30Z" fill="#f2704f" ${L}/><path d="M118 30 C124 18 112 6 100 12 L106 24 L96 26 C94 36 106 42 118 30Z" fill="#f2704f" ${L}/>
    <path d="M40 58 L46 44 L52 56 L58 40 L64 54 L70 40 L76 56 L82 44 L88 58" fill="#e8d6b0" ${L}/>
    <ellipse cx="64" cy="78" rx="40" ry="24" fill="#f2704f" ${L}/><path d="M28 82 C40 98 88 98 100 82 C100 92 88 102 64 102 C40 102 28 92 28 82Z" fill="#000" opacity=".15"/>
    <ellipse cx="48" cy="68" rx="9" ry="5" ${SHINE}/>
    <path d="M54 58 V46 M74 58 V46" stroke="${INK}" stroke-width="3"/>${eye(54, 44, 7)}${eye(74, 44, 7)}<path d="M54 84 Q64 80 74 84" fill="none" ${L}/>` },
  'en-cultist': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="38" ry="6" fill="#000" opacity=".22"/>
    <path d="M64 10 C40 14 30 40 30 64 L18 116 H110 L98 64 C98 40 88 14 64 10Z" fill="#9b2f3f" ${L}/>
    <path d="M64 10 C70 30 78 60 98 64 L110 116 H84 C80 80 72 40 64 10Z" fill="#000" opacity=".18"/>
    <path d="M44 62 C44 42 52 30 64 30 C76 30 84 42 84 62 C78 68 50 68 44 62Z" fill="#2a1622" ${L}/>
    <circle cx="56" cy="52" r="4" fill="#ffd25a"/><circle cx="72" cy="52" r="4" fill="#ffd25a"/>
    <path d="M38 88 C50 80 78 80 90 88 L86 98 C74 92 54 92 42 98Z" fill="#7d2433" ${L}/>
    <rect x="58" y="74" width="12" height="20" rx="3" fill="#f4ead2" ${L}/>${flame(52, 50, .38)}` },
  'en-hexer': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="36" ry="6" fill="#000" opacity=".22"/>
    <path d="M36 116 L46 70 H82 L92 116Z" fill="#5b3a8c" ${L}/><path d="M64 70 H82 L92 116 H70Z" fill="#000" opacity=".16"/>
    <circle cx="64" cy="60" r="20" fill="#9ad27a" ${L}/><path d="M60 64 Q64 72 68 64" fill="#9ad27a" ${L} stroke-width="2.5"/>
    ${eye(56, 56, 5, '#7a1f6e')}${eye(72, 56, 5, '#7a1f6e')}<path d="M57 70 Q64 76 71 70" fill="none" ${L} stroke-width="2.5"/>
    <path d="M28 44 C46 40 82 40 100 44 L92 50 H36Z" fill="#3d2563" ${L}/><path d="M40 44 C48 30 56 10 82 6 C74 16 78 30 88 44Z" fill="#5b3a8c" ${L}/>
    <rect x="44" y="38" width="40" height="7" rx="2" fill="${GOLD}" ${L} stroke-width="2.5"/>
    <path d="M96 116 L106 70" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/><polygon points="${starPoints(107, 64, 11, 4.5)}" fill="#c48bff" ${L} stroke-width="2.5"/>` },
  'en-wisp': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="26" ry="5" fill="#000" opacity=".18"/>
    <path d="M64 14 C88 14 102 34 102 58 V100 C96 94 92 106 86 100 C80 94 76 108 70 100 C66 106 60 106 58 100 C52 108 48 94 42 100 C36 106 32 94 26 100 V58 C26 34 40 14 64 14Z" fill="#c9f2ff" opacity=".92" ${L}/>
    <path d="M86 26 C96 34 102 46 102 58 V100 C96 94 92 106 86 100 C88 70 90 44 86 26Z" fill="#7cc6ff" opacity=".35"/>
    <ellipse cx="50" cy="56" rx="8" ry="11" fill="${INK}"/><ellipse cx="78" cy="56" rx="8" ry="11" fill="${INK}"/><circle cx="52" cy="52" r="3" fill="#fff"/><circle cx="80" cy="52" r="3" fill="#fff"/>
    <ellipse cx="64" cy="80" rx="7" ry="9" fill="${INK}"/><ellipse cx="44" cy="32" rx="8" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 44 32)"/>` },
  'en-sentinel': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="48" ry="6" fill="#000" opacity=".25"/>
    <rect x="18" y="56" width="20" height="40" rx="6" fill="#8b93a5" ${L}/><rect x="90" y="56" width="20" height="40" rx="6" fill="#8b93a5" ${L}/>
    <path d="M30 26 H98 L106 112 H22Z" fill="#a3abbd" ${L}/><path d="M64 26 H98 L106 112 H64Z" fill="#000" opacity=".14"/>
    <path d="M40 76 L50 84 L46 96 M86 40 L80 50 L88 56" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".5"/>
    <rect x="38" y="40" width="52" height="20" rx="4" fill="#4d5468" ${L}/><rect x="44" y="46" width="14" height="8" rx="2" fill="#7cf0ff"/><rect x="70" y="46" width="14" height="8" rx="2" fill="#7cf0ff"/>
    <path d="M52 76 H76 M64 70 V90 M56 84 L64 90 L72 84" fill="none" stroke="#7cf0ff" stroke-width="3" stroke-linecap="round" opacity=".85"/><rect x="36" y="30" width="20" height="6" rx="3" ${SHINE}/>` },
  'en-nob': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="46" ry="6" fill="#000" opacity=".25"/>
    <path d="M26 46 C16 34 14 18 22 8 C26 22 34 30 44 34Z M102 46 C112 34 114 18 106 8 C102 22 94 30 84 34Z" fill="#f4ead2" ${L}/>
    <path d="M18 116 C18 84 34 62 64 62 C94 62 110 84 110 116Z" fill="#c9443a" ${L}/>
    <ellipse cx="64" cy="58" rx="40" ry="34" fill="#e0564a" ${L}/><path d="M92 40 C104 56 104 76 92 88 C86 80 90 58 92 40Z" fill="#000" opacity=".15"/>
    <path d="M36 44 L56 52 M92 44 L72 52" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="58" r="6" fill="#ffd25a" ${L} stroke-width="2.5"/><circle cx="78" cy="58" r="6" fill="#ffd25a" ${L} stroke-width="2.5"/>
    <path d="M42 76 Q64 90 86 76 Q64 84 42 76Z" fill="${INK}"/><path d="M46 78 L50 66 L54 80 M82 78 L78 66 L74 80" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="44" cy="38" rx="9" ry="5" ${SHINE}/>` },
  'en-knight': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="118" rx="44" ry="6" fill="#000" opacity=".25"/>
    <path d="M64 6 C76 14 78 28 70 34 M64 6 C60 18 66 26 70 34" fill="#7cc6ff" ${L}/>
    <path d="M22 116 C22 90 36 76 64 76 C92 76 106 90 106 116Z" fill="#6c7894" ${L}/><path d="M64 76 C92 76 106 90 106 116 H64Z" fill="#000" opacity=".15"/>
    <path d="M30 70 C30 40 44 26 64 26 C84 26 98 40 98 70 C98 82 84 90 64 90 C44 90 30 82 30 70Z" fill="#8f9bb8" ${L}/>
    <path d="M38 56 H90 V64 H38Z" fill="${INK}"/><rect x="44" y="58" width="12" height="4" rx="2" fill="#9ef0ff"/><rect x="72" y="58" width="12" height="4" rx="2" fill="#9ef0ff"/>
    <path d="M64 64 V88 M52 72 V84 M76 72 V84" stroke="${INK}" stroke-width="2.5" opacity=".5"/><ellipse cx="46" cy="40" rx="9" ry="5" ${SHINE}/>
    <path d="M56 26 L64 14 L72 26" fill="${GOLD}" ${L} stroke-width="2.5"/>` },
  'en-bell': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="120" rx="50" ry="6" fill="#000" opacity=".28"/>
    <path d="M60 4 H68 V16 H60Z" fill="${WOOD}" ${L}/><path d="M52 14 H76 V22 H52Z" fill="#8a5a2a" ${L}/>
    <path d="M64 20 C40 20 30 40 28 66 C26 88 18 98 10 104 H118 C110 98 102 88 100 66 C98 40 88 20 64 20Z" fill="#c9923a" ${L}/>
    <path d="M86 28 C96 40 98 56 100 66 C102 88 110 98 118 104 H92 C96 80 94 46 86 28Z" fill="#000" opacity=".18"/>
    <path d="M10 104 H118 V112 C118 116 114 118 110 118 H18 C14 118 10 116 10 112Z" fill="#a8762a" ${L}/>
    <path d="M44 40 L50 52 L44 60 M88 72 L80 80 L86 90" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".55"/>
    <ellipse cx="64" cy="66" rx="18" ry="14" fill="#fff6e0" ${L}/><circle cx="64" cy="66" r="9" fill="#d43a3a"/><circle cx="64" cy="66" r="4" fill="${INK}"/><circle cx="60" cy="62" r="2.5" fill="#fff"/>
    <path d="M40 34 C44 28 50 24 56 23" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>
    <circle cx="64" cy="118" r="7" fill="#8a5a2a" ${L}/>` },
  'en-dummy': { vb: '0 0 128 128', svg: `<ellipse cx="64" cy="120" rx="34" ry="5" fill="#000" opacity=".22"/>
    <rect x="58" y="70" width="12" height="50" rx="3" fill="${WOOD}" ${L}/><rect x="18" y="64" width="92" height="12" rx="4" fill="${WOOD}" ${L}/>
    <path d="M14 64 L8 56 M14 76 L6 80 M114 64 L120 56 M114 76 L122 80" stroke="#e3c06a" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 70 C38 90 44 104 64 104 C84 104 90 90 88 70Z" fill="#e3c06a" ${L}/>${target(64, 86, 11)}
    <circle cx="64" cy="40" r="26" fill="#d9b779" ${L}/><path d="M44 28 C50 18 60 15 70 16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>
    <path d="M50 34 L58 42 M58 34 L50 42 M70 34 L78 42 M78 34 L70 42" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M52 52 H76" stroke="${INK}" stroke-width="3" stroke-dasharray="3 3"/><path d="M40 22 L36 12 M64 14 V4 M88 22 L92 12" stroke="#e3c06a" stroke-width="4" stroke-linecap="round"/>` },

  // --- portraits
  warden: `<circle cx="32" cy="32" r="29" fill="#1d3a66" ${L}/><path d="M12 58 C14 46 22 40 32 40 C42 40 50 46 52 58Z" fill="${BLUE}" ${L}/>
    <circle cx="32" cy="29" r="13" fill="#f2c9a0" ${L}/><path d="M17 28 C17 16 24 9 32 9 C40 9 47 16 47 28 H41 V22 H23 V28Z" fill="${BLUE}" ${L}/>
    <path d="M32 9 V22" stroke="${INK}" stroke-width="2.5"/><circle cx="27" cy="30" r="2" fill="${INK}"/><circle cx="37" cy="30" r="2" fill="${INK}"/><path d="M28 35 Q32 38 36 35" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    ${shield(BLUE, 34, 34, .42)}`,
  striker: `<circle cx="32" cy="32" r="29" fill="#5a2a22" ${L}/>${dagger(-35, -14, -8)}${dagger(35, 14, -8)}
    <path d="M12 58 C14 46 22 40 32 40 C42 40 50 46 52 58Z" fill="${ORANGE}" ${L}/>
    <path d="M16 34 C16 18 24 8 32 8 C40 8 48 18 48 34 C44 42 20 42 16 34Z" fill="${ORANGE}" ${L}/><circle cx="32" cy="30" r="11" fill="#f2c9a0" ${L}/>
    <path d="M22 26 Q32 18 42 26" fill="${ORANGE}" ${L} stroke-width="2.5"/><path d="M26 30 L30 31 M38 30 L34 31" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M28 36 Q32 38 36 35" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,

  // --- card families (drawn into the card's art window)
  'c-shield': shield(BLUE),
  'c-bash': `${shield(BLUE, -4, 2, .9)}<path d="M50 14 L60 8 M54 26 L63 26 M50 38 L59 44" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>`,
  'c-tower': `<rect x="12" y="6" width="40" height="54" rx="8" fill="#4f8ad6" ${L}/><rect x="18" y="12" width="28" height="42" rx="5" fill="${BLUE}" ${L} stroke-width="2.5"/>
    <circle cx="20" cy="14" r="2.5" fill="${STEEL}"/><circle cx="44" cy="14" r="2.5" fill="${STEEL}"/><circle cx="20" cy="52" r="2.5" fill="${STEEL}"/><circle cx="44" cy="52" r="2.5" fill="${STEEL}"/>
    <path d="M32 18 V48 M22 33 H42" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/><rect x="21" y="15" width="8" height="10" rx="2" ${SHINE}/>`,
  'c-buckler': `<circle cx="32" cy="32" r="24" fill="${ORANGE}" ${L}/><circle cx="32" cy="32" r="15" fill="#ffb08f" ${L} stroke-width="2.5"/><circle cx="32" cy="32" r="6" fill="${STEEL}" ${L} stroke-width="2.5"/><ellipse cx="22" cy="20" rx="6" ry="3.5" ${SHINE}/>`,
  'c-target': target(),
  'c-riposte': `${shield(BLUE, -6, 8, .78)}${sword(40, '#eef3fb', .9, 6, -2)}`,
  'c-heal': `<path d="M32 54 C12 41 7 30 12 21 C17 13 27 14 32 22 C37 14 47 13 52 21 C57 30 52 41 32 54Z" fill="#5fd39a" ${L}/><path d="M32 24 V44 M22 34 H42" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  'c-flag': `<path d="M16 6 V60" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/><path d="M16 6 V60" stroke="${INK}" stroke-width="1.5" opacity=".4"/>
    <path d="M18 10 C30 4 40 16 54 10 V36 C40 42 30 30 18 36Z" fill="#ff6b6b" ${L}/><polygon points="${starPoints(35, 23, 7, 3)}" fill="${GOLD}"/><circle cx="16" cy="6" r="4" fill="${GOLD}" ${L} stroke-width="2.5"/>`,
  'c-web': `<g fill="none" stroke="#e8eef9" stroke-width="2.5" stroke-linecap="round"><path d="M32 4 V60 M4 32 H60 M12 12 L52 52 M52 12 L12 52"/><path d="M32 14 L45 19 L50 32 L45 45 L32 50 L19 45 L14 32 L19 19Z"/><path d="M32 24 L38 26 L40 32 L38 38 L32 40 L26 38 L24 32 L26 26Z"/></g><circle cx="44" cy="44" r="5" fill="#2a1622" ${L} stroke-width="2"/>`,
  'c-hammer': `<g transform="rotate(-35 32 32)"><rect x="28" y="22" width="8" height="38" rx="3" fill="${WOOD}" ${L}/><rect x="12" y="6" width="40" height="20" rx="5" fill="#9aa4b8" ${L}/><rect x="16" y="9" width="12" height="5" rx="2.5" ${SHINE}/></g>`,
  'c-beacon': `<path d="M22 60 L26 30 H38 L42 60Z" fill="${WOOD}" ${L}/><rect x="20" y="26" width="24" height="8" rx="3" fill="${STEEL}" ${L} stroke-width="2.5"/>${flame(9, -6, .72)}`,
  'c-smoke': `<g fill="#b9c2d6" ${L}><circle cx="22" cy="40" r="12"/><circle cx="38" cy="34" r="15"/><circle cx="46" cy="46" r="10"/><circle cx="26" cy="22" r="8"/></g><circle cx="34" cy="28" r="5" ${SHINE}/>`,
  'c-poison': `${drop('#7bd64f')}<circle cx="27" cy="44" r="3" fill="${INK}"/><circle cx="37" cy="44" r="3" fill="${INK}"/><path d="M28 51 H36" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
  'c-scroll': `<rect x="14" y="12" width="36" height="42" rx="4" fill="#f4ead2" ${L}/><rect x="10" y="8" width="44" height="8" rx="4" fill="#e3cfa0" ${L}/><rect x="10" y="50" width="44" height="8" rx="4" fill="#e3cfa0" ${L}/>
    <path d="M20 24 H44 M20 31 H40 M20 38 H44" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><path d="M38 40 L46 46 L38 50" fill="none" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round"/>`,
  'c-sword': sword(40),
  'c-axe': `<g transform="rotate(-28 32 32)"><rect x="28" y="6" width="7" height="56" rx="3" fill="${WOOD}" ${L}/><path d="M34 6 C54 2 64 20 60 38 C54 32 44 30 34 32Z" fill="#c9d3e6" ${L}/><path d="M29 10 C18 10 12 18 14 28 C18 25 23 24 29 25Z" fill="#a3abbd" ${L}/><path d="M40 10 C50 9 56 16 58 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`,
  'c-reckless': `${sword(40, '#ffb08f')}<path d="M44 10 C50 16 50 22 46 26 M52 18 C56 22 56 26 54 30" fill="none" stroke="#ff8f3a" stroke-width="4" stroke-linecap="round"/>`,
  'c-daggers': `${dagger(-30, -6, 2)}${dagger(30, 6, 2)}`,
  'c-mask': `<path d="M10 18 C24 12 40 12 54 18 C56 38 46 54 32 56 C18 54 8 38 10 18Z" fill="#f4ead2" ${L}/><path d="M18 28 Q24 22 30 28 Q24 32 18 28Z M34 28 Q40 22 46 28 Q40 32 34 28Z" fill="${INK}"/>
    <path d="M24 42 Q32 50 40 42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M14 20 C20 17 26 16 30 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
  'c-horn': `<path d="M8 40 C10 24 26 16 44 14 L52 8 L56 30 L48 28 C36 32 26 40 24 50 C18 52 10 48 8 40Z" fill="#e3c06a" ${L}/><path d="M40 16 C42 22 44 26 48 28" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".5"/>
    <path d="M14 36 C16 30 22 26 28 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/><path d="M4 50 L-2 56 M10 54 L8 62" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
  'c-claw': `<path d="M14 10 C24 26 26 40 22 56 M28 6 C38 24 40 40 36 58 M42 10 C52 26 54 40 50 56" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M14 10 C24 26 26 40 22 56 M28 6 C38 24 40 40 36 58 M42 10 C52 26 54 40 50 56" fill="none" stroke="#ff6b6b" stroke-width="4.5" stroke-linecap="round"/>`,
  'c-dread': `<path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32Z" fill="#8a5cc2" ${L}/><circle cx="32" cy="32" r="10" fill="#f4ead2" ${L} stroke-width="2.5"/><circle cx="32" cy="32" r="5" fill="${INK}"/><path d="M16 20 L12 12 M32 16 V8 M48 20 L52 12" stroke="#8a5cc2" stroke-width="3.5" stroke-linecap="round"/>`,

  // --- intents and statuses
  'i-attack': sword(45),
  'i-multi': `${sword(-40, '#eef3fb', .9)}${sword(40, '#eef3fb', .9)}`,
  'i-block': shield('#9fd0ff'),
  'i-buff': `<circle cx="32" cy="32" r="24" fill="#ff8f6b" ${L}/><path d="M20 36 L32 24 L44 36 M20 46 L32 34 L44 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  'i-curse': `<path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32Z" fill="#8a5cc2" ${L}/><circle cx="32" cy="32" r="9" fill="#f4ead2" ${L} stroke-width="2.5"/><circle cx="32" cy="32" r="4.5" fill="${INK}"/>`,
  'i-charge': `<path d="M32 10 C20 10 16 20 15 32 C14 42 10 46 6 48 H58 C54 46 50 42 49 32 C48 20 44 10 32 10Z" fill="#c9923a" ${L}/><circle cx="32" cy="52" r="5" fill="#8a5a2a" ${L} stroke-width="2.5"/>
    <path d="M4 18 C2 24 2 30 4 36 M60 18 C62 24 62 30 60 36" fill="none" stroke="#ff6b6b" stroke-width="4" stroke-linecap="round"/><path d="M22 18 C24 15 27 13 30 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
  'i-ghost': `<path d="M32 8 C46 8 52 20 52 32 V54 L46 50 L40 56 L34 50 L28 56 L22 50 L16 54 L12 54 V32 C12 20 18 8 32 8Z" fill="#c9f2ff" ${L}/><ellipse cx="25" cy="30" rx="4" ry="6" fill="${INK}"/><ellipse cx="39" cy="30" rx="4" ry="6" fill="${INK}"/>`,
  's-block': shield('#9fd0ff'),
  's-vuln': `${target()}<path d="M32 6 L28 22 L36 30 L30 44" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  's-weak': `<g transform="rotate(40 32 32)"><path d="M28 38 V20 L36 16 V38 Z" fill="#c9a6ff" ${L}/><path d="M28 14 L32 4 L36 10 Z" fill="#c9a6ff" ${L} transform="translate(-4 -2) rotate(-25 32 10)"/><rect x="21" y="37" width="22" height="6" rx="3" fill="${GOLD}" ${L}/><rect x="29" y="43" width="6" height="12" rx="2" fill="${WOOD}" ${L}/></g>`,
  's-poison': `${drop('#7bd64f')}`,
  's-strength': `<circle cx="32" cy="32" r="24" fill="#ff8f6b" ${L}/><path d="M20 36 L32 24 L44 36 M20 46 L32 34 L44 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  's-thorns': `<polygon points="${starPoints(32, 32, 28, 14, 8)}" fill="#c99a5a" ${L}/><circle cx="32" cy="32" r="12" fill="#a8762a" ${L} stroke-width="2.5"/>`,
  energy: bolt,
  heal: `<path d="M32 54 C12 41 7 30 12 21 C17 13 27 14 32 22 C37 14 47 13 52 21 C57 30 52 41 32 54Z" fill="#5fd39a" ${L}/><path d="M32 24 V44 M22 34 H42" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,

  // --- combo signs (tags), and the link mark that says "with your partner"
  'tag-guard': shield(BLUE),
  'tag-mark': target(),
  'tag-feint': `<path d="M10 18 C24 12 40 12 54 18 C56 38 46 54 32 56 C18 54 8 38 10 18Z" fill="#f4ead2" ${L}/><path d="M18 28 Q24 22 30 28 Q24 32 18 28Z M34 28 Q40 22 46 28 Q40 32 34 28Z" fill="${INK}"/><path d="M24 42 Q32 50 40 42" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  'tag-cry': `<path d="M8 40 C10 24 26 16 44 14 L52 8 L56 30 L48 28 C36 32 26 40 24 50 C18 52 10 48 8 40Z" fill="#e3c06a" ${L}/>`,
  'tag-rally': `<path d="M16 6 V60" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/><path d="M18 10 C30 4 40 16 54 10 V36 C40 42 30 30 18 36Z" fill="#ff6b6b" ${L}/>`,
  'tag-snare': `<g fill="none" stroke="#e8eef9" stroke-width="3.5" stroke-linecap="round"><path d="M32 4 V60 M4 32 H60 M12 12 L52 52 M52 12 L12 52"/><path d="M32 16 L44 20 L48 32 L44 44 L32 48 L20 44 L16 32 L20 20Z"/></g>`,
  'tag-swift': `<g fill="none" stroke="#9fe3ff" stroke-width="6" stroke-linecap="round"><path d="M6 22 H40 a8 8 0 1 0 -8 -8"/><path d="M6 34 H52 a8 8 0 1 1 -8 8"/><path d="M14 46 H30"/></g>`,
  link: `<circle cx="23" cy="32" r="14" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="41" cy="32" r="14" fill="none" stroke="${INK}" stroke-width="10"/>
    <circle cx="23" cy="32" r="14" fill="none" stroke="${BLUE}" stroke-width="5"/><circle cx="41" cy="32" r="14" fill="none" stroke="${ORANGE}" stroke-width="5"/><path d="M30 20 A14 14 0 0 1 37 32" fill="none" stroke="${BLUE}" stroke-width="5"/>`,

  // --- relics
  'rl-lantern': `<path d="M24 8 H40 L42 14 H22Z" fill="#8a5a2a" ${L}/><rect x="18" y="14" width="28" height="38" rx="8" fill="#ff6b4a" ${L}/><rect x="24" y="20" width="16" height="26" rx="5" fill="#ffd25a"/><rect x="22" y="52" width="20" height="6" rx="2" fill="#8a5a2a" ${L}/><path d="M28 4 Q32 0 36 4" fill="none" ${L}/>`,
  'rl-anchor': `<circle cx="32" cy="12" r="6" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="32" cy="12" r="6" fill="none" stroke="${STEEL}" stroke-width="4"/><path d="M32 18 V56 M20 28 H44" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M32 18 V56 M20 28 H44" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/><path d="M10 40 C12 52 22 58 32 58 C42 58 52 52 54 40" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M10 40 C12 52 22 58 32 58 C42 58 52 52 54 40" fill="none" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/>`,
  'rl-ring': `<circle cx="32" cy="38" r="18" fill="none" stroke="${INK}" stroke-width="11"/><circle cx="32" cy="38" r="18" fill="none" stroke="${GOLD}" stroke-width="6"/><path d="M24 14 L32 6 L40 14 L32 22Z" fill="#9fe3ff" ${L}/><path d="M28 13 L32 9 L34 11" fill="none" stroke="#fff" stroke-width="2"/>`,
  'rl-whetstone': `<path d="M8 40 L18 22 H50 L58 34 L48 50 H16Z" fill="#8b93a5" ${L}/><path d="M18 22 H50 L58 34 H12Z" fill="#a3abbd" ${L} stroke-width="2.5"/><polygon points="${starPoints(46, 18, 9, 3, 4, 0)}" fill="#fff"/>`,
  'rl-bells': `<g transform="rotate(-14 22 32)"><path d="M22 14 C14 14 12 22 11 32 C10 40 8 42 6 44 H38 C36 42 34 40 33 32 C32 22 30 14 22 14Z" fill="#c9923a" ${L}/><circle cx="22" cy="48" r="4" fill="#8a5a2a" ${L} stroke-width="2.5"/></g><g transform="rotate(14 42 32)"><path d="M42 14 C34 14 32 22 31 32 C30 40 28 42 26 44 H58 C56 42 54 40 53 32 C52 22 50 14 42 14Z" fill="#e0ae52" ${L}/><circle cx="42" cy="48" r="4" fill="#8a5a2a" ${L} stroke-width="2.5"/></g>`,
  'rl-quill': `<path d="M50 6 C30 10 16 30 14 50 L20 46 C26 30 38 18 50 6Z" fill="#f4ead2" ${L}/><path d="M50 6 C46 22 34 38 20 46" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/><path d="M14 50 L8 60" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  'rl-drum': `<ellipse cx="32" cy="22" rx="22" ry="8" fill="#f4ead2" ${L}/><path d="M10 22 V44 C10 50 20 54 32 54 C44 54 54 50 54 44 V22 C54 28 44 30 32 30 C20 30 10 28 10 22Z" fill="#d9573f" ${L}/><path d="M14 30 L22 50 L32 30 L42 50 L50 30" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linejoin="round"/><path d="M40 6 L28 18 M52 8 L38 18" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/>`,
  'rl-vial': `<rect x="26" y="6" width="12" height="10" rx="3" fill="${WOOD}" ${L}/><path d="M26 16 H38 V24 C48 28 52 36 52 42 a20 20 0 0 1 -40 0 C12 36 16 28 26 24Z" fill="#cde8ff" ${L}/><path d="M14 40 a18 18 0 0 0 36 0Z" fill="#ff5a7a"/><ellipse cx="22" cy="34" rx="3" ry="6" ${SHINE}/>`,
  'rl-compass': `<circle cx="32" cy="32" r="24" fill="${GOLD}" ${L}/><circle cx="32" cy="32" r="18" fill="#f4ead2" ${L} stroke-width="2.5"/><path d="M32 16 L37 32 L32 48 L27 32Z" fill="#ff6b6b" ${L} stroke-width="2"/><path d="M32 32 L37 32 L32 48 L27 32Z" fill="#7d8aa8"/><circle cx="32" cy="32" r="3" fill="${INK}"/>`,

  // --- event scenes and map nodes
  'ev-shrine': `<path d="M8 16 H56 L52 22 H12Z" fill="#d9573f" ${L}/><rect x="14" y="22" width="36" height="5" fill="#b8402e" ${L} stroke-width="2.5"/><rect x="16" y="22" width="6" height="36" fill="#d9573f" ${L}/><rect x="42" y="22" width="6" height="36" fill="#d9573f" ${L}/><path d="M10 58 H54" stroke="${INK}" stroke-width="3"/><path d="M14 16 C18 10 22 12 26 16 M40 14 C44 10 48 12 52 16" fill="#62c46a" stroke="${INK}" stroke-width="2"/>`,
  'ev-tinker': `<rect x="8" y="24" width="48" height="30" rx="5" fill="#d9573f" ${L}/><path d="M22 24 V16 H42 V24" fill="none" ${L} stroke-width="4"/><rect x="8" y="34" width="48" height="5" fill="#b8402e"/><rect x="28" y="32" width="8" height="8" rx="2" fill="${STEEL}" ${L} stroke-width="2"/><rect x="12" y="27" width="16" height="4" rx="2" ${SHINE}/>`,
  'ev-library': `<rect x="8" y="40" width="48" height="10" rx="2" fill="#6fb3ff" ${L}/><rect x="12" y="30" width="40" height="10" rx="2" fill="#62c46a" ${L}/><rect x="10" y="20" width="44" height="10" rx="2" fill="#ff8f6b" ${L}/><path d="M18 8 C24 6 30 8 32 12 C34 8 40 6 46 8 V20 C40 18 34 20 32 22 C30 20 24 18 18 20Z" fill="#f4ead2" ${L} stroke-width="2.5"/>`,
  'ev-dice': `<rect x="6" y="20" width="28" height="28" rx="6" fill="#f4ead2" ${L} transform="rotate(-12 20 34)"/><circle cx="14" cy="28" r="2.6" fill="${INK}"/><circle cx="20" cy="34" r="2.6" fill="${INK}"/><circle cx="26" cy="40" r="2.6" fill="${INK}"/>
    <rect x="30" y="14" width="28" height="28" rx="6" fill="#ff6b6b" ${L} transform="rotate(14 44 28)"/><circle cx="40" cy="24" r="2.6" fill="#fff"/><circle cx="48" cy="32" r="2.6" fill="#fff"/><circle cx="48" cy="22" r="2.6" fill="#fff"/><circle cx="40" cy="34" r="2.6" fill="#fff"/>`,
  'ev-well': `<path d="M14 12 V34 M50 12 V34" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/><path d="M8 12 L32 4 L56 12Z" fill="#d9573f" ${L}/><path d="M32 12 V24" stroke="${INK}" stroke-width="2"/><rect x="27" y="24" width="10" height="9" rx="2" fill="${WOOD}" ${L} stroke-width="2.5"/>
    <path d="M10 34 H54 V52 C54 56 50 58 46 58 H18 C14 58 10 56 10 52Z" fill="#a3abbd" ${L}/><path d="M10 42 H54 M22 34 V42 M42 34 V42 M32 42 V58" stroke="${INK}" stroke-width="2" opacity=".45"/>`,
  'n-fight': `${sword(-40, '#eef3fb', .9)}${sword(40, '#eef3fb', .9)}`,
  'n-elite': `<path d="M14 30 C8 22 8 12 12 6 C16 14 20 18 26 20Z M50 30 C56 22 56 12 52 6 C48 14 44 18 38 20Z" fill="#f4ead2" ${L} stroke-width="2.5"/><path d="M32 14 C46 14 54 24 54 36 C54 44 50 48 46 50 V58 H18 V50 C14 48 10 44 10 36 C10 24 18 14 32 14Z" fill="#e8eef9" ${L}/><circle cx="24" cy="36" r="6" fill="${INK}"/><circle cx="40" cy="36" r="6" fill="${INK}"/><circle cx="24" cy="36" r="2" fill="#ff4d6d"/><circle cx="40" cy="36" r="2" fill="#ff4d6d"/><path d="M26 50 V56 M32 50 V56 M38 50 V56" stroke="${INK}" stroke-width="2.5"/>`,
  'n-rest': `<path d="M12 54 L52 44 M12 44 L52 54" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/><path d="M12 54 L52 44 M12 44 L52 54" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".4"/>${flame(10, -4, .68)}`,
  'n-event': `<rect x="12" y="8" width="40" height="48" rx="6" fill="#f4ead2" ${L}/><path d="M25 26 a7.5 7.5 0 1 1 11 6.5 c-3 1.8 -4 3 -4 6.5" fill="none" stroke="#8a5cc2" stroke-width="5.5" stroke-linecap="round"/><circle cx="32" cy="46" r="3.4" fill="#8a5cc2"/>`,
  'n-boss': `<path d="M32 8 C20 8 16 18 15 30 C14 40 10 44 6 46 H58 C54 44 50 40 49 30 C48 18 44 8 32 8Z" fill="#c9923a" ${L}/><circle cx="32" cy="50" r="5" fill="#8a5a2a" ${L} stroke-width="2.5"/><circle cx="32" cy="30" r="6" fill="#fff6e0" ${L} stroke-width="2"/><circle cx="32" cy="30" r="3" fill="#d43a3a"/>`,

  // --- hints a player can send, and a few UI marks
  'h-attack': sword(45),
  'h-block': shield(BLUE),
  'h-setup': target(),
  'h-big': `<polygon points="${starPoints(32, 32, 28, 14, 8, -22.5)}" fill="#ff8f3a" ${L}/><polygon points="${starPoints(32, 32, 16, 8, 8)}" fill="${GOLD}"/>`,
  'h-ask': `<path d="M8 12 H56 V44 H30 L18 56 V44 H8Z" fill="#e8eef9" ${L}/><path d="M26 20 a6.5 6.5 0 1 1 9.5 5.6 c-2.6 1.6 -3.5 2.6 -3.5 5.6" fill="none" stroke="#5aa6ff" stroke-width="4.5" stroke-linecap="round"/><circle cx="32" cy="38" r="2.8" fill="#5aa6ff"/>`,
  skull: `<path d="M32 8 C46 8 54 18 54 32 C54 40 50 44 46 46 V56 H18 V46 C14 44 10 40 10 32 C10 18 18 8 32 8Z" fill="#e8eef9" ${L}/><circle cx="24" cy="32" r="6" fill="${INK}"/><circle cx="40" cy="32" r="6" fill="${INK}"/><path d="M29 44 L32 39 L35 44Z" fill="${INK}"/><path d="M26 48 V56 M32 48 V56 M38 48 V56" stroke="${INK}" stroke-width="2.5"/>`,
  crown: `<path d="M8 22 L20 34 L32 12 L44 34 L56 22 L52 50 H12Z" fill="${GOLD}" ${L}/><rect x="12" y="48" width="40" height="8" rx="3" fill="#e0ae52" ${L}/><circle cx="32" cy="38" r="4" fill="#ff6b6b" ${L} stroke-width="2"/><circle cx="8" cy="22" r="3.5" fill="${GOLD}" ${L} stroke-width="2"/><circle cx="56" cy="22" r="3.5" fill="${GOLD}" ${L} stroke-width="2"/><circle cx="32" cy="12" r="3.5" fill="${GOLD}" ${L} stroke-width="2"/>`,
  deck: `<rect x="18" y="8" width="30" height="42" rx="5" fill="#3a5a8a" ${L} transform="rotate(10 33 29)"/><rect x="14" y="12" width="30" height="42" rx="5" fill="#f4ead2" ${L}/><polygon points="${starPoints(29, 33, 9, 4)}" fill="${GOLD}" ${L} stroke-width="2"/>`,
  book: `<path d="M6 14 C16 10 26 12 32 18 C38 12 48 10 58 14 V52 C48 48 38 50 32 56 C26 50 16 48 6 52Z" fill="#f4ead2" ${L}/><path d="M32 18 V56" stroke="${INK}" stroke-width="2.5"/><path d="M12 22 C18 20 24 21 28 24 M12 30 C18 28 24 29 28 32 M36 24 C40 21 46 20 52 22 M36 32 C40 29 46 28 52 30" stroke="${INK}" stroke-width="2" opacity=".45" fill="none"/>`,
  cap: `<path d="M4 26 L32 14 L60 26 L32 38Z" fill="#3a4d75" ${L}/><path d="M16 32 V44 C24 50 40 50 48 44 V32 L32 38Z" fill="#2a3a5c" ${L}/><path d="M54 28 V44" stroke="${GOLD}" stroke-width="3"/><circle cx="54" cy="46" r="3.5" fill="${GOLD}"/>`,
  spire: `<path d="M32 4 L42 22 H22Z" fill="#ff8f6b" ${L}/><rect x="22" y="22" width="20" height="36" fill="#8b93a5" ${L}/><rect x="16" y="50" width="32" height="10" rx="2" fill="#6c7894" ${L}/><rect x="28" y="30" width="8" height="10" rx="4" fill="#ffd25a" ${L} stroke-width="2"/><path d="M32 4 V-2" stroke="${INK}" stroke-width="2"/>`,
  sync: `<circle cx="32" cy="32" r="26" fill="#2a3a5c" ${L}/><path d="M18 30 A14 14 0 0 1 44 24" fill="none" stroke="${BLUE}" stroke-width="6" stroke-linecap="round"/><path d="M40 16 L46 25 L36 27Z" fill="${BLUE}"/><path d="M46 34 A14 14 0 0 1 20 40" fill="none" stroke="${ORANGE}" stroke-width="6" stroke-linecap="round"/><path d="M24 48 L18 39 L28 37Z" fill="${ORANGE}"/>`,
};
defineArt(SPRITES);

// Which card family each card is drawn with.
export const CARD_ART = {
  guard: 'c-shield', bash: 'c-bash', mark: 'c-target', riposte: 'c-riposte', secondwind: 'c-heal', rally: 'c-flag',
  hold: 'c-tower', snare: 'c-web', crush: 'c-hammer', bulwark: 'c-tower', beacon: 'c-beacon', smoke: 'c-smoke',
  bless: 'c-heal', insight: 'c-target', phalanx: 'c-tower', venom: 'c-poison', tactics: 'c-scroll',
  strike: 'c-sword', defend: 'c-buckler', execute: 'c-axe', feint: 'c-mask', reckless: 'c-reckless', flurry: 'c-daggers',
  counter: 'c-riposte', cry: 'c-horn', pounce: 'c-claw', expose: 'c-target', heavy: 'c-axe', dagger: 'c-daggers',
  toxic: 'c-poison', quick: 'c-buckler', finisher: 'c-axe', shout: 'c-horn', lunge: 'c-sword', dread: 'c-dread',
};
