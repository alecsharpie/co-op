// Two-Keeper Garden: the rules, as pure functions over plain JSON (no DOM), so the board can save the state as-is,
// the phones can explain every action before it is sent, and node --test can play whole seasons.
//
// A garden café. The grower plants and waters the beds; the cook picks, cooks and serves. Each day both place 3
// tokens in secret, then the day plays out in a fixed order: pick, plant, water (rain waters everything), grow,
// cook, serve. Heavy pumpkins need both keepers on the bed, and a feast order needs both at the counter.
// Served orders earn stars; reach the season's target by the last day. The grower alone sees the weather; the
// cook alone sees who is coming.

export const PHASES = [{ name: 'plan', seats: ['grower', 'cook'] }];
export const TOKENS = 3;
export const CROPS = {
  herb: { icon: '🌿', name: 'Herbs', need: 1 },
  tomato: { icon: '🍅', name: 'Tomato', need: 2 },
  pumpkin: { icon: '🎃', name: 'Pumpkin', need: 3, heavy: true },
};
export const DISHES = {
  tea: { icon: '🍵', name: 'Herb tea', needs: { herb: 1 }, stars: 1 },
  salad: { icon: '🥗', name: 'Salad', needs: { herb: 1, tomato: 1 }, stars: 2 },
  soup: { icon: '🍲', name: 'Tomato soup', needs: { tomato: 2 }, stars: 2 },
  pie: { icon: '🥧', name: 'Pumpkin pie', needs: { pumpkin: 1, herb: 1 }, stars: 3 },
};
export const WEATHER = { sun: '☀️', rain: '🌧️', storm: '⛈️' };
export const UPGRADES = {
  greenhouse: { icon: '🪴', name: 'Greenhouse bed', text: 'One more bed to grow in.' },
  compost: { icon: '♻️', name: 'Compost heap', text: 'New plantings start one watering ahead.' },
  barrel: { icon: '🛢️', name: 'Rain barrel', text: 'Watering a bed also waters the bed next to it.' },
};

// with the compost heap, a new planting starts one watering ahead (a crop always needs at least one)
const headStart = (s, crop) => (s.upgrades?.includes('compost') ? Math.min(1, CROPS[crop].need - 1) : 0);
export const stations = (def, s) => [...Array.from({ length: s ? s.beds.length : def.beds.length }, (_, i) => 'b' + i), 'stove', 'counter'];
export const isBed = at => /^b\d+$/.test(at);
export const bedName = at => `Bed ${+at.slice(1) + 1}`;
export const ripe = b => !!b.crop && b.grown >= CROPS[b.crop].need;
export const toRipen = b => (b.crop ? Math.max(0, CROPS[b.crop].need - b.grown) : 0);
export const weatherOn = (def, day) => ((def.storm || []).includes(day) ? 'storm' : def.rain.includes(day) ? 'rain' : 'sun');
export const forecast = (s, def, n = 3) => Array.from({ length: n }, (_, i) => s.day + i).filter(d => d <= def.days).map(d => ({ day: d, w: weatherOn(def, d) }));
export const upcoming = (s, def) => def.orders.filter(o => o.day > s.day && o.day <= s.day + 2).map(o => ({ ...o, stars: o.stars ?? DISHES[o.dish].stars }));
const recipe = d => Object.entries(DISHES[d].needs).map(([c, n]) => CROPS[c].icon.repeat(n)).join(' + ');
export const recipeText = d => `${recipe(d)} → ${DISHES[d].icon}`;

function arrive(s, def) {
  def.orders.forEach((o, i) => {
    if (o.day === s.day) s.orders.push({ id: i, dish: o.dish, due: o.day + o.within - 1, stars: o.stars ?? DISHES[o.dish].stars, joint: !!o.joint });
  });
}

export function newSeason(def, upgrades = []) {
  const beds = def.beds.map(b => ({ crop: b.crop || null, grown: b.grown || 0, ripeFor: 0 }));
  if (upgrades.includes('greenhouse')) beds.push({ crop: null, grown: 0, ripeFor: 0 });
  const s = { day: 1, stars: 0, status: 'play', why: '', upgrades: [...upgrades], beds, basket: {}, dishes: [], orders: [], served: 0, missed: 0 };
  arrive(s, def);
  return s;
}

// Who may act on a station, for the badges on every card.
export function rolesAt(at, def) {
  if (isBed(at)) return { grower: def.storm?.length ? 'plant · water · cover' : 'plant · water', cook: 'pick' };
  if (at === 'stove') return { cook: 'cook' };
  if (at === 'counter') return { cook: 'serve', grower: 'help carry feasts' };
  return {};
}

