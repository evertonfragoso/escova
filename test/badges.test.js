import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Card from '../shared/engine/Card.js'
import Player from '../shared/engine/Player.js'

describe('public badges', () => {
  test('hasSeteBelo is true only once the 7 of diamonds is captured', () => {
    const p = new Player('p1', 'Ana', 'A')
    assert.equal(p.toPublicJSON().hasSeteBelo, false)
    p.captured.push(new Card('7', 'hearts'))
    assert.equal(p.toPublicJSON().hasSeteBelo, false)
    p.captured.push(new Card('7', 'diamonds'))
    assert.equal(p.toPublicJSON().hasSeteBelo, true)
  })

  test('escovas are public', () => {
    const p = new Player('p1', 'Ana', 'A')
    p.escovas = 2
    assert.equal(p.toPublicJSON().escovas, 2)
  })
})
