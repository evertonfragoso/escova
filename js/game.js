import Deck from './Deck.js'

const deck = new Deck()

const totalPlayers = 4
const handSize = 3
const startTableSize = 4

let players = new Array(totalPlayers)

// players hands

for (let p = 0; p < totalPlayers; p++) {
  players[p] = new Array()

  for (let c = 0; c < handSize; c++) {
    let card = deck.pop()
    players[p].push(card)
  }
}

// table

let table = new Array()

for (let i = 0; i < startTableSize; i++) {
  table.push(deck.pop())
}

// render

let gameContainer = document.getElementById('game')

gameContainer.innerHTML = ''

// render hands

for (let i = 0; i < totalPlayers; i++) {
  let p = document.createElement('p')
  let h = document.createElement('ul')

  for (let c = 0; c < players[i].length; c++) {
    let v = document.createElement('li')
    v.innerText = players[i][c].Value + ' of ' + players[i][c].Suit
    h.appendChild(v)
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
  let card = document.createElement('li')
  card.classList.add('card', deck[i].Suit, 'val' + deck[i].Value)
  card.innerHTML = deck[i].Value + ' of ' + deck[i].Suit

  tableCards.querySelector('ul').appendChild(card)
}

// render pile

let pile = document.createElement('div')
pile.innerText = 'Cards pile:'
pile.append(document.createElement('ul'))
gameContainer.appendChild(pile)

for (let i = 0; i < deck.length; i++) {
  let card = document.createElement('li')
  card.classList.add('card', deck[i].Suit, 'val' + deck[i].Value)
  card.innerHTML = deck[i].Value + ' of ' + deck[i].Suit

  pile.querySelector('ul').appendChild(card)
}
