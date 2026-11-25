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

const { server, io } = createServer({ rooms: new RoomManager({ rng: seeded(11) }) })
await new Promise(resolve => server.listen(0, resolve))
const url = `http://localhost:${server.address().port}`
const clients = []

after(() => {
  clients.forEach(c => c.disconnect())
  io.close()
  server.close()
})

// Records the latest state each client received, so no broadcast can be missed
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
    const [host] = sockets
    const { roomId } = await emit(host, EVENTS.ROOM_CREATE, { capacity: 4 })
    assert.ok(roomId)

    const names = ['Ana', 'Bruno', 'Caio', 'Dani']
    for (let i = 0; i < 4; i++) {
      const res = await emit(sockets[i], EVENTS.ROOM_JOIN, { roomId, name: names[i] })
      assert.equal(res.ok, true)
    }

    await waitFor(() => sockets.every(s => s.latest?.started))

    const view = host.latest
    const mine = view.round.players.find(p => p.id === host.id)
    assert.equal(mine.hand.length, 3)
    for (const p of view.round.players.filter(p => p.id !== host.id)) {
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

    const notMyTurn = a.latest.round.currentPlayerId === b.id ? a : b
    const card = notMyTurn.latest.round.players.find(p => p.id === notMyTurn.id).hand[0].id
    const res = await emit(notMyTurn, EVENTS.GAME_PLAY, { cardId: card, tableCardIds: [] })
    assert.equal(res.ok, false)
    assert.match(res.error, /turn/)
  })

  test('invalid payload is rejected', async () => {
    const a = await client()
    const res = await emit(a, EVENTS.ROOM_CREATE, { capacity: 3 })
    assert.equal(res.ok, false)
    assert.equal(res.error, 'Invalid payload')
  })
})
