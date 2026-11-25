import { z } from 'zod'

// Single source of truth for event names, shared by server and client
export const EVENTS = Object.freeze({
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_STATE: 'room:state',
  GAME_PLAY: 'game:play',
  ROUND_OVER: 'round:over'
})

export const createRoomSchema = z.object({
  capacity: z.union([z.literal(2), z.literal(4)])
})

export const joinRoomSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().trim().min(1).max(20)
})

export const playSchema = z.object({
  cardId: z.string().min(1),
  tableCardIds: z.array(z.string().min(1)).max(3).default([])
})
