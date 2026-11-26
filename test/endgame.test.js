import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Room from '../server/Room.js'
import { isValidCapture } from '../shared/engine/rules.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

function findMove (round) {
  const p = round.currentPlayer
  const table = round.table
  const subsets = []
  const walk = (start, acc) => {
    if (acc.length > 0) subsets.push(acc)
    if (acc.length === 3) return
    for (let i = start; i < table.length; i++) walk(i + 1, [...acc, table[i]])
  }
  walk(0, [])
  for (const card of p.hand) {
    const s = subsets.find(sub => isValidCapture(card, sub))
    if (s) return [card.id, s.map(x => x.id)]
  }
  return [p.hand[0].id, []]
}

// Plays the room to the end of the game
function finishGame (room) {
  let guard = 0
  while (!room.game.isOver) {
    if (++guard > 20000) throw new Error('did not finish')
    const round = room.game.round
    const [cardId, ids] = findMove(round)
    room.play(round.currentPlayer.id, cardId, ids)
  }
}

function fourPlayerRoom (seed) {
  const room = new Room('end', 4, { rng: seeded(seed) })
  for (let i = 0; i < 4; i++) room.join(`P${i + 1}`, `s${i + 1}`)
  return room
}

describe('end of game and rematch', () => {
  test('stateFor exposes history and the rematch votes after a finished game', () => {
    const room = fourPlayerRoom(31)
    finishGame(room)
    const view = room.stateFor('p1')
    assert.ok(view.winner === 'A' || view.winner === 'B')
    assert.equal(view.history.length, room.game.history.length)
    assert.deepEqual(view.rematch.votes, {})
    assert.equal(view.rematch.capacity, 4)
  })

  test('rematch needs a vote from every seat; no votes are cast before the game is over', () => {
    const room = fourPlayerRoom(32)
    assert.throws(() => room.requestRematch('p1', false), /not over/)
  })

  test('partners stay the same unless every seat votes to swap', () => {
    const room = fourPlayerRoom(33)
    finishGame(room)
    room.requestRematch('p1', true)
    room.requestRematch('p2', false)
    room.requestRematch('p3', true)
    room.requestRematch('p4', true)
    assert.deepEqual(room.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4'])
    assert.equal(room.started, true)
    assert.equal(room.game.isOver, false)
  })

  test('unanimous swap restarts with new partners: teams become {p1,p2} vs {p3,p4}', () => {
    const room = fourPlayerRoom(34)
    finishGame(room)
    for (const id of ['p1', 'p2', 'p3', 'p4']) room.requestRematch(id, true)
    assert.deepEqual(room.players.map(p => p.id), ['p1', 'p3', 'p2', 'p4'])
    assert.equal(room.players[0].team, 'A')
    assert.equal(room.players[1].team, 'B')
    assert.equal(room.players[2].team, 'A')
    assert.equal(room.players[3].team, 'B')
    assert.equal(room.game.isOver, false)
    assert.equal(room.game.round.currentPlayer.id, 'p1')
  })

  test('a plain unanimous replay keeps the seating and restarts', () => {
    const room = fourPlayerRoom(35)
    finishGame(room)
    for (const id of ['p1', 'p2', 'p3', 'p4']) room.requestRematch(id, false)
    assert.deepEqual(room.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4'])
    assert.equal(room.game.isOver, false)
  })

  test('leaving a finished game sends the player home and the room returns to the lobby', () => {
    const room = fourPlayerRoom(36)
    finishGame(room)
    room.leaveFinished('p4')
    assert.equal(room.started, false)
    assert.equal(room.players.length, 3)
    const { seatId } = room.join('Newcomer', 's9')
    assert.equal(room.started, true)
    assert.equal(seatId, 'p5')
  })

  test('a player who leaves the finished game cannot vote anymore', () => {
    const room = fourPlayerRoom(37)
    finishGame(room)
    room.leaveFinished('p2')
    assert.throws(() => room.requestRematch('p2', false), /not over/)
  })

  test('leaving is refused while a game is still running', () => {
    const room = fourPlayerRoom(38)
    assert.throws(() => room.leaveFinished('p1'), /finished game/)
  })
})
