import Game from '../shared/engine/Game.js'
import Player from '../shared/engine/Player.js'

export const ROOM_CAPACITIES = Object.freeze([2, 4])

export default class Room {
  constructor (id, capacity, { rng = Math.random } = {}) {
    if (!ROOM_CAPACITIES.includes(capacity)) throw new Error('Room capacity must be 2 or 4')
    this.id = id
    this.capacity = capacity
    this.rng = rng
    this.players = []
    this.game = null
  }

  get isFull () {
    return this.players.length === this.capacity
  }

  get started () {
    return this.game !== null
  }

  join (playerId, name) {
    if (this.started) throw new Error('Game already started')
    if (this.isFull) throw new Error('Room is full')
    if (this.players.some(p => p.id === playerId)) throw new Error('Already joined')

    const player = new Player(playerId, name)
    this.players.push(player)

    // Rule: a full room starts immediately, no manual start by the creator
    if (this.isFull) this._start()
    return player
  }

  leave (playerId) {
    // TODO: Mid-game disconnects; only lobby leaves are handled here at the moment
    if (this.started) return false
    this.players = this.players.filter(p => p.id !== playerId)
    return true
  }

  _start () {
    this.game = new Game(this.players, { rng: this.rng })
    this.game.startRound()
  }

  play (playerId, cardId, tableCardIds = []) {
    if (!this.started) throw new Error('Game has not started')
    const summary = this.game.play(playerId, cardId, tableCardIds)
    // Next round starts right after a round ends, unless the game is over
    if (summary && !this.game.isOver) this.game.startRound()
    return summary
  }

  // Everything one player is allowed to see
  stateFor (playerId) {
    const base = {
      roomId: this.id,
      capacity: this.capacity,
      started: this.started,
      players: this.players.map(p => p.toPublicJSON())
    }
    if (!this.started) return base

    return {
      ...base,
      scores: this.game.scores,
      winner: this.game.winner,
      round: this.game.round.viewFor(playerId)
    }
  }
}
