import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Player from '../shared/engine/Player.js'
import Game from '../shared/engine/Game.js'
import { isValidCapture } from '../shared/engine/rules.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

// Bot: first valid capture from any table subset of up to 3 cards, else discard the first card
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

describe('4-player turn rule: fixed seats, teams alternate', () => {
  const seats = () => ['a', 'b', 'c', 'd'].map(id => new Player(id, id))

  test('a teammate across the table cannot play on their partner\'s turn', () => {
    const players = seats()
    const game = new Game(players, { rng: seeded(21) })
    const round = game.startRound()
    // seat 0 (team A) is up; seat 2 (also team A, across the table) must be rejected
    const across = players[2]
    const card = across.hand[0].id
    assert.throws(() => round.play(across.id, card), /Not c's turn/)
  })

  test('every seat plays in order a, b, c, d and teams alternate A, B, A, B', () => {
    const players = seats()
    const game = new Game(players, { rng: seeded(22) })
    const round = game.startRound()
    const order = []
    for (let i = 0; i < 8; i++) {
      order.push(`${round.currentPlayer.id}:${round.currentPlayer.team}`)
      const [cardId, ids] = findMove(round)
      round.play(round.currentPlayer.id, cardId, ids)
    }
    assert.deepEqual(order, ['a:A', 'b:B', 'c:A', 'd:B', 'a:A', 'b:B', 'c:A', 'd:B'])
  })

  test('hands stay balanced by seat, so no seat is ever up with an empty hand', () => {
    const players = seats()
    const game = new Game(players, { rng: seeded(23) })
    let guard = 0
    while (!game.isOver) {
      if (++guard > 5000) throw new Error('game did not terminate')
      if (!game.round || game.round.isOver) game.startRound()
      const round = game.round
      assert.ok(round.currentPlayer.hand.length > 0, 'seat up with empty hand')
      const [cardId, ids] = findMove(round)
      game.play(round.currentPlayer.id, cardId, ids)
    }
    assert.ok(game.history.length >= 1)
  })
})
