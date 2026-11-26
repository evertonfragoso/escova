import { test, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { io as connect } from 'socket.io-client'
import { createServer } from '../server/index.js'
import RoomManager from '../server/RoomManager.js'
import { EVENTS } from '../shared/protocol.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

const { server, io } = createServer({ rooms: new RoomManager({ rng: seeded(11), graceMs: 60_000 }) })
await new Promise(resolve => server.listen(0, resolve))
const url = `http://localhost:${server.address().port}`
const clients = []

after(() => {
  clients.forEach(c => c.disconnect())
  io.close()
  server.close()
})

// Records the latest state each socket received, so no broadcast can be missed
function client () {
  const s = connect(url, { transports: ['websocket'], forceNew: true })
  s.latest = null
  s.on(EVENTS.ROOM_STATE, st => { s.latest = st })
  clients.push(s)
  return new Promise(resolve => s.on('connect', () => resolve(s)))
}

const emit = (s, event, payload) => new Promise(resolve => s.emit(event, payload, resolve))

async function waitFor (fn, ms = 2000) {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > ms) throw new Error('timed out waiting')
    await new Promise(r => setTimeout(r, 10))
  }
}

describe('socket server', () => {
  test('4 players join, game auto-starts, each sees only their own hand', async () => {
    const sockets = await Promise.all([client(), client(), client(), client()])
    const { roomId } = await emit(sockets[0], EVENTS.ROOM_CREATE, { capacity: 4 })

    const names = ['Ana', 'Bruno', 'Caio', 'Dani']
    for (let i = 0; i < 4; i++) {
      const res = await emit(sockets[i], EVENTS.ROOM_JOIN, { roomId, name: names[i] })
      assert.equal(res.ok, true)
    }

    await waitFor(() => sockets.every(s => s.latest?.started))

    const host = sockets[0]
    const view = host.latest
    assert.equal(view.you, 'p1')
    assert.equal(view.round.players.find(p => p.id === 'p1').hand.length, 3)
    for (const p of view.round.players.filter(p => p.id !== 'p1')) {
      assert.equal(p.hand, undefined)
    }
    assert.deepEqual(view.players.map(p => p.team), ['A', 'B', 'A', 'B'])
  })

  test('play out of turn returns an error ack', async () => {
    const a = await client()
    const b = await client()
    const { roomId } = await emit(a, EVENTS.ROOM_CREATE, { capacity: 2 })
    await emit(a, EVENTS.ROOM_JOIN, { roomId, name: 'A' })
    await emit(b, EVENTS.ROOM_JOIN, { roomId, name: 'B' })
    await waitFor(() => a.latest?.started && b.latest?.started)

    const notUp = a.latest.round.currentPlayerId === 'p1' ? b : a
    const card = notUp.latest.round.players.find(p => p.id === notUp.latest.you).hand[0].id
    const res = await emit(notUp, EVENTS.GAME_PLAY, { cardId: card, tableCardIds: [] })
    assert.equal(res.ok, false)
    assert.match(res.error, /turn/)
  })

  test('invalid payload is rejected', async () => {
    const a = await client()
    const res = await emit(a, EVENTS.ROOM_CREATE, { capacity: 3 })
    assert.equal(res.ok, false)
    assert.equal(res.error, 'Invalid payload')
  })

  test('mid-game drop keeps the seat; reconnect with the token restores the same hand', async () => {
    const a = await client()
    const b = await client()
    const { roomId } = await emit(a, EVENTS.ROOM_CREATE, { capacity: 2 })
    const joinA = await emit(a, EVENTS.ROOM_JOIN, { roomId, name: 'A' })
    await emit(b, EVENTS.ROOM_JOIN, { roomId, name: 'B' })
    await waitFor(() => a.latest?.started && b.latest?.started)

    const handBefore = a.latest.round.players.find(p => p.id === joinA.seatId).hand.map(c => c.id)

    a.disconnect()
    await waitFor(() => b.latest.players.find(p => p.id === 'p1').connected === false)

    const a2 = await client()
    const res = await emit(a2, EVENTS.ROOM_RECONNECT, { roomId, token: joinA.playerId })
    assert.equal(res.ok, true)
    assert.equal(res.seatId, 'p1')

    await waitFor(() => a2.latest?.you === 'p1')
    const handAfter = a2.latest.round.players.find(p => p.id === 'p1').hand.map(c => c.id)
    assert.deepEqual(handAfter, handBefore)
    await waitFor(() => b.latest.players.find(p => p.id === 'p1').connected === true)
  })

  test('reconnect with an unknown token is rejected', async () => {
    const a = await client()
    const { roomId } = await emit(a, EVENTS.ROOM_CREATE, { capacity: 2 })
    await emit(a, EVENTS.ROOM_JOIN, { roomId, name: 'A' })
    const b = await client()
    const res = await emit(b, EVENTS.ROOM_RECONNECT, { roomId, token: 'not-a-real-token' })
    assert.equal(res.ok, false)
    assert.match(res.error, /Unknown player token/)
  })
})
