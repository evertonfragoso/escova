import { Room, Client } from 'colyseus';
import { ArraySchema } from '@colyseus/schema';
import { Game } from "../objects/Game";
import { Player } from "../objects/Player";
import { Card, Value, Suit } from '../objects/Card';
import { CardSchema } from '../schema/CardSchema';
import { PlayerState } from "../schema/PlayerState";
import { EscopaRoomState } from '../schema/EscopaRoomState';

export class EscopaRoom extends Room<EscopaRoomState> {
  maxClients = 6;

  private game?: Game;

  onCreate() {
    this.state = new EscopaRoomState();
    console.log(`[room ${this.roomId}] created`);

    // Register the message handler here
    this.onMessage("play_card", this.handlePlayCard.bind(this));
  }

  onJoin(client: Client, options: Partial<{ name: string }>) {
    const playerCounts = { 0: 0, 1: 0 };

    // Count current players per team
    for (const player of this.state.players.values()) {
      // playerCounts[player.teamId]++; <-- this does not work for some reason
      if (player.teamId === 0) playerCounts[0]++;
      else if (player.teamId === 1) playerCounts[1]++;
    }

    const totalPlayers = playerCounts[0] + playerCounts[1];

    if (totalPlayers >= this.maxClients) {
      console.warn(`[room ${this.roomId}] full`);
      client.leave(4000, "Room full");
      return;
    }

    // Assign to team with fewer players
    let teamId: 0 | 1 = playerCounts[0] <= playerCounts[1] ? 0 : 1;

    // If selected team is full (3 players), assign to other
    if (playerCounts[teamId] >= 3) {
      teamId = teamId === 0 ? 1 : 0;
    }

    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Player-${client.sessionId.slice(0, 4)}`;
    player.teamId = teamId;

    this.state.players.set(client.sessionId, player);

    this.broadcast("system", {
      message: `${player.name} joined Team ${teamId}`
    });

    // Build team composition message
    const teamSummary = { 0: [] as string[], 1: [] as string[] };
    for (const player of this.state.players.values()) {
      // teamSummary[player.teamId].push(player.name); <-- this does not work for some reason
      if (player.teamId === 0) teamSummary[0].push(player.name);
      else if (player.teamId === 1) teamSummary[player.teamId].push(player.name);
    }

    const team0 = teamSummary[0].join(", ") || "empty"
    const team1 = teamSummary[1].join(", ") || "empty"

    this.broadcast("system", { 
      message: `Teams:\nTeam 0: ${team0}\nTeam 1: ${team1}`
    });

    // Check if both teams are full (1–3 each) and balanced
    const bothTeamsReady =
      playerCounts[0] + 1 === playerCounts[1] || // current join to team 0 balances
      playerCounts[1] + 1 === playerCounts[0];   // current join to team 1 balances

    if (this.state.players.size % 2 === 0 && this.state.players.size <= 6) {
      this.startGame();
    }

    if (
      (playerCounts[0] + playerCounts[1] + 1) >= 2 &&
        playerCounts[0] < 3 &&
        playerCounts[1] < 3 &&
        bothTeamsReady
    ) {
      this.broadcast("system", { message: "✅ Game starting!" });
      this.startGame();
    } else {
      this.broadcast("system", { message: "⌛ Waiting for balanced teams..." });
    }
  }

  startGame() {
    const statePlayers = this.state.players;

    // Prepare Game
    const players = [...statePlayers.values()].map(
      p => new Player(p.id, p.name, p.teamId)
    );

    this.game = new Game(players);

    this.game.startRound();

    // Sync hands
    statePlayers.forEach((playerState, sessionId) => {
      // if (!this.game) return;
      const hand = this.game!.hands.get(sessionId) || [];
      playerState.hand = new ArraySchema<CardSchema>(
        ...hand.map(c => Object.assign(new CardSchema(), c))
      );
    });

    // Sync table
    this.state.table = new ArraySchema<CardSchema>(
      ...this.game.table.map(c => Object.assign(new CardSchema(), c))
    );

    this.broadcast("system", { message: "🃏 Cards dealt. Round started!" });

    const [firstSessionId] = statePlayers.keys();
    this.state.currentTurn = firstSessionId;

    // Debug
    console.log("=== STATE SYNC CHECK ===");
    console.log("🃏 Table:", this.state.table.map(c => `${c.value} of ${c.suit}`));

    for (const [, playerState] of statePlayers.entries()) {
      const handString = playerState.hand.map(c => `${c.value} of ${c.suit}`).join(", ");
      console.log(`🙋 Player ${playerState.name} [Team ${playerState.teamId}]: ${handString}`);
    }
    console.log("=== END STATE ===");
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`[room ${this.roomId}] ${client.sessionId} left`);
  }

  onDispose() {
    console.log(`[room ${this.roomId}] disposed`);
  }

  private handlePlayCard(client: Client, data: { value: Value; suit: Suit }) {
    if (client.sessionId !== this.state.currentTurn) {
      console.warn(`Player ${client.sessionId} tried to play out of turn.`);
      return;
    }

     const playerState = this.state.players.get(client.sessionId);
    if (!playerState || !this.game) return;

    const card = new Card(data.suit, data.value); // assuming Card class
    const player = this.game.players.find(p => p.id === client.sessionId);
    if (!player) return;

    const result = this.game.playCard(player, card);

    console.log(`${client.sessionId} played: ${card.toString()}`);

    // Sync hand
    playerState.hand = new ArraySchema<CardSchema>(
      ...player.hand.map(c => CardSchema.fromCard(c))
    );

    // Sync captured cards
    playerState.captured = new ArraySchema<CardSchema>(
      ...player.captured.map(c => CardSchema.fromCard(c))
    );

    // Sync points
    playerState.points = player.points;

    // Sync table
    this.state.table = new ArraySchema<CardSchema>(
      ...this.game.table.map(c => CardSchema.fromCard(c))
    );

    // Optional log
    console.log(`${player.name} played ${card.value} of ${card.suit}`);
    if (result.captured.length > 0) {
      console.log(`Captured ${result.captured.length} cards`);
      if (result.isScopa) console.log("💥 SCOPA!");
    }

    this.advanceTurn();
  }

  private advanceTurn() {
    const sessionIds = Array.from(this.state.players.keys());
    const currentIndex = sessionIds.indexOf(this.state.currentTurn);
    const nextIndex = (currentIndex + 1) % sessionIds.length;
    this.state.currentTurn = sessionIds[nextIndex];
    console.log(`Turn advanced to: ${this.state.currentTurn}`);
  }
}