// What a token on `at` may do, each with a plain-words description shown before the player commits. `plan` is the
// phone's own tokens so far: a bed it plants today can also be watered (or covered) today.
export function optionsFor(role, at, s, def, plan = []) {
  const plant = (b, after) => def.crops.map(c => ({
    verb: 'plant', opt: c, label: `Plant ${CROPS[c].icon}`,
    desc: `Plant ${CROPS[c].name.toLowerCase()} in ${bedName(at)}${after ? ' once the cook has picked what is there' : ''}. Ripe after ${CROPS[c].need - headStart(s, c)} watering${CROPS[c].need - headStart(s, c) === 1 ? '' : 's'}.`,
  }));
  if (role === 'grower') {
    if (isBed(at)) {
      const b = s.beds[+at.slice(1)];
      if (!b) return [];
      const sown = plan.find(t => t.at === at && t.verb === 'plant');
      const later = sown ? [{ verb: 'water', label: 'Water 💧', desc: `Water the ${CROPS[sown.opt].icon} you are planting in ${bedName(at)} today (watering happens after planting).` },
        ...(def.storm?.length ? [{ verb: 'cover', label: 'Cover ⛺', desc: `Cover what you plant in ${bedName(at)} so a storm cannot flatten it.` }] : [])] : [];
      if (!b.crop) return sown ? later : plant(b, false);
      const opts = [];
      if (!ripe(b)) {
        opts.push({ verb: 'water', label: 'Water 💧', desc: `Water the ${CROPS[b.crop].icon} in ${bedName(at)}. ${toRipen(b) === 1 ? 'It will be ripe tonight.' : `${toRipen(b)} waterings until ripe.`}` });
        if (def.storm?.length) opts.push({ verb: 'cover', label: 'Cover ⛺', desc: `Cover the ${CROPS[b.crop].icon} in ${bedName(at)} so a storm cannot flatten it.` });
        return opts;
      }
      if (CROPS[b.crop].heavy) opts.push({ verb: 'lift', label: 'Lift 💪', desc: `Help lift the ${CROPS[b.crop].icon}. The cook must pick ${bedName(at)} the same day.` });
      return [...opts, ...(sown ? later : plant(b, true))];
    }
    if (at === 'counter') return [{ verb: 'help', label: 'Help carry 🤝', desc: 'Help carry a 🤝 feast order. Only feasts need it, and the cook must serve the same day.' }];
    return [];
  }
  if (role === 'cook') {
    if (isBed(at)) {
      const b = s.beds[+at.slice(1)];
      if (!b) return [];
      return [{ verb: 'harvest', label: 'Pick 🧺', desc: b.crop ? `Pick the ${CROPS[b.crop].icon} in ${bedName(at)} into the basket${CROPS[b.crop].heavy ? ' (the grower must lift too)' : ''}.` : `Pick from ${bedName(at)} into the basket.` }];
    }
    if (at === 'stove') return def.dishes.map(d => ({ verb: 'cook', opt: d, label: `Cook ${DISHES[d].icon}`, desc: `Cook ${DISHES[d].name.toLowerCase()} from ${recipe(d)} in the basket.` }));
    if (at === 'counter') return [{ verb: 'serve', label: 'Serve 🛎️', desc: 'Serve a cooked dish to someone at the counter who ordered it.' }];
  }
  return [];
}

// The option a placed token stands for; `plan` is the rest of that player's tokens (the token itself is left out).
export const optionOf = (role, t, s, def, plan = []) => optionsFor(role, t.at, s, def, plan.filter(x => x !== t)).find(o => o.verb === t.verb && (o.opt || null) === (t.opt || null));

// Is this token something the role could ever do on that station (state aside)?
function legal(role, t, def, s) {
  if (!t || typeof t !== 'object' || !stations(def, s).includes(t.at)) return false;
  const bed = isBed(t.at);
  if (role === 'grower') return (bed && t.verb === 'plant' && def.crops.includes(t.opt)) || (bed && ['water', 'lift', 'cover'].includes(t.verb)) || (t.at === 'counter' && t.verb === 'help');
  return (bed && t.verb === 'harvest') || (t.at === 'stove' && t.verb === 'cook' && def.dishes.includes(t.opt)) || (t.at === 'counter' && t.verb === 'serve');
}
export const cleanPlan = (role, plan, def, s) => (Array.isArray(plan) ? plan : []).filter(t => legal(role, t, def, s)).slice(0, TOKENS).map(t => ({ at: t.at, verb: t.verb, ...(t.opt ? { opt: t.opt } : {}) }));

