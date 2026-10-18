// Bays, easiest first. oil = turns available; hull = knocks the boat can take. Drifter paths loop: N E S W, or '.'
// to hold still for a turn. test/lighthouse.test.mjs checks every bay is solvable inside its oil.
export const LEVELS = [
  {
    name: 'First Light',
    intro: 'A calm night. Learn the lamp: light the water ahead and talk the boat home.',
    hull: 3, oil: 8,
    map: [
      '###########',
      '#B...#....#',
      '#..#...#..#',
      '#.....##..#',
      '##.#.>>>..#',
      '#..#...#..#',
      '#.L..#..#H#',
      '#...##....#',
      '###########',
    ],
  },
  {
    name: 'Ice Floes',
    intro: 'Floes drift on the tide. Only the keeper can see where they are heading.',
    hull: 3, oil: 9,
    map: [
      '#############',
      '#B..#.......#',
      '#...#..##...#',
      '#.....#..#..#',
      '###.......###',
      '#....##.....#',
      '#..#....#...#',
      '#..#.L..#..H#',
      '#############',
    ],
    drifters: [
      { at: [5, 4], path: 'EEEEWWWW' },
      { at: [10, 1], path: 'SS.NN.' },
      { at: [6, 6], path: 'E.WW.E' },
    ],
  },
  {
    name: 'Whirlpool Bay',
    intro: 'The currents here run in loops. Ride the right one and you save a night of oil.',
    hull: 2, oil: 7,
    map: [
      '#############',
      '#B.v<<<<.#..#',
      '#..v#..^.#..#',
      '#..>>>>^....#',
      '#.##....#v#.#',
      '#....#..#v#.#',
      '#.L..#.^<<..#',
      '#....#......#',
      '#########H###',
    ],
    drifters: [
      { at: [11, 1], path: 'SSSSSNNNNN' },
      { at: [6, 4], path: 'WW.EE.' },
    ],
  },
];
