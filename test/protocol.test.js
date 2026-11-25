import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { playSchema, createRoomSchema } from '../shared/protocol.js'
import { PLAYER_COUNTS, DECK_SIZE } from '../shared/constants.js'

describe('protocol schemas use shared constants', () => {
  test('room capacity accepts exactly PLAYER_COUNTS', () => {
    for (const n of PLAYER_COUNTS) assert.equal(createRoomSchema.safeParse({ capacity: n }).success, true)
    assert.equal(createRoomSchema.safeParse({ capacity: 3 }).success, false)
  })

  test('play accepts a capture of more than 3 table cards', () => {
    const ids = Array.from({ length: 5 }, (_, i) => `r${i}-clubs`)
    assert.equal(playSchema.safeParse({ cardId: 'Q-clubs', tableCardIds: ids }).success, true)
  })

  test('play rejects more table cards than the deck holds', () => {
    const ids = Array.from({ length: DECK_SIZE + 1 }, (_, i) => `r${i}-clubs`)
    assert.equal(playSchema.safeParse({ cardId: 'Q-clubs', tableCardIds: ids }).success, false)
  })
})
