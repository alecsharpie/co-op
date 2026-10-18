// Split-Vision Escape Room: the rules, as pure functions over plain JSON (no DOM). Only the board runs them; phones
// get views without answers. A room is open once every lock is: ordinary locks take one right answer from either
// phone; the final lock appears after the others and takes each seat's own half (what the partner's phone shows).

export const SEATS = ['sun', 'moon'];

// Each lock in a room gets a colour; its clue cards on both phones and its card on the TV wear the same one.
// Finals are always gold.
export const LOCK_COLORS = ['#7cc4ff', '#c49bff', '#7be0b0', '#ff9d7a'];
export const lockColor = (room, lock) => (lock.final ? '#ffcf5a' : LOCK_COLORS[room.locks.filter(l => !l.final).indexOf(lock) % LOCK_COLORS.length]);
export const HINT_TIERS = ['Nudge', 'How to', 'Give-away'];

// What a keypad should ask for, in words.
export function formatText(input) {
  const n = input.len || 1;
  return {
    digits: `${n} number${n > 1 ? 's' : ''}`, dirs: `${n} arrow${n > 1 ? 's' : ''}, in order`, colors: `${n} colour${n > 1 ? 's' : ''}, in order`,
    pick: `one ${String(input.label || 'option').toLowerCase()}`, coord: 'a column and a row', clock: 'one hour on the clock',
  }[input.type] || '';
}

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

// How many tokens are right and in the right place: said after a wrong try when it is fair (several tokens).
export const closeness = (v, answer) => (answer.length > 1 && v.length === answer.length ? v.filter((x, i) => x === answer[i]).length : null);

// Returns {st, ok, opened, close}: opened is true when this try finished the lock; close is closeness() on a miss.
export function tryLock(room, st0, lockId, seat, value) {
  const lock = visible(room, st0).find(l => l.id === lockId);
  if (!lock || !SEATS.includes(seat) || isSolved(lock, st0)) return { st: st0, ok: false, opened: false, close: null };
  const v = tokens(value), st = structuredClone(st0), answer = lock.final ? lock.answer[seat] : lock.answer;
  const ok = same(v, answer);
  st.tries = (st.tries || 0) + 1;
  if (lock.final) {
    if (ok) st.solved[lock.id] = { ...(st.solved[lock.id] || {}), [seat]: true };
    return { st, ok, opened: ok && isSolved(lock, st), close: ok ? null : closeness(v, answer) };
  }
  if (ok) st.solved[lock.id] = true;
  return { st, ok, opened: ok, close: ok ? null : closeness(v, answer) };
}

export const hintsUsed = st => Object.values(st.hints).reduce((a, b) => a + b, 0);

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
    cards: locks.flatMap(l => l.cards[seat].map((c, i) => ({ ...c, key: `${l.id}.${i}`, lock: l.id, lockTitle: l.title, icon: l.icon, color: lockColor(room, l), solved: isSolved(l, st) }))),
    hiddenFinal: room.locks.some(l => l.final && !finalReady(room, st)),
    locks: locks.map(l => ({
      id: l.id, title: l.title, icon: l.icon, input: l.input, final: !!l.final, color: lockColor(room, l), format: formatText(l.input),
      solved: isSolved(l, st),
      mine: l.final ? !!(st.solved[l.id] && st.solved[l.id][seat]) : isSolved(l, st),
      partner: l.final ? !!(st.solved[l.id] && st.solved[l.id][SEATS.find(s => s !== seat)]) : null,
    })),
  };
}
