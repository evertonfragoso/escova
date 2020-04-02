const socket = io()

const container = document.querySelector('#game')

const rooms = document.querySelector('#rooms')
const roomList = rooms.querySelector('#room_list')
const roomForm = rooms.querySelector('form')

const lobby = document.querySelector('#lobby')
const playerList = lobby.querySelector('#player_list')
const lobbyForm = lobby.querySelector('form')
const lobbyInput = lobby.querySelector('#player')

const actions = document.querySelector('#actions')

const SUM_TO_TAKE_CARDS = 15

let playerId
let playerName
let roomId
let roomName
let tableCardsContainer
let selectedCards
let totalSum
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

socket.on('lobby:update', function(data) {
  let players = data.players,
      playingPlayerId = data.playingPlayerId

  playerList.innerHTML = ''

  players.forEach(player => {
    let playerItem = document.createElement('li')
    playerItem.setAttribute('data-player-id', player.playerId)
    playerItem.innerText = player.name + ' (' + player.hand.length + ' cartas)'

    if (playingPlayerId == player.playerId)
      playerItem.innerText += ' (jogando)'

    playerList.appendChild(playerItem)
  })

  showLobby()
})

/*
* START GAME
* */

function setTableCardsContainer () {
  tableCardsContainer = container.querySelector('.table_cards')
}

function cardContainerContains (card, klass) {
  return card.parentNode.parentNode.classList.contains(klass)
}

function isPlaying (card) {
  return (card.classList.contains('card') && cardContainerContains(card, 'playing'))
}

function isPlayingHand (card) {
  return (isPlaying(card) && cardContainerContains(card, 'hand'))
}

function isPlayingTable (card) {
  return (isPlaying(card) && cardContainerContains(card, 'table_cards'))
}

function sumCards () {
  selectedCards = container.querySelectorAll('.card.selected')
  selectedCards.forEach(function (card) {
    totalSum += parseInt(card.getAttribute('data-value'))
  })
}

socket.on('game:start', function(game) {
  hideLobbyForm()
  resetScreen()
  showActions()
  disableActions()
  var isPlayingPlayer = !!(game.playingPlayer == playerId)
  renderHand(game.player, isPlayingPlayer)
  renderTableCards(game.table, game.deck)
  renderCardsPile(game.deck)
  setTableCardsContainer()
})

socket.on('game:render', function(game) {
console.log(game)
  hideLobbyForm()
  resetScreen()
  showActions()
  disableActions()
  // TODO: find a way to send only the current player
  var player = game.players.filter(p => p.playerId === playerId).pop()
  var isPlayingPlayer = !!(game.playingPlayer === playerId)
  renderHand(player, isPlayingPlayer)
  renderTableCards(game.table, game.deck)
  renderCardsPile(game.deck)
  setTableCardsContainer()
})

container.addEventListener('click', function(e) {
  let sourceElem = e.target
  totalSum = 0

  // Select card from hand
  if (isPlayingHand(sourceElem)) {
    // only allow one card from hand to be selected
    sourceElem.parentNode.childNodes.forEach(function(li) {
      li.classList.remove('selected')
    })
    sourceElem.classList.add('selected')

    tableCardsContainer.classList.add('playing')
  }

  // Select cards from table
  if (isPlayingTable(sourceElem)) {
    sourceElem.classList.toggle('selected')
  }

  // Sum selected cards
  sumCards()

  if (totalSum == SUM_TO_TAKE_CARDS) enableActions()
  else disableActions()
})

actions.addEventListener('click', function (e) {
  let sourceElem = e.target

  if (sourceElem.id == 'cancel') {
    container.querySelectorAll('.card.selected').forEach(function(card) {
      card.classList.remove('selected')
    })
    container.querySelector('.table_cards').classList.remove('playing')
  }

  if (sourceElem.id == 'submit') {
    let cards = new Array()
    selectedCards.forEach(function(card) {
      cards.push({
        suit: card.getAttribute('data-suit'),
        value: card.getAttribute('data-value')
      })
    })

    socket.emit('game:cards:pick', cards)
  }
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

function showActions () {
  actions.querySelector('div').removeAttribute('hidden')
}

function hideActions () {
  actions.querySelector('div').setAttribute('hidden', '')
}

function enableActions () {
  actions.querySelectorAll('button').forEach(function (action) {
    action.removeAttribute('disabled')
  })
}

function disableActions () {
  actions.querySelectorAll('button').forEach(function (action) {
    action.setAttribute('disabled', '')
  })
}

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
