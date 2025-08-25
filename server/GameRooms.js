import Room from '#server/Room.js'
import { Events } from '#lib/events.js'

export default class GameRooms {
    constructor() {
        this.socket = undefined
        this.rooms = {}
    }

    /**
     * @param {number} numberOfPlayers
     */
    create(numberOfPlayers) {
        const room = new Room(numberOfPlayers)
        this.rooms[room.roomId] = room

        this.socket.room = room
        this.socket.join(room.roomId)

        return room
    }

    /**
     * @param {string | number} roomId
     */
    join(roomId) {
        const room = this.rooms[roomId]

        if (room.maxPlayers === room.length) {
            this.socket.emit(Events.room.full)
            return
        }

        this.socket.room = room
        this.socket.join(roomId)
        this.socket.emit(Events.lobby.join, roomId)
    }
}
