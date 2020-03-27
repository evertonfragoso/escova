import Deck from './Deck.js'

export default class Game {
  constructor (handSize, startTableSize) {
    this.deck
    this.table
    this.players

    this.handSize = handSize
    this.startTableSize = startTableSize
  }

  startGame () {
    const newDeck = new Deck()

    this.deck = newDeck.deck
    this.table = new Array()

    newDeck.deal(this.players, this.handSize)
  }
}
