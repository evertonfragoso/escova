export default class Party {
    constructor(name) {
        this.name = name // (A|B)

        this.partyId = crypto.randomUUID()
        this.players = {}

        this.escovas = 0
        this.seteBelo = false
        this.highest = false
        this.totalCards = false
    }

    addPlayer(player) {
        this.players[player.playerId] = player
    }

    addEscova() { this.escovas++ }

    setSeteBelo() { this.seteBelo = true }

    setHighest() { this.highest = true }

    setTotalCards() { this.totalCards = true }
}
