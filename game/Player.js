export default class Player {
    /**
     * @param {string} name
     */
    constructor (name = '') {
        this.playerId = crypto.randomUUID()
        this.name = name
        this.hand = []
        this.partyId = null

        this.pickedCards = []
        this.escovas = 0
        this.lastPicked = false
    }
}
