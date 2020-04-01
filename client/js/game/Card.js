export default class Card {
  constructor (value, suit) {
    this.Suit = suit
    this.Value = getCardValue(value)
    this.DisplayValue = value

    function getCardValue (value) {
      switch(value) {
        case 'A': return 1; break;
        case 'Q': return 8; break;
        case 'J': return 9; break;
        case 'K': return 10; break;
        default:  return parseInt(value); break;
      }
    }
  }
}

