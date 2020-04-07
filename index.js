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
import { GenerateRandomId, suitPt } from './lib/utils.js'

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

  function playerAction () {
    if (game.gameOver()) {
      game.pickTable()
      socket.emit('game:over', game.players)
      socket.broadcast.to(socket.roomId).emit('game:over', game.players)
    } else {
      game.nextPlayer()

      if (game.emptyHands())
        game.deal()

      let playingPlayerId = game.playingPlayer
      socket.emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
      socket.broadcast.to(socket.roomId).emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })

      socket.emit('game:render', game)
      socket.broadcast.to(socket.roomId).emit('game:render', game)
    }
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
    logMessage(`Sala criada (${qtd} jogadores)`)
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

    let newPlayer
    let playingPlayerId = 0
    let playerName = data.playerName

    addedUser = true

    logMessage(`Jogador ${playerName} entrou na sala`)

    newPlayer = new Player(playerName)
    game.players.push(newPlayer)
    socket.player = newPlayer
    socket.roomId = data.room

    socket.emit('player:set:id', newPlayer.playerId)

    if (game.players.length == maxPlayers) {
      logMessage(`Partida iniciada`)
      game.startGame()

      let startData = {
        table: game.table,
        deck: game.deck,
        playingPlayer: game.playingPlayer,
        player: newPlayer
      }
      socket.emit('game:start', startData)
      socket.broadcast.to(data.room).emit('game:render', game)

      playingPlayerId = game.playingPlayer
    }

    socket.emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
    socket.broadcast.to(data.room).emit('lobby:update', { players: game.players, playingPlayerId: playingPlayerId })
  })

  socket.on('game:cards:pick', cards => {
    let playerId = socket.player.playerId
    game.pickCards(playerId, cards)
    playerAction()
    logMessage(`Jogador ${socket.player.name} pegou `, cards)
  })

  socket.on('game:cards:drop', card => {
    let playerId = socket.player.playerId
    game.dropCard(playerId, card)
    playerAction()
    logMessage(`Jogador ${socket.player.name} descartou `, card)
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      var playerName = socket.player.name
      logMessage(`Jogador ${socket.player.name} desconectou`)
      var index = game.players.findIndex(p => p.playerId === socket.player.playerId)
      if (index > -1) { game.players.splice(index, 1) }
    } else logMessage(`Um jogador se desconectou`)

    if (game)
      if (game.players.length > 0)
        socket.broadcast.emit('lobby:update', { players: game.players, playingPlayerId: 0 }) // not working
      else
        game = null

    updateRoomList()
  })
})

function updateRoomList () {
  io.sockets.emit('rooms:update', io.sockets.adapter.rooms)
}

function logMessage (message, cards = null) {
  if (cards) {
    if (Array.isArray(cards)) {
      let c = new Array()
      cards.forEach(card => {
        c.push(`${card.displayValue} de ${suitPt[card.suit]}`)
      })
      message += c.join(', ')
    } else if (Object.prototype.toString.call(cards) === '[object Object]') {
      message += `${cards.displayValue} de ${suitPt[cards.suit]}`
    }
  }

  console.log(message)
  io.sockets.emit('log', message)
}

server.listen(port, () => {
  console.log(`listening on *:${port}`)
})
