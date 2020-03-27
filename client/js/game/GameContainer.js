export default class GameContainer {
  constructor (containerSelector = '') {
    this.container = document.querySelector(containerSelector)
  }

  resetScreen (container = this.container) {
    container.innerHTML = ''
  }

  renderHand (player) {
    let hand = document.createElement('div')
    hand.setAttribute('data-player-id', player.playerId)
    hand.innerText = player.name

    this._cardList(hand, player.hand)
    this._append(hand)
  }

  renderPlayersHands (players) {
    for (let i in players) {
      let hand = document.createElement('div')
      hand.setAttribute('data-player-id', players[i].playerId)
      hand.innerText = players[i].name

      this._cardList(hand, players[i].hand)
      this._append(hand)
    }
  }

  renderTableCards (tableSize, deck) {
    const table = document.createElement('div')
    const tableCards = new Array()

    table.innerText = 'Table Cards:'

    for (let i = 0; i < tableSize; i++) {
      tableCards.push(deck.pop())
    }

    this._cardList(table, tableCards)
    this._append(table)
  }

  renderCardsPile (deck) {
    const pile = document.createElement('div')
    pile.innerText = 'Cards pile:'

    this._cardList(pile, deck)
    this._append(pile)
  }

  // should be private

  _append (child, container = this.container) {
    container.appendChild(child)
  }

  _cardList (container, cards) {
    const list = document.createElement('ul')

    for (let i = 0; i < cards.length; i++) {
      let cardItem = this._cardStructure(cards[i])
      this._append(cardItem, list)
    }

    this._append(list, container)
  }

  _cardStructure (card) {
    let cardItem = document.createElement('li')
    let cardText = document.createElement('span')

    cardText.classList.add('a11y')
    cardText.innerText = card.Value + ' of ' + card.Suit

    cardItem.appendChild(cardText)
    cardItem.classList.add('card', card.Suit, 'val' + card.Value)

    return cardItem
  }
}
