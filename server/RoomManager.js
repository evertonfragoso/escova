import { randomUUID } from 'node:crypto'
import Room from './Room.js'
import { config } from './config.js'

export default class RoomManager {
  constructor ({ rng = Math.random, newId = () => randomUUID().slice(0, 8), graceMs = config.roomGraceMs } = {}) {
    this.rng = rng
    this.newId = newId
    this.graceMs = graceMs
    this.rooms = new Map()
    this.timers = new Map()
  }

  create (capacity) {
    const room = new Room(this.newId(), capacity, { rng: this.rng })
    this.rooms.set(room.id, room)
    return room
  }

  get (roomId) {
    const room = this.rooms.get(roomId)
    if (!room) throw new Error('Room not found')
    return room
  }

  remove (roomId) {
    clearTimeout(this.timers.get(roomId))
    this.timers.delete(roomId)
    this.rooms.delete(roomId)
  }

  // Call after every connect or disconnect in a room
  refresh (room) {
    if (!this.rooms.has(room.id)) return

    if (room.connectedCount > 0) {
      clearTimeout(this.timers.get(room.id))
      this.timers.delete(room.id)
      return
    }

    // Empty lobby: nobody can come back to it, remove now
    if (!room.started) {
      if (room.players.length === 0) this.remove(room.id)
      return
    }

    // Started game with nobody connected: remove after the grace period unless someone reconnects
    if (this.timers.has(room.id)) return
    const timer = setTimeout(() => this.remove(room.id), this.graceMs)
    timer.unref()
    this.timers.set(room.id, timer)
  }
}
