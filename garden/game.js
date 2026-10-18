// Two-Keeper Garden: the rules, as pure functions over plain JSON (no DOM), so the board can save the state as-is,
// the phones can work out which actions a token may take, and node --test can play whole seasons.
//
// A garden café. The grower plants and waters the beds; the cook harvests, cooks and serves. Each day both place 3
// tokens in secret, then the day resolves in a fixed order: harvest, plant, water (rain waters everything), grow,
// cook, serve. Heavy pumpkins need both keepers on the bed to lift, and a feast order needs both at the counter.
// Orders earn stars; reach the season's target by the last day. The grower alone sees the weather forecast; the
// cook alone sees tomorrow's orders.

export const PHASES = [{ name: 'plan', seats: ['grower', 'cook'] }];
export const TOKENS = 3;
export const CROPS = {
  herb: { icon: '🌿', name: 'Herbs', need: 1 },
  tomato: { icon: '🍅', name: 'Tomato', need: 2 },
  pumpkin: { icon: '🎃', name: 'Pumpkin', need: 3, heavy: true },
};
export const DISHES = {
  tea: { icon: '🍵', name: 'Herb tea', needs: { herb: 1 } },
  salad: { icon: '🥗', name: 'Salad', needs: { herb: 1, tomato: 1 } },
  soup: { icon: '🍲', name: 'Tomato soup', needs: { tomato: 2 } },
  pie: { icon: '🥧', name: 'Pumpkin pie', needs: { pumpkin: 1, herb: 1 } },
};
export const WEATHER = { sun: '☀️', rain: '🌧️' };

export const stations = def => [...def.beds.map((_, i) => 'b' + i), 'stove', 'counter'];
export const isBed = at => /^b\d+$/.test(at);
export const ripe = b => !!b.crop && b.grown >= CROPS[b.crop].need;
export const weatherOn = (def, day) => (def.rain.includes(day) ? 'rain' : 'sun');
export const forecast = (s, def, n = 3) => Array.from({ length: n }, (_, i) => s.day + i).filter(d => d <= def.days).map(d => ({ day: d, w: weatherOn(def, d) }));
export const upcoming = (s, def) => def.orders.filter(o => o.day > s.day && o.day <= s.day + 2);

function arrive(s, def) {
  def.orders.forEach((o, i) => {
    if (o.day === s.day) s.orders.push({ id: i, dish: o.dish, due: o.day + o.within - 1, stars: o.stars, joint: !!o.joint });
  });
}

export function newSeason(def) {
  const s = {
    day: 1, stars: 0, status: 'play', why: '',
    beds: def.beds.map(b => ({ crop: b.crop || null, grown: b.grown || 0, ripeFor: 0 })),
    basket: {}, dishes: [], orders: [], served: 0, missed: 0,
  };
  arrive(s, def);
  return s;
}

// What a token dropped on `at` may do, for the phone's picker. Plan-time state decides the labels, but every
// option is kept that could work once the day resolves (e.g. replanting a bed the cook harvests first).
export function optionsFor(role, at, s, def) {
  const plant = (lab) => def.crops.map(c => ({ verb: 'plant', opt: c, label: `${lab} ${CROPS[c].icon}` }));
  if (role === 'grower') {
    if (isBed(at)) {
      const b = s.beds[+at.slice(1)];
      if (!b) return [];
      if (!b.crop) return plant('Plant');
      if (!ripe(b)) return [{ verb: 'water', label: 'Water 💧' }];
      return [...(CROPS[b.crop].heavy ? [{ verb: 'lift', label: 'Lift 💪' }] : []), ...plant('Replant')];
    }
    if (at === 'counter') return [{ verb: 'help', label: 'Help carry 🤝' }];
    return [];
  }
  if (role === 'cook') {
    if (isBed(at)) return s.beds[+at.slice(1)] ? [{ verb: 'harvest', label: 'Harvest 🧺' }] : [];
    if (at === 'stove') return def.dishes.map(d => ({ verb: 'cook', opt: d, label: `Cook ${DISHES[d].icon}` }));
    if (at === 'counter') return [{ verb: 'serve', label: 'Serve 🛎️' }];
  }
  return [];
}

// Is this token something the role could ever do on that station (state aside)?
function legal(role, t, def) {
  if (!t || typeof t !== 'object' || !stations(def).includes(t.at)) return false;
  const bed = isBed(t.at);
  if (role === 'grower') return (bed && t.verb === 'plant' && def.crops.includes(t.opt)) || (bed && (t.verb === 'water' || t.verb === 'lift')) || (t.at === 'counter' && t.verb === 'help');
  return (bed && t.verb === 'harvest') || (t.at === 'stove' && t.verb === 'cook' && def.dishes.includes(t.opt)) || (t.at === 'counter' && t.verb === 'serve');
}
export const cleanPlan = (role, plan, def) => (Array.isArray(plan) ? plan : []).filter(t => legal(role, t, def)).slice(0, TOKENS).map(t => ({ at: t.at, verb: t.verb, ...(t.opt ? { opt: t.opt } : {}) }));

const canMake = (basket, dish) => Object.entries(DISHES[dish].needs).every(([c, n]) => (basket[c] || 0) >= n);

