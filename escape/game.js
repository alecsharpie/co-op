// Split-Vision Escape Room: the rules, as pure functions over plain JSON (no DOM). Only the board runs them; phones
// get views without answers. A room is open once every lock is: ordinary locks take one right answer from either
// phone; the final lock appears after the others and takes each seat's own half (what the partner's phone shows).

export const SEATS = ['sun', 'moon'];

export const newRoom = () => ({ solved: {}, hints: {} });

// ['4', '9'] from anything a phone might send
export const tokens = v => (Array.isArray(v) ? v : []).slice(0, 8).map(x => String(x).slice(0, 12));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export function isSolved(lock, st) {
  const s = st.solved[lock.id];
  return lock.final ? !!(s && s.sun && s.moon) : s === true;
}

export const finalReady = (room, st) => room.locks.filter(l => !l.final).every(l => isSolved(l, st));
export const visible = (room, st) => room.locks.filter(l => !l.final || finalReady(room, st));
export const roomDone = (room, st) => room.locks.every(l => isSolved(l, st));

// Returns {st, ok, opened}: opened is true when this try finished the lock.
export function tryLock(room, st0, lockId, seat, value) {
  const lock = visible(room, st0).find(l => l.id === lockId);
  if (!lock || !SEATS.includes(seat) || isSolved(lock, st0)) return { st: st0, ok: false, opened: false };
  const v = tokens(value), st = structuredClone(st0);
  if (lock.final) {
    const ok = same(v, lock.answer[seat]);
    if (ok) st.solved[lock.id] = { ...(st.solved[lock.id] || {}), [seat]: true };
    return { st, ok, opened: ok && isSolved(lock, st) };
  }
  const ok = same(v, lock.answer);
  if (ok) st.solved[lock.id] = true;
  return { st, ok, opened: ok };
}

export function hint(room, st0, lockId) {
  const lock = room.locks.find(l => l.id === lockId);
  if (!lock) return st0;
  const st = structuredClone(st0);
  st.hints[lockId] = Math.min(lock.hints.length, (st.hints[lockId] || 0) + 1);
  return st;
}

// What one phone may know: its own cards (for locks it can see) and the lock list. Never answers.
export function viewFor(room, st, seat) {
  const locks = visible(room, st);
  return {
    cards: locks.flatMap(l => l.cards[seat].map(c => ({ ...c, lock: l.id, lockTitle: l.title, icon: l.icon, solved: isSolved(l, st) }))),
    locks: locks.map(l => ({
      id: l.id, title: l.title, icon: l.icon, input: l.input, final: !!l.final,
      solved: isSolved(l, st),
      mine: l.final ? !!(st.solved[l.id] && st.solved[l.id][seat]) : isSolved(l, st),
      partner: l.final ? !!(st.solved[l.id] && st.solved[l.id][SEATS.find(s => s !== seat)]) : null,
    })),
  };
}
