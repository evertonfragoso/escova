import Deck from './Deck.js'
import Round from './Round.js'
import { scoreRound } from './scoring.js'
import { TARGET_SCORE, TEAMS, PLAYER_COUNTS } from '../constants.js'

export default class Game {
  // Seats are players[0..n-1]. Every round starts at seat 0 and plays in array order.
  constructor (players, { targetScore = TARGET_SCORE, rng = Math.random } = {}) {
    if (!PLAYER_COUNTS.includes(players.length)) throw new Error(`A game needs ${PLAYER_COUNTS.join(' or ')} players`)

    // Seats alternate teams: seat 1 and 3 are A, seat 2 and 4 are B
    players.forEach((p, i) => { p.team = TEAMS[i % 2] })

    this.players = players
    this.targetScore = targetScore
    this.rng = rng
    this.scores = Object.fromEntries(TEAMS.map(t => [t, 0]))
    this.history = []
    this.round = null
    this.winner = null
  }

  get isOver () {
    return this.winner !== null
  }

  startRound () {
    if (this.isOver) throw new Error('Game is over')
    if (this.round && !this.round.isOver) throw new Error('Current round is still in progress')

    this.players.forEach(p => p.reset())
    this.round = new Round(this.players, {
      deck: new Deck(null, this.rng).shuffle()
    })
    return this.round
  }

  play (playerId, cardId, tableCardIds = []) {
    if (!this.round) throw new Error('No round in progress')
    this.round.play(playerId, cardId, tableCardIds)
    return this.round.isOver ? this.endRound() : null
  }

  endRound () {
    this.round.finish()

    const results = Object.fromEntries(TEAMS.map(t => [t, { captured: [], escovas: 0 }]))
    for (const p of this.players) {
      results[p.team].captured.push(...p.captured)
      results[p.team].escovas += p.escovas
    }

    const { points, breakdown } = scoreRound(results)
    for (const t of TEAMS) this.scores[t] += points[t]

    this.winner = this._checkWinner()

    const summary = { points, breakdown, scores: { ...this.scores }, winner: this.winner }
    this.history.push(summary)
    return summary
  }

  // A team wins at target score with a strict lead; a tie at or above target keeps playing
  _checkWinner () {
    const [first, second] = TEAMS.map(t => this.scores[t]).sort((a, b) => b - a)
    const leaderTeam = TEAMS.find(t => this.scores[t] === first)
    if (first >= this.targetScore && first > second) return leaderTeam
    return null
  }
}
