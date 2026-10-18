// Seasons, easiest first. One season is one sitting (~20 minutes); the board saves after every day.
// orders: {day it arrives, dish, within (days it waits, counting arrival day), stars (default: the dish's), joint
// (a feast: both carry)}. rain/storm: days with that weather. guide: step-by-step prompts per day and seat, with
// the stations to point at. test/garden.test.mjs checks a simple pair of bots reaches every target.
export const SEASONS = [
  {
    name: 'First Morning',
    intro: 'A short guided season: follow the prompts on your phones and make your first salad.',
    days: 3, target: 3, wilt: 0, rain: [], tutorial: true,
    crops: ['herb', 'tomato'], dishes: ['tea', 'salad'],
    beds: [{ crop: 'herb', grown: 1 }, { crop: 'tomato', grown: 1 }, {}],
    orders: [
      { day: 1, dish: 'tea', within: 2 },
      { day: 1, dish: 'salad', within: 3 },
    ],
    guide: {
      1: {
        board: 'Someone wants 🍵 tea today, and a 🥗 salad by day 3. A salad is 🌿 + 🍅.',
        grower: { text: 'Water the 🍅 in Bed 2 so it is ripe tomorrow. Then plant 🌿 in Bed 3 and water it too.', at: ['b1', 'b2'] },
        cook: { text: 'Pick the ripe 🌿 in Bed 1, cook 🍵 tea at the stove, and serve it at the counter. Picking, cooking and serving all happen in that order, so one day is enough.', at: ['b0', 'stove', 'counter'] },
      },
      2: {
        board: 'Salad time: the cook needs a 🌿 and a 🍅 in the basket.',
        grower: { text: 'The cook is picking Beds 2 and 3 today. Plant 🍅 in Bed 2 and 🌿 in Bed 3 again: planting happens after picking, so the beds are free in time.', at: ['b1', 'b2'] },
        cook: { text: 'Pick the 🍅 in Bed 2 and the 🌿 in Bed 3, then cook 🥗 salad. You are out of tokens, so serve it tomorrow.', at: ['b1', 'b2', 'stove'] },
      },
      3: {
        board: 'Last day: serve the salad before the customer gives up.',
        grower: { text: 'Water the new plants (they will be ready for the next season). Nothing else to do: you can also skip a token.', at: ['b1', 'b2'] },
        cook: { text: 'Serve the 🥗 at the counter. That is the whole loop: grow, pick, cook, serve.', at: ['counter'] },
      },
    },
  },
  {
    name: 'Spring Café',
    intro: 'Herbs and tomatoes. The grower sees the weather; the cook sees who is coming. Talk!',
    days: 8, target: 6, wilt: 0, rain: [3, 6],
    crops: ['herb', 'tomato'], dishes: ['tea', 'salad', 'soup'],
    beds: [{ crop: 'herb', grown: 1 }, { crop: 'tomato', grown: 1 }, {}],
    orders: [
      { day: 1, dish: 'tea', within: 2 },
      { day: 2, dish: 'salad', within: 3 },
      { day: 3, dish: 'soup', within: 3 },
      { day: 5, dish: 'salad', within: 3 },
      { day: 6, dish: 'tea', within: 3 },
      { day: 7, dish: 'soup', within: 2 },
    ],
  },
  {
    name: 'Summer Fair',
    intro: 'Pumpkins are too heavy for one: lift together. Ripe crops wilt after 3 days, and a storm is coming: only the grower will see it.',
    days: 9, target: 9, wilt: 3, rain: [2, 5, 8], storm: [7],
    crops: ['herb', 'tomato', 'pumpkin'], dishes: ['tea', 'salad', 'soup', 'pie'],
    beds: [{ crop: 'tomato', grown: 1 }, { crop: 'herb', grown: 1 }, {}, { crop: 'pumpkin', grown: 1 }],
    orders: [
      { day: 1, dish: 'tea', within: 2 },
      { day: 2, dish: 'salad', within: 3 },
      { day: 3, dish: 'soup', within: 3 },
      { day: 4, dish: 'pie', within: 3 },
      { day: 6, dish: 'salad', within: 3 },
      { day: 7, dish: 'pie', within: 3, stars: 4, joint: true },
      { day: 8, dish: 'tea', within: 2 },
    ],
  },
  {
    name: 'Harvest Moon',
    intro: 'The busiest night of the year. Crops wilt after 2 days, storms roll in, and the feasts keep coming.',
    days: 10, target: 11, wilt: 2, rain: [2, 6], storm: [5],
    crops: ['herb', 'tomato', 'pumpkin'], dishes: ['tea', 'salad', 'soup', 'pie'],
    beds: [{ crop: 'herb', grown: 1 }, { crop: 'tomato', grown: 1 }, { crop: 'pumpkin', grown: 2 }, {}],
    orders: [
      { day: 1, dish: 'salad', within: 3 },
      { day: 2, dish: 'tea', within: 2 },
      { day: 3, dish: 'pie', within: 4 },
      { day: 4, dish: 'soup', within: 3 },
      { day: 5, dish: 'salad', within: 3 },
      { day: 6, dish: 'pie', within: 3, stars: 4, joint: true },
      { day: 7, dish: 'soup', within: 3 },
      { day: 8, dish: 'salad', within: 3 },
      { day: 9, dish: 'tea', within: 2 },
      { day: 9, dish: 'pie', within: 2, stars: 4, joint: true },
    ],
  },
];
