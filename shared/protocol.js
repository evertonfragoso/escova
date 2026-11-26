import { z } from 'zod'
import { PLAYER_COUNTS, DECK_SIZE } from './constants.js'

// Single source of truth for event names, shared by server and client
export const EVENTS = Object.freeze({
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_RECONNECT: 'room:reconnect',
  ROOM_STATE: 'room:state',
  GAME_PLAY: 'game:play',
  ROUND_OVER: 'round:over'
})

export const createRoomSchema = z.object({
  capacity: z.union(PLAYER_COUNTS.map(n => z.literal(n)))
})

export const joinRoomSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().trim().min(1).max(20)
})

// token is the secret issued at join; it is never sent to other players
export const reconnectSchema = z.object({
  roomId: z.string().min(1),
  token: z.string().min(1)
})

export const playSchema = z.object({
  cardId: z.string().min(1),
  tableCardIds: z.array(z.string().min(1)).max(DECK_SIZE).default([])
})
