# Graph Report - escova  (2026-11-26)

## Corpus Check
- Corpus is ~5,212 words - fits in a single context window. You may not need a graph.

## Summary
- 165 nodes · 302 edges · 12 communities (7 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Server and Rooms
- Player and Rules
- Game Constants
- Package Configuration
- Card and Deck Tests
- Room Game Lifecycle
- Main HTML Interface
- ESLint Configuration
- Turn Sequencing
- Playing Card Sprite Sheet
- Seven Emblem Asset
- Cleaning Brush Asset

## God Nodes (most connected - your core abstractions)
1. `Round` - 19 edges
2. `Deck` - 15 edges
3. `Card` - 13 edges
4. `Room` - 12 edges
5. `Player` - 12 edges
6. `Escova online interface` - 12 edges
7. `Game` - 10 edges
8. `RoomManager` - 8 edges
9. `PLAYER_COUNTS` - 7 edges
10. `isValidCapture()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `c()` --calls--> `Card`  [EXTRACTED]
  test/engine.test.js → shared/engine/Card.js
- `c()` --calls--> `Card`  [EXTRACTED]
  test/game.test.js → shared/engine/Card.js
- `c()` --calls--> `Card`  [EXTRACTED]
  test/scoring.test.js → shared/engine/Card.js
- `scripted()` --calls--> `Deck`  [EXTRACTED]
  test/engine.test.js → shared/engine/Deck.js
- `scripted()` --calls--> `Deck`  [EXTRACTED]
  test/game.test.js → shared/engine/Deck.js

## Import Cycles
- None detected.

## Communities (12 total, 5 thin omitted)

### Community 0 - "Server and Rooms"
Cohesion: 0.10
Nodes (11): createServer(), handler(), RoomManager, DECK_SIZE, PLAYER_COUNTS, createRoomSchema, EVENTS, joinRoomSchema (+3 more)

### Community 1 - "Player and Rules"
Cohesion: 0.16
Nodes (9): TAKE_SUM, Player, isEscova(), isValidCapture(), sumValues(), scripted(), twoPlayers(), findMove() (+1 more)

### Community 2 - "Game Constants"
Cohesion: 0.21
Nodes (14): HAND_SIZE, PRIMEIRA_VALUE, RANK_VALUE, RANKS, SETE_BELO, START_TABLE_SIZE, SUIT, SUITS (+6 more)

### Community 3 - "Package Configuration"
Cohesion: 0.15
Nodes (16): dependencies, express@^5.3.0, socket.io@^4.8.4, zod@^4.6.7, devDependencies, socket.io-client@^4.8.4, name, private (+8 more)

### Community 4 - "Card and Deck Tests"
Cohesion: 0.14
Nodes (5): Card, Deck, c(), c(), c()

### Community 6 - "Main HTML Interface"
Cohesion: 0.15
Nodes (13): Actions section, Cards pile section, Selected cards total section, Escova online interface, Game section, GameContainer script, Lobby script, Lobby section (+5 more)

### Community 7 - "ESLint Configuration"
Cohesion: 0.15
Nodes (12): env, browser, es6, node, extends, globals, Atomics, SharedArrayBuffer (+4 more)

## Knowledge Gaps
- **16 isolated node(s):** `Rooms section`, `Lobby section`, `Actions section`, `Selected cards total section`, `Game section` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 69 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Round` connect `Turn Sequencing` to `Player and Rules`, `Game Constants`, `Room Game Lifecycle`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `Rooms section`, `Lobby section`, `Actions section` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server and Rooms` be split into smaller, more focused modules?**
  _Cohesion score 0.1032258064516129 - nodes in this community are weakly interconnected._
- **Why does `Room` connect `Room Game Lifecycle` to `Server and Rooms`, `Player and Rules`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Why does `Player` connect `Player and Rules` to `Room Game Lifecycle`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Card and Deck Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._