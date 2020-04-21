import { GenerateRandomId } from '../../../lib/utils'

export default class Player {
  constructor (name = '', hand = []) {
    this.playerId = GenerateRandomId()
    this.name = name
    this.hand = hand

    this.pickedCards = []
    this.escovas = 0
    this.lastPicked = false
  }
}
