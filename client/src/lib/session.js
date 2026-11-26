// Remembers this browser's seat so a page reload can reconnect to the same game
const KEY = 'escova.session'

export const session = {
  get () {
    try {
      return JSON.parse(localStorage.getItem(KEY))
    } catch {
      return null
    }
  },
  save (roomId, playerId) {
    localStorage.setItem(KEY, JSON.stringify({ roomId, playerId }))
  },
  clear () {
    localStorage.removeItem(KEY)
  }
}
