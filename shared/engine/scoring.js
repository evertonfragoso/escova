import { SUITS } from './Card.js'

// "Primeira" value per rank: the highest-seven ranking
export const PRIMEIRA_VALUE = Object.freeze({ 7: 21, 6: 18, A: 16, 5: 15, 4: 14, 3: 13, 2: 12, Q: 10, J: 10, K: 10 })

const mapTeams = (teams, fn) => Object.fromEntries(teams.map(t => [t, fn(t)]))

// Winning team, or null on a tie (ties award nothing)
function leader (totals) {
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return null
  return sorted[0][0]
}

function primeiraTotal (cards) {
  return SUITS.reduce((sum, suit) => {
    const best = cards
      .filter(c => c.suit === suit)
      .reduce((max, c) => Math.max(max, PRIMEIRA_VALUE[c.rank]), 0)
    return sum + best
  }, 0)
}

// results: { [team]: { captured: Card[], escovas: number } }
// Returns { points: { [team]: n }, breakdown: {...} }
export function scoreRound (results) {
  const teams = Object.keys(results)
  const points = mapTeams(teams, () => 0)
  const breakdown = {}

  const award = (category, winner) => {
    breakdown[category] = winner
    if (winner) points[winner] += 1
  }

  award('cards', leader(mapTeams(teams, t => results[t].captured.length)))

  award('diamonds', leader(mapTeams(teams, t =>
    results[t].captured.filter(c => c.suit === 'diamonds').length
  )))

  award('seteBelo', teams.find(t => results[t].captured.some(c => c.isSeteBelo())) ?? null)

  award('primeira', leader(mapTeams(teams, t => primeiraTotal(results[t].captured))))

  // Escovas are always points, not a contest
  for (const t of teams) points[t] += results[t].escovas
  breakdown.escovas = mapTeams(teams, t => results[t].escovas)

  return { points, breakdown }
}
