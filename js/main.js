import Game from './Game.js'

const totalPlayers = 4
const handSize = 3
const startTableSize = 4
const containerSelector = '#game'

var game = new Game(totalPlayers, handSize, startTableSize, containerSelector)
game.startGame()
