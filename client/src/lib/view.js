// Board rules for the UI: button states and selection cleanup.
// The server is the authority. These only decide what the player can click.
import { TAKE_SUM } from '../../../shared/constants.js'

export function selectionSum (table, selectedIds) {
  return table.filter(c => selectedIds.has(c.id)).reduce((n, c) => n + c.value, 0)
}

export function canDiscard ({ myTurn, cardSelected, tableCount }) {
  return myTurn && cardSelected && tableCount === 0
}

export function canCapture ({ myTurn, cardSelected, tableCount, sum }) {
  return myTurn && cardSelected && tableCount > 0 && sum === TAKE_SUM
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
