import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Room from '../server/Room.js'
import RoomManager from '../server/RoomManager.js'
import { PLAYER_COUNTS } from '../shared/constants.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

describe('Room', () => {
  test('rejects capacities outside PLAYER_COUNTS', () => {
    assert.throws(() => new Room('r', 3), new RegExp(PLAYER_COUNTS.join(' or ')))
  })

  test('room of 2 starts when the second player joins', () => {
    const room = new Room('r', 2, { rng: seeded(1) })
    room.join('Ana', 's1')
    assert.equal(room.started, false)
    room.join('Bruno', 's2')
    assert.equal(room.started, true)
  })

  test('room of 4 starts immediately; seats p1..p4 alternate teams A,B,A,B', () => {
    const room = new Room('r', 4, { rng: seeded(2) })
    ;['a', 'b', 'c'].forEach((n, i) => room.join(n, `s${i}`))
    assert.equal(room.started, false)
    room.join('d', 's3')
    assert.equal(room.started, true)
    assert.deepEqual(room.players.map(p => p.id), ['p1', 'p2', 'p3', 'p4'])
    assert.deepEqual(room.players.map(p => p.team), ['A', 'B', 'A', 'B'])
  })

  test('cannot join a full or started room', () => {
    const room = new Room('r', 2, { rng: seeded(3) })
    room.join('A', 's1')
    room.join('B', 's2')
    assert.throws(() => room.join('C', 's3'), /started|full/)
  })

  test('lobby leave frees the seat and invalidates its token', () => {
    const room = new Room('r', 4, { rng: seeded(5) })
    const { seatId, token } = room.join('A', 's1')
    room.removePlayer(seatId)
    assert.equal(room.players.length, 0)
    assert.throws(() => room.reconnect(token, 's2'), /Unknown player token/)
  })

  test('play before start is rejected', () => {
    const room = new Room('r', 2, { rng: seeded(6) })
    room.join('A', 's1')
    assert.throws(() => room.play('p1', 'K-clubs'), /not started/)
  })

  test('each new round starts with seat p1 after a round ends', () => {
    const room = new Room('r', 2, { rng: seeded(7) })
    room.join('A', 's1')
    room.join('B', 's2')
    const first = room.game.round
    while (room.game.round === first) {
      const p = room.game.round.currentPlayer
      room.play(p.id, p.hand[0].id, [])
    }
    assert.equal(room.game.round.currentPlayer.id, 'p1')
    assert.equal(room.game.round.isOver, false)
  })

  test('stateFor shows your own hand, hides others, and reports your seat', () => {
    const room = new Room('r', 2, { rng: seeded(8) })
    room.join('A', 's1')
    room.join('B', 's2')
    const view = room.stateFor('p1')
    assert.equal(view.you, 'p1')
    assert.equal(view.round.players.find(p => p.id === 'p1').hand.length, 3)
    assert.equal(view.round.players.find(p => p.id === 'p2').hand, undefined)
  })

  test('detach returns the dropped seat; the seat stays in the game', () => {
    const room = new Room('r', 2, { rng: seeded(9) })
    room.join('A', 's1')
    room.join('B', 's2')
    assert.equal(room.detach('s2'), 'p2')
    assert.equal(room.started, true)
    assert.equal(room.players.length, 2)
    assert.equal(room.stateFor('p1').players.find(p => p.id === 'p2').connected, false)
  })

  test('reconnect rebinds the same seat to a new socket and replaces the old one', () => {
    const room = new Room('r', 2, { rng: seeded(10) })
    const { token } = room.join('A', 's1')
    room.join('B', 's2')
    room.detach('s1')
    assert.equal(room.reconnect(token, 's9'), 'p1')
    assert.equal(room.socketIdOf('p1'), 's9')
    assert.equal(room.detach('s1'), null, 'stale socket must not drop the seat')
  })

  test('a mid-game seat keeps its hand across a disconnect and reconnect', () => {
    const room = new Room('r', 2, { rng: seeded(12) })
    const { token } = room.join('A', 's1')
    room.join('B', 's2')
    const handBefore = room.game.round.players[0].hand.map(c => c.id)
    room.detach('s1')
    room.reconnect(token, 's7')
    const handAfter = room.stateFor('p1').round.players.find(p => p.id === 'p1').hand.map(c => c.id)
    assert.deepEqual(handAfter, handBefore)
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

  test('empty lobby is removed as soon as it is refreshed', () => {
    const rooms = new RoomManager({ newId: () => 'lobby' })
    const room = rooms.create(4)
    rooms.refresh(room)
    assert.throws(() => rooms.get('lobby'), /not found/)
  })

  test('started game with nobody connected is removed after the grace period', async () => {
    const rooms = new RoomManager({ newId: () => 'g1', graceMs: 30 })
    const room = rooms.create(2)
    room.join('A', 's1')
    room.join('B', 's2')
    room.detach('s1')
    room.detach('s2')
    rooms.refresh(room)
    await sleep(80)
    assert.throws(() => rooms.get('g1'), /not found/)
  })

  test('a reconnect inside the grace period keeps the game', async () => {
    const rooms = new RoomManager({ newId: () => 'g2', graceMs: 40 })
    const room = rooms.create(2)
    const { token } = room.join('A', 's1')
    room.join('B', 's2')
    room.detach('s1')
    room.detach('s2')
    rooms.refresh(room)
    room.reconnect(token, 's3')
    rooms.refresh(room)
    await sleep(100)
    assert.equal(rooms.get('g2'), room)
  })
})
