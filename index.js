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
import { GenerateRandomId } from './lib/utils.js'

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)
const clientPath = path.join(__dirname, 'client')

const rooms = new Array()
const handSize = 3
const startTableSize = 4
let maxPlayers = 2
let game

app.use(express.static(clientPath))

io.on('connection', socket => {
  console.log('a user connected')

  function updateRoomList () {
    io.sockets.emit('rooms:update', io.sockets.adapter.rooms)
  }

  // update all when connecting
  updateRoomList()

  socket.on('rooms:get', () => updateRoomList())

  var addedUser = false

  socket.on('rooms:create', qtd => {
    game = new Game(handSize, startTableSize)
    game.players = new Array()

    maxPlayers = qtd

    let room = GenerateRandomId()
    let roomName = `qtd:${qtd};id:${room}`
    socket.join(roomName)
    updateRoomList()
  })

  socket.on('rooms:join', room => {
    let playersInRoom = socket.adapter.rooms[room].length
    if (maxPlayers == playersInRoom) {
      socket.emit('rooms:full')
      return
    }
    socket.join(room)
    socket.emit('lobby:join', room)
    socket.emit('lobby:update', game.players)
  })

  socket.on('player:add', data => {
    if (addedUser) return

    let playerName = data.playerName

    addedUser = true

    console.log('Player', playerName, 'has joined room', data.room)

    var newPlayer = new Player(playerName)
    game.players.push(newPlayer)
    socket.player = newPlayer

    socket.emit('player:set:id', newPlayer.playerId)

    socket.emit('lobby:update', game.players)
    socket.broadcast.to(data.room).emit('lobby:update', game.players)

    if (game.players.length == maxPlayers) {
      game.startGame()

      socket.emit('game:start', {
        startTableSize: game.startTableSize,
        deck: game.deck,
        player: newPlayer
      })
      socket.broadcast.to(data.room).emit('game:render', game)
    }
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      var playerName = socket.player.name
      console.log(playerName, 'disconnected')
      var index = game.players.findIndex(p => p.playerId === socket.player.playerId)
      if (index > -1) { game.players.splice(index, 1) }
    } else console.log('a user has disconnected')

    socket.emit('lobby:update', game.players) // not working
    updateRoomList()
  })
})

server.listen(port, () => {
  console.log(`listening on *:${port}`)
})
