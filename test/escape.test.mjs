// Content and rules checks for the Split-Vision Escape Room: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, COLORS, STORY, shredCandidates, logicSolutions, weigh, unmirror } from '../escape/rooms.js';
import { newRoom, tryLock, hint, viewFor, roomDone, visible, SEATS, lockColor, formatText, closeness } from '../escape/game.js';

const ordinary = ROOMS.flatMap(r => r.locks.filter(l => !l.final).map(l => [r, l]));
const finals = ROOMS.flatMap(r => r.locks.filter(l => l.final).map(l => [r, l]));
const lockById = id => ROOMS.flatMap(r => r.locks.map(l => [r, l])).find(([, l]) => l.id === id);

test('every ordinary lock needs both phones: solvable together, not alone', () => {
  for (const [r, l] of ordinary) {
    assert.ok(l.cards.sun.length && l.cards.moon.length, `${l.id}: a seat has no clues`);
    assert.deepEqual(l.solve(l.cards), l.answer, `${r.name} / ${l.id}: cards do not give the answer`);
    assert.equal(l.solve({ sun: l.cards.sun, moon: [] }), null, `${l.id}: Sun alone suffices`);
    assert.equal(l.solve({ sun: [], moon: l.cards.moon }), null, `${l.id}: Moon alone suffices`);
  }
});

test('the answer is not lying around in one seat’s cards', () => {
  for (const [, l] of ordinary) for (const s of SEATS) {
    const flat = JSON.stringify(l.cards[s]);
    assert.ok(!flat.includes(JSON.stringify(l.answer)), `${l.id}: ${s} sees the answer verbatim`);
  }
});

test('each final half can only be read off the partner’s phone', () => {
  for (const [, l] of finals) {
    assert.deepEqual(l.solve(l.cards), l.answer, `${l.id}: the cards do not give both halves`);
    // with only your own cards, your half is unknowable
    assert.equal(l.solve({ sun: l.cards.sun, moon: [] }).sun, null, `${l.id}: Sun can read their own half`);
    assert.equal(l.solve({ sun: [], moon: l.cards.moon }).moon, null, `${l.id}: Moon can read their own half`);
    assert.notDeepEqual(l.answer.sun, l.answer.moon, `${l.id}: both halves are the same`);
  }
});

test('the new puzzles are ambiguous for each phone on its own', () => {
  const [, painting] = lockById('painting');
  const side = s => shredCandidates([painting.cards[s][0]]);
  for (const s of SEATS) assert.ok(side(s).some(c => c.length > 1), `painting: ${s} can read every number alone`);
  assert.ok(shredCandidates(SEATS.map(s => painting.cards[s][0])).every(c => c.length === 1));

  const [, portraits] = lockById('portraits');
  for (const s of SEATS) assert.ok(logicSolutions(portraits.cards[s][0].clues).length > 1, `portraits: ${s}'s notes alone settle it`);

  const [, scales] = lockById('scales');
  assert.equal(weigh(scales.cards.sun[0].eqs, {})['🍐'], undefined, 'scales: weights known without the apple');

  assert.equal(unmirror(2), 10); assert.equal(unmirror(6), 6); assert.equal(unmirror(12), 12);
});

test('answers fit their keypads, and every keypad says what it wants', () => {
  for (const r of ROOMS) for (const l of r.locks) {
    const answers = l.final ? Object.values(l.answer) : [l.answer], i = l.input;
    for (const a of answers) {
      if (i.len) assert.equal(a.length, i.len, `${l.id}: wrong length`);
      const ok = { digits: x => /^\d$/.test(x), dirs: x => 'NESW'.includes(x), colors: x => i.options.includes(x) && COLORS[x], pick: x => i.options.includes(x), clock: x => +x >= 1 && +x <= 12 }[i.type];
      if (ok) assert.ok(a.every(ok), `${l.id}: ${a} not enterable`);
      if (i.type === 'coord') assert.ok(i.cols.includes(a[0]) && i.rows.includes(a[1]));
    }
    assert.ok(l.hints.length >= 3, `${l.id}: needs three hints`);
    assert.ok(formatText(i), `${l.id}: no format text`);
  }
});

test('the story runs from a practice room to a finale, with a journal page per room', () => {
  assert.ok(STORY.title && STORY.intro);
  assert.ok(ROOMS[0].tutorial && ROOMS.at(-1).finale);
  assert.ok(ROOMS.length >= 6);
  for (const r of ROOMS) {
    assert.ok(r.journal, `${r.name}: no journal page`);
    assert.equal(r.locks.filter(l => l.final).length, 1, `${r.name}: needs exactly one final lock`);
    const colors = r.locks.map(l => lockColor(r, l));
    assert.equal(new Set(colors).size, colors.length, `${r.name}: two locks share a colour`);
  }
});

test('playing a room: wrong tries say how close, the door needs both halves', () => {
  const [r] = lockById('chest'), door = r.locks.find(l => l.final);
  let st = newRoom();
  assert.equal(visible(r, st).some(l => l.final), false);
  const miss = tryLock(r, st, 'chest', 'sun', ['4', '1', '2', '1']);
  assert.equal(miss.ok, false); assert.equal(miss.close, 2);
  assert.equal(tryLock(r, st, 'door', 'sun', door.answer.sun).ok, false, 'final lock is not open yet');
  st = tryLock(r, st, 'chest', 'moon', ['4', '9', '2', '7']).st;
  st = tryLock(r, st, 'wheel', 'sun', ['N', 'E', 'W', 'S']).st;
  assert.equal(visible(r, st).some(l => l.final), true);
  assert.equal(tryLock(r, st, 'door', 'sun', door.answer.moon).ok, false, 'entering your own half fails');
  let t = tryLock(r, st, 'door', 'sun', door.answer.sun);
  assert.ok(t.ok && !t.opened); st = t.st;
  t = tryLock(r, st, 'door', 'moon', door.answer.moon);
  assert.ok(t.opened); assert.ok(roomDone(r, t.st));
  assert.equal(closeness(['3'], ['4']), null, 'one-token answers never say how close');
});

test('every room can be played to the end', () => {
  for (const r of ROOMS) {
    let st = newRoom();
    for (const l of r.locks.filter(l => !l.final)) st = tryLock(r, st, l.id, 'sun', l.answer).st;
    const f = r.locks.find(l => l.final);
    for (const s of SEATS) st = tryLock(r, st, f.id, s, f.answer[s]).st;
    assert.ok(roomDone(r, st), `${r.name} could not be finished`);
  }
});

test('views never carry answers or solvers; cards wear their lock’s colour; hints stop at the last one', () => {
  for (const r of ROOMS) {
    let st = newRoom();
    for (const l of r.locks.filter(l => !l.final)) st = tryLock(r, st, l.id, 'sun', l.answer).st;
    for (const s of SEATS) {
      const view = viewFor(r, st, s), v = JSON.stringify(view);
      assert.ok(!v.includes('"answer"') && !v.includes('"hints"') && !v.includes('"solve":'));
      for (const c of view.cards) assert.equal(c.color, view.locks.find(l => l.id === c.lock).color);
    }
  }
  const [r] = lockById('chest');
  let st = newRoom();
  for (let i = 0; i < 9; i++) st = hint(r, st, 'chest');
  assert.equal(st.hints.chest, r.locks[0].hints.length);
});
