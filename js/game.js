import Deck from './Deck.js'
import Player from './Player.js'
import GameContainer from './GameContainer.js'

export default class Game {
  constructor (totalPlayers, handSize, startTableSize, containerSelector) {
    this.newDeck
    this.deck
    this.players
    this.table

    this.totalPlayers = totalPlayers
    this.handSize = handSize
    this.startTableSize = startTableSize

    this.gameContainer = new GameContainer(containerSelector)
  }

  startGame () {
    this.newDeck = new Deck()
    this.deck = this.newDeck.deck

    this.players = new Array()
    this.table = new Array()

    for (let p = 0; p < this.totalPlayers; p++) {
      this.players[p] = new Player()
    }

    this.newDeck.deal(this.players, this.handSize)

    this.gameContainer.resetScreen()

    this.gameContainer.renderPlayersHands(this.players)
    this.gameContainer.renderTableCards(this.startTableSize, this.deck)
    this.gameContainer.renderCardsPile(this.deck)
  }
}
