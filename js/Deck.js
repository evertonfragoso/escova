export default class Deck {
  constructor () {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades']
    // const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    // escova style
    const values = ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K']

    this.deck = new Array()

    suits.forEach(suit => {
      values.forEach(val => {
        let card = { Value: val, Suit: suit }
        this.deck.push(card)
      })
    })

    this.shuffle()

    return this.deck
  }

  shuffle () {
    for (let i = 0; i < this.deck.length * 10; i++) {
      let location1 = Math.floor(Math.random() * this.deck.length)
      let location2 = Math.floor(Math.random() * this.deck.length)
      let tmp = this.deck[location1]

      this.deck[location1] = this.deck[location2]
      this.deck[location2] = tmp
    }
  }
}
