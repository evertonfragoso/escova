const container = window.gameContainer
const cardsPile = window.gameCardsPile

window.resetScreen = function () {
  container.innerHTML = ''
}

window.renderHand = function (player, isStartingPlayer) {
  const hand = document.createElement('div')
  hand.classList.add('hand')
  hand.setAttribute('data-player-id', player.playerId)
  hand.innerHTML = '<h3>' + player.name + '</h3>'

  if (isStartingPlayer) {
    hand.classList.add('playing')
  }

  _cardList(hand, player.hand)
  _append(hand, container)
}

window.renderPlayersHands = function (players) {
  for (const i in players) {
    const hand = document.createElement('div')
    hand.setAttribute('data-player-id', players[i].playerId)
    hand.innerHTML = '<h3>' + players[i].name + '</h3>'

    _cardList(hand, players[i].hand)
    _append(hand, container)
  }
}

window.renderTableCards = function (tableCards, deck) {
  const table = document.createElement('div')

  table.classList.add('table_cards')
  table.innerHTML = '<h3>Mesa:</h3>'

  _cardList(table, tableCards)
  _append(table, container)
}

window.renderCardsPile = function (deck) {
  cardsPile.innerHTML = '<h3>' + deck.length + ' cartas</h3>'

  for (let i = 0; i < deck.length; i++) {
    const c = document.createElement('div')
    c.classList.add('card', 'back')
    c.setAttribute('style', 'border: 1px solif white; margin-left: ' + i + 'px; margint-top: ' + i + 'px;')
    _append(c, cardsPile)
  }
}

window.renderPickedCards = function (player) {
  const pickedCards = document.createElement('div')
  pickedCards.classList.add('hand')
  pickedCards.setAttribute('data-player-id', player.playerId)
  pickedCards.innerHTML = '<h3>' + player.name + '</h3>'

  // order by number first...
  const sortedCards = player.pickedCards.sort((a, b) => a.Value - b.Value)
  // then by suit
  sortedCards.sort((a, b) => {
    if (a.Suit < b.Suit) return -1
    if (a.Suit > b.Suit) return 1

    return 0
  })

  _cardList(pickedCards, sortedCards)
  _append(pickedCards, container)
}

// should be private

function _append (child, container) {
  container.appendChild(child)
}

function _cardList (container, cards) {
  const list = document.createElement('ul')

  for (let i = 0; i < cards.length; i++) {
    const cardItem = _cardStructure(cards[i])
    _append(cardItem, list)
  }

  _append(list, container)
}

function _cardStructure (card) {
  const cardItem = document.createElement('li')
  const cardText = document.createElement('span')

  cardText.classList.add('a11y')
  cardText.innerText = card.DisplayValue + ' of ' + card.Suit

  cardItem.appendChild(cardText)
  cardItem.classList.add('card')
  cardItem.setAttribute('data-suit', card.Suit)
  cardItem.setAttribute('data-value', card.Value)
  cardItem.setAttribute('data-display-value', card.DisplayValue)

  return cardItem
}
