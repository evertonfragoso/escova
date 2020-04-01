const containerSelector = '#game'
const container = document.querySelector(containerSelector)

function resetScreen () {
  container.innerHTML = ''
}

function renderHand (player) {
  let hand = document.createElement('div')
  hand.setAttribute('data-player-id', player.playerId)
  hand.innerText = player.name

  _cardList(hand, player.hand)
  _append(hand, container)
}

function renderPlayersHands (players) {
  for (let i in players) {
    let hand = document.createElement('div')
    hand.setAttribute('data-player-id', players[i].playerId)
    hand.innerText = players[i].name

    _cardList(hand, players[i].hand)
    _append(hand, container)
  }
}

function renderTableCards (tableSize, deck) {
  const table = document.createElement('div')
  const tableCards = new Array()

  table.classList.add('table_cards')
  table.innerText = 'Mesa:'

  for (let i = 0; i < tableSize; i++) {
    tableCards.push(deck.pop())
  }

  _cardList(table, tableCards)
  _append(table, container)
}

function renderCardsPile (deck) {
  const pile = document.createElement('div')
  pile.classList.add('cards_pile')
  pile.innerText = 'Deck:'

  for (let i = 0; i < deck.length; i++) {
    let c = document.createElement('div')
    c.classList.add('card', 'back')
    c.setAttribute('style', 'margin-left: ' + i + 'px; margint-top: ' + i + 'px;')
    _append(c, pile)
  }

  _append(pile, container)
}

// should be private

function _append (child, container) {
  container.appendChild(child)
}

function _cardList (container, cards) {
  const list = document.createElement('ul')

  for (let i = 0; i < cards.length; i++) {
    let cardItem = _cardStructure(cards[i])
    _append(cardItem, list)
  }

  _append(list, container)
}

function _cardStructure (card) {
  let cardItem = document.createElement('li')
  let cardText = document.createElement('span')

  cardText.classList.add('a11y')
  cardText.innerText = card.DisplayValue + ' of ' + card.Suit

  cardItem.appendChild(cardText)
  cardItem.classList.add('card', card.Suit, 'val' + card.DisplayValue)

  return cardItem
}
