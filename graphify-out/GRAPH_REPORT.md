# Graph Report - escova  (2026-11-25)

## Corpus Check
- Corpus is ~2,628 words - fits in a single context window. You may not need a graph.

## Summary
- 153 nodes · 196 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Project Dependencies
- Lobby UI Controls
- Card Game Domain
- Server Game Coordination
- Main HTML Interface
- ESLint Configuration
- UI Visibility Rendering
- Game Container Rendering
- Gameplay State Checks
- NPM Scripts
- Lobby Player Utilities
- Seven Emblem Asset

## God Nodes (most connected - your core abstractions)
1. `Game` - 12 edges
2. `Escova online interface` - 12 edges
3. `gameRender()` - 7 edges
4. `Deck` - 6 edges
5. `env` - 4 edges
6. `Card` - 4 edges
7. `cardContainerContains()` - 4 edges
8. `isPlaying()` - 4 edges
9. `GenerateRandomId()` - 4 edges
10. `scripts` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "Project Dependencies"
Cohesion: 0.07
Nodes (37): author, dependencies, babel-cli@^6.26.0, babel-core@^6.26.3, babel-loader@^8.1.0, babel-preset-env@^1.7.0, express@^4.17.1, path@^0.12.7 (+29 more)

### Community 1 - "Lobby UI Controls"
Cohesion: 0.07
Nodes (12): actions, lobby, lobbyForm, lobbyInput, logs, playerList, roomForm, roomList (+4 more)

### Community 2 - "Card Game Domain"
Cohesion: 0.13
Nodes (4): Card, Deck, Game, reducer()

### Community 3 - "Server Game Coordination"
Cohesion: 0.17
Nodes (10): Player, app, clientPath, gameRooms, io, playerAction(), server, updateLobby() (+2 more)

### Community 4 - "Main HTML Interface"
Cohesion: 0.15
Nodes (13): Actions section, Cards pile section, Selected cards total section, Escova online interface, Game section, GameContainer script, Lobby script, Lobby section (+5 more)

### Community 5 - "ESLint Configuration"
Cohesion: 0.15
Nodes (12): env, browser, es6, node, extends, globals, Atomics, SharedArrayBuffer (+4 more)

### Community 6 - "UI Visibility Rendering"
Cohesion: 0.29
Nodes (7): disableActions(), gameRender(), hideLobbyForm(), setTableCardsContainer(), showActions(), showBoard(), showSumCards()

### Community 7 - "Game Container Rendering"
Cohesion: 0.70
Nodes (4): _append(), _cardList(), _cardStructure(), _totalPerSuit()

### Community 8 - "Gameplay State Checks"
Cohesion: 0.83
Nodes (4): cardContainerContains(), isPlaying(), isPlayingHand(), isPlayingTable()

### Community 9 - "NPM Scripts"
Cohesion: 0.50
Nodes (4): scripts, nodemon, start, test

## Knowledge Gaps
- **13 isolated node(s):** `Rooms section`, `Lobby section`, `Actions section`, `Selected cards total section`, `Game section` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 72 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Card Game Domain` to `Server Game Coordination`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `Rooms section`, `Lobby section`, `Actions section` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07254623044096728 - nodes in this community are weakly interconnected._
- **Why does `express` connect `Project Dependencies` to `Server Game Coordination`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `Lobby UI Controls` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `path` connect `Project Dependencies` to `Server Game Coordination`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `Card Game Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._