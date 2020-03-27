import path from 'path'
import http from 'http'
import SocketIO from 'socket.io'
import express from 'express'

// For Socket.IO thing
// 
// import ioClient from 'socket.io-client'
// const io = ioClient(server)

import Game from './client/js/game/Game.js'
import Player from './client/js/game/Player.js'

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)
const clientPath = path.join(__dirname, 'client')

const maxPlayers = 2
const handSize = 3
const startTableSize = 4

app.use(express.static(clientPath))

const game = new Game(handSize, startTableSize)
game.players = new Array()

io.on('connection', socket => {
  console.log('a user connected')

  var addedUser = false

  socket.on('add player', playerName => {
    if (addedUser) return

    addedUser = true

    console.log('Player', playerName, 'has joined.')

    var newPlayer = new Player(playerName)
    game.players.push(newPlayer)
    socket.player = newPlayer

    socket.emit('set playerId', newPlayer.playerId)

    socket.emit('update lobby', game.players)
    socket.broadcast.emit('update lobby', game.players)

    if (game.players.length === maxPlayers) {
      game.startGame()

      socket.emit('start game', { game: game, player: newPlayer })
      socket.broadcast.emit('render game', game)
    }
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      var playerName = socket.player.name
      console.log(playerName, 'disconnected')
      var index = game.players.findIndex(p => p.playerId === socket.player.playerId)
      if (index > -1) game.players.splice(index, 1)
    }
  })
})

server.listen(port, () => {
  console.log(`listening on *:${port}`)
})
