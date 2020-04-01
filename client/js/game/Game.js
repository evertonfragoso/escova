import Deck from './Deck.js'

export default class Game {
  constructor (handSize, startTableSize) {
    this.deck
    this.table
    this.players
    this.startingPlayer
    this.previousStartingPlayers

    this.handSize = handSize
    this.startTableSize = startTableSize
  }

  startGame () {
    const newDeck = new Deck()

    this.deck = newDeck.deck
    this.table = new Array()
    this.startingPlayer = this.randomPlayer()
    this.previousStartingPlayer = this.startingPlayer

    newDeck.deal(this.players, this.handSize)
  }

  randomPlayer () {
    let playersList = this.players
    if (this.previousStartingPlayer) {
      let index = playersList.findIndex(p => p.playerId === this.previousStartingPlayer.playerId)
      playersList.splice(index, 1)
    }
    return playersList[Math.floor(Math.random() * playersList.length)]
  }
}
