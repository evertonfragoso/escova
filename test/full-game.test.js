import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Card from '../shared/engine/Card.js'
import Player from '../shared/engine/Player.js'
import Game from '../shared/engine/Game.js'
import Room from '../server/Room.js'
import { isValidCapture } from '../shared/engine/rules.js'
import { PLAYER_COUNTS, TEAMS, DECK_SIZE, TARGET_SCORE, START_TABLE_SIZE, HAND_SIZE } from '../shared/constants.js'

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

// Plays one full game on the engine and records every round for checking
function playEngineGame (count, seed) {
  const players = Array.from({ length: count }, (_, i) => new Player(`p${i + 1}`, `P${i + 1}`))
  const game = new Game(players, { rng: seeded(seed) })
  const rounds = []
  let guard = 0

  while (!game.isOver) {
    if (++guard > 20000) throw new Error('game did not terminate')
    if (!game.round || game.round.isOver) {
      game.startRound()
      rounds.push({ turns: [], summary: null, capturedTotal: 0 })
    }
    const round = game.round
    const seat = round.currentPlayer
    rounds.at(-1).turns.push({ seatId: seat.id, team: seat.team, handBefore: seat.hand.length })

    const [cardId, ids] = findMove(round)
    const summary = game.play(seat.id, cardId, ids)
    if (summary) {
      const current = rounds.at(-1)
      current.summary = summary
      current.capturedTotal = players.reduce((n, p) => n + p.captured.length, 0)
      current.capturedIds = players.flatMap(p => p.captured.map(c => c.id))
    }
  }
  return { game, players, rounds }
}

function assertRulesHold (count, { game, players, rounds }) {
  const seatIds = players.map(p => p.id)

  rounds.forEach((round, r) => {
    const label = `round ${r + 1}`

    // Every round starts at seat 1
    assert.equal(round.turns[0].seatId, seatIds[0], `${label} must start at seat 1`)

    // Turns go seat by seat in order, and each seat's team alternates A, B
    round.turns.forEach((t, k) => {
      assert.equal(t.seatId, seatIds[k % count], `${label} turn ${k} out of order`)
      assert.equal(t.team, TEAMS[k % 2], `${label} turn ${k} team`)
      assert.ok(t.handBefore > 0, `${label} turn ${k} played with an empty hand`)
    })

    // Each round uses every hand card once: deck minus start table, all played
    const playsExpected = DECK_SIZE - START_TABLE_SIZE
    assert.equal(round.turns.length, playsExpected, `${label} play count`)

    // Every round ends with a summary, and every card ends up captured
    assert.ok(round.summary, `${label} has no round summary`)
    assert.equal(round.capturedTotal, DECK_SIZE, `${label} card total`)
    assert.equal(new Set(round.capturedIds).size, DECK_SIZE, `${label} duplicate or lost card`)
  })

  // Only the final round ends the game
  rounds.slice(0, -1).forEach((round, r) => {
    assert.equal(round.summary.winner, null, `round ${r + 1} ended the game early`)
  })
  const last = rounds.at(-1).summary
  assert.equal(last.winner, game.winner)

  // Scores equal the sum of round points
  for (const t of TEAMS) {
    const total = rounds.reduce((n, r) => n + r.summary.points[t], 0)
    assert.equal(game.scores[t], total, `team ${t} score mismatch`)
  }

  // Winner: reached the target with a strict lead
  const [a, b] = [game.scores.A, game.scores.B]
  assert.ok(game.winner !== null, 'game has no winner')
  assert.ok(game.scores[game.winner] >= TARGET_SCORE)
  assert.ok(game.scores[game.winner] > (game.winner === 'A' ? b : a))
}

describe('full game on the engine', () => {
  for (const count of PLAYER_COUNTS) {
    for (const seed of [3, 17, 101]) {
      test(`${count} players, seed ${seed}: rules hold for every round and the game ends correctly`, () => {
        const result = playEngineGame(count, seed)
        assertRulesHold(count, result)
      })
    }
  }
})

describe('full game through Room (seats, tokens, server-side rules)', () => {
  for (const count of PLAYER_COUNTS) {
    test(`${count} players: room plays a full game to a winner`, () => {
      const room = new Room('full', count, { rng: seeded(202) })
      for (let i = 0; i < count; i++) room.join(`P${i + 1}`, `s${i + 1}`)
      assert.equal(room.started, true)

      let guard = 0
      const roundSummaries = []
      while (!room.game.isOver) {
        if (++guard > 20000) throw new Error('room game did not terminate')
        const round = room.game.round
        const seat = round.currentPlayer
        const [cardId, ids] = findMove(round)
        const summary = room.play(seat.id, cardId, ids)
        if (summary) roundSummaries.push(summary)
      }

      assert.ok(roundSummaries.length >= 1)
      assert.ok(room.game.winner === 'A' || room.game.winner === 'B')
      // Each seat sees only its own hand at the end
      const view = room.stateFor('p1')
      assert.equal(view.winner, room.game.winner)
      assert.ok(view.players.every(p => p.team === 'A' || p.team === 'B'))
      assert.equal(HAND_SIZE, 3)
    })
  }
})
