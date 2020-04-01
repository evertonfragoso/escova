const socket = io()

const rooms = document.querySelector('#rooms')
const roomList = rooms.querySelector('#room_list')
const roomForm = rooms.querySelector('form')

const lobby = document.querySelector('#lobby')
const playerList = lobby.querySelector('#player_list')
const lobbyForm = lobby.querySelector('form')
const lobbyInput = lobby.querySelector('#player')

let playerId
let playerName
let roomId
let roomName
let connected = false

/*
* ROOMS
* */
// list rooms
socket.on('rooms:update', function(rooms) {
  roomList.innerHTML = ''

  for (let room in rooms) {
    // room format (no quotes): "qtd:[0-9];id:[a-z0-9]{4}"
    if (room.match(/^qtd\:\d\;id\:[a-z0-9]{4}$/)) {
      roomName = room
      roomId = room.split(';').pop().split(':').pop()

      let roomQtd = room.split(';').shift().split(':').pop()

      let item = document.createElement('li')
      item.innerText = roomQtd + ' jogadores '

      let a = document.createElement('a')
      a.setAttribute('href', '#'+ roomId)
      a.innerText = '(entrar)'

      item.appendChild(a)
      roomList.appendChild(item)
    }
  }
})

socket.on('lobby:join', function(room) {
  hideRooms()
  showLobby()
})

socket.on('rooms:full', () => {
  console.log('sala cheia')
})

roomForm.addEventListener('click', function(e) {
  e.preventDefault()
  let sourceElem = e.target

  if (sourceElem.nodeName == 'BUTTON') {
    const qtd = sourceElem.value
    socket.emit('rooms:create', qtd)
    hideRooms()
    showLobby()
  }
  return false
})

roomList.addEventListener('click', function(e) {
  let sourceElem = e.target

  if (sourceElem.nodeName == 'A') {
    socket.emit('rooms:join', roomName)
  }

  return false
})

/*
* LOBBY
* */

lobbyForm.addEventListener('submit', function(e) {
  e.preventDefault()

  playerName = lobbyInput.value
  socket.emit('player:add', { playerName: playerName, room: roomName })

  lobbyInput.value = ''
  hideLobby()
  hideLobbyForm()

  return false
})

socket.on('player:set:id', function(id) {  playerId = id })

socket.on('lobby:update', function(players) {
  playerList.innerHTML = ''

  players.forEach(player => {
    let playerItem = document.createElement('li')
    playerItem.setAttribute('data-player-id', player.playerId)
    playerItem.innerText = player.name

    playerList.appendChild(playerItem)
  })

  showLobby()
})

/*
* START GAME
* */

socket.on('game:start', function(data) {
  hideLobbyForm()
  resetScreen()
  renderHand(data.player)
  renderTableCards(data.startTableSize, data.deck)
})

socket.on('game:render', function(game) {
  hideLobbyForm()
  resetScreen()
  // TODO: find a way to send only the current player
  var player = game.players.filter(player => player.playerId === playerId).pop()
  renderHand(player)
  renderTableCards(game.startTableSize, game.deck)
})

/*
* DISCONNECTIONS
* */

socket.on('disconnect', function() {
  // console.log('Disconnected')
})

socket.on('reconnect', function() {
  // console.log('Reconnected')
})

socket.on('reconnect_error', function() {
  // console.log('Reconnection failed')
})

/* *** */


function showLobby () {
  lobby.removeAttribute('hidden')
  lobbyInput.focus()
}

function hideLobby () {
  lobby.setAttribute('hidden', '')
}

function showRooms () {
  rooms.removeAttribute('hidden')
}

function hideRooms () {
  rooms.setAttribute('hidden', '')
}

function hideLobbyForm () {
  lobbyForm.setAttribute('hidden', '')
}

function load () {
  socket.emit('rooms:get')
}
function ready () {}

window.addEventListener('load', load);
document.addEventListener('DOMContentLoaded', ready);
