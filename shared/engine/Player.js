export default class Player {
  constructor (id, name, team) {
    if (!id) throw new Error('Player id is required')
    this.id = id
    this.name = name
    this.team = team
    this.hand = []
    this.captured = []
    this.escovas = 0
  }

  hasCard (cardId) {
    return this.hand.some(c => c.id === cardId)
  }

  removeFromHand (cardId) {
    const index = this.hand.findIndex(c => c.id === cardId)
    if (index === -1) throw new Error(`Card ${cardId} not in hand of ${this.id}`)
    return this.hand.splice(index, 1)[0]
  }

  toPublicJSON () {
    // what other players are allowed to see
    return {
      id: this.id,
      name: this.name,
      team: this.team,
      handSize: this.hand.length,
      capturedCount: this.captured.length,
      escovas: this.escovas
    }
  }
}
