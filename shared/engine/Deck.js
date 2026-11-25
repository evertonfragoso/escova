import Card from './Card.js'
import { SUITS, RANKS } from '../constants.js'

export default class Deck {
  // rng is injectable so tests can pass a seeded generator
  constructor (cards = null, rng = Math.random) {
    this.rng = rng
    this.cards = cards ?? Deck.fullCards()
  }

  static fullCards () {
    const cards = []
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push(new Card(rank, suit))
    }
    return cards
  }

  get size () {
    return this.cards.length
  }

  shuffle () {
    // Fisher-Yates: uniform, unlike the swap-random loop in the old Deck.js
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
    return this
  }

  draw (count = 1) {
    if (count > this.cards.length) {
      throw new Error(`Cannot draw ${count}, only ${this.cards.length} left`)
    }
    return this.cards.splice(0, count)
  }
}
