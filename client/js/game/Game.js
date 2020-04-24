import Deck from './Deck'

const reducer = (accumulator, currentValue) => accumulator + currentValue

export default class Game {
  constructor (handSize, startTableSize) {
    this.gameDeck = null
    this.deck = null
    this.players = null
    this.playingPlayer = null
    this.previousPlayer = null

    this.turn = 1
    this.table = []
    this.handSize = handSize
    this.startTableSize = startTableSize
    this.started = false
  }

  startGame () {
    this.gameDeck = new Deck()

    const randomPlayer = this.randomPlayer()

    this.deck = this.gameDeck.deck
    this.playingPlayer = randomPlayer.playerId
    this.previousPlayer = this.playingPlayer.playerId

    this.gameDeck.deal(this.players, this.handSize)

    while (this.table.length < this.startTableSize) {
      this.table.push(this.deck.shift())
    }
  }

  deal () {
    this.gameDeck.deal(this.players, this.handSize)
  }

  nextPlayer () {
    let playerIndex = this.players.findIndex(p => p.playerId === this.playingPlayer)
    playerIndex++

    if (playerIndex === this.players.length) playerIndex = 0

    this.previousPlayer = this.playingPlayer
    this.playingPlayer = this.players[playerIndex].playerId
  }

  pickCards (playerId, cards) {
    const playerIndex = this.players.findIndex(p => p.playerId === playerId)
    let cardIndex
    let cardTransfer

    cards.forEach(card => {
      cardIndex = this.table.findIndex(c => c.Suit === card.suit && c.Value === parseInt(card.value))
      if (cardIndex > -1) {
        cardTransfer = this.table.splice(cardIndex, 1)
      } else {
        cardIndex = this.players[playerIndex].hand.findIndex(c => c.Suit === card.suit && c.Value === parseInt(card.value))
        cardTransfer = this.players[playerIndex].hand.splice(cardIndex, 1)
      }
      this.players[playerIndex].pickedCards.push(cardTransfer.pop())
    })

    this.players.forEach(player => { player.lastPicked = false })
    this.players[playerIndex].lastPicked = true

    if (this.table.length === 0) this.players[playerIndex].escovas++
  }

  dropCard (playerId, card) {
    const playerIndex = this.players.findIndex(p => p.playerId === playerId)
    const cardIndex = this.players[playerIndex].hand.findIndex(c => c.Suit === card.suit && c.Value === parseInt(card.value))
    const cardTransfer = this.players[playerIndex].hand.splice(cardIndex, 1).pop()
    this.table.push(cardTransfer)
  }

  emptyHands () {
    const hands = []
    this.players.forEach(player => hands.push(player.hand.length))

    if (hands.reduce(reducer) === 0) return true

    return false
  }

  pickTable () {
    const playerIndex = this.players.findIndex(p => p.lastPicked === true)
    while (this.table.length > 0) {
      this.players[playerIndex].pickedCards.push(this.table.pop())
    }
  }

  gameOver () {
    return !!(this.deck.length === 0 && this.emptyHands())
  }

  randomPlayer () {
    let index
    const playersList = this.players
    // remove previous starting player from the pool
    if (this.previousStartingPlayer) {
      index = playersList.findIndex(p => p.playerId === this.previousStartingPlayer.playerId)
      playersList.splice(index, 1)
    }
    return playersList[Math.floor(Math.random() * playersList.length)]
  }

  // _getPlayerIndex () {
  // }

  // _getCardIndex () {
  // }
}
