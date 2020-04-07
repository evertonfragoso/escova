function resetScreen () {
  container.innerHTML = ''
}

function renderHand (player, isStartingPlayer) {
  let hand = document.createElement('div')
  hand.classList.add('hand')
  hand.setAttribute('data-player-id', player.playerId)
  hand.innerHTML = '<h3>' + player.name + '</h3>'

  if (isStartingPlayer)
    hand.classList.add('playing')

  _cardList(hand, player.hand)
  _append(hand, container)
}

function renderPlayersHands (players) {
  for (let i in players) {
    let hand = document.createElement('div')
    hand.setAttribute('data-player-id', players[i].playerId)
    hand.innerHTML = '<h3>' + players[i].name + '</h3>'

    _cardList(hand, players[i].hand)
    _append(hand, container)
  }
}

function renderTableCards (tableCards, deck) {
  const table = document.createElement('div')

  table.classList.add('table_cards')
  table.innerHTML = '<h3>Mesa:</h3>'

  _cardList(table, tableCards)
  _append(table, container)
}

function renderCardsPile (deck) {
  const pile = document.createElement('div')
  pile.classList.add('cards_pile')
  pile.innerHTML = '<h3>Deck:</h3>'

  for (let i = 0; i < deck.length; i++) {
    let c = document.createElement('div')
    c.classList.add('card', 'back')
    c.setAttribute('style', 'border: 1px solif white; margin-left: ' + i + 'px; margint-top: ' + i + 'px;')
    _append(c, pile)
  }

  _append(pile, container)
}

function renderPickedCards (player) {
  let pickedCards = document.createElement('div')
  pickedCards.classList.add('hand')
  pickedCards.setAttribute('data-player-id', player.playerId)
  pickedCards.innerHTML = '<h3>' + player.name + '</h3>'

  // order by number first...
  let sortedCards = player.pickedCards.sort((a, b) => a.Value - b.Value)
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
  cardItem.classList.add('card')
  cardItem.setAttribute('data-suit', card.Suit)
  cardItem.setAttribute('data-value', card.Value)
  cardItem.setAttribute('data-display-value', card.DisplayValue)

  return cardItem
}
