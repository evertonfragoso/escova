export default class Card {
  constructor (value, suit) {
    this.Suit = suit
    this.Value = getCardValue(value)
    this.DisplayValue = value

    function getCardValue (value) {
      switch (value) {
        case 'A': return 1
        case 'Q': return 8
        case 'J': return 9
        case 'K': return 10
        default: return parseInt(value)
      }
    }
  }
}
