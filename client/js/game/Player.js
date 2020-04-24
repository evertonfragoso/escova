import { GenerateRandomId } from '../../../lib/utils'

export default class Player {
  constructor (name = '') {
    this.playerId = GenerateRandomId()
    this.name = name
    this.hand = []
    this.partyId = null

    this.pickedCards = []
    this.escovas = 0
    this.lastPicked = false
  }
}
