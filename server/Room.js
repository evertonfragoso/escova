export default class Room {
    /**
     * @param {number} numberOfPlayers
     */
    constructor(numberOfPlayers) {
        this.roomId = crypto.randomUUID()
        this.maxPlayers = numberOfPlayers
        this.players = []
    }
}
