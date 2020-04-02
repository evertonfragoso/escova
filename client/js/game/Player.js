import { GenerateRandomId } from '../../../lib/utils.js'

export default class Player {
  constructor (name = '', hand = new Array()) {
    this.playerId = GenerateRandomId()
    this.name = name
    this.hand = hand

    this.pickedCards = new Array()
    this.escovas = 0
  }
}
