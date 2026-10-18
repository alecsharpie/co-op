// The rooms, easiest first, and the story that runs through them. Each lock gives each seat different clue cards;
// only together do they hold the answer. `solve` works the answer out from the cards alone and returns null if a
// side is missing: test/escape.test.mjs checks it against `answer` with both sides, and with each side on its own.
//
// Card types (drawn by cards.js): coach, symbols, legend, flags, flagbook, valves, rules, grid, walk, digitgrid,
// stencil, planets, almanac, rhythm, tunebook, drawer, order, mirrorclock, shred, logic, tides, ticket, scales,
// scalenote, halfkey. Input types (hand.html keypads): digits, dirs, colors, pick, coord, clock.
// A `final` lock appears once the others are open. Its answer is per seat: each enters what only the partner's
// phone shows (a half-key, or a reading of the partner's mirror).

export const COLORS = { red: '#e5484d', blue: '#3e8ef7', yellow: '#f5d90a', green: '#30a46c', white: '#f1f1f1', purple: '#8e4ec6', orange: '#f76b15' };
const SIX = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

const find = (cards, type) => (cards || []).find(c => c.type === type);
const flagKey = f => `${f.pattern}:${f.a}:${f.b || ''}`;
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

// Finals: each seat's answer is read off the partner's cards, never its own.
const readHalf = cards => find(cards, 'halfkey')?.tokens ?? null;
const halves = ({ sun, moon }) => ({ sun: readHalf(moon), moon: readHalf(sun) });

// A clock seen in a mirror: left and right swap, so 2 o'clock looks like 10.
export const unmirror = h => (h === 12 ? 12 : 12 - h);

// 3x5 pixel digits for the shredded painting. Sun keeps the outer strips of each digit, Moon the middle one.
export const FONT = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '001', '001'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};
// One seat's strips of a row of digits: '1' paint, '0' bare canvas, '_' torn away (the partner has that strip).
function shred(digits, keep) {
  return [0, 1, 2, 3, 4].map(r => [...digits].map(d => [...FONT[d][r]].map((px, c) => (keep.includes(c) ? px : '_')).join('')).join(' '));
}
// Which digits fit what is visible in each position, given every seat's strips laid on top of each other.
export function shredCandidates(cardsList) {
  const rows = cardsList.filter(Boolean).map(c => c.rows);
  if (!rows.length) return null;
  const n = rows[0][0].split(' ').length;
  return Array.from({ length: n }, (_, i) => Object.keys(FONT).filter(d => rows.every(rs =>
    rs.every((row, r) => [...row.split(' ')[i]].every((px, c) => px === '_' || px === FONT[d][r][c])))));
}

// The logic grid: three portraits in a row. Every arrangement of animals and frames that fits the clues.
export const PORTRAITS = { animals: ['🦊', '🦉', '🐇'], frames: ['red', 'blue', 'green'] };
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
export function logicSolutions(clues) {
  const out = [];
  for (const animals of perms(PORTRAITS.animals)) for (const frames of perms(PORTRAITS.frames)) {
    const at = a => animals.indexOf(a), frameOf = a => frames[at(a)];
    const fits = clues.every(c =>
      c.k === 'pos' ? at(c.who) === c.at :
      c.k === 'frame' ? frameOf(c.who) === c.color :
      c.k === 'notFrame' ? frameOf(c.who) !== c.color :
      c.k === 'leftOf' ? at(c.a) < at(c.b) : false);
    if (fits) out.push({ animals, frames });
  }
  return out;
}