// Resolve one day. plans: {grower: [token], cook: [token]}, token = {at, verb, opt?}. Returns the new state and the
// events to animate in order: {step, at, who, kind: 'good'|'bad'|'info', text}.
export function resolveDay(s0, def, plans) {
  const s = structuredClone(s0), ev = [];
  const g = cleanPlan('grower', plans.grower, def), c = cleanPlan('cook', plans.cook, def);
  const say = (step, at, who, kind, text) => ev.push({ step, at, who, kind, text });
  const bedOf = at => s.beds[+at.slice(1)];

  // 1. harvest
  for (const t of c.filter(t => t.verb === 'harvest')) {
    const b = bedOf(t.at);
    if (!ripe(b)) { say('harvest', t.at, 'cook', 'bad', b.crop ? `${CROPS[b.crop].icon} isn't ripe yet` : 'Nothing to harvest'); continue; }
    if (CROPS[b.crop].heavy && !g.some(x => x.at === t.at && x.verb === 'lift')) { say('harvest', t.at, 'cook', 'bad', `${CROPS[b.crop].icon} is too heavy to lift alone!`); continue; }
    s.basket[b.crop] = (s.basket[b.crop] || 0) + 1;
    say('harvest', t.at, CROPS[b.crop].heavy ? 'both' : 'cook', 'good', `Picked ${CROPS[b.crop].icon}`);
    Object.assign(b, { crop: null, grown: 0, ripeFor: 0 });
  }
  for (const t of g.filter(t => t.verb === 'lift')) {
    if (!c.some(x => x.at === t.at && x.verb === 'harvest')) say('harvest', t.at, 'grower', 'bad', 'Ready to lift, but nobody came to pick');
  }
  // 2. plant
  for (const t of g.filter(t => t.verb === 'plant')) {
    const b = bedOf(t.at);
    if (b.crop) { say('plant', t.at, 'grower', 'bad', 'Bed already planted'); continue; }
    Object.assign(b, { crop: t.opt, grown: 0, ripeFor: 0 });
    say('plant', t.at, 'grower', 'good', `Planted ${CROPS[t.opt].icon}`);
  }
  // 3. water (rain does every planted bed)
  const rain = weatherOn(def, s.day) === 'rain', watered = new Set();
  if (rain) { s.beds.forEach((b, i) => { if (b.crop && !ripe(b)) watered.add(i); }); say('water', null, 'sky', 'info', '🌧️ Rain waters the whole garden'); }
  for (const t of g.filter(t => t.verb === 'water')) {
    const i = +t.at.slice(1), b = s.beds[i];
    if (!b.crop || ripe(b)) { say('water', t.at, 'grower', 'bad', b.crop ? 'Already ripe' : 'Watered bare soil'); continue; }
    if (watered.has(i)) { say('water', t.at, 'grower', 'info', rain ? 'Rain beat you to it' : 'Already watered'); continue; }
    watered.add(i); say('water', t.at, 'grower', 'good', 'Watered 💧');
  }
  // 4. grow; ripe crops left too long wilt
  s.beds.forEach((b, i) => {
    if (!b.crop) return;
    if (ripe(b)) {
      b.ripeFor++;
      if (def.wilt && b.ripeFor > def.wilt) { say('grow', 'b' + i, 'sky', 'bad', `${CROPS[b.crop].icon} wilted on the vine`); Object.assign(b, { crop: null, grown: 0, ripeFor: 0 }); }
    } else if (watered.has(i)) {
      b.grown++;
      if (ripe(b)) say('grow', 'b' + i, 'sky', 'good', `${CROPS[b.crop].icon} is ripe!`);
    }
  });
  // 5. cook
  for (const t of c.filter(t => t.verb === 'cook')) {
    if (!canMake(s.basket, t.opt)) { say('cook', 'stove', 'cook', 'bad', `Not enough for ${DISHES[t.opt].icon}`); continue; }
    for (const [k, n] of Object.entries(DISHES[t.opt].needs)) s.basket[k] -= n;
    s.dishes.push(t.opt);
    say('cook', 'stove', 'cook', 'good', `Cooked ${DISHES[t.opt].icon}`);
  }
  // 6. serve: each token serves the most urgent order a ready dish fits
  const helping = g.some(t => t.verb === 'help');
  for (const t of c.filter(t => t.verb === 'serve')) {
    const fits = s.orders.filter(o => s.dishes.includes(o.dish)).sort((a, b) => a.due - b.due || b.stars - a.stars);
    const o = fits.find(o => !o.joint || helping);
    if (!o) { say('serve', 'counter', 'cook', 'bad', fits.length ? 'The feast needs both of you to carry!' : 'Nothing ready to serve'); continue; }
    s.dishes.splice(s.dishes.indexOf(o.dish), 1);
    s.orders = s.orders.filter(x => x !== o);
    s.stars += o.stars; s.served++;
    say('serve', 'counter', o.joint ? 'both' : 'cook', 'good', `Served ${DISHES[o.dish].icon}${o.joint ? ' feast' : ''} +${'⭐'.repeat(o.stars)}`);
  }
  if (helping && !c.some(t => t.verb === 'serve')) say('serve', 'counter', 'grower', 'info', 'Waited at the counter, but nobody served');

  // end of day: orders due today go away; tomorrow's arrive
  for (const o of s.orders.filter(o => o.due <= s.day)) { s.missed++; say('end', 'counter', 'sky', 'bad', `${DISHES[o.dish].icon} order left unhappy`); }
  s.orders = s.orders.filter(o => o.due > s.day);
  s.day++;
  if (s.day > def.days) {
    s.day = def.days;
    s.status = s.stars >= def.target ? 'won' : 'lost';
    s.why = s.status === 'won' ? `${s.stars} stars: the café is the talk of the village.` : `${s.stars} of ${def.target} stars. So close, try the season again.`;
  } else arrive(s, def);
  return { state: s, events: ev };
}
