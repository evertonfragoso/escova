export default class Card {
  /**
   * @param {number} value
   * @param {string} suit
   */
  constructor (value, suit) {
    this.Suit = suit
    this.Value = getCardValue(value)
    this.DisplayValue = value

    /**
     * @param {string | number} value
     */
    function getCardValue (value) {
      switch (value) {
        case 'A': return 1
        case 'Q': return 8
        case 'J': return 9
        case 'K': return 10
        default: return value
      }
    }
  }
}
