import Connection from '#server/socket/Connection.js'
import GameRooms from '#server/GameRooms.js'
import Party from '#game/Party.js'
import Player from '#game/Player.js'
import { Events } from '#lib/events.js'
import Locales from '#server/Locales.js'

// docu imports
import { Server, IncomingMessage, ServerResponse } from 'node:http'

export default class Main {
    /**
     * 
     * @param {Server<typeof IncomingMessage, typeof ServerResponse>} httpServer
     */
    constructor(httpServer) {
        this.conn = new Connection(httpServer)
        this.gameRooms = new GameRooms()
        this.parties = this.createParties()

        this.addedUser = false

        this.locale = new Locales()
    }

    start() {
        this.conn.io.on('connection', (socket) => {
            console.info(`Client connected [id=${socket.id}]`)

            // TODO: try to put all outsite this 'connection' block
            //       and use `this.gameRooms.socket` as the socket handler
            this.gameRooms.socket = socket

            socket.onAny((event) => {
                console.log('log:', event)
                console.log('socket:', socket.adapter)
            })

            // update list of rooms when requested
            socket.on(Events.room.get, async () => this.updateRooms())

            // create room
            socket.on(Events.room.create, async (numberOfPlayers) => {
                const room = this.gameRooms.create(numberOfPlayers)
                this.logMessage(room.roomId, this.locale.translate('room.created', {numberOfPlayers: numberOfPlayers}))
                this.updateRooms()
            })

            // join room
            socket.on(Events.room.join, async (roomId) => {
                this.gameRooms.join(roomId)
                this.updateLobby(roomId, this.gameRooms.rooms[roomId].players, 0)
                this.logMessage(roomId, this.locale.translate('player.joined'))
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
                    await this.conn.sendSocketMessage(socket, Events.game.prepare)
                    // await this.conn.sendMessage(room.roomId, Events.game.prepare)
                }

                this.updateLobby(room.roomId, room.players)
            })

            // Start the game
            socket.on(Events.game.start, () => {
                console.log(socket.roomName)
                // const game = this.gameRooms[socket.roomName]

                // if (game.started) return

                // game.started = true

                // logMessage('Partida iniciada')

                // const startData = {
                //     table: game.table,
                //     deck: game.deck,
                //     playingPlayer: game.playingPlayer,
                //     player: socket.player
                // }
                // socket.emit('game:start', startData)
                // socket.broadcast.to(socket.roomName).emit('game:render', game)

                // this.updateLobby(socket.roomName, game.players, game.playingPlayer)
            })
        })
    }

    async updateRooms() {
        this.gameRooms.rooms = await this.conn.getRooms()
        await this.conn.broadcastMessage(Events.room.update, this.gameRooms.rooms)
    }

    createParties() {
        // let parties = {}
        // for (let x in ['A', 'B']) { parties[x] = new Party(x) }
        // return parties
        return ['A', 'B'].reduce((p, x) => (p[x] = new Party(x), p), {})
    }

    /**
     * @param {string} roomId
     * @param {Array<typeof Player>} players
     */
    async updateLobby(roomId, players, playingPlayerId = 0) {
        const data = { players: players, playingPlayerId: playingPlayerId }
        // await this.conn.sendSocketMessage(socket, Events.lobby.update, data)
        await this.conn.sendMessage(roomId, Events.lobby.update, data)
    }

    /**
     * @param {string} roomId
     * @param {string} message
     * @param {Array | Object} cards
     */
    async logMessage(roomId, message, cards = null) {
        if (cards) {
            if (Array.isArray(cards)) {
                let c = []
                cards.forEach(card => {
                    let suit = this.locale.translate(`suits.${card.suit}`)
                    c.push(`${card.displayValue} ${this.locale.translate('of')} ${suit}`)
                })
                message += c.join(', ')
            } else if (typeof cards === 'object') {
                let suit = this.locale.translate(`suits.${cards.suit}`)
                message += `${cards.displayValue} ${this.locale.translate('of')} ${suit}`
            }
        }

        if (message) console.log('message:', message)
        if (cards) console.log('cards:', cards)
        this.conn.sendMessage(roomId, 'log', message)
    }
}
