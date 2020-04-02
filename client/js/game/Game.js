import Deck from './Deck.js'

export default class Game {
  constructor (handSize, startTableSize) {
    this.deck
    this.table
    this.players
    this.playingPlayer
    this.previousPlayer

    this.table = new Array()
    this.handSize = handSize
    this.startTableSize = startTableSize
  }

  startGame () {
    const newDeck = new Deck()

    let randomPlayer = this.randomPlayer()

    this.deck = newDeck.deck
    this.playingPlayer = randomPlayer.playerId
    this.previousPlayer = this.playingPlayer.playerId

    newDeck.deal(this.players, this.handSize)

    while(this.table.length < this.startTableSize) {
      this.table.push(this.deck.shift())
    }
  }

  nextPlayer () {
    let playerIndex = this.players.findIndex(p => p.playerId === this.playingPlayer)
    playerIndex++

    if (playerIndex == this.players.length)
      playerIndex = 0

    this.previousPlayer = this.playingPlayer
    this.playingPlayer = this.players[playerIndex].playerId
  }

  pickCards (playerId, cards) {
    let cardIndex
    let cardTransfer
    let playerIndex = this.players.findIndex(p => p.playerId === playerId)

    cards.forEach(card => {
      cardIndex = this.table.findIndex(c => c.Suit == card.suit && c.Value == card.value)
      if (cardIndex > -1) {
        cardTransfer = this.table.splice(cardIndex, 1)
      } else {
        cardIndex = this.players[playerIndex].hand.findIndex(c => c.Suit == card.suit && c.Value == card.value)
        cardTransfer = this.players[playerIndex].hand.splice(cardIndex, 1)
      }
      this.players[playerIndex].pickedCards.push(cardTransfer)
    })
  }

  dropCard (playerId, card) {
    let playerIndex = this.players.findIndex(p => p.playerId === playerId)
    let cardIndex = this.deck.findIndex(c => c.Suit == card.suit && c.DisplayValue == card.value)
    let cardtransfer = this.players[playerIndex].hand[cardIndex].pop()
    this.table.push(cardTransfer)
  }

  randomPlayer () {
    let playersList = this.players
    // remove previous starting player from the pool
    if (this.previousStartingPlayer) {
      let index = playersList.findIndex(p => p.playerId === this.previousStartingPlayer.playerId)
      playersList.splice(index, 1)
    }
    return playersList[Math.floor(Math.random() * playersList.length)]
  }
}
