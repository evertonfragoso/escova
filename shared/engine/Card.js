import { SUITS, RANKS, RANK_VALUE, SETE_BELO } from '../constants.js'

export default class Card {
  constructor (rank, suit) {
    if (!SUITS.includes(suit)) throw new Error(`Invalid suit: ${suit}`)
    if (!RANKS.includes(String(rank))) throw new Error(`Invalid rank: ${rank}`)

    this.id = `${rank}-${suit}`
    this.rank = String(rank)
    this.suit = suit
    this.value = RANK_VALUE[this.rank]
  }

  isSeteBelo () {
    return this.rank === SETE_BELO.rank && this.suit === SETE_BELO.suit
  }

  equals (other) {
    return other instanceof Card && other.id === this.id
  }

  toJSON () {
    return { id: this.id, rank: this.rank, suit: this.suit, value: this.value }
  }
}
