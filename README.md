# Escova

Escopa (escova) card game for 2 or 4 players, in the browser.

## Run it

Requires Node.js 22 or newer.

```bash
npm install
npm start          # builds the client, then serves the game on http://localhost:3000
```

To change the port or the empty-room grace period, set environment variables:

```bash
PORT=8080 ROOM_GRACE_MS=60000 npm start
```

### Development

```bash
npm run dev        # game server on :3000 and Vite dev client on http://localhost:5173
```

### Tests

```bash
npm test                                  # unit, server and static tests
CHROME_PATH=/path/to/chromium npm run test:e2e   # real-browser test (opt-in)
```

## Layout

- `shared/`: game rules, constants and socket event names. Used by the server and the browser.
- `server/`: rooms, socket server and settings (`server/config.js`).
- `client/`: Svelte + Vite app.
- `test/`: engine, server, client-rule and browser tests.
