export const SUITS = Object.freeze(['clubs', 'diamonds', 'hearts', 'spades'])

// Escopa values: A=1, 2..7 face value, Q=8, J=9, K=10 (no 8, 9, 10 in this deck)
const RANK_VALUE = Object.freeze({ A: 1, Q: 8, J: 9, K: 10 })

export default class Card {
  constructor (rank, suit) {
    if (!SUITS.includes(suit)) throw new Error(`Invalid suit: ${suit}`)
    if (!(rank in RANK_VALUE) && !(Number(rank) >= 2 && Number(rank) <= 7)) {
      throw new Error(`Invalid rank: ${rank}`)
    }

    this.id = `${rank}-${suit}`
    this.rank = String(rank)
    this.suit = suit
    this.value = RANK_VALUE[rank] ?? Number(rank)
  }

  isSeteBelo () {
    return this.suit === 'diamonds' && this.value === 7
  }

  equals (other) {
    return other instanceof Card && other.id === this.id
  }

  toJSON () {
    return { id: this.id, rank: this.rank, suit: this.suit, value: this.value }
  }
}
