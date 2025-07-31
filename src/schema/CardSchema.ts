import { Schema, type } from "@colyseus/schema";
import { Card } from "../objects/Card";

export class CardSchema extends Schema {
  @type("string") suit!: string;
  @type("number") value!: number;

  static fromCard(card: Card): CardSchema {
    const c = new CardSchema();
    c.value = card.value;
    c.suit = card.suit;
    return c;
  }
}
