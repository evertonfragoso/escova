function GenerateRandomId () {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}

const suitPt = {
  clubs: 'paus',
  diamonds: 'ouro',
  hearts: 'corações',
  spades: 'espadas'
}

module.exports = { GenerateRandomId, suitPt }
