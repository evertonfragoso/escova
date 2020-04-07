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

const sumCardsOnScreen = document.querySelector('#cards_sum')

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
      a.innerText = 'entrar'

      item.appendChild(a)
      roomList.appendChild(item)
    }
  }
})

socket.on('lobby:join', function(room) {
  hideRooms()
  showLobby()
})

socket.on('rooms:full', function() {
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

function hasSeteBelo (hand) {
  let cardIndex = hand.findIndex(function(c) { return c.Suit == 'diamonds' && c.Value == 7 })
  if (cardIndex > -1) return true
  return false
}

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

  players.forEach(function(player) {
    let playerItem = document.createElement('li')
    let handCards = document.createElement('span')
    let escovas = document.createElement('span')
    let seteBelo = document.createElement('span')

    playerItem.setAttribute('data-player-id', player.playerId)
    playerItem.innerText = player.name

    handCards.classList.add('cards_hand')
    handCards.innerText = player.hand.length

    escovas.classList.add('escova')
    escovas.innerText = player.escovas

    playerItem.appendChild(handCards)
    playerItem.appendChild(escovas)

    if (hasSeteBelo(player.pickedCards)) {
      seteBelo.classList.add('seven_diamonds')
      seteBelo.innerHTML = '&nbsp;'
      playerItem.appendChild(seteBelo)
    }

    if (playingPlayerId == player.playerId)
      playerItem.classList.add('playing_player')

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
  totalSum = 0
  selectedCards = container.querySelectorAll('.card.selected')
  selectedCards.forEach(function (card) {
    totalSum += parseInt(card.getAttribute('data-value'))
  })
}

function updateSumCardsOnScreen () {
  let klass

  if (totalSum == SUM_TO_TAKE_CARDS)
    klass = 'green'
  else if (totalSum > 0)
    klass = 'red'
  else
    klass = ''

  let totalSpan = sumCardsOnScreen.querySelector('span')
  totalSpan.setAttribute('class', klass)
  totalSpan.innerText = totalSum
}

socket.on('game:start', function(game) {
  hideLobbyForm()
  resetScreen()
  showSumCards()
  showActions()
  disableActions('all')
  var isPlayingPlayer = !!(game.playingPlayer == playerId)
  renderHand(game.player, isPlayingPlayer)
  renderTableCards(game.table, game.deck)
  renderCardsPile(game.deck)
  setTableCardsContainer()
})

socket.on('game:render', function(game) {
  hideLobbyForm()
  resetScreen()
  showSumCards()
  showActions()
  disableActions('all')
  // TODO: find a way to send only the current player
  var player = game.players.filter(function(p) { return p.playerId === playerId }).pop()
  var isPlayingPlayer = !!(game.playingPlayer === playerId)
  renderHand(player, isPlayingPlayer)
  renderTableCards(game.table, game.deck)
  renderCardsPile(game.deck)
  setTableCardsContainer()
})

container.addEventListener('click', function(e) {
  let sourceElem = e.target

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
  updateSumCardsOnScreen()

  enableActions('cancel')

  if (totalSum == 15)
    enableActions('pick')
  else
    disableActions('pick')

  if (totalSum > 0 != 15)
    enableActions('discard')
  else
    disableActions('discard')

  if (totalSum == 0)
    disableActions('all')
})

actions.addEventListener('click', function (e) {
  let sourceElem = e.target

  switch(sourceElem.id) {
    case 'cancel':
      container.querySelector('.table_cards').classList.remove('playing')
      break
    case 'discard':
      let card = container.querySelector('.hand').querySelector('.card.selected')
      socket.emit('game:cards:drop', {
        suit: card.getAttribute('data-suit'),
        value: card.getAttribute('data-value')
      })
      break
    case 'pick':
      let cards = new Array()
      selectedCards.forEach(function(card) {
        cards.push({
          suit: card.getAttribute('data-suit'),
          value: card.getAttribute('data-value')
        })
      })
      socket.emit('game:cards:pick', cards)
      break
    default: break
  }

  clearSelectedCards()
  sumCards()
  updateSumCardsOnScreen()
  disableActions('all')
})

/*
* GAME OVER
* */

socket.on('game:over', function(players) {
  let player = players.filter(function(p) { return p.playerId === playerId }).pop()
  resetScreen()
  renderPickedCards(player)
})

/*
* DISCONNECTIONS
* */

socket.on('disconnect', function() {
  console.log('Disconnected')
})

socket.on('reconnect', function() {
  console.log('Reconnected')
})

socket.on('reconnect_error', function() {
  console.log('Reconnection failed')
})

/* *** */

function clearSelectedCards () {
  container.querySelectorAll('.card.selected').forEach(function (card) {
    card.classList.remove('selected')
  })
}

function showSumCards () {
  sumCardsOnScreen.querySelector('p').removeAttribute('hidden')
}

function hideSumCards () {
  sumCardsOnScreen.querySelector('p').setAttribute('hidden', '')
}

function showActions () {
  actions.querySelector('div').removeAttribute('hidden')
}

function hideActions () {
  actions.querySelector('div').setAttribute('hidden', '')
}

function enableActions (id) {
  if (id == 'all') {
    actions.querySelectorAll('button').forEach(function (action) {
      action.removeAttribute('disabled')
    })
  } else
    actions.querySelector('#' + id).removeAttribute('disabled')
}

function disableActions (id) {
  if (id == 'all') {
    actions.querySelectorAll('button').forEach(function (action) {
      action.setAttribute('disabled', '')
    })
  } else
    actions.querySelector('#' + id).setAttribute('disabled', '')
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
