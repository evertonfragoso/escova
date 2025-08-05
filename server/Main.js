import Connection from '#server/socket/Connection.js'
import GameRooms from '#server/GameRooms.js'
import Party from '#game/Party.js'
import Player from '#game/Player.js'
import { Events } from '#lib/events.js'
import { Suits } from '#lib/utils.js'

// TODO: put language somewhere that makes more sense
const LANGUAGE = 'en'

export default class Main {
    constructor(httpServer, language = LANGUAGE) {
        this.conn = new Connection(httpServer)
        this.gameRooms = new GameRooms()
        this.parties = this.createParties()

        this.addedUser = false

        this.language = language
    }

    start() {
        this.conn.io.on('connection', (socket) => {
            console.info(`Client connected [id=${socket.id}]`)

            // TODO: try to put all outsite this 'connection' block
            //      and use this `this.gameRooms.socket` as the socket handler
            this.gameRooms.socket = socket

            // start by listing existing rooms
            this.updateRooms()

            // update list of rooms when requested
            socket.on(Events.room.get, () => this.updateRooms())

            // create room
            socket.on(Events.room.create, (numberOfPlayers) => {
                const room = this.gameRooms.create(numberOfPlayers)
                this.logMessage(room.roomId, `Room created (${numberOfPlayers} players)`)
                this.updateRooms()
            })

            // join room
            socket.on(Events.room.join, (roomId) => {
                this.gameRooms.join(roomId)
                this.updateLobby(roomId, this.gameRooms.rooms[roomId].players, 0)
                this.logMessage(roomId, `A player joined room`)
            })

            // add player to the room and assign them to a party
            // @param data: Object.keys(playerName, roomId)
            socket.on(Events.player.add, async (data) => {
                if (this.addedUser) return
                this.addedUser = true

                const room = this.gameRooms.rooms[data['roomId']]
                const newPlayer = new Player(data['playerName'])
                const partyId = (room.players.length % 2 === 0) ? 'A' : 'B'

                newPlayer.partyId = partyId
                this.parties[partyId].players[newPlayer.playerId] = newPlayer

                room.players.push(newPlayer)

                await this.conn.sendSocketMessage(socket, Events.player.set.id, newPlayer.playerId)

                if (room.players.length === room.maxPlayers) {
                    // room.startGame()
                    // await this.conn.sendSocketMessage(socket, Events.game.prepare)
                    await this.conn.sendMessage(room.roomId, Events.game.prepare)
                }

                this.updateLobby(room.roomId, room.players)
            })
        })
    }

    updateRooms() {
        this.gameRooms.rooms = this.conn.getRooms()
        this.conn.broadcastMessage(Events.room.update, this.gameRooms.rooms)
    }

    createParties() {
        // let parties = {}
        // for (let x in ['A', 'B']) { parties[x] = new Party(x) }
        // return parties
        return ['A', 'B'].reduce((p, x) => (p[x] = new Party(x), p), {})
    }

    async updateLobby(roomId, players, playingPlayerId = 0) {
        const data = { players: players, playingPlayerId: playingPlayerId }
        // await this.conn.sendSocketMessage(socket, Events.lobby.update, data)
        await this.conn.sendMessage(roomId, Events.lobby.update, data)
    }

    async logMessage(roomId, message, cards = null) {
        if (cards) {
            if (Array.isArray(cards)) {
                let c = []
                cards.forEach(card => {
                    c.push(`${card.displayValue} of ${Suits[this.language][card.suit]}`)
                })
                message += c.join(', ')
            } else if (Object.prototype.toString.call(cards) === '[object Object]') {
                message += `${cards.displayValue} of ${Suits[this.language][cards.suit]}`
            }
        }

        console.log('roomId:', roomId)
        if (message) console.log('message:', message)
        if (cards) console.log('cards:', cards)
        await this.conn.sendMessage(roomId, 'log', message)
    }
}
