import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Card from '../shared/engine/Card.js'
import Deck from '../shared/engine/Deck.js'
import { scoreRound } from '../shared/engine/scoring.js'

const c = (rank, suit) => new Card(rank, suit)
const emptyTeam = () => ({ captured: [], escovas: 0 })

describe('scoreRound', () => {
  test('full deck to one team scores all four card points', () => {
    const { points } = scoreRound({
      A: { captured: new Deck().cards, escovas: 0 },
      B: emptyTeam()
    })
    // cards, diamonds, sete belo, primeira all go to A
    assert.equal(points.A, 4)
    assert.equal(points.B, 0)
  })

  test('cards: 20-20 is a tie, nothing awarded', () => {
    const all = new Deck().cards
    const { breakdown } = scoreRound({
      A: { captured: all.slice(0, 20), escovas: 0 },
      B: { captured: all.slice(20), escovas: 0 }
    })
    assert.equal(breakdown.cards, null)
  })

  test('diamonds: most diamonds wins the point', () => {
    const { breakdown } = scoreRound({
      A: { captured: [c('2', 'diamonds'), c('3', 'diamonds')], escovas: 0 },
      B: { captured: [c('2', 'hearts')], escovas: 0 }
    })
    assert.equal(breakdown.diamonds, 'A')
  })

  test('sete belo goes to the team holding the 7 of diamonds', () => {
    const { breakdown, points } = scoreRound({
      A: { captured: [c('7', 'diamonds')], escovas: 0 },
      B: { captured: [c('7', 'hearts')], escovas: 0 }
    })
    assert.equal(breakdown.seteBelo, 'A')
    assert.equal(points.A, 2) // diamonds (A has the only diamond) + sete belo; primeira ties 21-21
  })

  test('primeira: best seven per suit, summed, decides the point', () => {
    const { breakdown } = scoreRound({
      A: { captured: [c('7', 'clubs'), c('7', 'hearts')], escovas: 0 }, // 21 + 21 = 42
      B: { captured: [c('6', 'clubs'), c('6', 'hearts')], escovas: 0 }  // 18 + 18 = 36
    })
    assert.equal(breakdown.primeira, 'A')
  })

  test('primeira tie awards nothing', () => {
    const { breakdown } = scoreRound({
      A: { captured: [c('7', 'clubs')], escovas: 0 },
      B: { captured: [c('7', 'hearts')], escovas: 0 }
    })
    assert.equal(breakdown.primeira, null)
  })

  test('escovas are one point each, regardless of other categories', () => {
    const { points } = scoreRound({
      A: { captured: [], escovas: 2 },
      B: { captured: [], escovas: 1 }
    })
    assert.equal(points.A, 2)
    assert.equal(points.B, 1)
  })
})
