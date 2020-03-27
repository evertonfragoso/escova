import Game from './Game.js'

const totalPlayers = 4
const handSize = 3
const startTableSize = 4
const containerSelector = '#game'

const socket = window.Game.socket

socket.on('start game', game => {
  game.startGame()
})
