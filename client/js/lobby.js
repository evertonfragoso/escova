import GameContainer from './game/GameContainer.js'

const form = document.querySelector('form')
const input = document.querySelector('#player')
const containerSelector = '#game'

window.Game = {}
let G = window.Game

G.socket = io()
G.container = new GameContainer(containerSelector)

let playerName
let connected = false

form.addEventListener('submit', function(e) {
  e.preventDefault()
  G.socket.emit('add player', input.value)
  input.value = ''
  form.setAttribute('hidden', '')
  return false
})

G.socket.on('start game', game => {
console.log(game)
  G.container.resetScreen()
  G.container.renderPlayersHands(game.players)
  G.container.renderTableCards(game.startTableSize, game.deck)
  G.container.renderCardsPile(game.deck)
})

G.socket.on('disconnect', () => {})
G.socket.on('reconnect', () => {
  form.setAttribute('hidden', '')
})
G.socket.on('reconnect_error', () => {})
