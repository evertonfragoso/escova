import Deck from './Deck.js'

const reducer = (accumulator, currentValue) => accumulator + currentValue

export default class Game {
  constructor (handSize, startTableSize) {
    this.gameDeck
    this.deck
    this.table
    this.players
    this.playingPlayer
    this.previousPlayer

    this.turn = 1
    this.table = new Array()
    this.handSize = handSize
    this.startTableSize = startTableSize
  }

  startGame () {
    this.gameDeck = new Deck()

    let randomPlayer = this.randomPlayer()

    this.deck = this.gameDeck.deck
    this.playingPlayer = randomPlayer.playerId
    this.previousPlayer = this.playingPlayer.playerId

    this.gameDeck.deal(this.players, this.handSize)

    while(this.table.length < this.startTableSize) {
      this.table.push(this.deck.shift())
    }
  }

  deal () {
    this.gameDeck.deal(this.players, this.handSize)
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
      this.players[playerIndex].pickedCards.push(cardTransfer.pop())
    })

    this.players.forEach(player => player.lastPicked = false)
    this.players[playerIndex].lastPicked = true

    if (this.table.length == 0)
      this.players[playerIndex].escovas++
  }

  dropCard (playerId, card) {
    let playerIndex = this.players.findIndex(p => p.playerId === playerId)
    let cardIndex = this.players[playerIndex].hand.findIndex(c => c.Suit == card.suit && c.Value == card.value)
    let cardTransfer = this.players[playerIndex].hand.splice(cardIndex, 1).pop()
    this.table.push(cardTransfer)
  }

  emptyHands () {
    let hands = new Array()
    this.players.forEach(player => hands.push(player.hand.length))

    if (hands.reduce(reducer) == 0)
      return true

    return false
  }

  pickTable () {
    let playerIndex = this.players.findIndex(p => p.lastPicked === true)
    while (this.table.length > 0)
      this.players[playerIndex].pickedCards.push(this.table.pop())
  }

  gameOver () {
    return !!(this.deck.length == 0 && this.emptyHands())
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
