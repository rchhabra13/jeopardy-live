<div align="center">

# Jeopardy Live

**A real-time, buzz-in trivia game.** Host on a shared screen, players buzz in from their phones —
in the same room or anywhere in the world.

[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Socket.IO](https://img.shields.io/badge/socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## Overview

Jeopardy Live turns any screen into a game board and any phone into a buzzer. The host controls the
board; players race to buzz in on their own devices. A Node/Socket.IO server acts as the referee —
it decides who buzzed first and is the single source of truth for scores.

Ships with **20 ready-to-play boards** (120 categories, 600 clues), a board editor, and JSON
import/export, so no API key, account, or network content fetch is ever required.

## Features

- **Real-time buzz-in** — server-arbitrated, first buzz wins; later buzzes are rejected
- **Works in-person and remote** — identical flow; local play is just everyone on the same WiFi
- **Shareable room links** — 4-character room codes with deep links (`/play/AB12`)
- **Live scoring** — correct adds the clue value, wrong subtracts it, locks that player out, and
  reopens buzzing for everyone else
- **20 built-in boards / 120 categories / 600 clues** — General Knowledge, Science, World History,
  Geography, Movies, Music, Sports, Video Games, Literature, Food & Drink, Space, Animals,
  Internet & Memes, Superheroes, Mythology & Legends, Wordplay, 90s & 2000s Nostalgia,
  Cartoons & Anime, Weird & Wonderful, and Pop Culture Grab Bag
- **Mix your own board** — pick any 6 categories from across every theme, filter by theme, or take
  a random cross-theme mix
- **Board editor** — build custom boards in the browser, save locally, import/export JSON
- **Answer privacy** — un-revealed answers are stripped server-side, so players can't read them
  out of the network payload
- **Single-container deploy** — one image serves the client and the realtime server on one port
- **Host overrides** — manually adjust any score, reveal an answer, skip a clue, or reset the game

## How it works

```
┌──────────────┐         ┌─────────────────────┐         ┌──────────────┐
│  Host screen │◄───────►│   Node + Socket.IO  │◄───────►│ Player phones│
│  (TV/laptop) │  ws     │   room state (RAM)  │   ws    │  (buzzers)   │
└──────────────┘         └─────────────────────┘         └──────────────┘
      board, clues,            referee for                 BUZZ button,
      judging, scores          "who was first"             synced view
```

**Why a server is required:** every player buzzes on a separate device, so there is no shared
input to compare against. The server timestamps arrivals, accepts the first, and rejects the rest.
It also owns scores — clients never trust each other, and every state change is broadcast back to
the whole room.

Host and player receive *different* views of the same game: the host payload includes answers, the
player payload has them stripped unless the host has revealed them.

## Quick start

### Docker (recommended)

```bash
docker compose up -d
```

Open <http://localhost:3001>. The image bundles the built client and the server into one service —
no Node installation required.

```bash
docker compose logs -f   # follow logs
docker compose down      # stop and remove
```

### Local development

```bash
npm run install:all   # root, server, and client dependencies
npm run dev           # server on :3001, Vite client on :5173
```

Open <http://localhost:5173>. To let phones join over your WiFi, use your machine's LAN address
(e.g. `http://192.168.1.42:5173`) — the Vite dev server already listens on all interfaces.

## Playing a game

1. **Host** opens the app and chooses content — a random board, a specific board from the library,
   **six hand-picked categories**, a random cross-theme mix, a saved custom board, or an imported
   JSON file — then creates a room.
2. **Players** open the invite link on their phones and enter a name.
3. **Host** clicks a clue. Buzzing opens for everyone.
4. **Players** race to hit **BUZZ**. The first one through locks it.
5. **Host** marks it correct or wrong:
   - ✅ correct → player gains the value, the cell clears, back to the board
   - ❌ wrong → player loses the value, is locked out of that clue, and buzzing reopens

## Content

| Source | Where | Notes |
|---|---|---|
| Built-in library | `client/src/game/boards/library.js` | 20 boards × 6 categories × 5 clues |
| Board editor | `/editor` route | Saves to `localStorage`, exports JSON |
| JSON import | Host setup screen | Load any board file at game time |

Board shape:

```jsonc
{
  "title": "Space & Astronomy",
  "categories": [
    {
      "title": "The Solar System",
      "clues": [
        { "value": 200, "clue": "The star at the center of our solar system", "answer": "Sun" }
        // ...5 clues per category, values 200–1000
      ]
    }
    // ...6 categories
  ]
}
```

## Project structure

```
.
├── client/                       # React + Vite front end
│   └── src/
│       ├── pages/                # Home, HostView, PlayerView
│       ├── components/           # Board, ClueModal, Scoreboard, BoardEditor
│       ├── game/boards/          # Board library + helpers
│       └── socket.js             # Socket.IO client (same-origin in prod)
├── server/
│   ├── index.js                  # HTTP + Socket.IO wiring, static hosting
│   └── rooms.js                  # Room store, game rules, host/player views
├── Dockerfile                    # Multi-stage build (client → runtime)
└── docker-compose.yml
```

## Realtime protocol

| Event | Direction | Payload | Effect |
|---|---|---|---|
| `host:createRoom` | client → server | `{ board }` | Creates a room, returns a 4-char code |
| `player:join` | client → server | `{ roomCode, name }` | Adds the player, broadcasts the roster |
| `host:selectClue` | client → server | `{ catIndex, clueIndex }` | Opens a clue, enables buzzing |
| `player:buzz` | client → server | — | First accepted buzz wins; rest rejected |
| `host:judge` | client → server | `{ correct }` | Applies score, clears or reopens the clue |
| `host:reveal` | client → server | — | Reveals the answer to everyone |
| `host:closeClue` | client → server | — | Marks the clue done with no score change |
| `host:setScore` | client → server | `{ playerId, score }` | Manual score override |
| `host:reset` | client → server | `{ board? }` | Resets scores and the board |
| `state:update` | server → client | `GameState` | Broadcast after every change |

## Deployment

Any host that runs a **persistent process** works — a VPS, EC2 instance, DigitalOcean droplet,
Render, Railway, or Fly.

```bash
# on the server
git clone https://github.com/rchhabra13/jeopardy-live.git
cd jeopardy-live
docker compose up -d
```

Open the port in your firewall or security group, then share `http://<server-ip>:3001`.
To serve on port 80, change the compose mapping to `"80:3001"`. For HTTPS, put nginx or Caddy in
front and point a domain at it.

> [!IMPORTANT]
> **Serverless platforms (Vercel, Netlify, Lambda) cannot host the server.** WebSocket connections
> need a long-lived process, and room state lives in memory in a single process. Those platforms can
> host the client only, with `VITE_SERVER_URL` pointed at a real server.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Server listen port |
| `VITE_SERVER_URL` | same-origin | Build-time override for the client's server URL, used only when the client is hosted separately |

## Known limitations

- **Rooms are in-memory.** Restarting the server ends any game in progress; idle rooms are reclaimed after 10 minutes. Fine for casual play;
  add Redis or a database for persistence.
- **Reconnects create a new player.** Identity is tied to the socket id, so a player who fully
  reloads rejoins as a new entry (the host can correct scores manually).
- **No spectator or team mode** yet — every joiner is an individual player.

## Roadmap

- [ ] Persistent rooms (Redis) so a restart doesn't end the game
- [ ] Daily Doubles and a Final Jeopardy round
- [ ] Team play with shared buzzers
- [ ] Buzz-in timer with automatic lockout
- [ ] Reconnect handling that restores a player's identity and score

## License

[MIT](LICENSE) © Rishi Chhabra

---

<sub>This is an independent, non-commercial hobby project. *Jeopardy!* is a registered trademark of
Jeopardy Productions, Inc. This project is not affiliated with, endorsed by, or sponsored by them,
and ships no content from the show.</sub>
