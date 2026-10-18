// Content and rules checks for the Split-Vision Escape Room: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, COLORS } from '../escape/rooms.js';
import { newRoom, tryLock, hint, viewFor, roomDone, visible, SEATS } from '../escape/game.js';

const ordinary = ROOMS.flatMap(r => r.locks.filter(l => !l.final).map(l => [r, l]));
const finals = ROOMS.flatMap(r => r.locks.filter(l => l.final).map(l => [r, l]));

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

test('each final half is shown only on the partner’s phone', () => {
  for (const [, l] of finals) {
    assert.ok(l.hints.length >= 2);
    for (const s of SEATS) {
      const other = SEATS.find(x => x !== s);
      assert.deepEqual(l.cards[other].find(c => c.type === 'halfkey').tokens, l.answer[s], `${l.id}: ${s}'s half is not on ${other}'s phone`);
      assert.notDeepEqual(l.cards[s].find(c => c.type === 'halfkey').tokens, l.answer[s], `${l.id}: ${s} can read their own half`);
    }
  }
});

test('answers fit their keypads', () => {
  for (const r of ROOMS) for (const l of r.locks) {
    const answers = l.final ? Object.values(l.answer) : [l.answer], i = l.input;
    for (const a of answers) {
      if (i.len) assert.equal(a.length, i.len, `${l.id}: wrong length`);
      const ok = { digits: x => /^\d$/.test(x), dirs: x => 'NESW'.includes(x), colors: x => i.options.includes(x) && COLORS[x], pick: x => i.options.includes(x) }[i.type];
      if (ok) assert.ok(a.every(ok), `${l.id}: ${a} not enterable`);
      if (i.type === 'coord') assert.ok(i.cols.includes(a[0]) && i.rows.includes(a[1]));
    }
    assert.ok(l.hints.length >= 3, `${l.id}: needs three hints`);
  }
});

test('playing a room: wrong tries change nothing, the door needs both halves', () => {
  const r = ROOMS[0];
  let st = newRoom();
  assert.equal(visible(r, st).some(l => l.final), false);
  assert.equal(tryLock(r, st, 'chest', 'sun', ['1', '1', '1', '1']).ok, false);
  assert.equal(tryLock(r, st, 'door', 'sun', r.locks[2].answer.sun).ok, false, 'final lock is not open yet');
  st = tryLock(r, st, 'chest', 'moon', ['4', '9', '2', '7']).st;
  st = tryLock(r, st, 'wheel', 'sun', ['N', 'E', 'W', 'S']).st;
  assert.equal(visible(r, st).some(l => l.final), true);
  assert.equal(tryLock(r, st, 'door', 'sun', r.locks[2].answer.moon).ok, false, 'entering your own half fails');
  let t = tryLock(r, st, 'door', 'sun', r.locks[2].answer.sun);
  assert.ok(t.ok && !t.opened); st = t.st;
  t = tryLock(r, st, 'door', 'moon', r.locks[2].answer.moon);
  assert.ok(t.opened); assert.ok(roomDone(r, t.st));
});

test('views never carry answers or solvers; hints stop at the last one', () => {
  for (const r of ROOMS) {
    let st = newRoom();
    for (const l of r.locks.filter(l => !l.final)) st = tryLock(r, st, l.id, 'sun', l.answer).st;
    for (const s of SEATS) {
      const v = JSON.stringify(viewFor(r, st, s));
      assert.ok(!v.includes('"answer"') && !v.includes('"hints"') && !v.includes('"solve":'));
    }
  }
  let st = newRoom();
  for (let i = 0; i < 9; i++) st = hint(ROOMS[0], st, 'chest');
  assert.equal(st.hints.chest, ROOMS[0].locks[0].hints.length);
});
