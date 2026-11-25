import { randomUUID } from 'node:crypto'
import Room from './Room.js'

export default class RoomManager {
  constructor ({ rng = Math.random, newId = () => randomUUID().slice(0, 8) } = {}) {
    this.rng = rng
    this.newId = newId
    this.rooms = new Map()
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
    this.rooms.delete(roomId)
  }
}
