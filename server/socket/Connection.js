import { Server, IncomingMessage, ServerResponse } from 'node:http'
import { Server as SocketIO } from 'socket.io'

export default class Connection {
    /**
     * @param {Server<typeof IncomingMessage, typeof ServerResponse>} server
     */
    constructor(server) {
        this.io = new SocketIO(server, {
            connectionStateRecovery: {}
        })
    }

    /**
     * @param {import('socket.io').Socket<import('socket.io').DefaultEventsMap, any>} socket
     * @param {string} event
     * @param {string|object} message
     */
    async sendSocketMessage(socket, event, message = '') {
        socket.emit(event, message)
    }

    /**
     * @param {string} roomId
     * @param {string} event
     * @param {string|object} message
     */
    async sendMessage(roomId, event, message = '') {
        this.io.to(roomId).emit(event, message)
    }

    /**
     * @param {string} event
     * @param {string|object} message
     */
    async broadcastMessage(event, message = '') {
        this.io.sockets.emit(event, message)
    }

    async getRooms() {
        return this.io.sockets.adapter.rooms
    }
}
