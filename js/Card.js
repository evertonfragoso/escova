export default class Card {
  constructor (value, suit) {
    this.Suit = suit
    this.Value = value
  }

  render () {
    let cardItem = document.createElement('li')
    let cardText = document.createElement('span')

    cardText.classList.add('a11y')
    cardText.innerText = this.Value + ' of ' + this.Suit

    cardItem.appendChild(cardText)
    cardItem.classList.add('card', this.Suit, 'val' + this.Value)

    return cardItem
  }
}
