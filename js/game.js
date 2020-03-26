import Deck from './Deck.js'
import Player from './Player.js'

const totalPlayers = 4
const handSize = 3
const startTableSize = 4

const newDeck = new Deck()
const deck = newDeck.deck

const players = new Array()
const table = new Array()

// players hands

for (let p = 0; p < totalPlayers; p++) {
  players[p] = new Player()
}

newDeck.deal(players, handSize)

// table

for (let i = 0; i < startTableSize; i++) {
  table.push(deck.pop())
}

// helper
function renderCard (card) {
  let cardItem = document.createElement('li')
  let cardText = document.createElement('span')

  cardText.classList.add('a11y')
  cardText.innerText = card.Value + ' of ' + card.Suit

  cardItem.appendChild(cardText)
  cardItem.classList.add('card', card.Suit, 'val' + card.Value)

  return cardItem
}

// render

const gameContainer = document.getElementById('game')

gameContainer.innerHTML = ''

// render hands

for (let i = 0; i < players.length; i++) {
  let p = document.createElement('p')
  let h = document.createElement('ul')

  for (let c = 0; c < players[i].hand.length; c++) {
    // let card = renderCard(players[i].hand[c])
    let card = players[i].hand[c].render()
    h.appendChild(card)
  }

  p.innerText = 'Player ' + i
  p.appendChild(h)

  gameContainer.appendChild(p)
}

// render table cards

let tableCards = document.createElement('div')
tableCards.innerText = 'Table Cards:'
tableCards.append(document.createElement('ul'))
gameContainer.appendChild(tableCards)

for (let i = 0; i < table.length; i++) {
  let card = renderCard(deck[i])
  tableCards.querySelector('ul').appendChild(card)
}

// render pile

let pile = document.createElement('div')
pile.innerText = 'Cards pile:'
pile.append(document.createElement('ul'))
gameContainer.appendChild(pile)

for (let i = 0; i < deck.length; i++) {
  let card = renderCard(deck[i])
  pile.querySelector('ul').appendChild(card)
}
