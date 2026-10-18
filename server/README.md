# Relay server

Phones and the TV board connect to this small server over a WebSocket. It forwards messages between the board
(host) and the phones (guests) in a room; the game itself runs on the board. Adapted from the Age Up relay.

```
browser ──wss──▶ Worker  /room/ABCDE?role=host|guest   checks Origin and code format
                   │ routes by room code
                   ▼
           Durable Object "ABCDE"   one per room, sleeps between messages
             board ◀──▶ relay ◀──▶ phones    phones can only talk to the board
```

| File | |
|---|---|
| `room.js` | relay rules: admission, routing, leaving, limits. No Cloudflare APIs |
| `worker.js` | Cloudflare adapter: the Worker front door and the `Room` Durable Object |
| `wrangler.toml` | Worker name, account, allowed origins, Durable Object binding |
| `.dev.vars` | local only: `ALLOWED_ORIGINS="*"` so phones on the home Wi-Fi are let in |
| `deploy.sh` | runs the tests, deploys, writes `RELAY_URL` into `shared/net.js`, checks `/health` |
| `test/room.test.mjs` | unit tests of `room.js` with fake connections |

Protocol: see the header of `room.js`. Seats, reconnecting and resume live a layer up, in `shared/net.js`.

Deploy: `CLOUDFLARE_API_TOKEN=… ./deploy.sh` (token from the *Edit Cloudflare Workers* template). It stays on the
Workers Free plan, which fails requests over the daily limit rather than billing. Turn-based play sends a handful
of messages a minute, so it will never come close. Nothing is stored or logged.
