import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Card from '../shared/engine/Card.js'
import Deck from '../shared/engine/Deck.js'
import Player from '../shared/engine/Player.js'
import Round from '../shared/engine/Round.js'
import Game from '../shared/engine/Game.js'
import { isValidCapture } from '../shared/engine/rules.js'
import { PLAYER_COUNTS } from '../shared/constants.js'

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const c = (rank, suit) => new Card(rank, suit)

function scripted ({ hands, table, deck = [] }) {
  const players = hands.map((h, i) => {
    const p = new Player(`p${i}`, `P${i}`)
    p.hand = h
    return p
  })
  const round = new Round(players, { deck: new Deck(deck, () => 0.5), startTableSize: 0 })
  round.table = table
  return round
}

// Simple bot: first capture found, otherwise discard the first card
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

describe('Round captures with many table cards', () => {
  test('capture of 4 aces and a 3 plus a played 8 sums to 15 (5 cards)', () => {
    const round = scripted({
      hands: [[c('Q', 'clubs')], []],
      table: [c('A', 'clubs'), c('A', 'hearts'), c('A', 'spades'), c('A', 'diamonds'), c('3', 'clubs')]
    })
    round.play('p0', 'Q-clubs', ['A-clubs', 'A-hearts', 'A-spades', 'A-diamonds', '3-clubs'])
    assert.equal(round.players[0].captured.length, 6)
    assert.equal(round.table.length, 0)
  })
})

describe('Game setup', () => {
  test('rejects 3 players', () => {
    const three = [1, 2, 3].map(i => new Player(`p${i}`, `P${i}`))
    assert.throws(() => new Game(three), /2 or 4/)
  })

  test('4 players: seats across share a team (A,B,A,B)', () => {
    const four = [1, 2, 3, 4].map(i => new Player(`p${i}`, `P${i}`))
    new Game(four)
    assert.deepEqual(four.map(p => p.team), ['A', 'B', 'A', 'B'])
  })

  test('turns rotate seat by seat, so teams alternate', () => {
    const four = [1, 2, 3, 4].map(i => new Player(`p${i}`, `P${i}`))
    const game = new Game(four, { rng: seeded(1) })
    const round = game.startRound()
    const order = []
    for (let i = 0; i < 4; i++) {
      order.push(round.currentPlayer.team)
      const [cardId, ids] = findMove(round)
      round.play(round.currentPlayer.id, cardId, ids)
    }
    assert.deepEqual(order, ['A', 'B', 'A', 'B'])
  })

  test('every round starts with seat 1, not the seat after the last starter', () => {
    const two = [new Player('a', 'A'), new Player('b', 'B')]
    const game = new Game(two, { rng: seeded(5) })
    for (let r = 0; r < 3 && !game.isOver; r++) {
      game.startRound()
      assert.equal(game.round.currentPlayer.id, 'a')
      while (!game.round.isOver) {
        const [cardId, ids] = findMove(game.round)
        game.play(game.round.currentPlayer.id, cardId, ids)
      }
    }
  })
})

describe('Game flow', () => {
  for (const count of PLAYER_COUNTS) {
    test(`simulated ${count}-player game terminates with a winner`, () => {
      const players = Array.from({ length: count }, (_, i) => new Player(`p${i}`, `P${i}`))
      const game = new Game(players, { rng: seeded(count * 99) })

      let guard = 0
      while (!game.isOver) {
        if (++guard > 5000) throw new Error('game did not terminate')
        if (!game.round || game.round.isOver) game.startRound()
        const [cardId, ids] = findMove(game.round)
        game.play(game.round.currentPlayer.id, cardId, ids)
      }

      assert.ok(game.winner === 'A' || game.winner === 'B')
      assert.ok(game.scores[game.winner] >= game.targetScore)
      assert.ok(game.scores[game.winner] > game.scores[game.winner === 'A' ? 'B' : 'A'])
      assert.ok(game.history.length >= 1)
    })
  }

  test('a tie at target keeps the game going', () => {
    const two = [new Player('a', 'A'), new Player('b', 'B')]
    const game = new Game(two, { targetScore: 1 })
    game.scores = { A: 1, B: 1 }
    assert.equal(game._checkWinner(), null)
    game.scores = { A: 2, B: 1 }
    assert.equal(game._checkWinner(), 'A')
  })

  test('cannot start a round while one is in progress', () => {
    const two = [new Player('a', 'A'), new Player('b', 'B')]
    const game = new Game(two, { rng: seeded(3) })
    game.startRound()
    assert.throws(() => game.startRound(), /in progress/)
  })
})
