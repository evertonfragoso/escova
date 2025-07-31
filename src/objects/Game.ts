import { Card } from './Card';
import { Deck } from './Deck';
import { Player } from './Player';
import { getAllCombinations } from '../utils';

export class Game {
  deck: Deck;
  players: Player[];
  table: Card[] = [];
  hands: Map<string, Card[]>;

  constructor(players: Player[]) {
    this.players = players;
    this.deck = new Deck();
    this.hands = new Map();
    this.deck.shuffle();
  }

  startRound() {
    // Deal 3 cards to each player
    for (const player of this.players) {
      this.hands.set(player.id, this.deck.deal(3));
    }

    // Deal 4 cards to the table if not already dealt
    if (this.table.length === 0) {
      this.table = this.deck.deal(4);
    }

    // logging for visibility
    // console.log("Table:", this.table.map(c => c.toString()));
    // this.players.forEach(p => {
    //   console.log(`${p.name}'s hand:`, p.hand.map(c => c.toString()));
    // });
  }

  nextPlayerTurn(): Player {
    // placeholder turn logic
    return this.players[0];
  }

  playCard(player: Player, playedCard: Card): { captured: Card[], isScopa: boolean } {
    // Remove from hand
    const handIndex = player.hand.findIndex(c => c.suit === playedCard.suit && c.value === playedCard.value);
    if (handIndex === -1) throw new Error("Card not in hand");
    player.hand.splice(handIndex, 1);

    const playedValue = playedCard.value;

    // Find matching combinations from table
    const tableCombos = getAllCombinations(this.table);
    const validCapture = tableCombos.find(combo =>
      combo.reduce((sum, c) => sum + c.value, 0) === playedValue
    );

    if (validCapture) {
      // Capture cards
      player.captured.push(...validCapture, playedCard);
      this.table = this.table.filter(c => !validCapture.includes(c));

      const isScopa = this.table.length === 0;
      if (isScopa) player.points += 1;

      return { captured: validCapture, isScopa };
    }

    // No capture — place card on table
    this.table.push(playedCard);
    return { captured: [], isScopa: false };
  }
}
