export function GenerateRandomId () {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}

export const suitPt = {
  clubs: 'paus',
  diamonds: 'ouro',
  hearts: 'corações',
  spades: 'espadas'
}
