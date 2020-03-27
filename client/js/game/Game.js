import Deck from './Deck.js'
import Player from './Player.js'

export default class Game {
  constructor (players, handSize, startTableSize) {
    this.deck
    this.table

    this.players = players
    this.totalPlayers = players.length
    this.handSize = handSize
    this.startTableSize = startTableSize
  }

  startGame () {
    const newDeck = new Deck()

    this.deck = newDeck.deck

    this.players = new Array()
    this.table = new Array()

    for (let p = 0; p < this.totalPlayers; p++) {
      this.players[p] = new Player()
    }

    newDeck.deal(this.players, this.handSize)
  }
}
