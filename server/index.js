import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { Server } from 'socket.io'
import RoomManager from './RoomManager.js'
import {
  EVENTS, createRoomSchema, joinRoomSchema, reconnectSchema, playSchema
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
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  app.use(express.static(path.join(root, 'client')))
  app.use('/shared', express.static(path.join(root, 'shared')))
  const server = http.createServer(app)
  const io = new Server(server)

  // Each connected seat gets its own view, so hands never leak to other sockets
  function broadcastState (room) {
    for (const player of room.players) {
      const socketId = room.socketIdOf(player.id)
      if (socketId) io.to(socketId).emit(EVENTS.ROOM_STATE, room.stateFor(player.id))
    }
  }

  // The socket's seat in its room, or an error if it has none
  function session (socket) {
    if (!socket.data.roomId) throw new Error('Not in a room')
    return { room: rooms.get(socket.data.roomId), seatId: socket.data.seatId }
  }

  function bindSocket (socket, room, seatId) {
    socket.data.roomId = room.id
    socket.data.seatId = seatId
    socket.join(room.id)
    rooms.refresh(room)
    broadcastState(room)
  }

  io.on('connection', socket => {
    socket.on(EVENTS.ROOM_CREATE, handler(createRoomSchema, ({ capacity }) => {
      const room = rooms.create(capacity)
      return { roomId: room.id }
    }))

    socket.on(EVENTS.ROOM_JOIN, handler(joinRoomSchema, ({ roomId, name }) => {
      if (socket.data.roomId) throw new Error('Already in a room')
      const room = rooms.get(roomId)
      const { seatId, token } = room.join(name, socket.id)
      bindSocket(socket, room, seatId)
      return { playerId: token, seatId, started: room.started }
    }))

    socket.on(EVENTS.ROOM_RECONNECT, handler(reconnectSchema, ({ roomId, token }) => {
      if (socket.data.roomId) throw new Error('Already in a room')
      const room = rooms.get(roomId)
      const seatId = room.reconnect(token, socket.id)
      bindSocket(socket, room, seatId)
      return { seatId, started: room.started }
    }))

    socket.on(EVENTS.GAME_PLAY, handler(playSchema, ({ cardId, tableCardIds }) => {
      const { room, seatId } = session(socket)
      const summary = room.play(seatId, cardId, tableCardIds)
      broadcastState(room)
      if (summary) io.to(room.id).emit(EVENTS.ROUND_OVER, summary)
      return {}
    }))

    socket.on('disconnect', () => {
      if (!socket.data.roomId) return
      const room = rooms.rooms.get(socket.data.roomId)
      if (!room) return
      const seatId = room.detach(socket.id)
      if (!seatId) return // stale socket: the seat already reconnected elsewhere

      // Lobby: the seat is freed. Started game: the seat is kept for reconnect.
      if (!room.started) room.removeFromLobby(seatId)
      broadcastState(room)
      rooms.refresh(room)
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
