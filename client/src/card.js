// Builds a card element from a server card: { suit, rank, value }
export function createCardElement (card, { selectable = false, selected = false, onClick = null } = {}) {
  const el = document.createElement('div')
  el.className = 'card'
  el.dataset.suit = card.suit
  el.dataset.displayValue = card.rank
  el.dataset.cardId = card.id
  el.setAttribute('aria-label', `${card.rank} de ${card.suit}`)
  if (selectable) el.classList.add('selectable')
  if (selected) el.classList.add('selected')
  if (onClick) el.addEventListener('click', () => onClick(card.id))
  return el
}
