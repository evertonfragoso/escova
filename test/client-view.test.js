import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { selectionSum, canDiscard, canCapture, prune, activeDialog } from '../client/src/lib/view.js'
import { TAKE_SUM } from '../shared/constants.js'

const card = (id, value) => ({ id, value, rank: String(value), suit: 'clubs' })

describe('board rules for the UI', () => {
  test('selectionSum counts the hand card plus the selected table cards', () => {
    const table = [card('a', 5), card('b', 10), card('c', 2)]
    assert.equal(selectionSum({ handCard: card('h', 3), table, selectedTableIds: new Set(['a']) }), 8)
    assert.equal(selectionSum({ handCard: card('h', 5), table, selectedTableIds: new Set(['a', 'b']) }), 20)
  })

  test('a hand card alone sums to its own value (discard case)', () => {
    assert.equal(selectionSum({ handCard: card('h', 7), table: [card('a', 5)], selectedTableIds: new Set() }), 7)
  })

  test('nothing selected sums to 0', () => {
    assert.equal(selectionSum({ handCard: null, table: [card('a', 5)], selectedTableIds: new Set() }), 0)
  })

  test('a 7 in hand plus an 8 on the table is a capture of 15 (the reported bug)', () => {
    const handCard = card('h', 7)
    const table = [card('t', 8)]
    const sum = selectionSum({ handCard, table, selectedTableIds: new Set(['t']) })
    assert.equal(sum, 15)
    assert.equal(canCapture({ myTurn: true, cardSelected: true, tableCount: 1, sum }), true)
  })

  test('discard needs your turn, a hand card, and an empty table selection', () => {
    assert.equal(canDiscard({ myTurn: true, cardSelected: true, tableCount: 0 }), true)
    assert.equal(canDiscard({ myTurn: false, cardSelected: true, tableCount: 0 }), false)
    assert.equal(canDiscard({ myTurn: true, cardSelected: true, tableCount: 1 }), false)
    assert.equal(canDiscard({ myTurn: true, cardSelected: false, tableCount: 0 }), false)
  })

  test('capture needs the selection to sum to TAKE_SUM exactly', () => {
    const base = { myTurn: true, cardSelected: true, tableCount: 2 }
    assert.equal(canCapture({ ...base, sum: TAKE_SUM }), true)
    assert.equal(canCapture({ ...base, sum: TAKE_SUM - 1 }), false)
    assert.equal(canCapture({ ...base, sum: TAKE_SUM, myTurn: false }), false)
    assert.equal(canCapture({ ...base, sum: TAKE_SUM, tableCount: 0 }), false)
  })

  test('prune drops a hand card and table cards that are gone after an update', () => {
    const state = {
      you: 'p1',
      round: {
        players: [{ id: 'p1', hand: [card('h1', 3)] }, { id: 'p2' }],
        table: [card('t1', 4)]
      }
    }
    const next = prune(state, 'h-old', new Set(['t1', 't-old']))
    assert.equal(next.hand, null)
    assert.deepEqual([...next.table], ['t1'])
  })

  test('prune keeps a selection that is still valid', () => {
    const state = {
      you: 'p1',
      round: { players: [{ id: 'p1', hand: [card('h1', 3)] }], table: [card('t1', 4)] }
    }
    const next = prune(state, 'h1', new Set(['t1']))
    assert.equal(next.hand, 'h1')
    assert.deepEqual([...next.table], ['t1'])
  })
})

describe('which end dialog is shown', () => {
  test('nothing when the game is running and no round has ended', () => {
    assert.equal(activeDialog({ view: { winner: null }, roundSummary: null }), null)
  })

  test('round dialog after a normal round end', () => {
    assert.equal(activeDialog({ view: { winner: null }, roundSummary: { winner: null } }), 'round')
  })

  test('game dialog wins when the game is over, even with a stale round summary', () => {
    assert.equal(activeDialog({ view: { winner: 'A' }, roundSummary: { winner: 'A' } }), 'game')
    assert.equal(activeDialog({ view: { winner: 'A' }, roundSummary: { winner: null } }), 'game')
  })

  test('a round summary that ends the game is never shown as the round dialog', () => {
    assert.equal(activeDialog({ view: { winner: null }, roundSummary: { winner: 'B' } }), null)
  })
})
