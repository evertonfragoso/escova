import { randomUUID } from 'node:crypto'
import Game from '../shared/engine/Game.js'
import Player from '../shared/engine/Player.js'
import { PLAYER_COUNTS } from '../shared/constants.js'

export default class Room {
  constructor (id, capacity, { rng = Math.random } = {}) {
    if (!PLAYER_COUNTS.includes(capacity)) throw new Error(`Room capacity must be ${PLAYER_COUNTS.join(' or ')}`)
    this.id = id
    this.capacity = capacity
    this.rng = rng
    this.players = []
    this.game = null
    this.nextSeat = 1
    this.tokens = new Map() // secret token -> seat id
    this.sockets = new Map() // seat id -> live socket id (absent = disconnected)
  }

  get isFull () {
    return this.players.length === this.capacity
  }

  get started () {
    return this.game !== null
  }

  get connectedCount () {
    return this.sockets.size
  }

  // Seats are numbered in join order: p1 is seat 1, and seats alternate teams
  join (name, socketId) {
    if (this.started) throw new Error('Game already started')
    if (this.isFull) throw new Error('Room is full')

    const seatId = `p${this.nextSeat++}`
    const token = randomUUID()
    this.players.push(new Player(seatId, name))
    this.tokens.set(token, seatId)
    this.sockets.set(seatId, socketId)

    // Rule: a full room starts immediately, no manual start by the creator
    if (this.isFull) this._start()
    return { seatId, token }
  }

  // Rebinds a seat to a new socket. Any older socket on that seat is replaced.
  reconnect (token, socketId) {
    const seatId = this.tokens.get(token)
    if (!seatId) throw new Error('Unknown player token')
    this.sockets.set(seatId, socketId)
    return seatId
  }

  // Returns the seat whose socket dropped, or null if the socket was stale
  detach (socketId) {
    for (const [seatId, sid] of this.sockets) {
      if (sid === socketId) {
        this.sockets.delete(seatId)
        return seatId
      }
    }
    return null
  }

  socketIdOf (seatId) {
    return this.sockets.get(seatId)
  }

  // Lobby only: a player who leaves frees the seat and their token
  removeFromLobby (seatId) {
    this.players = this.players.filter(p => p.id !== seatId)
    for (const [token, seat] of this.tokens) {
      if (seat === seatId) this.tokens.delete(token)
    }
  }

  _start () {
    this.game = new Game(this.players, { rng: this.rng })
    this.game.startRound()
  }

  play (seatId, cardId, tableCardIds = []) {
    if (!this.started) throw new Error('Game has not started')
    // Current behavior: if the seat on turn is disconnected, the game waits for it to return.
    // TODO: add a timeout or a vote to skip a seat that never comes back.
    const summary = this.game.play(seatId, cardId, tableCardIds)
    // Next round starts right after a round ends, unless the game is over
    if (summary && !this.game.isOver) this.game.startRound()
    return summary
  }

  // Everything one seat is allowed to see
  stateFor (seatId) {
    const base = {
      roomId: this.id,
      capacity: this.capacity,
      started: this.started,
      you: seatId,
      players: this.players.map(p => ({
        ...p.toPublicJSON(),
        connected: this.sockets.has(p.id)
      }))
    }
    if (!this.started) return base

    return {
      ...base,
      scores: this.game.scores,
      winner: this.game.winner,
      round: this.game.round.viewFor(seatId)
    }
  }
}
