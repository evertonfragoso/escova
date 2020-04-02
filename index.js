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
      // TODO
      socket.emit('rooms:full')
      return
    }
    socket.join(room)
    socket.emit('lobby:join', room)
    socket.emit('lobby:update', { players: game.players, playingPlayerId: 0 })
  })

  socket.on('player:add', data => {
    if (addedUser) return

    let playerName = data.playerName

    addedUser = true

    console.log('Player', playerName, 'has joined room', data.room)

    var newPlayer = new Player(playerName)
    game.players.push(newPlayer)
    socket.player = newPlayer
    socket.roomId = data.room

    socket.emit('player:set:id', newPlayer.playerId)

    socket.emit('lobby:update', { players: game.players, playingPlayerId: 0 })
    socket.broadcast.to(data.room).emit('lobby:update', { players: game.players, playingPlayerId: 0 })

    if (game.players.length == maxPlayers) {
      game.startGame()

      socket.emit('game:start', {
        table: game.table,
        deck: game.deck,
        playingPlayer: game.playingPlayer,
        player: newPlayer
      })
      socket.broadcast.to(data.room).emit('game:render', game)

      let playingPlayerId = game.playingPlayer
      socket.emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
      socket.broadcast.to(data.room).emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
    }
  })

  socket.on('game:cards:pick', cards => {
    let playerId = socket.player.playerId

    game.pickCards(playerId, cards)
    game.nextPlayer()

    let playingPlayerId = game.playingPlayer
    socket.emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
    socket.broadcast.to(socket.roomId).emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })

    socket.emit('game:render', game)
    socket.broadcast.to(socket.roomId).emit('game:render', game)
  })

  socket.on('game:cards:drop', card => {
    // TODO
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      var playerName = socket.player.name
      console.log(playerName, 'disconnected')
      var index = game.players.findIndex(p => p.playerId === socket.player.playerId)
      if (index > -1) { game.players.splice(index, 1) }
    } else console.log('a user has disconnected')

    if (game)
      if (game.players.length > 0)
        socket.broadcast.emit('lobby:update', { players: game.players, playingPlayerId: 0 }) // not working
      else
        game = null

    updateRoomList()
  })
})

server.listen(port, () => {
  console.log(`listening on *:${port}`)
})
