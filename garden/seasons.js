// Seasons, easiest first. One season is one sitting (~20 minutes); the board saves after every day.
// orders: {day it arrives, dish, within (days it waits, counting arrival day), stars, joint (feast: both carry)}.
// test/garden.test.mjs checks a simple pair of bots reaches every target.
export const SEASONS = [
  {
    name: 'Spring Café',
    intro: 'Herbs and tomatoes. The grower sees the weather; the cook sees who is coming. Talk!',
    days: 8, target: 6, wilt: 0, rain: [3, 6],
    crops: ['herb', 'tomato'], dishes: ['tea', 'salad', 'soup'],
    beds: [{ crop: 'herb', grown: 1 }, { crop: 'tomato', grown: 1 }, {}],
    orders: [
      { day: 1, dish: 'tea', within: 2, stars: 1 },
      { day: 2, dish: 'salad', within: 3, stars: 2 },
      { day: 3, dish: 'soup', within: 3, stars: 2 },
      { day: 5, dish: 'salad', within: 3, stars: 2 },
      { day: 6, dish: 'tea', within: 3, stars: 1 },
      { day: 7, dish: 'soup', within: 2, stars: 2 },
    ],
  },
  {
    name: 'Summer Fair',
    intro: 'Pumpkins are too heavy for one: lift together. Ripe crops now wilt after 3 days.',
    days: 9, target: 9, wilt: 3, rain: [2, 5, 8],
    crops: ['herb', 'tomato', 'pumpkin'], dishes: ['tea', 'salad', 'soup', 'pie'],
    beds: [{ crop: 'tomato', grown: 1 }, { crop: 'herb', grown: 1 }, {}, { crop: 'pumpkin', grown: 1 }],
    orders: [
      { day: 1, dish: 'tea', within: 2, stars: 1 },
      { day: 2, dish: 'salad', within: 3, stars: 2 },
      { day: 3, dish: 'soup', within: 3, stars: 2 },
      { day: 4, dish: 'pie', within: 3, stars: 3 },
      { day: 6, dish: 'salad', within: 3, stars: 2 },
      { day: 7, dish: 'pie', within: 3, stars: 4, joint: true },
      { day: 8, dish: 'tea', within: 2, stars: 1 },
    ],
  },
  {
    name: 'Harvest Moon',
    intro: 'The busiest night of the year. Crops wilt after 2 days and the feasts keep coming.',
    days: 10, target: 11, wilt: 2, rain: [4, 7],
    crops: ['herb', 'tomato', 'pumpkin'], dishes: ['tea', 'salad', 'soup', 'pie'],
    beds: [{ crop: 'herb', grown: 1 }, { crop: 'tomato', grown: 1 }, { crop: 'pumpkin', grown: 2 }, {}],
    orders: [
      { day: 1, dish: 'salad', within: 3, stars: 2 },
      { day: 2, dish: 'tea', within: 2, stars: 1 },
      { day: 3, dish: 'pie', within: 4, stars: 3 },
      { day: 4, dish: 'soup', within: 3, stars: 2 },
      { day: 5, dish: 'salad', within: 3, stars: 2 },
      { day: 6, dish: 'pie', within: 3, stars: 4, joint: true },
      { day: 7, dish: 'soup', within: 3, stars: 2 },
      { day: 8, dish: 'salad', within: 3, stars: 2 },
      { day: 9, dish: 'tea', within: 2, stars: 1 },
      { day: 9, dish: 'pie', within: 2, stars: 4, joint: true },
    ],
  },
];
