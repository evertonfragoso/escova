import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Room from '../server/Room.js'
import RoomManager from '../server/RoomManager.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('Room', () => {
  test('rejects capacities other than 2 or 4', () => {
    assert.throws(() => new Room('r', 3), /2 or 4/)
  })

  test('room of 2 starts as soon as the second player joins', () => {
    const room = new Room('r', 2, { rng: seeded(1) })
    room.join('a', 'Ana')
    assert.equal(room.started, false)
    room.join('b', 'Bruno')
    assert.equal(room.started, true)
  })

  test('room of 4 starts immediately when it fills, no manual start', () => {
    const room = new Room('r', 4, { rng: seeded(2) })
    ;['a', 'b', 'c'].forEach(id => room.join(id, id))
    assert.equal(room.started, false)
    room.join('d', 'd')
    assert.equal(room.started, true)
    assert.deepEqual(room.players.map(p => p.team), ['A', 'B', 'A', 'B'])
  })

  test('cannot join a full or started room', () => {
    const room = new Room('r', 2, { rng: seeded(3) })
    room.join('a', 'A')
    room.join('b', 'B')
    assert.throws(() => room.join('c', 'C'), /started|full/)
  })

  test('cannot join twice with the same id', () => {
    const room = new Room('r', 4, { rng: seeded(4) })
    room.join('a', 'A')
    assert.throws(() => room.join('a', 'A'), /Already joined/)
  })

  test('lobby leave removes the player; leave is refused after start', () => {
    const room = new Room('r', 4, { rng: seeded(5) })
    room.join('a', 'A')
    assert.equal(room.leave('a'), true)
    assert.equal(room.players.length, 0)
  })

  test('play before start is rejected', () => {
    const room = new Room('r', 2, { rng: seeded(6) })
    room.join('a', 'A')
    assert.throws(() => room.play('a', 'K-clubs'), /not started/)
  })

  test('next round starts automatically after a round ends', () => {
    const room = new Room('r', 2, { rng: seeded(7) })
    room.join('a', 'A')
    room.join('b', 'B')
    const first = room.game.round
    // play out the first round with discards only; end it by forcing empty state
    while (!room.game.round.isOver) {
      const p = room.game.round.currentPlayer
      room.play(p.id, p.hand[0].id, [])
      if (room.game.round !== first) break
    }
    assert.notEqual(room.game.round, first)
    assert.equal(room.game.round.isOver, false)
  })

  test('stateFor hides opponents cards', () => {
    const room = new Room('r', 2, { rng: seeded(8) })
    room.join('a', 'A')
    room.join('b', 'B')
    const view = room.stateFor('a')
    const mine = view.round.players.find(p => p.id === 'a')
    const theirs = view.round.players.find(p => p.id === 'b')
    assert.ok(Array.isArray(mine.hand) && mine.hand.length === 3)
    assert.equal(theirs.hand, undefined)
  })
})

describe('RoomManager', () => {
  test('creates, gets and removes rooms', () => {
    const rooms = new RoomManager({ newId: () => 'abc' })
    const room = rooms.create(2)
    assert.equal(rooms.get('abc'), room)
    rooms.remove('abc')
    assert.throws(() => rooms.get('abc'), /not found/)
  })
})
