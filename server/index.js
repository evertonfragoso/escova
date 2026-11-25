import http from 'node:http'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { Server } from 'socket.io'
import RoomManager from './RoomManager.js'
import {
  EVENTS, createRoomSchema, joinRoomSchema, playSchema
} from '../shared/protocol.js'

// Runs one handler: validates payload, calls fn, always answers the ack
function handler (schema, fn) {
  return (payload, ack) => {
    try {
      const data = schema ? schema.parse(payload) : payload
      const result = fn(data) ?? {}
      ack?.({ ok: true, ...result })
    } catch (err) {
      const error = err.name === 'ZodError' ? 'Invalid payload' : err.message
      ack?.({ ok: false, error })
    }
  }
}

export function createServer ({ rooms = new RoomManager() } = {}) {
  const app = express()
  const server = http.createServer(app)
  const io = new Server(server)

  // Each player gets their own view, so hands never leak to other sockets
  function broadcastState (room) {
    for (const player of room.players) {
      io.to(player.id).emit(EVENTS.ROOM_STATE, room.stateFor(player.id))
    }
  }

  io.on('connection', socket => {
    socket.on(EVENTS.ROOM_CREATE, handler(createRoomSchema, ({ capacity }) => {
      const room = rooms.create(capacity)
      return { roomId: room.id }
    }))

    socket.on(EVENTS.ROOM_JOIN, handler(joinRoomSchema, ({ roomId, name }) => {
      if (socket.data.roomId) throw new Error('Already in a room')
      const room = rooms.get(roomId)
      room.join(socket.id, name)
      socket.data.roomId = roomId
      socket.join(roomId)
      broadcastState(room)
      return { started: room.started }
    }))

    socket.on(EVENTS.GAME_PLAY, handler(playSchema, ({ cardId, tableCardIds }) => {
      if (!socket.data.roomId) throw new Error('Not in a room')
      const room = rooms.get(socket.data.roomId)
      const summary = room.play(socket.id, cardId, tableCardIds)
      broadcastState(room)
      if (summary) io.to(room.id).emit(EVENTS.ROUND_OVER, summary)
      return {}
    }))

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId
      if (!roomId) return
      const room = rooms.get(roomId)
      if (room.leave(socket.id) && room.players.length > 0) broadcastState(room)
    })
  })

  return { app, server, io, rooms }
}

// Start only when run directly, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000
  const { server } = createServer()
  server.listen(port, () => console.log(`listening on :${port}`))
}
