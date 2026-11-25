import Deck from './Deck.js'
import { isValidCapture, isEscova, TAKE_SUM } from './rules.js'

export const HAND_SIZE = 3
export const START_TABLE_SIZE = 4

export default class Round {
  // players: array of Player, already ordered by seat
  // deck: optional Deck, defaults to a fresh shuffled deck
  constructor (players, { deck = null, startingIndex = 0, handSize = HAND_SIZE, startTableSize = START_TABLE_SIZE } = {}) {
    if (players.length < 2) throw new Error('A round needs at least 2 players')

    this.players = players
    this.deck = deck ?? new Deck().shuffle()
    this.handSize = handSize
    this.table = []
    this.turnIndex = startingIndex
    this.lastCapturer = null
    this.log = []

    this._dealInitial(startTableSize)
  }

  get currentPlayer () {
    return this.players[this.turnIndex]
  }

  get isOver () {
    return this.deck.size === 0 && this.players.every(p => p.hand.length === 0)
  }

  _dealInitial (startTableSize) {
    this.table.push(...this.deck.draw(startTableSize))
    this._dealHands()
  }

  _dealHands () {
    // Deal only when every hand is empty and cards remain
    if (!this.players.every(p => p.hand.length === 0)) return
    if (this.deck.size === 0) return
    for (const player of this.players) {
      player.hand.push(...this.deck.draw(Math.min(this.handSize, this.deck.size)))
    }
  }

  _assertTurn (playerId) {
    if (this.currentPlayer.id !== playerId) throw new Error(`Not ${playerId}'s turn`)
  }

  _advanceTurn () {
    this.turnIndex = (this.turnIndex + 1) % this.players.length
    if (this.players.every(p => p.hand.length === 0)) this._dealHands()
  }

  // Play a card from hand. tableCardIds is the set of table cards the player
  // wants to capture (empty = discard).
  play (playerId, cardId, tableCardIds = []) {
    this._assertTurn(playerId)

    const player = this.currentPlayer
    const playedCard = player.hand.find(c => c.id === cardId)

    if (!playedCard) throw new Error(`Card ${cardId} not in hand`)

    if (tableCardIds.length === 0) this._discard(player, cardId)
    else this._capture(player, cardId, tableCardIds)

    this._advanceTurn()
    return this
  }

  _discard (player, cardId) {
    const card = player.removeFromHand(cardId)
    this.table.push(card)
    this.log.push({ type: 'discard', playerId: player.id, card: card.id })
  }

  _capture (player, cardId, tableCardIds) {
    const tableCards = tableCardIds.map(id => {
      const card = this.table.find(c => c.id === id)
      if (!card) throw new Error(`Table card ${id} not found`)
      return card
    })

    if (new Set(tableCardIds).size !== tableCardIds.length) throw new Error('Duplicate table card ids')

    const playedCard = player.hand.find(c => c.id === cardId)
    if (!isValidCapture(playedCard, tableCards)) throw new Error(`Invalid capture: values must sum to ${TAKE_SUM}`)

    const tableBefore = [...this.table]
    player.removeFromHand(cardId)
    this.table = this.table.filter(c => !tableCardIds.includes(c.id))

    const captured = [playedCard, ...tableCards]
    player.captured.push(...captured)
    this.lastCapturer = player.id

    const escova = isEscova(tableBefore, tableCards)
    if (escova) player.escovas++

    this.log.push({ type: 'capture', playerId: player.id, captured: captured.map(c => c.id), escova })
  }

  // Remaining table cards go to the last capturer when the round ends (scoring uses this)
  finish () {
    if (!this.isOver) throw new Error('Round is not over')
    if (this.table.length > 0 && this.lastCapturer) {
      const winner = this.players.find(p => p.id === this.lastCapturer)
      winner.captured.push(...this.table)
      this.table = []
    }
    return this
  }

  // Public view for one player: their own hand, everyone else's hand sizes only.
  viewFor (playerId) {
    return {
      table: this.table.map(c => c.toJSON()),
      deckSize: this.deck.size,
      currentPlayerId: this.currentPlayer.id,
      isOver: this.isOver,
      players: this.players.map(p => {
        const base = p.toPublicJSON()
        if (p.id === playerId) base.hand = p.hand.map(c => c.toJSON())
        return base
      })
    }
  }
}