const canMake = (basket, dish) => Object.entries(DISHES[dish].needs).every(([c, n]) => (basket[c] || 0) >= n);
const missing = (basket, dish) => Object.entries(DISHES[dish].needs).filter(([c, n]) => (basket[c] || 0) < n).map(([c, n]) => CROPS[c].icon.repeat(n - (basket[c] || 0))).join('');
const basketText = b => Object.entries(b).filter(([, n]) => n > 0).map(([c, n]) => CROPS[c].icon.repeat(n)).join('') || 'nothing';

// Checks a phone's own plan against what it knows, token by token: {ok, text} where ok is true, false (will fail
// whatever the partner does) or null (depends on the partner). Shown under each token before Ready.
export function checkPlan(role, plan, s, def) {
  const basket = { ...s.basket }, dishes = [...s.dishes];
  const picks = role === 'cook' ? plan.filter(t => t.verb === 'harvest') : [];
  for (const t of picks) { const b = s.beds[+t.at.slice(1)]; if (b && ripe(b) && !CROPS[b.crop].heavy) basket[b.crop] = (basket[b.crop] || 0) + 1; }
  const rain = weatherOn(def, s.day) === 'rain';
  const beds = s.beds.map(b => ({ ...b })); // the grower's own plantings count for later tokens in the plan
  return plan.map(t => {
    const b = isBed(t.at) ? beds[+t.at.slice(1)] : null;
    if (t.verb === 'harvest') {
      if (!b.crop) return { ok: false, text: 'Nothing is growing here.' };
      if (!ripe(b)) return { ok: false, text: `Not ripe yet: needs ${toRipen(b)} more watering${toRipen(b) > 1 ? 's' : ''}.` };
      if (CROPS[b.crop].heavy) return { ok: null, text: 'Too heavy alone: ask the grower to Lift here too.' };
      return { ok: true, text: `${CROPS[b.crop].icon} goes into the basket.` };
    }
    if (t.verb === 'cook') {
      if (!canMake(basket, t.opt)) return { ok: false, text: `Needs ${recipe(t.opt)}. Missing ${missing(basket, t.opt)}: pick it first (picking happens before cooking).` };
      for (const [k, n] of Object.entries(DISHES[t.opt].needs)) basket[k] -= n;
      dishes.push(t.opt);
      return { ok: true, text: `Uses ${recipe(t.opt)} from the basket.` };
    }
    if (t.verb === 'serve') {
      const o = s.orders.find(o => dishes.includes(o.dish));
      if (!s.orders.length) return { ok: false, text: 'Nobody is waiting at the counter.' };
      if (!o) return { ok: false, text: `No cooked dish matches an order. Waiting for: ${s.orders.map(o => DISHES[o.dish].icon).join(' ')}.` };
      dishes.splice(dishes.indexOf(o.dish), 1);
      return o.joint ? { ok: null, text: `Serves the ${DISHES[o.dish].icon} feast if the grower helps carry.` } : { ok: true, text: `Serves ${DISHES[o.dish].icon} for ${'⭐'.repeat(o.stars)}.` };
    }
    if (t.verb === 'water') {
      if (!b.crop) return { ok: false, text: 'Bare soil: plant something first.' };
      if (ripe(b)) return { ok: false, text: 'Already ripe: the cook should pick it.' };
      if (rain) return { ok: false, text: 'It rains today: every bed gets watered anyway.' };
      if (weatherOn(def, s.day) === 'storm') return { ok: false, text: 'A storm today: nothing grows. Cover it instead, or it gets flattened.' };
      return { ok: true, text: toRipen(b) === 1 ? 'Ripe tonight.' : `${toRipen(b) - 1} more watering${toRipen(b) - 1 > 1 ? 's' : ''} after this.` };
    }
    if (t.verb === 'plant') {
      if (b.crop && !ripe(b)) return { ok: false, text: 'Something is already growing here.' };
      if (b.crop) { Object.assign(b, { crop: t.opt, grown: headStart(s, t.opt) }); return { ok: null, text: 'Only works if the cook picks this bed today.' }; }
      Object.assign(b, { crop: t.opt, grown: headStart(s, t.opt) });
      return { ok: true, text: `${CROPS[t.opt].icon} goes in. Water it to make it grow.` };
    }
    if (t.verb === 'lift') return { ok: null, text: 'Only works if the cook picks this bed today.' };
    if (t.verb === 'cover') return weatherOn(def, s.day) === 'storm' ? { ok: true, text: 'Safe from the storm.' } : { ok: false, text: 'No storm today: covering does nothing.' };
    if (t.verb === 'help') return s.orders.some(o => o.joint) ? { ok: null, text: 'Works if the cook serves the feast today.' } : { ok: false, text: 'No feast order is waiting.' };
    return { ok: null, text: '' };
  });
}