// The scales: work out every weight the balances allow, starting from what is known.
export function weigh(eqs, known) {
  const w = { ...known };
  const side = s => Object.entries(s).reduce((t, [k, n]) => (t == null || w[k] == null ? null : t + w[k] * n), 0);
  for (let pass = 0; pass < 6; pass++) for (const e of eqs) for (const [a, b] of [[e.left, e.right], [e.right, e.left]]) {
    const unknown = Object.keys(a).filter(k => w[k] == null);
    const total = side(b);
    if (unknown.length === 1 && total != null) {
      const rest = Object.entries(a).filter(([k]) => k !== unknown[0]).reduce((t, [k, n]) => t + w[k] * n, 0);
      w[unknown[0]] = (total - rest) / a[unknown[0]];
    }
  }
  return w;
}

export const STORY = {
  title: 'The Trail of Captain Wren',
  intro: 'Captain Wren vanished last spring and left a trail of locked rooms behind her. Her note says: “Only two people who trust each other will reach the vault.”',
};

export const ROOMS = [
  {
    name: 'The Boathouse',
    tutorial: true,
    scene: '🛶🪝🦆🐟🔦',
    intro: 'A practice room. Each of you sees something different on your phone. Read your clue out loud: the answer needs both halves.',
    journal: 'Pinned to the boathouse wall: “Good. You talked. Keep doing that. Next, my cabin.” — W.',
    locks: [
      {
        id: 'padlock', title: 'Boathouse padlock', icon: '🔒', input: { type: 'digits', len: 3 },
        answer: ['5', '3', '1'],
        cards: {
          sun: [
            { type: 'coach', title: 'How this works', caption: 'You see the animals painted on the padlock. Your partner has the key that turns them into numbers.', steps: ['Read the animals out loud, left to right.', 'Your partner tells you the number for each one.', 'Either of you taps the padlock below and enters the three numbers.'] },
            { type: 'symbols', title: 'Painted on the padlock', caption: 'Three animals, left to right.', items: ['🐟', '🐢', '🦆'] },
          ],
          moon: [
            { type: 'coach', title: 'How this works', caption: 'You have the key. Your partner can see the animals painted on the padlock.', steps: ['Ask your partner which animals they see, in order.', 'Find each one on your key and say its number.', 'Either of you taps the padlock below and enters the three numbers.'] },
            { type: 'legend', title: 'Key on a fishing float', caption: 'Each animal stands for a number.', pairs: [['🦆', '1'], ['🐸', '2'], ['🐢', '3'], ['🦢', '4'], ['🐟', '5'], ['🦀', '6'], ['🐌', '7'], ['🐳', '8']] },
          ],
        },
        solve: ({ sun, moon }) => {
          const s = find(sun, 'symbols'), l = find(moon, 'legend');
          if (!s || !l) return null;
          const key = Object.fromEntries(l.pairs);
          return s.items.map(x => key[x]);
        },
        hints: [
          'Sun: say the three animals out loud. Moon: look each one up on the key.',
          'Read the padlock left to right: fish first.',
          'The code starts 5, 3.',
        ],
      },
      {
        id: 'shed', title: 'Boathouse door', icon: '🚪', final: true, input: { type: 'digits', len: 2 },
        answer: { sun: ['2', '7'], moon: ['6', '4'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Scratched on an oar', caption: 'These numbers are for your partner to enter. Read them out.', tokens: ['6', '4'], kind: 'digits' }],
          moon: [{ type: 'halfkey', title: 'Written on the life ring', caption: 'These numbers are for your partner to enter. Read them out.', tokens: ['2', '7'], kind: 'digits' }],
        },
        solve: halves,
        hints: [
          'The last lock in every room works like this: you each enter the numbers on your partner’s phone.',
          'Read your numbers to your partner, and type in theirs.',
          'Sun enters 2 7.',
        ],
      },
    ],
  },
  {
    name: "The Captain's Cabin",
    scene: '⚓🗺️🕯️🧰🪟',
    intro: 'A storm slammed the cabin door behind you. Sun sees the cabin by the porthole’s daylight; Moon sees it by lantern light. Nothing looks the same to both of you.',
    journal: 'Captain’s log, torn page: “I keep my seeds where the frogs sing. The greenhouse will remember me.”',
    locks: [
      {
        id: 'chest', title: 'Sea chest', icon: '🧰', input: { type: 'digits', len: 4 },
        answer: ['4', '9', '2', '7'],
        cards: {
          sun: [{ type: 'symbols', title: 'Carvings on the chest lid', caption: 'Four marks, carved left to right.', items: ['🐙', '⚓', '🦀', '🐚'] }],
          moon: [{ type: 'legend', title: 'Logbook, last page', caption: 'The captain’s cipher.', pairs: [['🐚', '7'], ['🦀', '2'], ['🐟', '5'], ['⚓', '9'], ['🐙', '4'], ['🦑', '1'], ['🐬', '8'], ['⭐', '3']] }],
        },
        solve: ({ sun, moon }) => {
          const s = find(sun, 'symbols'), l = find(moon, 'legend');
          if (!s || !l) return null;
          const key = Object.fromEntries(l.pairs);
          return s.items.map(x => key[x]);
        },
        hints: [
          'One of you has symbols, the other has a key that turns symbols into numbers.',
          'Read the chest lid left to right, one symbol at a time.',
          'The first digit is 4.',
        ],
      },
      {
        id: 'wheel', title: 'Ship’s wheel', icon: '☸️', input: { type: 'dirs', len: 4 },
        answer: ['N', 'E', 'W', 'S'],
        cards: {
          sun: [{ type: 'flags', title: 'Flags on the mast', caption: 'Flying left to right through the porthole.', items: [
            { pattern: 'split', a: 'red', b: 'white' },
            { pattern: 'cross', a: 'blue', b: 'white' },
            { pattern: 'split', a: 'white', b: 'red' },
            { pattern: 'stripes', a: 'yellow', b: 'blue' },
          ] }],
          moon: [{ type: 'flagbook', title: 'Signal book', caption: 'Each flag means a turn of the wheel.', pairs: [
            [{ pattern: 'cross', a: 'white', b: 'blue' }, 'N'],
            [{ pattern: 'split', a: 'red', b: 'white' }, 'N'],
            [{ pattern: 'solid', a: 'red' }, 'E'],
            [{ pattern: 'cross', a: 'blue', b: 'white' }, 'E'],
            [{ pattern: 'stripes', a: 'yellow', b: 'blue' }, 'S'],
            [{ pattern: 'stripes', a: 'blue', b: 'yellow' }, 'W'],
            [{ pattern: 'split', a: 'white', b: 'red' }, 'W'],
          ] }],
        },
        solve: ({ sun, moon }) => {
          const f = find(sun, 'flags'), b = find(moon, 'flagbook');
          if (!f || !b) return null;
          const key = Object.fromEntries(b.pairs.map(([fl, d]) => [flagKey(fl), d]));
          return f.items.map(x => key[flagKey(x)]);
        },
        hints: [
          'The flags on the mast spell out four turns of the wheel. The signal book says what each flag means.',
          'Some flags in the book are mirror images of each other. Check which side the red is on.',
          'The first turn is North.',
        ],
      },
      {
        id: 'door', title: 'Cabin door', icon: '🚪', final: true, input: { type: 'colors', len: 3, options: SIX },
        answer: { sun: ['blue', 'yellow', 'red'], moon: ['green', 'green', 'purple'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Half a key, from the chest', caption: 'This is for your partner to enter. Read it out.', tokens: ['green', 'green', 'purple'], kind: 'colors' }],
          moon: [{ type: 'halfkey', title: 'Half a key, behind the wheel', caption: 'This is for your partner to enter. Read it out.', tokens: ['blue', 'yellow', 'red'], kind: 'colors' }],
        },
        solve: halves,
        hints: [
          'Each of you found half of the door key. You each enter your partner’s half, not your own.',
          'Describe the colours on your half-key, in order, to your partner.',
          'Sun enters blue, yellow, red.',
        ],
      },
    ],
  },
  {
    name: 'The Overgrown Greenhouse',
    scene: '🌿🪴🌵🐸🌻',
    intro: 'Vines have grown over the exit. Somewhere under the soil is the gate key, and the sprinklers are the only way to clear the vines.',
    journal: 'A seed packet, in Wren’s handwriting: “Clocks lie in mirrors. Ask the clockmaker.”',
    locks: [
      {
        id: 'valves', title: 'Sprinkler valves', icon: '🚿', input: { type: 'pick', options: ['1', '2', '3', '4', '5'], label: 'Valve' },
        answer: ['4'],
        cards: {
          sun: [{ type: 'valves', title: 'The sprinkler pipe', caption: 'Five valves, numbered from the left, and a pressure gauge.', colors: ['blue', 'red', 'yellow', 'blue', 'white'], gauge: 6 }],
          moon: [{ type: 'rules', title: 'Gardener’s manual', caption: 'Use the first rule that fits. Open only one valve.', items: [
            'If there are more red valves than blue valves, open the first valve.',
            'If the last valve is white and the gauge shows an odd number, open the last valve.',
            'If there is exactly one yellow valve, open the valve just after it.',
            'Otherwise, open the second valve.',
          ] }],
        },
        solve: ({ sun, moon }) => {
          const v = find(sun, 'valves'), r = find(moon, 'rules');
          if (!v || !r) return null;
          const c = v.colors, n = x => c.filter(y => y === x).length;
          if (n('red') > n('blue')) return ['1'];
          if (c.at(-1) === 'white' && v.gauge % 2) return [String(c.length)];
          if (n('yellow') === 1) return [String(c.indexOf('yellow') + 2)];
          return ['2'];
        },
        hints: [
          'Sun sees the valves. Moon has the rules: go down them and stop at the first one that fits.',
          'Count the red and blue valves, and read the gauge.',
          'Rule 3 is the one that fits.',
        ],
      },
      {
        id: 'bed', title: 'Seed bed', icon: '🌱', input: { type: 'coord', cols: 'ABCDE', rows: '12345' },
        answer: ['C', '3'],
        cards: {
          sun: [{ type: 'walk', title: 'Note tucked in a glove', caption: 'Dig where the walk ends.', start: '🐸', steps: [['E', 3], ['N', 2], ['W', 1]] }],
          moon: [{ type: 'grid', title: 'Greenhouse floor plan', caption: 'Pinned by the door.', cols: 'ABCDE', rows: '12345', cells: { A1: '🌻', C2: '🌷', E1: '🐝', B4: '🌵', C4: '🌻', E4: '🍄', A5: '🐸', B2: '🍄', D5: '🌷' } }],
        },
        solve: ({ sun, moon }) => {
          const w = find(sun, 'walk'), g = find(moon, 'grid');
          if (!w || !g) return null;
          const at = Object.entries(g.cells).find(([, v]) => v === w.start)?.[0];
          if (!at) return null;
          let x = g.cols.indexOf(at[0]), y = g.rows.indexOf(at.slice(1));
          for (const [d, k] of w.steps) { x += DIRS[d][0] * k; y += DIRS[d][1] * k; }
          return [g.cols[x], g.rows[y]];
        },
        hints: [
          'Moon’s floor plan has letters and numbers. Sun’s note says where to walk, starting from a landmark.',
          'Moon: find the frog on the plan. North is up.',
          'The frog is at A5.',
        ],
      },
      {
        id: 'gate', title: 'Greenhouse gate', icon: '🚧', final: true, input: { type: 'digits', len: 3 },
        answer: { sun: ['3', '8', '1'], moon: ['6', '0', '5'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Tag on a seed packet', caption: 'These are for your partner to enter. Read them out.', tokens: ['6', '0', '5'], kind: 'digits' }],
          moon: [{ type: 'halfkey', title: 'Label under the valve', caption: 'These are for your partner to enter. Read them out.', tokens: ['3', '8', '1'], kind: 'digits' }],
        },
        solve: halves,
        hints: [
          'The gate has two keypads. Each of you enters your partner’s numbers.',
          'Read your tag out loud to your partner.',
          'Sun enters 3 8 1.',
        ],
      },
    ],
  },
  {
    name: 'The Clockmaker’s Workshop',
    scene: '🕰️⚙️🎶🔩🪞',
    intro: 'A hundred clocks tick out of time. The music box is still playing Wren’s tune, and every mirror on the wall shows a different hour.',
    journal: 'Inside the music box: “The stars point the way. Find my telescope.”',
    locks: [
      {
        id: 'musicbox', title: 'Music box', icon: '🎶', input: { type: 'digits', len: 4 },
        answer: ['3', '8', '6', '7'],
        cards: {
          sun: [{ type: 'rhythm', title: 'The tune it plays', caption: 'Four bars of bells. Long notes and short notes. Hum them to your partner.', bars: ['LSS', 'SLS', 'LLL', 'SSL'] }],
          moon: [{ type: 'tunebook', title: 'Clockmaker’s tune book', caption: 'Each little rhythm is a number.', pairs: [['SSL', '7'], ['LSS', '3'], ['SLS', '8'], ['LLS', '1'], ['SLL', '4'], ['LLL', '6'], ['SSS', '2'], ['LSL', '9']] }],
        },
        solve: ({ sun, moon }) => {
          const r = find(sun, 'rhythm'), b = find(moon, 'tunebook');
          if (!r || !b) return null;
          const key = Object.fromEntries(b.pairs);
          return r.bars.map(x => key[x]);
        },
        hints: [
          'Sun hears the tune; Moon’s book turns each bar of long and short notes into a number.',
          'Say each bar as “long” and “short”. Order matters: long-short-short is not short-short-long.',
          'The first bar is long-short-short: 3.',
        ],
      },
      {
        id: 'drawer', title: 'Parts drawer', icon: '🗃️', input: { type: 'digits', len: 3 },
        answer: ['2', '4', '1'],
        cards: {
          sun: [{ type: 'drawer', title: 'Inside the drawer', caption: 'A jumble of clock parts. Tap a part to tick it off as you count.', items: ['🔩', '🔑', '⚙️', '🔩', '🧲', '🔑', '🪛', '🔩', '🧲', '⚙️', '🔑', '🔩', '🧲'] }],
          moon: [{ type: 'order', title: 'Repair ticket', caption: 'Stamped on the drawer front.', text: 'The code is how many of each part are in the drawer, in this order:', ask: ['⚙️', '🔩', '🪛'] }],
        },
        solve: ({ sun, moon }) => {
          const d = find(sun, 'drawer'), o = find(moon, 'order');
          if (!d || !o) return null;
          return o.ask.map(x => String(d.items.filter(y => y === x).length));
        },
        hints: [
          'Sun has the drawer full of parts. Moon’s ticket says which parts to count, and in what order.',
          'Sun: tap each part as you count it, so you do not count it twice.',
          'There are 2 gears.',
        ],
      },
      {
        id: 'clocks', title: 'Twin clocks', icon: '🕰️', final: true, input: { type: 'clock' },
        answer: { sun: ['8'], moon: ['10'] },
        cards: {
          sun: [{ type: 'mirrorclock', title: 'The mirror behind your partner', caption: 'This mirror shows your partner’s clock. Mirrors swap left and right.', hand: 2 }],
          moon: [{ type: 'mirrorclock', title: 'The mirror behind your partner', caption: 'This mirror shows your partner’s clock. Mirrors swap left and right.', hand: 4 }],
        },
        solve: ({ sun, moon }) => {
          const read = cards => { const m = find(cards, 'mirrorclock'); return m ? [String(unmirror(m.hand))] : null; };
          return { sun: read(moon), moon: read(sun) };
        },
        hints: [
          'Each of you sets your own clock, but only your partner can see (in a mirror) what it should say.',
          'In a mirror, 3 o’clock looks like 9 o’clock. Work out what the real time is.',
          'Moon sets the clock to 10.',
        ],
      },
    ],
  },
  {
    name: 'The Observatory',
    scene: '🔭🌌🪐✨🌙',
    intro: 'The dome is sealed for the night. Line up the telescope and the orrery, and the hatch will open to the stars.',
    journal: 'Under the telescope: “My portrait hangs in the gallery. It was torn in two, like my map.”',
    locks: [
      {
        id: 'chart', title: 'Star chart safe', icon: '🗄️', input: { type: 'digits', len: 4 },
        answer: ['9', '8', '7', '4'],
        cards: {
          sun: [{ type: 'digitgrid', title: 'Numbers on the star chart', caption: 'Faint numbers printed across the sky.', rows: ['7294', '1836', '5027', '4961'] }],
          moon: [{ type: 'stencil', title: 'A card with holes', caption: 'Cut to the size of a star chart.', holes: [[0, 2], [1, 1], [2, 3], [3, 0]] }],
        },
        solve: ({ sun, moon }) => {
          const g = find(sun, 'digitgrid'), s = find(moon, 'stencil');
          if (!g || !s) return null;
          return [...s.holes].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([r, c]) => g.rows[r][c]);
        },
        hints: [
          'Moon’s card is a stencil. Lay it over Sun’s numbers.',
          'Read the numbers that show through the holes, row by row, left to right.',
          'The first number is 9.',
        ],
      },
      {
        id: 'orrery', title: 'Orrery', icon: '🪐', input: { type: 'colors', len: 4, options: SIX },
        answer: ['purple', 'green', 'orange', 'blue'],
        cards: {
          sun: [{ type: 'planets', title: 'Through the telescope', caption: 'Four planets. Their names are not written anywhere you can see.', items: [
            { color: 'orange', moons: 2, rings: false },
            { color: 'blue', moons: 0, rings: false },
            { color: 'green', moons: 0, rings: true },
            { color: 'purple', moons: 1, rings: false },
          ] }],
          moon: [{ type: 'almanac', title: 'Astronomer’s almanac', caption: 'Set the orrery nearest planet first.', order: ['Pell', 'Vela', 'Orra', 'Mizu'], guide: [
            { name: 'Orra', moons: 2, rings: false },
            { name: 'Vela', moons: 0, rings: true },
            { name: 'Mizu', moons: 0, rings: false },
            { name: 'Pell', moons: 1, rings: false },
          ] }],
        },
        solve: ({ sun, moon }) => {
          const p = find(sun, 'planets'), a = find(moon, 'almanac');
          if (!p || !a) return null;
          return a.order.map(name => {
            const g = a.guide.find(x => x.name === name);
            const hits = p.items.filter(x => x.moons === g.moons && x.rings === g.rings);
            return hits.length === 1 ? hits[0].color : null;
          });
        },
        hints: [
          'Sun can see the planets; Moon knows their names and the order.',
          'Count each planet’s moons and look for rings.',
          'Pell is the planet with one moon.',
        ],
      },
      {
        id: 'hatch', title: 'Dome hatch', icon: '🌠', final: true, input: { type: 'dirs', len: 4 },
        answer: { sun: ['N', 'N', 'E', 'W'], moon: ['S', 'E', 'S', 'W'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Scratched inside the eyepiece', caption: 'These are for your partner to enter. Read them out.', tokens: ['S', 'E', 'S', 'W'], kind: 'dirs' }],
          moon: [{ type: 'halfkey', title: 'Pencilled in the almanac', caption: 'These are for your partner to enter. Read them out.', tokens: ['N', 'N', 'E', 'W'], kind: 'dirs' }],
        },
        solve: halves,
        hints: [
          'The hatch has two dials. Each of you enters your partner’s arrows.',
          'Read your arrows aloud, first to last.',
          'Sun enters north, north, east, west.',
        ],
      },
    ],
  },
  {
    name: 'The Portrait Gallery',
    scene: '🖼️🦊🦉🐇🕯️',
    intro: 'Wren’s portrait was cut into strips and hung in pieces. The gallery guard left notes, but they never agree on where anything hangs.',
    journal: 'Behind the portrait, a brass plate: “The vault is under the harbour. Bring each other.”',
    locks: [
      {
        id: 'painting', title: 'Shredded painting', icon: '🖼️', input: { type: 'digits', len: 3 },
        answer: ['0', '8', '5'],
        cards: {
          sun: [{ type: 'shred', title: 'Your strips of the painting', caption: 'Three numbers were painted on it. You have the outer strips of each; the gaps are your partner’s.', rows: shred('085', [0, 2]) }],
          moon: [{ type: 'shred', title: 'Your strips of the painting', caption: 'Three numbers were painted on it. You have the middle strip of each; the gaps are your partner’s.', rows: shred('085', [1]) }],
        },
        solve: ({ sun, moon }) => {
          const a = find(sun, 'shred'), b = find(moon, 'shred');
          if (!a || !b) return null;
          const c = shredCandidates([a, b]);
          return c.every(x => x.length === 1) ? c.map(x => x[0]) : null;
        },
        hints: [
          'Each of you has some strips of the same three painted numbers. Lay them over each other by describing them.',
          'Go one number at a time. Is the middle of it painted, or bare? Are the outer edges painted all the way down?',
          'The first number is 0.',
        ],
      },
      {
        id: 'portraits', title: 'Portrait frames', icon: '🦉', input: { type: 'colors', len: 3, options: SIX },
        answer: ['green', 'red', 'blue'],
        cards: {
          sun: [{ type: 'logic', title: 'Guard’s notes, page 1', caption: 'Three portraits hang in a row: a fox, an owl and a hare, in red, blue and green frames.', clues: [{ k: 'pos', who: '🦉', at: 1 }, { k: 'frame', who: '🦊', color: 'blue' }], ask: 'The lock wants the frame colours, left to right.' }],
          moon: [{ type: 'logic', title: 'Guard’s notes, page 2', caption: 'Three portraits hang in a row: a fox, an owl and a hare, in red, blue and green frames.', clues: [{ k: 'leftOf', a: '🐇', b: '🦊' }, { k: 'notFrame', who: '🦉', color: 'green' }], ask: 'The lock wants the frame colours, left to right.' }],
        },
        solve: ({ sun, moon }) => {
          const a = find(sun, 'logic'), b = find(moon, 'logic');
          if (!a || !b) return null;
          const sols = logicSolutions([...a.clues, ...b.clues]);
          return sols.length === 1 ? sols[0].frames : null;
        },
        hints: [
          'Each of you has two of the guard’s four notes. Put all four together.',
          'Start with where the owl hangs, then where the hare and fox must go.',
          'The owl hangs in the middle, in a red frame.',
        ],
      },
      {
        id: 'curtain', title: 'Velvet curtain', icon: '🎭', final: true, input: { type: 'dirs', len: 4 },
        answer: { sun: ['E', 'S', 'S', 'N'], moon: ['W', 'W', 'N', 'E'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Arrows on the frame', caption: 'These are for your partner to enter. Read them out.', tokens: ['W', 'W', 'N', 'E'], kind: 'dirs' }],
          moon: [{ type: 'halfkey', title: 'Arrows on the guard’s chair', caption: 'These are for your partner to enter. Read them out.', tokens: ['E', 'S', 'S', 'N'], kind: 'dirs' }],
        },
        solve: halves,
        hints: [
          'Each of you enters your partner’s arrows.',
          'Read your arrows aloud, first to last.',
          'Sun enters east, south, south, north.',
        ],
      },
    ],
  },
  {
    name: 'The Vault Under the Harbour',
    finale: true,
    scene: '⚓🌊🗝️⚖️💌',
    intro: 'The last door of the trail. The tide is coming in, the scales are waiting, and Wren’s vault has two keyholes side by side.',
    journal: 'Inside the vault there is no gold. Just a letter: “If you are reading this, you got here together. That was always the treasure. Keep talking to each other.” — Captain Wren',
    locks: [
      {
        id: 'tides', title: 'Tide gate', icon: '🌊', input: { type: 'digits', len: 2 },
        answer: ['7', '2'],
        cards: {
          sun: [{ type: 'tides', title: 'Harbour tide table', caption: 'Tide heights in metres.', days: ['Mon', 'Tue', 'Wed', 'Thu'], times: ['6am', 'noon', '6pm', 'midnight'], heights: [[3, 5, 2, 4], [4, 6, 1, 3], [2, 7, 3, 5], [5, 4, 2, 6]] }],
          moon: [{ type: 'ticket', title: 'Your ferry ticket', caption: 'Folded in Wren’s letter.', day: 'Wed', time: 'noon', rule: 'The gate code is the tide height when you arrived, then the lowest tide of that day.' }],
        },
        solve: ({ sun, moon }) => {
          const t = find(sun, 'tides'), k = find(moon, 'ticket');
          if (!t || !k) return null;
          const row = t.heights[t.days.indexOf(k.day)];
          return [String(row[t.times.indexOf(k.time)]), String(Math.min(...row))];
        },
        hints: [
          'Moon knows when you arrived. Sun has the tide table.',
          'Find the arrival day and time on the table, then the smallest number in that day’s row.',
          'The first number is 7.',
        ],
      },
      {
        id: 'scales', title: 'Brass scales', icon: '⚖️', input: { type: 'digits', len: 2 },
        answer: ['1', '0'],
        cards: {
          sun: [{ type: 'scales', title: 'Two balanced scales', caption: 'Both are perfectly level.', eqs: [{ left: { '🍐': 1 }, right: { '🍎': 2 } }, { left: { '🍋': 1 }, right: { '🍐': 1, '🍎': 1 } }] }],
          moon: [{ type: 'scalenote', title: 'Label on the vault scale', caption: 'Engraved in brass.', known: { '🍎': 2 }, ask: ['🍋', '🍐'] }],
        },
        solve: ({ sun, moon }) => {
          const a = find(sun, 'scales'), b = find(moon, 'scalenote');
          if (!a || !b) return null;
          const w = weigh(a.eqs, b.known), total = b.ask.reduce((t, k) => t + w[k], 0);
          return Number.isFinite(total) ? String(total).padStart(2, '0').split('') : null;
        },
        hints: [
          'Sun’s scales say how the fruits compare. Moon knows what an apple weighs and what the vault asks.',
          'If a pear balances two apples, and an apple weighs 2, what does a pear weigh?',
          'A pear weighs 4.',
        ],
      },
      {
        id: 'vault', title: 'Vault door', icon: '🗝️', final: true, input: { type: 'digits', len: 4 },
        answer: { sun: ['1', '9', '0', '4'], moon: ['2', '0', '2', '6'] },
        cards: {
          sun: [{ type: 'halfkey', title: 'Engraved on the left key', caption: 'These are for your partner to enter. Read them out.', tokens: ['2', '0', '2', '6'], kind: 'digits' }],
          moon: [{ type: 'halfkey', title: 'Engraved on the right key', caption: 'These are for your partner to enter. Read them out.', tokens: ['1', '9', '0', '4'], kind: 'digits' }],
        },
        solve: halves,
        hints: [
          'Two keyholes: each of you enters the numbers on your partner’s key.',
          'Read your four numbers aloud, slowly.',
          'Sun enters 1 9 0 4.',
        ],
      },
    ],
  },
];
