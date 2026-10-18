// Turn phases with hidden submissions. A phase is {name, seats}: everyone in `seats` submits, and nothing they
// submitted is revealed until the last of them has (Sky Team style). One seat per phase makes it a plain sequence;
// two seats in one phase makes it simultaneous. The turn is plain JSON so it goes into the save as-is.
//   const PHASES = [{name: 'light', seats: ['keeper']}, {name: 'steer', seats: ['navigator']}];
//   let turn = newTurn();  ...  const r = submit(PHASES, turn, seat, data);  turn = r.turn;  if (r.done) ...

export const newTurn = () => ({ i: 0, got: {} });

export const phaseOf = (phases, turn) => phases[turn.i];

export const waitingOn = (phases, turn) => phaseOf(phases, turn)?.seats.filter(s => !(s in turn.got)) ?? [];

// What other seats may know about the current phase: who has locked in, never what.
export const lockedIn = (phases, turn) => Object.fromEntries((phaseOf(phases, turn)?.seats ?? []).map(s => [s, s in turn.got]));

// Returns {turn, done}: done is null until the phase's last seat submits, then {name, moves: {seat: data}} and the
// turn moves on to the next phase (turn.i === phases.length once the last phase is done: time to resolve).
export function submit(phases, turn, seat, data) {
  const ph = phaseOf(phases, turn);
  if (!ph || !ph.seats.includes(seat)) return { turn, done: null };
  const got = { ...turn.got, [seat]: data };
  if (ph.seats.some(s => !(s in got))) return { turn: { ...turn, got }, done: null };
  return { turn: { i: turn.i + 1, got: {} }, done: { name: ph.name, moves: got } };
}

// Changing your mind before the reveal.
export function withdraw(phases, turn, seat) {
  const got = { ...turn.got }; delete got[seat];
  return { ...turn, got };
}
