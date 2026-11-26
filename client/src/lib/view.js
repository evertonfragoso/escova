// Board rules for the UI: button states and selection cleanup.
// The server is the authority. These only decide what the player can click.
import { TAKE_SUM } from '../../../shared/constants.js'

// Total of the played hand card plus the selected table cards: what a capture must make 15
export function selectionSum ({ handCard, table, selectedTableIds }) {
  const tableTotal = table
    .filter(c => selectedTableIds.has(c.id))
    .reduce((n, c) => n + c.value, 0)
  return (handCard?.value ?? 0) + tableTotal
}

export function canDiscard ({ myTurn, cardSelected, tableCount }) {
  return myTurn && cardSelected && tableCount === 0
}

export function canCapture ({ myTurn, cardSelected, tableCount, sum }) {
  return myTurn && cardSelected && tableCount > 0 && sum === TAKE_SUM
}

// Which end dialog to show. The game-over dialog wins; a round summary that ends the game is never stored.
export function activeDialog ({ view, roundSummary }) {
  if (view?.winner) return 'game'
  if (roundSummary && !roundSummary.winner) return 'round'
  return null
}

// Drops selections that no longer exist after a server update
export function prune (state, selectedHand, selectedTable) {
  const round = state.round
  const me = round.players.find(p => p.id === state.you)
  const inHand = new Set((me?.hand ?? []).map(c => c.id))
  const onTable = new Set(round.table.map(c => c.id))
  return {
    hand: selectedHand && inHand.has(selectedHand) ? selectedHand : null,
    table: new Set([...selectedTable].filter(id => onTable.has(id)))
  }
}
