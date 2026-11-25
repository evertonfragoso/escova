import Deck from './Deck.js'
import Round from './Round.js'
import { scoreRound } from './scoring.js'

export const TARGET_SCORE = 11
export const TEAMS = Object.freeze(['A', 'B'])
export const VALID_PLAYER_COUNTS = Object.freeze([2, 4])

export default class Game {
  constructor (players, { targetScore = TARGET_SCORE, rng = Math.random, startingIndex = 0 } = {}) {
    if (!VALID_PLAYER_COUNTS.includes(players.length)) throw new Error('A game needs 2 or 4 players')

    // Seats alternate teams, so players across the table share a team
    players.forEach((p, i) => { p.team = TEAMS[i % 2] })

    this.players = players
    this.targetScore = targetScore
    this.rng = rng
    this.startingIndex = startingIndex
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
      deck: new Deck(null, this.rng).shuffle(),
      startingIndex: this.startingIndex
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
    this.startingIndex = (this.startingIndex + 1) % this.players.length

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
