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
    this.rematchVotes = new Map() // seat id -> wants to swap partners, once the game is over
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

  // Removes a seat and its token. Used for lobby leaves and for leaving a finished game.
  removePlayer (seatId) {
    this.players = this.players.filter(p => p.id !== seatId)
    for (const [token, seat] of this.tokens) {
      if (seat === seatId) this.tokens.delete(token)
    }
    this.sockets.delete(seatId)
  }

  // After the game is over, a player can go home. The room goes back to the lobby.
  leaveFinished (seatId) {
    if (!this.game?.isOver) throw new Error('Can only leave a finished game')
    this.removePlayer(seatId)
    this.game = null
    this.rematchVotes = new Map()
  }

  // Each seat votes to play again. When every seat has voted, the game restarts.
  // Partners swap only when all seats vote to swap, and only in a 4-player room.
  requestRematch (seatId, swapPartners) {
    if (!this.game?.isOver) throw new Error('Game is not over')
    if (!this.players.some(p => p.id === seatId)) throw new Error('Not seated in this room')

    this.rematchVotes.set(seatId, swapPartners)
    const everyoneVoted = this.players.length === this.capacity &&
      this.players.every(p => this.rematchVotes.has(p.id))
    if (everyoneVoted) {
      const swap = this.capacity === 4 && [...this.rematchVotes.values()].every(Boolean)
      this._restart(swap)
    }
  }

  // Seat order decides teams (1 and 3 vs 2 and 4). Swapping [1,2,3,4] to [1,3,2,4]
  // puts 1 and 2 together, so everyone gets a new partner.
  _restart (swap) {
    if (swap) {
      const [a, b, c, d] = this.players
      this.players = [a, c, b, d]
    }
    this.rematchVotes = new Map()
    this._start()
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
      history: this.game.history,
      rematch: { votes: Object.fromEntries(this.rematchVotes), capacity: this.capacity },
      round: this.game.round.viewFor(seatId)
    }
  }
}
