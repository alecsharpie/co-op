// The rooms, easiest first. Each lock gives each seat different clue cards; only together do they hold the answer.
// `solve` works the answer out from the cards alone and returns null if a side is missing: test/escape.test.mjs
// checks it against `answer` with both sides, and with each side on its own.
//
// Card types (drawn by cards.js): symbols, legend, flags, flagbook, valves, rules, grid, walk, digitgrid, stencil,
// planets, almanac, halfkey. Input types (hand.html keypads): digits, dirs, colors, pick, coord.
// A `final` lock appears once the others are open. Its answer is per seat: each enters the half shown on the
// partner's phone.

export const COLORS = { red: '#e5484d', blue: '#3e8ef7', yellow: '#f5d90a', green: '#30a46c', white: '#f1f1f1', purple: '#8e4ec6', orange: '#f76b15' };
const SIX = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

const find = (cards, type) => (cards || []).find(c => c.type === type);
const flagKey = f => `${f.pattern}:${f.a}:${f.b || ''}`;
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

export const ROOMS = [
  {
    name: "The Captain's Cabin",
    scene: '⚓🗺️🕯️🧰🪟',
    intro: 'A storm slammed the cabin door behind you. Sun sees the cabin by the porthole’s daylight; Moon sees it by lantern light. Nothing looks the same to both of you.',
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
          sun: [{ type: 'halfkey', title: 'Half a key, from the chest', caption: 'Your partner needs this half. You need theirs.', tokens: ['green', 'green', 'purple'], kind: 'colors' }],
          moon: [{ type: 'halfkey', title: 'Half a key, behind the wheel', caption: 'Your partner needs this half. You need theirs.', tokens: ['blue', 'yellow', 'red'], kind: 'colors' }],
        },
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
          sun: [{ type: 'halfkey', title: 'Tag on a seed packet', caption: 'Your partner needs these numbers. You need theirs.', tokens: ['6', '0', '5'], kind: 'digits' }],
          moon: [{ type: 'halfkey', title: 'Label under the valve', caption: 'Your partner needs these numbers. You need theirs.', tokens: ['3', '8', '1'], kind: 'digits' }],
        },
        hints: [
          'The gate has two keypads. Each of you enters your partner’s numbers.',
          'Read your tag out loud to your partner.',
          'Sun enters 3 8 1.',
        ],
      },
    ],
  },
  {
    name: 'The Observatory',
    scene: '🔭🌌🪐✨🌙',
    intro: 'The dome is sealed for the night. Line up the telescope and the orrery, and the hatch will open to the stars.',
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
          sun: [{ type: 'halfkey', title: 'Scratched inside the eyepiece', caption: 'Your partner needs these arrows. You need theirs.', tokens: ['S', 'E', 'S', 'W'], kind: 'dirs' }],
          moon: [{ type: 'halfkey', title: 'Pencilled in the almanac', caption: 'Your partner needs these arrows. You need theirs.', tokens: ['N', 'N', 'E', 'W'], kind: 'dirs' }],
        },
        hints: [
          'The hatch has two dials. Each of you enters your partner’s arrows.',
          'Read your arrows aloud, first to last.',
          'Sun enters north, north, east, west.',
        ],
      },
    ],
  },
];