// Resolve one day. plans: {grower: [token], cook: [token]}, token = {at, verb, opt?}. Returns the new state and the
// events to narrate in order: {step, at, who, kind: 'good'|'bad'|'info', text}, each a plain cause → effect sentence.
export function resolveDay(s0, def, plans) {
  const s = structuredClone(s0), ev = [];
  const g = cleanPlan('grower', plans.grower, def, s), c = cleanPlan('cook', plans.cook, def, s);
  const say = (step, at, who, kind, text) => ev.push({ step, at, who, kind, text });
  const bedOf = at => s.beds[+at.slice(1)];
  const ups = s.upgrades || [];

  // 1. pick
  for (const t of c.filter(t => t.verb === 'harvest')) {
    const b = bedOf(t.at), name = bedName(t.at);
    if (!b.crop) { say('harvest', t.at, 'cook', 'bad', `The cook went to pick ${name}, but nothing grows there.`); continue; }
    if (!ripe(b)) { say('harvest', t.at, 'cook', 'bad', `The ${CROPS[b.crop].icon} in ${name} isn't ripe: it needs ${toRipen(b)} more watering${toRipen(b) > 1 ? 's' : ''}.`); continue; }
    if (CROPS[b.crop].heavy && !g.some(x => x.at === t.at && x.verb === 'lift')) { say('harvest', t.at, 'cook', 'bad', `The ${CROPS[b.crop].icon} in ${name} is too heavy to lift alone: the grower must Lift it too.`); continue; }
    s.basket[b.crop] = (s.basket[b.crop] || 0) + 1;
    say('harvest', t.at, CROPS[b.crop].heavy ? 'both' : 'cook', 'good', `${CROPS[b.crop].heavy ? 'Together you lifted' : 'The cook picked'} the ${CROPS[b.crop].icon} from ${name} into the basket.`);
    Object.assign(b, { crop: null, grown: 0, ripeFor: 0 });
  }
  for (const t of g.filter(t => t.verb === 'lift')) {
    if (!c.some(x => x.at === t.at && x.verb === 'harvest')) say('harvest', t.at, 'grower', 'bad', `The grower waited to lift in ${bedName(t.at)}, but the cook didn't come to pick.`);
  }
  // 2. plant
  for (const t of g.filter(t => t.verb === 'plant')) {
    const b = bedOf(t.at);
    if (b.crop) { say('plant', t.at, 'grower', 'bad', `${bedName(t.at)} still has ${CROPS[b.crop].icon} in it, so nothing new could be planted.`); continue; }
    Object.assign(b, { crop: t.opt, grown: headStart(s, t.opt), ripeFor: 0 });
    say('plant', t.at, 'grower', 'good', `The grower planted ${CROPS[t.opt].icon} in ${bedName(t.at)}.`);
  }
  // 3. water (rain does every bed; a storm waters nothing and flattens what isn't covered)
  const w = weatherOn(def, s.day), watered = new Set(), covered = new Set(g.filter(t => t.verb === 'cover').map(t => +t.at.slice(1)));
  if (w === 'rain') { s.beds.forEach((b, i) => { if (b.crop && !ripe(b)) watered.add(i); }); say('water', null, 'sky', 'info', '🌧️ Rain watered every bed today.'); }
  for (const t of g.filter(t => t.verb === 'water')) {
    const i = +t.at.slice(1), b = s.beds[i];
    if (!b.crop) { say('water', t.at, 'grower', 'bad', `The grower watered ${bedName(t.at)}, but it's bare soil.`); continue; }
    if (ripe(b)) { say('water', t.at, 'grower', 'bad', `The ${CROPS[b.crop].icon} in ${bedName(t.at)} was already ripe; it needed picking, not water.`); continue; }
    if (watered.has(i)) { say('water', t.at, 'grower', 'info', w === 'rain' ? `The rain had already watered ${bedName(t.at)}.` : `${bedName(t.at)} was already watered.`); continue; }
    watered.add(i); say('water', t.at, 'grower', 'good', `The grower watered the ${CROPS[b.crop].icon} in ${bedName(t.at)}.`);
    if (ups.includes('barrel')) { const j = i + 1 < s.beds.length ? i + 1 : i - 1, n = s.beds[j]; if (n && n.crop && !ripe(n) && !watered.has(j)) { watered.add(j); say('water', 'b' + j, 'grower', 'good', `The rain barrel watered ${bedName('b' + j)} too.`); } }
  }
  for (const t of g.filter(t => t.verb === 'cover')) if (w !== 'storm') say('water', t.at, 'grower', 'info', `The grower covered ${bedName(t.at)}, but no storm came.`);
  // 4. grow; ripe crops left too long wilt
  s.beds.forEach((b, i) => {
    if (!b.crop) return;
    const at = 'b' + i;
    if (ripe(b)) {
      b.ripeFor++;
      if (def.wilt && b.ripeFor > def.wilt) { say('grow', at, 'sky', 'bad', `The ${CROPS[b.crop].icon} in ${bedName(at)} sat ripe too long and wilted.`); Object.assign(b, { crop: null, grown: 0, ripeFor: 0 }); }
    } else if (w === 'storm') {
      if (covered.has(i)) say('grow', at, 'grower', 'good', `⛈️ The cover kept the ${CROPS[b.crop].icon} in ${bedName(at)} safe from the storm.`);
      else if (b.grown > 0) { say('grow', at, 'sky', 'bad', `⛈️ The storm flattened the ${CROPS[b.crop].icon} in ${bedName(at)}: it has to grow again.`); b.grown = 0; }
    } else if (watered.has(i)) {
      b.grown++;
      if (ripe(b)) say('grow', at, 'sky', 'good', `The ${CROPS[b.crop].icon} in ${bedName(at)} is ripe: the cook can pick it tomorrow.`);
      else say('grow', at, 'sky', 'info', `The ${CROPS[b.crop].icon} in ${bedName(at)} grew: ${toRipen(b)} more watering${toRipen(b) > 1 ? 's' : ''} to go.`);
    }
  });
  if (w === 'storm') say('grow', null, 'sky', 'info', '⛈️ A storm blew through: no water today.');
  // 5. cook
  for (const t of c.filter(t => t.verb === 'cook')) {
    if (!canMake(s.basket, t.opt)) { say('cook', 'stove', 'cook', 'bad', `No ${DISHES[t.opt].icon}: it needs ${recipe(t.opt)}, but the basket had ${basketText(s.basket)}.`); continue; }
    for (const [k, n] of Object.entries(DISHES[t.opt].needs)) s.basket[k] -= n;
    s.dishes.push(t.opt);
    say('cook', 'stove', 'cook', 'good', `The cook made ${DISHES[t.opt].icon} ${DISHES[t.opt].name.toLowerCase()} from ${recipe(t.opt)}.`);
  }
  // 6. serve: each token serves the most urgent order a ready dish fits
  const helping = g.some(t => t.verb === 'help');
  for (const t of c.filter(t => t.verb === 'serve')) {
    const fits = s.orders.filter(o => s.dishes.includes(o.dish)).sort((a, b) => a.due - b.due || b.stars - a.stars);
    const o = fits.find(o => !o.joint || helping);
    if (!o) {
      say('serve', 'counter', 'cook', 'bad', fits.length ? 'The feast is too big to carry alone: the grower must Help carry the same day.'
        : !s.orders.length ? 'The cook waited at the counter, but nobody had ordered.'
        : `Nothing to serve: the orders want ${s.orders.map(o => DISHES[o.dish].icon).join(' ')} and the stove had ${s.dishes.map(d => DISHES[d].icon).join(' ') || 'nothing'}.`);
      continue;
    }
    s.dishes.splice(s.dishes.indexOf(o.dish), 1);
    s.orders = s.orders.filter(x => x !== o);
    s.stars += o.stars; s.served++;
    say('serve', 'counter', o.joint ? 'both' : 'cook', 'good', `Served ${DISHES[o.dish].icon}${o.joint ? ' to the feast, carried together' : ''}: +${'⭐'.repeat(o.stars)}`);
  }
  if (helping && !c.some(t => t.verb === 'serve')) say('serve', 'counter', 'grower', 'info', 'The grower waited at the counter to help carry, but the cook didn\'t serve.');

  // end of day: orders due today go away; tomorrow's arrive
  for (const o of s.orders.filter(o => o.due <= s.day)) { s.missed++; say('end', 'counter', 'sky', 'bad', `The ${DISHES[o.dish].icon} order gave up waiting and left.`); }
  s.orders = s.orders.filter(o => o.due > s.day);
  s.day++;
  if (s.day > def.days) {
    s.day = def.days;
    s.status = s.stars >= def.target ? 'won' : 'lost';
    s.why = s.status === 'won' ? `${s.stars} stars: the café is the talk of the village.` : `${s.stars} of ${def.target} stars. So close, try the season again.`;
  } else arrive(s, def);
  return { state: s, events: ev };
}
