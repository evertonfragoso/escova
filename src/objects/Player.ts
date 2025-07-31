import { Card } from './Card';

export class Player {
  id: string;
  name: string;
  teamId: number;
  hand: Card[] = [];
  captured: Card[] = [];
  points: number = 0;

  constructor(id: string, name: string, teamId: number) {
    this.id = id;
    this.name = name;
    this.teamId = teamId;
  }

  playCard(index: number): Card | null {
    if (index < 0 || index >= this.hand.length) return null;
    return this.hand.splice(index, 1)[0];
  }

  captureCards(cards: Card[]) {
    this.captured.push(...cards);
  }

  resetForNextRound() {
    this.hand = [];
    this.captured = [];
  }
}
