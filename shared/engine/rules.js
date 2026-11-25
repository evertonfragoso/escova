export const TAKE_SUM = 15

export const sumValues = cards => cards.reduce((total, c) => total + c.value, 0)

// A capture is valid if the selected table cards plus the played card sum to 15.
// Selecting nothing from the table (discard) is handled separately by Round.
export function isValidCapture (playedCard, tableCards) {
  if (tableCards.length === 0) return false
  return sumValues([playedCard, ...tableCards]) === TAKE_SUM
}

// Escova = the player clears the entire table with a capture.
export function isEscova (tableBeforeCapture, capturedTableCards) {
  return tableBeforeCapture.length > 0 &&
    tableBeforeCapture.length === capturedTableCards.length
}
