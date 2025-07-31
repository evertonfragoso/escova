import { Card, Suit, Value } from './Card';

export class Deck {
  cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    const suits: Suit[] = ['cups', 'coins', 'swords', 'clubs'];
    const values: Value[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

    this.cards = [];

    for (const suit of suits) {
      for (const value of values) {
        this.cards.push(new Card(suit, value));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count: number): Card[] {
    return this.cards.splice(0, count);
  }

  get length() {
    return this.cards.length;
  }
}
