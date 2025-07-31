import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { CardSchema } from "./CardSchema";

export class EscopaRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type([CardSchema]) table = new ArraySchema<CardSchema>();
  @type("string") currentTurn: string = "";
}
