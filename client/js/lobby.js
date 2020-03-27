import GameContainer from './game/GameContainer.js'

const lobby = document.querySelector('#lobby')
const playerList = document.querySelector('#player_list')
const form = document.querySelector('form')
const input = document.querySelector('#player')
const containerSelector = '#game'

window.Game = {}
let G = window.Game

G.socket = io()
G.container = new GameContainer(containerSelector)

let playerId
let playerName
let connected = false

form.addEventListener('submit', e => {
  e.preventDefault()

  playerName = input.value
  G.socket.emit('add player', playerName)

  input.value = ''
  form.setAttribute('hidden', '')

  return false
})

G.socket.on('set playerId', id => playerId = id)

G.socket.on('update lobby', players => {
  playerList.innerHTML = ''

  players.forEach(player => {
    let playerItem = document.createElement('li')
    playerItem.setAttribute('data-player-id', player.playerId)
    playerItem.innerText = player.name

    playerList.appendChild(playerItem)
  })
})

G.socket.on('start game', data => {
  G.container.resetScreen()
  G.container.renderHand(data.player)
  // G.container.renderPlayersHands(game.players) // debug only
  G.container.renderTableCards(data.game.startTableSize, data.game.deck)
  // G.container.renderCardsPile(game.deck) // debug only
})

G.socket.on('render game', game => {
  G.container.resetScreen()
  var player = game.players.filter(player => player.playerId === playerId).pop()
  G.container.renderHand(player)
  G.container.renderTableCards(game.startTableSize, game.deck)
})

G.socket.on('disconnect', () => {
  console.log('Disconnected')
})

G.socket.on('reconnect', () => {
  console.log('Reconnected')
  form.setAttribute('hidden', '')
})

G.socket.on('reconnect_error', () => {
  console.log('Reconnection failed')
})
