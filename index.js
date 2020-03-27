import path from 'path'
import http from 'http'
import SocketIO from 'socket.io'
import express from 'express'

// For Socket.IO thing
// 
// import ioClient from 'socket.io-client'
// const io = ioClient(server)

import Game from './client/js/game/Game.js'

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)
const clientPath = path.join(__dirname, 'client')

const maxPlayers = 4
const handSize = 3
const startTableSize = 4
const containerSelector = '#game'

const Players = new Array()

app.use(express.static(clientPath))

io.on('connection', socket => {
  console.log('a user connected')

  var addedUser = false

  socket.on('add player', playerName => {
    if (addedUser) return

    addedUser = true

    console.log('Player', playerName, 'has joined.')

    Players.push({ Name: playerName })
    socket.playerName = playerName

    if (Players.length === maxPlayers) {
      var game = new Game(Players, handSize, startTableSize)
      game.startGame()

      socket.emit('start game', game)
      socket.broadcast.emit('start game', game)
    }
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      var playerName = socket.playerName
      console.log(playerName, 'disconnected')
      var index = Players.indexOf({ Name: socket.playerName })
      if (index > -1) Players.splice(index, 1)
    }
  })
})

server.listen(port, () => {
  console.log(`listening on *:${port}`)
})
