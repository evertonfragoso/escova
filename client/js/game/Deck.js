import Card from './Card'

export default class Deck {
  constructor (shuffle = true) {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades']
    // const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    // escova style
    const values = ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K']

    this.deck = []

    suits.forEach(suit => {
      values.forEach(val => {
        this.deck.push(new Card(val, suit))
      })
    })

    if (shuffle) this.shuffle()
  }

  shuffle () {
    for (let i = 0; i < this.deck.length * 10; i++) {
      const location1 = Math.floor(Math.random() * this.deck.length)
      const location2 = Math.floor(Math.random() * this.deck.length)
      const tmp = this.deck[location1]

      this.deck[location1] = this.deck[location2]
      this.deck[location2] = tmp
    }
  }

  deal (players, handSize) {
    for (const p in players) {
      players[p].hand = []
      for (let c = 0; c < handSize; c++) {
        const card = this.deck.pop()
        players[p].hand.push(card)
      }
    }
  }
}
