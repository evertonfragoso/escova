export type Suit = 'cups' | 'coins' | 'swords' | 'clubs'; // Italian suits
export type Value = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export class Card {
  constructor(
    public suit: Suit,
    public value: Value
  ) {}

  toString(): string {
    return `${this.value} of ${this.suit}`;
  }
}
