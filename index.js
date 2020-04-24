import path from 'path'
import http from 'http'
import SocketIO from 'socket.io'
import express from 'express'
import Game from './client/js/game/Game'
import Player from './client/js/game/Player'
import { GenerateRandomId, suitPt } from './lib/utils'

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)
const clientPath = path.join(__dirname, 'client')

const gameRooms = {}
const handSize = 3
const startTableSize = 4
let maxPlayers = 2

app.use(express.static(clientPath))

io.on('connection', socket => {
  console.log('a user connected')

  function updateLobby (roomId, players, playingPlayerId) {
    const data = { players: players, playingPlayerId: playingPlayerId }
    socket.emit('lobby:update', data)
    socket.broadcast.to(roomId).emit('lobby:update', data)
  }

  function playerAction () {
    const game = gameRooms[socket.roomName]
    let playingPlayerId = 0

    if (game.gameOver()) {
      game.pickTable()
      socket.emit('game:over', game.players)
      socket.broadcast.to(socket.roomId).emit('game:over', game.players)
    } else {
      game.nextPlayer()

      if (game.emptyHands()) game.deal()

      playingPlayerId = game.playingPlayer

      socket.emit('game:render', game)
      socket.broadcast.to(socket.roomId).emit('game:render', game)
    }

    updateLobby(socket.roomId, game.players, playingPlayerId)
  }

  // update all when connecting
  updateRoomList()

  socket.on('rooms:get', () => updateRoomList())

  let addedUser = false

  socket.on('rooms:create', qtd => {
    const room = GenerateRandomId()
    const roomName = `qtd:${qtd};id:${room}`

    gameRooms[roomName] = new Game(handSize, startTableSize)
    gameRooms[roomName].players = []

    maxPlayers = parseInt(qtd)

    socket.roomName = roomName
    socket.join(roomName)
    updateRoomList()
    logMessage(`Sala criada (${qtd} jogadores)`)
  })

  socket.on('rooms:join', room => {
    const playersInRoom = socket.adapter.rooms[room].length
    if (maxPlayers === playersInRoom) {
      // TODO
      socket.emit('rooms:full')
      return
    }
    socket.roomName = room
    socket.join(room)
    socket.emit('lobby:join', room)
    updateLobby(room, gameRooms[room].players, 0)
  })

  socket.on('party:swap', () => {
    const partyId = socket.player.partyId === 'A' ? 'B' : 'A'
    const playingPlayerId = gameRooms[socket.roomName].playingPlayer
    socket.player.partyId = partyId
    updateLobby(socket.roomName, gameRooms[socket.roomName].players, playingPlayerId)
  })

  socket.on('player:add', data => {
    if (addedUser) return

    const game = gameRooms[data.room]
    const playerName = data.playerName

    addedUser = true

    logMessage(`Jogador ${playerName} entrou na sala`)

    const newPlayer = new Player(playerName)
    newPlayer.partyId = (game.players.length % 2 === 0) ? 'A' : 'B'
    game.players.push(newPlayer)
    socket.player = newPlayer
    socket.roomId = data.room

    socket.emit('player:set:id', newPlayer.playerId)

    if (game.players.length === maxPlayers) {
      game.startGame()
      socket.emit('game:prepare')
      socket.broadcast.to(socket.roomName).emit('game:prepare')
    }

    updateLobby(data.room, game.players, 0)
  })

  socket.on('game:start', () => {
    const game = gameRooms[socket.roomName]

    if (game.started) return

    game.started = true

    logMessage('Partida iniciada')

    const startData = {
      table: game.table,
      deck: game.deck,
      playingPlayer: game.playingPlayer,
      player: socket.player
    }
    socket.emit('game:start', startData)
    socket.broadcast.to(socket.roomName).emit('game:render', game)

    updateLobby(socket.roomName, game.players, game.playingPlayer)
  })

  socket.on('game:cards:pick', cards => {
    gameRooms[socket.roomName].pickCards(socket.player.playerId, cards)
    playerAction()
    logMessage(`Jogador ${socket.player.name} pegou `, cards)
  })

  socket.on('game:cards:drop', card => {
    gameRooms[socket.roomName].dropCard(socket.player.playerId, card)
    playerAction()
    logMessage(`Jogador ${socket.player.name} descartou `, card)
  })

  socket.on('game:new', () => {
    // TODO
  })

  socket.on('disconnect', () => {
    const game = gameRooms[socket.roomName]

    if (game) {
      if (addedUser) {
        logMessage(`Jogador ${socket.player.name} desconectou`)
        const index = game.players.findIndex(p => p.playerId === socket.player.playerId)
        if (index > -1) { game.players.splice(index, 1) }
      } else logMessage('Um jogador se desconectou')

      if (game.players.length > 0) updateLobby(socket.roomName, game.players, 0)
      else gameRooms[socket.roomName] = null
    }

    updateRoomList()
  })
})

function updateRoomList () {
  io.sockets.emit('rooms:update', io.sockets.adapter.rooms)
}

function logMessage (message, cards = null) {
  if (cards) {
    if (Array.isArray(cards)) {
      const c = []
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

server.listen(port, () => { console.log(`listening on *:${port}`) })
