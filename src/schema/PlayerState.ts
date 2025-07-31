import { Schema, type, ArraySchema } from "@colyseus/schema";
import { CardSchema } from "./CardSchema";

export class PlayerState extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("number") teamId!: number;
  @type("number") points: number = 0;
  @type([CardSchema]) hand = new ArraySchema<CardSchema>();
  @type([CardSchema]) captured = new ArraySchema<CardSchema>();
}
