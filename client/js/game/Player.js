export default class Player {
  constructor (name = '', hand = new Array()) {
    this.playerId = generatePlayerId()
    this.name = name
    this.hand = hand

    function generatePlayerId() {
      return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16).substring(1)
    }
  }
}
