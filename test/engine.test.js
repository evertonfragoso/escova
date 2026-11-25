import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Card from '../shared/engine/Card.js'
import Deck from '../shared/engine/Deck.js'
import Player from '../shared/engine/Player.js'
import Round from '../shared/engine/Round.js'
import { isValidCapture, isEscova } from '../shared/engine/rules.js'

// Deterministic RNG so shuffles are reproducible in tests
const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

const c = (rank, suit) => new Card(rank, suit)

function twoPlayers () {
  return [new Player('a', 'Ana', 'A'), new Player('b', 'Bruno', 'B')]
}

// Build a Round with fully controlled hands and table (no shuffle)
function scripted ({ hands, table, deck = [], startingIndex = 0 }) {
  const players = twoPlayers()
  players.forEach((p, i) => { p.hand = hands[i] })
  const round = new Round(players, {
    deck: new Deck(deck, () => 0.5),
    startingIndex,
    startTableSize: 0
  })
  round.table = table
  return round
}

describe('Card', () => {
  test('values follow escopa rules', () => {
    assert.equal(c('A', 'clubs').value, 1)
    assert.equal(c('7', 'hearts').value, 7)
    assert.equal(c('Q', 'spades').value, 8)
    assert.equal(c('J', 'spades').value, 9)
    assert.equal(c('K', 'spades').value, 10)
  })

  test('sete belo is the 7 of diamonds only', () => {
    assert.equal(c('7', 'diamonds').isSeteBelo(), true)
    assert.equal(c('7', 'hearts').isSeteBelo(), false)
  })

  test('rejects invalid rank and suit', () => {
    assert.throws(() => c('8', 'clubs'))
    assert.throws(() => c('A', 'stars'))
  })
})

describe('Deck', () => {
  test('full deck has 40 unique cards', () => {
    const deck = new Deck()
    assert.equal(deck.size, 40)
    assert.equal(new Set(deck.cards.map(x => x.id)).size, 40)
  })

  test('shuffle is deterministic with seeded rng and keeps all cards', () => {
    const a = new Deck(null, seeded(42)).shuffle()
    const b = new Deck(null, seeded(42)).shuffle()
    assert.deepEqual(a.cards.map(x => x.id), b.cards.map(x => x.id))
    assert.equal(a.size, 40)
  })

  test('draw throws when not enough cards', () => {
    assert.throws(() => new Deck([c('A', 'clubs')]).draw(2))
  })
})

describe('rules', () => {
  test('capture valid when played card and table sum to 15', () => {
    assert.equal(isValidCapture(c('K', 'clubs'), [c('5', 'hearts')]), true)
    assert.equal(isValidCapture(c('2', 'clubs'), [c('3', 'hearts'), c('5', 'spades')]), false)
    assert.equal(isValidCapture(c('2', 'clubs'), [c('3', 'hearts'), c('K', 'spades')]), true)
  })

  test('empty table is never a capture', () => {
    assert.equal(isValidCapture(c('K', 'clubs'), []), false)
  })

  test('escova when whole table is captured', () => {
    const table = [c('2', 'clubs'), c('3', 'clubs')]
    assert.equal(isEscova(table, table), true)
    assert.equal(isEscova(table, [table[0]]), false)
  })
})

describe('Round turns', () => {
  test('rejects a play from the wrong player', () => {
    const round = scripted({
      hands: [[c('2', 'clubs')], [c('3', 'clubs')]],
      table: []
    })
    assert.throws(() => round.play('b', c('3', 'clubs').id), /Not b's turn/)
  })

  test('turn advances after each play', () => {
    const round = scripted({
      hands: [[c('2', 'clubs')], [c('3', 'clubs')]],
      table: []
    })
    round.play('a', '2-clubs')
    assert.equal(round.currentPlayer.id, 'b')
  })

  test('rejects playing a card not in hand', () => {
    const round = scripted({ hands: [[c('2', 'clubs')], []], table: [] })
    assert.throws(() => round.play('a', '9-spades'), /not in hand/)
  })
})

describe('Round captures and discards', () => {
  test('discard puts card on table', () => {
    const round = scripted({
      hands: [[c('2', 'clubs')], [c('3', 'clubs')]],
      table: [c('A', 'hearts')]
    })
    round.play('a', '2-clubs')
    assert.deepEqual(round.table.map(x => x.id).sort(), ['2-clubs', 'A-hearts'].sort())
  })

  test('valid capture moves cards to captured pile', () => {
    const round = scripted({
      hands: [[c('K', 'clubs')], [c('3', 'clubs')]],
      table: [c('5', 'hearts')]
    })
    round.play('a', 'K-clubs', ['5-hearts'])
    assert.equal(round.table.length, 0)
    assert.equal(round.players[0].captured.length, 2)
    assert.equal(round.players[0].escovas, 1)
  })

  test('invalid capture is rejected and state unchanged', () => {
    const round = scripted({
      hands: [[c('2', 'clubs')], [c('3', 'clubs')]],
      table: [c('5', 'hearts')]
    })
    assert.throws(() => round.play('a', '2-clubs', ['5-hearts']), /sum to 15/)
    assert.equal(round.players[0].hand.length, 1)
    assert.equal(round.table.length, 1)
    assert.equal(round.currentPlayer.id, 'a')
  })

  test('unknown table card id is rejected', () => {
    const round = scripted({ hands: [[c('K', 'clubs')], []], table: [] })
    assert.throws(() => round.play('a', 'K-clubs', ['5-hearts']), /not found/)
  })
})

describe('Round dealing and ending', () => {
  test('initial deal: table gets 4 cards, hands get 3 each', () => {
    const deck = new Deck(null, seeded(7)).shuffle()
    const round = new Round(twoPlayers(), { deck })
    assert.equal(round.table.length, 4)
    assert.equal(round.players[0].hand.length, 3)
    assert.equal(round.players[1].hand.length, 3)
    assert.equal(round.deck.size, 40 - 4 - 6)
  })

  test('view hides opponent hand contents', () => {
    const round = new Round(twoPlayers(), { deck: new Deck(null, seeded(3)).shuffle() })
    const view = round.viewFor('a')
    const me = view.players.find(p => p.id === 'a')
    const them = view.players.find(p => p.id === 'b')
    assert.ok(Array.isArray(me.hand))
    assert.equal(them.hand, undefined)
    assert.equal(them.handSize, 3)
  })

  test('round is over when deck and hands are empty', () => {
    const round = scripted({ hands: [[], []], table: [], deck: [] })
    assert.equal(round.isOver, true)
  })

  test('finish gives leftover table to last capturer', () => {
    const round = scripted({ hands: [[], []], table: [c('2', 'clubs')], deck: [] })
    round.lastCapturer = 'b'
    round.finish()
    assert.equal(round.table.length, 0)
    assert.equal(round.players[1].captured.length, 1)
  })
})
