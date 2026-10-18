# Co-op

Two-player co-op prototypes for the browser. The laptop or TV shows the shared board; each player's phone is their
private hand and controller (big buttons, no reflexes needed). Turn-based, shared fate, built to make two people
talk to each other.

**Play:** https://www.alecsharpie.me/co-op/ (open a board on the TV, scan the QR code with both phones)

| | Prototype | |
|---|---|---|
| 🗼 | [Lighthouse & Navigator](lighthouse/) | the keeper sees the whole bay, the navigator steers through the fog |
| 🔐 | [Split-Vision Escape Room](escape/) | each phone holds half the clues; describe, cross-reference, escape |
| 🃏 | [Co-op Spire](spire/) | two decks, one enemy; pick in secret, reveal together, land the combo |

## How it fits together

- `<game>/board.html` runs the game and is the only place the rules run. It saves to its own localStorage after
  every move, so closing the tab is always safe.
- `<game>/hand.html` is the phone. It renders whatever private view the board sends it and sends back actions.
- `shared/net.js` connects them: over the relay in `server/` (a Cloudflare Durable Object per room code, see
  `server/README.md`), or over BroadcastChannel between tabs with `?net=local`. Phones keep a seat across screen
  locks and board reloads.
- `shared/phases.js` handles turns with hidden submissions (plan in secret, then reveal).

## Development

No build step: edit and reload.

```sh
npm start        # serves the repo on the home network and runs the relay locally; prints the phone URL
npm test         # rules, level checks and relay unit tests
```

`dev.html?game=lighthouse` (or `escape`, `spire`) shows the board and both hands side by side in one tab, no
relay needed. Pages served from GitHub Pages use the deployed relay; `server/deploy.sh` redeploys it.
