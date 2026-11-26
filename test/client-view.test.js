import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { selectionSum, canDiscard, canCapture, prune } from '../client/src/lib/view.js'
import { TAKE_SUM } from '../shared/constants.js'

const card = (id, value) => ({ id, value, rank: String(value), suit: 'clubs' })

describe('board rules for the UI', () => {
  test('selectionSum adds only the selected table cards', () => {
    const table = [card('a', 5), card('b', 10), card('c', 2)]
    assert.equal(selectionSum(table, new Set(['a', 'b'])), 15)
    assert.equal(selectionSum(table, new Set()), 0)
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
